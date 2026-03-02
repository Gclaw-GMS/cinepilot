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

// Demo data for when database is not connected
const DEMO_SCRIPTS = [
  {
    id: 'demo-script-1',
    projectId: DEFAULT_PROJECT_ID,
    title: 'Kaadhal Enbadhu',
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    scenes: [
      {
        id: 'scene-1',
        sceneNumber: '1',
        sceneIndex: 0,
        headingRaw: 'EXT. CHENNAI BEACH - DAY',
        intExt: 'EXT',
        timeOfDay: 'DAY',
        location: 'Chennai Beach',
        confidence: 0.95,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun', 'AJ'] } },
          { character: { id: 'char-2', name: 'PRIYA', aliases: ['Priya'] } }
        ],
        sceneLocations: [{ name: 'Chennai Beach', details: 'Marina Beach, crowded' }],
        sceneProps: [{ prop: { name: 'Ice Cream' } }, { prop: { name: 'Camera' } }],
        vfxNotes: [],
        warnings: []
      },
      {
        id: 'scene-2',
        sceneNumber: '2',
        sceneIndex: 1,
        headingRaw: 'INT. RESTAURANT - NIGHT',
        intExt: 'INT',
        timeOfDay: 'NIGHT',
        location: 'Sea Shell Restaurant',
        confidence: 0.92,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun'] } },
          { character: { id: 'char-3', name: 'RAHUL', aliases: ['Rahul'] } }
        ],
        sceneLocations: [{ name: 'Sea Shell Restaurant', details: 'Fine dining' }],
        sceneProps: [{ prop: { name: 'Wine Glass' } }, { prop: { name: 'Menu' } }],
        vfxNotes: [],
        warnings: [{ warningType: 'night_shoot', description: 'Night shoot scheduled', severity: 'medium' }]
      },
      {
        id: 'scene-3',
        sceneNumber: '3',
        sceneIndex: 2,
        headingRaw: 'INT. APARTMENT - DAY',
        intExt: 'INT',
        timeOfDay: 'DAY',
        location: 'Arjun\'s Apartment',
        confidence: 0.88,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun'] } }
        ],
        sceneLocations: [{ name: 'Arjun\'s Apartment', details: 'Modern flat in Chennai' }],
        sceneProps: [{ prop: { name: 'Phone' } }],
        vfxNotes: [],
        warnings: []
      },
      {
        id: 'scene-4',
        sceneNumber: '4',
        sceneIndex: 3,
        headingRaw: 'EXT. TEMPLE - MORNING',
        intExt: 'EXT',
        timeOfDay: 'MORNING',
        location: 'Kapaleeshwarar Temple',
        confidence: 0.97,
        sceneCharacters: [
          { character: { id: 'char-2', name: 'PRIYA', aliases: ['Priya'] } },
          { character: { id: 'char-4', name: 'PRIYA\'S MOTHER', aliases: ['Mother'] } }
        ],
        sceneLocations: [{ name: 'Kapaleeshwarar Temple', details: 'Mylapore temple' }],
        sceneProps: [{ prop: { name: 'Flowers' } }, { prop: { name: 'Pooja Items' } }],
        vfxNotes: [{ description: 'Crowd simulation needed', vfxType: 'crowd' }],
        warnings: []
      },
      {
        id: 'scene-5',
        sceneNumber: '5',
        sceneIndex: 4,
        headingRaw: 'INT. HOSPITAL - DAY',
        intExt: 'INT',
        timeOfDay: 'DAY',
        location: 'General Hospital',
        confidence: 0.91,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun'] } },
          { character: { id: 'char-5', name: 'DOCTOR', aliases: ['Dr. Sharma'] } }
        ],
        sceneLocations: [{ name: 'General Hospital', details: 'ICU Ward' }],
        sceneProps: [{ prop: { name: 'Medical Report' } }, { prop: { name: 'IV Drip' } }],
        vfxNotes: [],
        warnings: [{ warningType: 'hospital', description: 'Location permit needed', severity: 'high' }]
      }
    ],
    scriptVersions: [{ id: 'v1', versionNumber: 1, extractionScore: 0.94 }]
  },
  {
    id: 'demo-script-2',
    projectId: DEFAULT_PROJECT_ID,
    title: 'Vikram Vedha 2',
    version: 1,
    isActive: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    scenes: [
      {
        id: 'scene-v2-1',
        sceneNumber: '1',
        sceneIndex: 0,
        headingRaw: 'EXT. WAREHOUSE - NIGHT',
        intExt: 'EXT',
        timeOfDay: 'NIGHT',
        location: 'Abandoned Warehouse',
        confidence: 0.89,
        sceneCharacters: [
          { character: { id: 'char-6', name: 'VIKRAM', aliases: ['Vikram'] } },
          { character: { id: 'char-7', name: 'VEDHA', aliases: ['Vedha'] } }
        ],
        sceneLocations: [{ name: 'Warehouse', details: 'Industrial area' }],
        sceneProps: [{ prop: { name: 'Gun' } }, { prop: { name: 'Flashlight' } }],
        vfxNotes: [{ description: 'Explosion sequence', vfxType: 'pyro' }],
        warnings: [{ warningType: 'stunts', description: 'Action sequence with weapons', severity: 'high' }]
      }
    ],
    scriptVersions: [{ id: 'v2-1', versionNumber: 1, extractionScore: 0.87 }]
  }
];

