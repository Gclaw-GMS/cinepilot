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

// Demo data for scripts - ENHANCED with comprehensive breakdown
const DEMO_SCRIPTS = {
  scripts: [
    {
      id: 'demo-script-1',
      projectId: 'default-project',
      title: 'Kaathal - The Core (Final Draft)',
      version: 3,
      isActive: true,
      createdAt: new Date('2025-12-15').toISOString(),
      updatedAt: new Date('2026-01-10').toISOString(),
      content: `INT. COURTROOM - DAY

The judge enters. Everyone stands.

JUDGE
Court is now in session.

...`,
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
          headingRaw: "INT. RAVI'S HOUSE - DAY",
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: "RAVI'S HOUSE",
          confidence: 0.98,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
          ],
          sceneLocations: [{ name: "RAVI'S HOUSE", details: 'A modest apartment in Adyar' }],
          sceneProps: [{ prop: { name: 'PHOTOGRAPH' } }, { prop: { name: 'COFFEE CUP' } }],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-4',
          sceneNumber: '4',
          sceneIndex: 3,
          headingRaw: 'EXT. BEACH - SUNSET',
          intExt: 'EXT',
          timeOfDay: 'DAWN',
          location: 'MARINA BEACH',
          confidence: 0.94,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
          ],
          sceneLocations: [{ name: 'MARINA BEACH', details: 'Famous beach in Chennai' }],
          sceneProps: [{ prop: { name: 'WALKING STICK' } }, { prop: { name: 'SANDALS' } }],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-5',
          sceneNumber: '5',
          sceneIndex: 4,
          headingRaw: 'INT. RESTAURANT - NIGHT',
          intExt: 'INT',
          timeOfDay: 'NIGHT',
          location: 'SEASIDE RESTAURANT',
          confidence: 0.91,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
            { character: { id: 'char-5', name: 'KANMANI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'SEASIDE RESTAURANT', details: 'Romantic dinner setting' }],
          sceneProps: [{ prop: { name: 'CANDLES' } }, { prop: { name: 'WINE GLASSES' } }, { prop: { name: 'MENU' } }],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-6',
          sceneNumber: '6',
          sceneIndex: 5,
          headingRaw: 'INT. POLICE STATION - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'POLICE STATION',
          confidence: 0.89,
          sceneCharacters: [
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
            { character: { id: 'char-6', name: 'INSPECTOR', aliases: [] } },
          ],
          sceneLocations: [{ name: 'POLICE STATION', details: 'Chennai Central Police Station' }],
          sceneProps: [{ prop: { name: 'CASE FILE' } }, { prop: { name: 'BADGE' } }],
          vfxNotes: [],
          warnings: [{ warningType: 'SAFETY', description: 'Police uniform requires permit', severity: 'low' }],
        },
        {
          id: 'scene-7',
          sceneNumber: '7',
          sceneIndex: 6,
          headingRaw: 'EXT. OFFICE BUILDING - DAY',
          intExt: 'EXT',
          timeOfDay: 'DAY',
          location: 'CORPORATE OFFICE',
          confidence: 0.96,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'CORPORATE OFFICE', details: 'Tech company in OMR' }],
          sceneProps: [{ prop: { name: 'LAPTOP' } }, { prop: { name: 'ID CARD' } }],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-8',
          sceneNumber: '8',
          sceneIndex: 7,
          headingRaw: 'INT. HOSPITAL - NIGHT',
          intExt: 'INT',
          timeOfDay: 'NIGHT',
          location: 'PRIVATE HOSPITAL',
          confidence: 0.93,
          sceneCharacters: [
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
            { character: { id: 'char-7', name: 'DOCTOR', aliases: [] } },
          ],
          sceneLocations: [{ name: 'PRIVATE HOSPITAL', details: 'ICU Ward' }],
          sceneProps: [{ prop: { name: 'MEDICAL EQUIPMENT' } }, { prop: { name: 'IV DRIP' } }, { prop: { name: 'PATIENT CHART' } }],
          vfxNotes: [],
          warnings: [{ warningType: 'CONTENT', description: 'Hospital scene may need sensitivity review', severity: 'low' }],
        },
        {
          id: 'scene-9',
          sceneNumber: '9',
          sceneIndex: 8,
          headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT',
          intExt: 'EXT',
          timeOfDay: 'NIGHT',
          location: 'KAPALEESHWARAR TEMPLE',
          confidence: 0.88,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
            { character: { id: 'char-5', name: 'KANMANI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'KAPALEESHWARAR TEMPLE', details: 'Annual festival celebrations' }],
          sceneProps: [{ prop: { name: 'CANNONS' } }, { prop: { name: 'FLOWERS' } }, { prop: { name: 'LIGHTS' } }],
          vfxNotes: [{ description: 'Festival fireworks display', vfxType: 'explicit' }],
          warnings: [{ warningType: 'VFX', description: 'Fireworks require fire safety permit', severity: 'high' }],
        },
        {
          id: 'scene-10',
          sceneNumber: '10',
          sceneIndex: 9,
          headingRaw: 'INT. COURTROOM - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'COURTROOM',
          confidence: 0.97,
          sceneCharacters: [
            { character: { id: 'char-1', name: 'JUDGE', aliases: [] } },
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
          ],
          sceneLocations: [{ name: 'COURTROOM', details: 'Final verdict hearing' }],
          sceneProps: [{ prop: { name: 'GAVEL' } }, { prop: { name: 'LEGAL DOCUMENTS' } }],
          vfxNotes: [],
          warnings: [],
        },
      ],
      scriptVersions: [{ id: 'v1', versionNumber: 3, extractionScore: 0.94 }],
    },
    {
      id: 'demo-script-2',
      projectId: 'default-project',
      title: 'Kaathal - Scene Extensions',
      version: 1,
      isActive: false,
      createdAt: new Date('2026-01-05').toISOString(),
      updatedAt: new Date('2026-01-05').toISOString(),
      content: `EXT. BEACH - SUNRISE

The sun rises over the Marina Beach...
`,
      scenes: [],
      scriptVersions: [{ id: 'v2', versionNumber: 1, extractionScore: 0.88 }],
    },
  ],
  characters: [
    { id: 'char-1', name: 'JUDGE', aliases: [], roleHint: 'Honorable Judge', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }, { sceneId: 'scene-10', isSpeaking: true }] },
    { id: 'char-2', name: 'RAVI', aliases: ['Ravi Kumar'], roleHint: 'Protagonist - A principled lawyer fighting for justice', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }, { sceneId: 'scene-3', isSpeaking: true }, { sceneId: 'scene-4', isSpeaking: true }, { sceneId: 'scene-5', isSpeaking: true }, { sceneId: 'scene-7', isSpeaking: true }, { sceneId: 'scene-9', isSpeaking: true }, { sceneId: 'scene-10', isSpeaking: true }] },
    { id: 'char-3', name: 'DIVYA', aliases: [], roleHint: 'Female Lead - Journalist and love interest', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-2', isSpeaking: true }, { sceneId: 'scene-4', isSpeaking: true }, { sceneId: 'scene-5', isSpeaking: true }, { sceneId: 'scene-8', isSpeaking: true }, { sceneId: 'scene-9', isSpeaking: true }] },
    { id: 'char-4', name: 'SARATH', aliases: [], roleHint: 'Antagonist - Corrupt politician', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-3', isSpeaking: true }, { sceneId: 'scene-6', isSpeaking: true }, { sceneId: 'scene-10', isSpeaking: true }] },
    { id: 'char-5', name: 'KANMANI', aliases: ['Kani'], roleHint: 'Comic Relief - Best friend', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-5', isSpeaking: true }, { sceneId: 'scene-9', isSpeaking: true }] },
    { id: 'char-6', name: 'INSPECTOR', aliases: [], roleHint: 'Police Inspector', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-6', isSpeaking: true }] },
    { id: 'char-7', name: 'DOCTOR', aliases: [], roleHint: 'Hospital Doctor', projectId: 'default-project', sceneCharacters: [{ sceneId: 'scene-8', isSpeaking: true }] },
  ],
  props: [
    { id: 'prop-1', name: 'DIYA', projectId: 'default-project' },
    { id: 'prop-2', name: 'PHOTOGRAPH', projectId: 'default-project' },
    { id: 'prop-3', name: 'COFFEE CUP', projectId: 'default-project' },
    { id: 'prop-4', name: 'WALKING STICK', projectId: 'default-project' },
    { id: 'prop-5', name: 'SANDALS', projectId: 'default-project' },
    { id: 'prop-6', name: 'CANDLES', projectId: 'default-project' },
    { id: 'prop-7', name: 'WINE GLASSES', projectId: 'default-project' },
    { id: 'prop-8', name: 'MENU', projectId: 'default-project' },
    { id: 'prop-9', name: 'CASE FILE', projectId: 'default-project' },
    { id: 'prop-10', name: 'BADGE', projectId: 'default-project' },
    { id: 'prop-11', name: 'LAPTOP', projectId: 'default-project' },
    { id: 'prop-12', name: 'ID CARD', projectId: 'default-project' },
    { id: 'prop-13', name: 'MEDICAL EQUIPMENT', projectId: 'default-project' },
    { id: 'prop-14', name: 'IV DRIP', projectId: 'default-project' },
    { id: 'prop-15', name: 'PATIENT CHART', projectId: 'default-project' },
    { id: 'prop-16', name: 'CANNONS', projectId: 'default-project' },
    { id: 'prop-17', name: 'FLOWERS', projectId: 'default-project' },
    { id: 'prop-18', name: 'LIGHTS', projectId: 'default-project' },
    { id: 'prop-19', name: 'GAVEL', projectId: 'default-project' },
    { id: 'prop-20', name: 'LEGAL DOCUMENTS', projectId: 'default-project' },
  ],
  analyses: [
    {
      id: 'analysis-1',
      projectId: 'default-project',
      analysisType: 'breakdown_summary',
      result: {
        total_scenes: 10,
        int_scenes: 5,
        ext_scenes: 5,
        day_scenes: 5,
        night_scenes: 4,
        dawn_scenes: 1,
        unique_characters: 7,
        unique_locations: 10,
        total_props: 20,
        vfx_count: 1,
        safety_warnings_count: 2,
        cultural_notes: ['Temple festival scene captures authentic Mylapore tradition', 'Courtroom procedure follows Indian legal system'],
        estimated_shoot_days: 12,
        summary: 'A courtroom drama with romantic subplot set in Chennai. Features mix of indoor court scenes and outdoor temple/ beach locations. One VFX sequence required for festival fireworks.',
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

    // Count total scenes across all scripts
    const totalScenes = scripts.reduce((sum, s) => sum + (s.scenes?.length || 0), 0);
    
    // If database has less than 5 scenes, use demo data for better UX
    if (totalScenes < 5) {
      console.log(`[GET /api/scripts] Using demo data - only ${totalScenes} scenes in DB`);
      return NextResponse.json({
        ...DEMO_SCRIPTS,
        _demo: true,
        _dbScenes: totalScenes,
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
    
    const contentType = req.headers.get('content-type') || '';
    let formData: FormData;
    let file: File | null = null;
    let projectId = DEFAULT_PROJECT_ID;
    
    try {
      formData = await req.formData();
      file = formData.get('file') as File | null;
      projectId = (formData.get('projectId') as string) || DEFAULT_PROJECT_ID;
    } catch {
      // If formData fails, check if it's JSON body
      if (contentType.includes('application/json')) {
        const body = await req.json().catch(() => ({}));
        if (!body.file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        return NextResponse.json({ error: 'File upload requires multipart/form-data' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

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

    let script;
    try {
      script = await prisma.script.findUnique({
        where: { id: scriptId },
        include: { scenes: { orderBy: { sceneIndex: 'asc' } } },
      });
    } catch (dbError) {
      // Database not available - return 404 as script doesn't exist in demo mode
      console.log('[PATCH /api/scripts] Database not available');
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

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
