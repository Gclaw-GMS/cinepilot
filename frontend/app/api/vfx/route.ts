import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runTextTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

export async function GET(req: NextRequest) {
  try {
    const scriptId = req.nextUrl.searchParams.get('scriptId');
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
    }

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
    console.error('[GET /api/vfx]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
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
    console.error('[POST /api/vfx]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
