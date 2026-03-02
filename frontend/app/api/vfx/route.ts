import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runTextTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

// Demo data for when database is not connected
const DEMO_VFX_DATA = {
  vfxNotes: [
    { id: 'v1', sceneId: 's1', description: 'Massive crowd simulation for festival sequence - 500+ digital extras required', vfxType: 'crowd', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v2', sceneId: 's1', description: 'Dynamic lighting effects for diyas and fireworks', vfxType: 'lighting', confidence: 0.85, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v3', sceneId: 's3', description: 'Car chase with vehicle replacements and plate matching', vfxType: 'action', confidence: 0.88, scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'v4', sceneId: 's4', description: 'Dream sequence with surreal floating elements and morphing', vfxType: 'fantasy', confidence: 0.95, scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'v5', sceneId: 's5', description: 'Green screen composite for romantic song sequence', vfxType: 'composite', confidence: 0.78, scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY', sceneIndex: 37 } },
    { id: 'v6', sceneId: 's6', description: 'Explosion with fire and debris simulation', vfxType: 'destruction', confidence: 0.91, scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
    { id: 'v7', sceneId: 's7', description: 'Sky replacement for mood enhancement', vfxType: 'beauty', confidence: 0.65, scene: { sceneNumber: '52', headingRaw: 'EXT. CITY ROOFTOP - DAY', sceneIndex: 51 } },
    { id: 'v8', sceneId: 's8', description: 'Creature makeup enhancement and digital aging', vfxType: 'prosthetic', confidence: 0.89, scene: { sceneNumber: '58', headingRaw: 'INT. LABORATORY - DAY', sceneIndex: 57 } },
  ],
  vfxWarnings: [
    { id: 'w1', sceneId: 's3', warningType: 'vfx', description: 'High-budget car chase sequence may exceed VFX allocation', severity: 'high', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'w2', sceneId: 's4', warningType: 'vfx', description: 'Complex fantasy sequence requires extended render time', severity: 'medium', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'w3', sceneId: 's6', warningType: 'vfx', description: 'Explosion sequence needs stunt coordination', severity: 'low', scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
  ],
  props: [
    { id: 'p1', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT' }, prop: { name: 'Fireworks', description: 'CG pyrotechnics for festival celebration' } },
    { id: 'p2', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY' }, prop: { name: 'Stunt Car', description: 'Digital vehicle for dangerous stunts' } },
    { id: 'p3', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY' }, prop: { name: 'Floating Rocks', description: 'CG environment elements' } },
    { id: 'p4', scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY' }, prop: { name: 'Mountain Background', description: 'Digital matte painting' } },
  ],
};

// Helper to check if database is available
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  if (!scriptId) {
    return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
  }

  // Check database connection
  const isDbConnected = await checkDbConnection();
  
  if (!isDbConnected) {
    // Return demo data when database is unavailable
    const summary = {
      totalScenes: 6,
      totalNotes: DEMO_VFX_DATA.vfxNotes.length,
      totalWarnings: DEMO_VFX_DATA.vfxWarnings.length,
      complexityBreakdown: { simple: 1, moderate: 2, complex: 5 },
    };
    
    return NextResponse.json({
      ...DEMO_VFX_DATA,
      summary,
      isDemoMode: true,
    });
  }

  // Database is available - use real data
  try {
    const vfxNotes = await prisma.vfxNote.findMany({
      where: { scene: { scriptId } },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true, sceneIndex: true } },
      },
      orderBy: { scene: { sceneIndex: 'asc' } },
    });

    const vfxWarnings = await prisma.warning.findMany({
      where: {
        scene: { scriptId },
        warningType: 'vfx',
      },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true, sceneIndex: true } },
      },
      orderBy: { scene: { sceneIndex: 'asc' } },
    });

    const vfxProps = await prisma.sceneProp.findMany({
      where: {
        scene: { scriptId },
        prop: { category: 'vfx' },
      },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true } },
        prop: { select: { name: true, description: true } },
      },
    });

    const scenesWithVfx = new Set([
      ...vfxNotes.map((n) => n.scene.sceneNumber),
      ...vfxWarnings.map((w) => w.scene.sceneNumber),
      ...vfxProps.map((p) => p.scene.sceneNumber),
    ]);

    const complexityBreakdown = { simple: 0, moderate: 0, complex: 0 };
    for (const note of vfxNotes) {
      if (note.confidence >= 0.8) complexityBreakdown.complex++;
      else if (note.confidence >= 0.5) complexityBreakdown.moderate++;
      else complexityBreakdown.simple++;
    }

    return NextResponse.json({
      vfxNotes,
      vfxWarnings,
      props: vfxProps,
      summary: {
        totalScenes: scenesWithVfx.size,
        totalNotes: vfxNotes.length,
        totalWarnings: vfxWarnings.length,
        complexityBreakdown,
      },
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/vfx]', error);
    
    // Fallback to demo data on error
    const summary = {
      totalScenes: 6,
      totalNotes: DEMO_VFX_DATA.vfxNotes.length,
      totalWarnings: DEMO_VFX_DATA.vfxWarnings.length,
      complexityBreakdown: { simple: 1, moderate: 2, complex: 5 },
    };
    
    return NextResponse.json({
      ...DEMO_VFX_DATA,
      summary,
      isDemoMode: true,
      error: 'Using demo data due to database error',
    });
  }
}

