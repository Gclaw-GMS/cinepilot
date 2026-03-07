import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runTextTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

// Demo data for when database is not available
const DEMO_VFX_NOTES = [
  { id: 'vfx-1', sceneId: 'scene-1', description: 'Opening shot - city skyline with flying birds', vfxType: 'environment', confidence: 0.85, createdAt: new Date().toISOString(), scene: { sceneNumber: '1', headingRaw: 'EXT. CITY - DAY', sceneIndex: 0 } },
  { id: 'vfx-2', sceneId: 'scene-2', description: 'Rain effects during dialogue', vfxType: 'weather', confidence: 0.72, createdAt: new Date().toISOString(), scene: { sceneNumber: '2', headingRaw: 'INT. HOUSE - NIGHT', sceneIndex: 1 } },
  { id: 'vfx-3', sceneId: 'scene-5', description: 'Car chase - green screen background', vfxType: 'stunt', confidence: 0.91, createdAt: new Date().toISOString(), scene: { sceneNumber: '5', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 4 } },
  { id: 'vfx-4', sceneId: 'scene-8', description: 'Dream sequence - surreal environment', vfxType: 'environment', confidence: 0.88, createdAt: new Date().toISOString(), scene: { sceneNumber: '8', headingRaw: 'INT. DREAM - NIGHT', sceneIndex: 7 } },
  { id: 'vfx-5', sceneId: 'scene-12', description: 'Blood effect - injury makeup enhancement', vfxType: 'practical', confidence: 0.65, createdAt: new Date().toISOString(), scene: { sceneNumber: '12', headingRaw: 'INT. WAREHOUSE - NIGHT', sceneIndex: 11 } },
  { id: 'vfx-6', sceneId: 'scene-15', description: 'Temple atmosphere - divine glow effect', vfxType: 'lighting', confidence: 0.78, createdAt: new Date().toISOString(), scene: { sceneNumber: '15', headingRaw: 'EXT. TEMPLE - NIGHT', sceneIndex: 14 } },
  { id: 'vfx-7', sceneId: 'scene-18', description: 'Final confrontation - fire explosion', vfxType: 'environment', confidence: 0.93, createdAt: new Date().toISOString(), scene: { sceneNumber: '18', headingRaw: 'EXT. FACTORY - NIGHT', sceneIndex: 17 } },
  { id: 'vfx-8', sceneId: 'scene-20', description: 'Montage transitions - time warp effect', vfxType: 'transition', confidence: 0.70, createdAt: new Date().toISOString(), scene: { sceneNumber: '20', headingRaw: 'INT. MEMORY - DAY', sceneIndex: 19 } },
]

const DEMO_VFX_WARNINGS = [
  { id: 'vw-1', sceneId: 'scene-5', warningType: 'vfx', severity: 'high', description: 'Complex car chase requires extensive VFX work - budget impact', scene: { sceneNumber: '5', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 4 } },
  { id: 'vw-2', sceneId: 'scene-18', warningType: 'vfx', severity: 'high', description: 'Fire explosion scene needs professional VFX team', scene: { sceneNumber: '18', headingRaw: 'EXT. FACTORY - NIGHT', sceneIndex: 17 } },
  { id: 'vw-3', sceneId: 'scene-8', warningType: 'vfx', severity: 'medium', description: 'Surreal dream sequence may require CGI elements', scene: { sceneNumber: '8', headingRaw: 'INT. DREAM - NIGHT', sceneIndex: 7 } },
]

const DEMO_VFX_PROPS = [
  { id: 'vp-1', sceneId: 'scene-1', scene: { sceneNumber: '1', headingRaw: 'EXT. CITY - DAY' }, prop: { name: 'City Background Plate', description: 'Pre-shot city skyline' } },
  { id: 'vp-2', sceneId: 'scene-2', scene: { sceneNumber: '2', headingRaw: 'INT. HOUSE - NIGHT' }, prop: { name: 'Rain System', description: 'Digital rain overlay' } },
]

function getDemoResponse() {
  const complexityBreakdown = { simple: 0, moderate: 0, complex: 0 }
  for (const note of DEMO_VFX_NOTES) {
    if (note.confidence >= 0.8) complexityBreakdown.complex++
    else if (note.confidence >= 0.5) complexityBreakdown.moderate++
    else complexityBreakdown.simple++
  }

  const uniqueScenes = new Set(DEMO_VFX_NOTES.map(n => n.scene.sceneNumber))

  return {
    vfxNotes: DEMO_VFX_NOTES,
    vfxWarnings: DEMO_VFX_WARNINGS,
    props: DEMO_VFX_PROPS,
    summary: {
      totalScenes: uniqueScenes.size,
      totalNotes: DEMO_VFX_NOTES.length,
      totalWarnings: DEMO_VFX_WARNINGS.length,
      complexityBreakdown,
    },
    _demo: true,
  }
}

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  const useDemo = req.nextUrl.searchParams.get('demo') === 'true';

  // Use demo data if requested or if no scriptId provided
  if (!scriptId || useDemo) {
    return NextResponse.json(getDemoResponse());
  }

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
    });
  } catch (error) {
    console.error('[GET /api/vfx] Database error, falling back to demo:', error);
    // Fallback to demo data on any database error
    return NextResponse.json(getDemoResponse());
  }
}

export async function POST(req: NextRequest) {
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
    });
  } catch (error) {
    console.error('[POST /api/vfx] Database error, falling back to demo:', error);
    // Return demo response on database error
    return NextResponse.json({
      ...getDemoResponse(),
      message: 'Demo mode: Using sample VFX analysis',
    });
  }
}
