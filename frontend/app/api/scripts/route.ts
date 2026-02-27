import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  uploadScript,
  runFullPipeline,
  runCanonicalization,
  generateBreakdownSummary,
  runQualityScoring,
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

// PATCH /api/scripts — run remaining pipeline stages on existing script
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const scriptId = body.scriptId as string;
    const projectId = body.projectId || DEFAULT_PROJECT_ID;

    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId required' }, { status: 400 });
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: { scenes: { orderBy: { sceneIndex: 'asc' } } },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    await runCanonicalization(projectId);

    const scenesForSummary = script.scenes.map((s) => ({
      scene_number: s.sceneNumber,
      scene_index: s.sceneIndex,
      heading_raw: s.headingRaw || '',
      int_ext: s.intExt || '',
      time_of_day: s.timeOfDay || '',
      location_text: s.location || '',
      start_line: s.startLine || 0,
      end_line: s.endLine || 0,
      page_start: s.pageStart || undefined,
      page_end: s.pageEnd || undefined,
      confidence: s.confidence || 0.8,
    }));

    const summary = await generateBreakdownSummary(projectId, scriptId, scenesForSummary);

    const quality = await runQualityScoring(
      projectId,
      scriptId,
      script.content || '',
      Math.ceil((script.content || '').split('\n').length / 55)
    );

    return NextResponse.json({
      message: 'Remaining stages complete',
      summary,
      quality,
    });
  } catch (error) {
    console.error('[PATCH /api/scripts]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