export async function POST(req: NextRequest) {
  // Check database connection first
  const isDbConnected = await checkDbConnection();
  
  if (!isDbConnected) {
    // Return demo response when database is unavailable
    return NextResponse.json({
      notes: DEMO_VFX_DATA.vfxNotes,
      warnings: DEMO_VFX_DATA.vfxWarnings,
      summary: {
        scenesAnalyzed: 45,
        vfxNotesCreated: DEMO_VFX_DATA.vfxNotes.length,
        warningsCreated: DEMO_VFX_DATA.vfxWarnings.length,
      },
      message: 'VFX analysis complete (Demo Mode)',
      isDemoMode: true,
    });
  }

  // Database is available
  try {
    const { scriptId } = await req.json();
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
    }

    const scenes = await prisma.scene.findMany({
      where: { scriptId },
      orderBy: { sceneIndex: 'asc' },
    });

    if (scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes found for this script' }, { status: 404 });
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { content: true },
    });

    const fullText = script?.content || '';
    const lines = fullText.split('\n');
    const createdNotes: unknown[] = [];
    const createdWarnings: unknown[] = [];

    for (const scene of scenes) {
      const sceneText =
        scene.startLine && scene.endLine
          ? lines.slice(Math.max(0, scene.startLine - 1), scene.endLine).join('\n')
          : scene.description || scene.headingRaw || '';

      if (!sceneText.trim()) continue;

      const result = await runTextTask(
        'script.entityExtraction',
        {
          sceneText,
          sceneNumber: scene.sceneNumber,
          knownCharacters: '',
        },
        PROMPTS.scriptParsing.entityExtraction.system,
        PROMPTS.scriptParsing.entityExtraction.user,
        { responseFormat: { type: 'json_object' }, maxTokens: 4096 },
      );

      let vfxEntities: Array<{
        description: string;
        type: string;
        confidence: number;
      }> = [];
      try {
        const parsed = JSON.parse(result);
        vfxEntities = parsed.vfx || [];
      } catch {
        console.warn(`[POST /api/vfx] Failed to parse VFX result for scene ${scene.sceneNumber}`);
      }

      for (const vfx of vfxEntities) {
        const note = await prisma.vfxNote.create({
          data: {
            sceneId: scene.id,
            description: vfx.description,
            vfxType: vfx.type || 'implied',
            confidence: vfx.confidence || 0,
          },
        });
        createdNotes.push(note);

        if (vfx.confidence >= 0.7) {
          const warning = await prisma.warning.create({
            data: {
              sceneId: scene.id,
              warningType: 'vfx',
              severity: vfx.confidence >= 0.9 ? 'high' : 'medium',
              description: `VFX required: ${vfx.description} (${vfx.type})`,
            },
          });
          createdWarnings.push(warning);
        }
      }
    }

    return NextResponse.json({
      notes: createdNotes,
      warnings: createdWarnings,
      summary: {
        scenesAnalyzed: scenes.length,
        vfxNotesCreated: createdNotes.length,
        warningsCreated: createdWarnings.length,
      },
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[POST /api/vfx]', error);
    
    // Fallback to demo response on error
    return NextResponse.json({
      notes: DEMO_VFX_DATA.vfxNotes,
      warnings: DEMO_VFX_DATA.vfxWarnings,
      summary: {
        scenesAnalyzed: 45,
        vfxNotesCreated: DEMO_VFX_DATA.vfxNotes.length,
        warningsCreated: DEMO_VFX_DATA.vfxWarnings.length,
      },
      message: 'VFX analysis complete (Demo Mode - fallback)',
      isDemoMode: true,
    });
  }
}