const DEMO_CHARACTERS = [
  { id: 'char-1', name: 'Arjun', nameTamil: 'அர்ஜுன்', description: 'Protagonist, a young software engineer from Chennai', actorName: 'Ajith Kumar', isMain: true },
  { id: 'char-2', name: 'Priya', nameTamil: 'பிரியா', description: 'Female lead, a classical dancer', actorName: 'Sai Pallavi', isMain: true },
  { id: 'char-3', name: 'Rahul', nameTamil: 'ராகுல்', description: 'Arjun\'s best friend', actorName: 'Yogi Babu', isMain: false },
  { id: 'char-4', name: 'Priya\'s Mother', nameTamil: 'பிரியாவின் தாய்', description: 'Traditional mother figure', actorName: 'Lakshmi', isMain: false },
  { id: 'char-5', name: 'Dr. Sharma', nameTamil: 'டாக்டர் சர்மா', description: 'Hospital doctor', actorName: 'Prakash Raj', isMain: false },
  { id: 'char-6', name: 'Vikram', nameTamil: 'விக்னேஷ்', description: 'Action hero', actorName: 'Vijay', isMain: true },
  { id: 'char-7', name: 'Vedha', nameTamil: 'வேதா', description: 'Antagonist', actorName: 'Vijay Sethupathi', isMain: true }
];

const DEMO_PROPS = [
  { name: 'Ice Cream' },
  { name: 'Camera' },
  { name: 'Wine Glass' },
  { name: 'Menu' },
  { name: 'Phone' },
  { name: 'Flowers' },
  { name: 'Pooja Items' },
  { name: 'Medical Report' },
  { name: 'IV Drip' },
  { name: 'Gun' },
  { name: 'Flashlight' }
];

const DEMO_ANALYSES = [
  {
    id: 'analysis-1',
    analysisType: 'breakdown_summary',
    result: {
      totalScenes: 6,
      totalLocations: 5,
      totalCharacters: 7,
      totalProps: 11,
      byIntExt: { INT: 3, EXT: 3 },
      byTimeOfDay: { DAY: 4, NIGHT: 2, MORNING: 1 },
      vfxShots: 2,
      warnings: 3
    },
    modelUsed: 'gpt-4',
    createdAt: new Date().toISOString()
  },
  {
    id: 'analysis-2',
    analysisType: 'quality_score',
    result: {
      overall: 85,
      formatting: 90,
      dialogue: 88,
      structure: 82,
      suggestions: ['Consider adding more action sequences', 'Dialogue could be more punchy']
    },
    modelUsed: 'gpt-4',
    createdAt: new Date().toISOString()
  }
];

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

    // Check if we have real data
    if (scripts.length === 0) {
      // Return demo data when no scripts exist
      return NextResponse.json({
        scripts: DEMO_SCRIPTS,
        characters: DEMO_CHARACTERS,
        props: DEMO_PROPS,
        analyses: DEMO_ANALYSES,
        isDemoMode: true,
      });
    }

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
    // Return demo data when database is not connected
    return NextResponse.json({
      scripts: DEMO_SCRIPTS,
      characters: DEMO_CHARACTERS,
      props: DEMO_PROPS,
      analyses: DEMO_ANALYSES,
      isDemoMode: true,
    });
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
