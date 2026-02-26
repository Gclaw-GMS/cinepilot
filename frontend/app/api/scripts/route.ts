import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  uploadScript,
  runFullPipeline,
} from '@/lib/scripts/pipeline';

const DEFAULT_PROJECT_ID = 'default-project';
const DEFAULT_USER_ID = 'default-user';

async function ensureDefaultProject() {
  let project = await prisma.project.findFirst({
    where: { id: DEFAULT_PROJECT_ID },
  });

  if (!project) {
    let user = await prisma.user.findFirst({ where: { id: DEFAULT_USER_ID } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'admin@cinepilot.local',
          passwordHash: 'placeholder',
          name: 'CinePilot Admin',
          role: 'producer',
        },
      });
    }

    project = await prisma.project.create({
      data: {
        id: DEFAULT_PROJECT_ID,
        name: 'Default Project',
        description: 'Auto-created default project',
        userId: user.id,
      },
    });
  }

  return project;
}

// GET /api/scripts — list scripts for a project
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

    const scripts = await prisma.script.findMany({
      where: { projectId },
      include: {
        scriptVersions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        scenes: {
          orderBy: { sceneIndex: 'asc' },
          include: {
            sceneCharacters: { include: { character: true } },
            sceneLocations: true,
            sceneProps: { include: { prop: true } },
            vfxNotes: true,
            warnings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const characters = await prisma.character.findMany({
      where: { projectId },
      include: {
        sceneCharacters: { select: { sceneId: true, isSpeaking: true } },
      },
    });

    const props = await prisma.prop.findMany({
      where: { projectId },
    });

    const analyses = await prisma.aiAnalysis.findMany({
      where: {
        projectId,
        analysisType: { in: ['breakdown_summary', 'quality_score'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      scripts,
      characters,
      props,
      analyses,
    });
  } catch (error) {
    console.error('[GET /api/scripts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}

// POST /api/scripts — upload + process script
export async function POST(req: NextRequest) {
  try {
    await ensureDefaultProject();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = (formData.get('projectId') as string) || DEFAULT_PROJECT_ID;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const mimeType = file.type || 'application/octet-stream';

    const upload = await uploadScript(projectId, buffer, filename, mimeType);

    if (upload.status === 'analyzed') {
      return NextResponse.json({
        message: 'Script already processed (same content)',
        scriptId: upload.scriptId,
        versionId: upload.versionId,
        status: 'analyzed',
      });
    }

    const result = await runFullPipeline(
      projectId,
      upload.scriptId,
      upload.versionId,
      buffer,
      filename
    );

    return NextResponse.json({
      message: 'Script processed successfully',
      scriptId: upload.scriptId,
      versionId: upload.versionId,
      status: 'analyzed',
      summary: result.summary,
      quality: result.quality,
      sceneCount: result.scenes.scenes.length,
      language: result.language,
    });
  } catch (error) {
    console.error('[POST /api/scripts]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
