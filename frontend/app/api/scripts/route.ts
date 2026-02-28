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

// Demo data for scripts
const DEMO_SCRIPTS = {
  scripts: [
    {
      id: 'demo-script-1',
      projectId: 'demo-project-1',
      title: 'Kaathal - The Core (Final Draft)',
      version: 3,
      isActive: true,
      createdAt: new Date('2025-12-15').toISOString(),
      updatedAt: new Date('2026-01-10').toISOString(),
      content: `INT. COURTROOM - DAY\n\nThe judge enters. Everyone stands.\n\nJUDGE\nCourt is now in session.\n\n...`,
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: '1',
          sceneIndex: 0,
          headingRaw: 'INT. COURTROOM - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'COURTROOM',
          confidence: 0.95,
          sceneCharacters: [
            { character: { id: 'char-1', name: 'JUDGE', aliases: [] } },
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'COURTROOM', details: 'A high court in Chennai' }],
          sceneProps: [],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-2',
          sceneNumber: '2',
          sceneIndex: 1,
          headingRaw: 'EXT. TEMPLE - NIGHT',
          intExt: 'EXT',
          timeOfDay: 'NIGHT',
          location: 'KAPALEESHWARAR TEMPLE',
          confidence: 0.92,
          sceneCharacters: [
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
          ],
          sceneLocations: [{ name: 'KAPALEESHWARAR TEMPLE', details: 'Mylapore, Chennai' }],
          sceneProps: [{ prop: { name: 'DIYA' } }],
          vfxNotes: [],
          warnings: [{ warningType: 'VFX', description: 'Night shooting requires permits', severity: 'medium' }],
        },
        {
          id: 'scene-3',
          sceneNumber: '3',
          sceneIndex: 2,
          headingRaw: 'INT. RAVI\'S HOUSE - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'RAVI\'S HOUSE',
          confidence: 0.98,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
          ],
          sceneLocations: [{ name: 'RAVI\'S HOUSE', details: 'A modest apartment in Adyar' }],
          sceneProps: [{ prop: { name: 'PHOTOGRAPH' } }, { prop: { name: 'COFFEE CUP' } }],
          vfxNotes: [],
          warnings: [],
        },
      ],
      scriptVersions: [{ id: 'v1', versionNumber: 3, extractionScore: 0.94 }],
    },
    {
      id: 'demo-script-2',
      projectId: 'demo-project-1',
      title: 'Kaathal - Scene Extensions',
      version: 1,
      isActive: false,
      createdAt: new Date('2026-01-05').toISOString(),
      updatedAt: new Date('2026-01-05').toISOString(),
      content: `EXT. BEACH - SUNRISE\n\nThe sun rises over the Marina Beach...\n`,
      scenes: [],
      scriptVersions: [{ id: 'v2', versionNumber: 1, extractionScore: 0.88 }],
    },
  ],
  characters: [
    { id: 'char-1', name: 'JUDGE', aliases: [], roleHint: 'Honorable Judge', projectId: 'demo-project-1', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }] },
    { id: 'char-2', name: 'RAVI', aliases: ['Ravi Kumar'], roleHint: 'Protagonist', projectId: 'demo-project-1', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }, { sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-3', name: 'DIVYA', aliases: [], roleHint: 'Female Lead', projectId: 'demo-project-1', sceneCharacters: [{ sceneId: 'scene-2', isSpeaking: true }] },
    { id: 'char-4', name: 'SARATH', aliases: [], roleHint: 'Antagonist', projectId: 'demo-project-1', sceneCharacters: [{ sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-5', name: 'KANMANI', aliases: ['Kani'], roleHint: 'Comic Relief', projectId: 'demo-project-1', sceneCharacters: [] },
  ],
  props: [
    { id: 'prop-1', name: 'DIYA', projectId: 'demo-project-1' },
    { id: 'prop-2', name: 'PHOTOGRAPH', projectId: 'demo-project-1' },
    { id: 'prop-3', name: 'COFFEE CUP', projectId: 'demo-project-1' },
  ],
  analyses: [
    {
      id: 'analysis-1',
      projectId: 'demo-project-1',
      analysisType: 'breakdown_summary',
      result: {
        totalScenes: 3,
        intScenes: 2,
        extScenes: 1,
        dayScenes: 2,
        nightScenes: 1,
        locations: ['COURTROOM', 'KAPALEESHWARAR TEMPLE', 'RAVI\'S HOUSE'],
        characters: ['JUDGE', 'RAVI', 'DIVYA', 'SARATH'],
        props: ['DIYA', 'PHOTOGRAPH', 'COFFEE CUP'],
      },
      modelUsed: 'gpt-4',
      createdAt: new Date('2025-12-20').toISOString(),
    },
  ],
};

async function ensureDefaultProject() {
  try {
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
  } catch (error) {
    console.log('[ensureDefaultProject] Database not available');
    return null;
  }
}

// GET /api/scripts — list scripts for a project
export async function GET(req: NextRequest) {
  const isDemoMode = req.nextUrl.searchParams.get('demo') === 'true';
  
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
    console.log('[GET /api/scripts] Database not connected, using demo data');
    if (isDemoMode || process.env.NODE_ENV !== 'production') {
      return NextResponse.json(DEMO_SCRIPTS);
    }
    console.error('[GET /api/scripts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts', ...DEMO_SCRIPTS },
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
