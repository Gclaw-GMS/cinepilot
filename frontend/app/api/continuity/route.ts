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

    const warnings = await prisma.warning.findMany({
      where: {
        scene: { scriptId },
        warningType: { in: ['continuity', 'plot_hole'] },
      },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true } },
      },
      orderBy: { severity: 'desc' },
    });

    return NextResponse.json(warnings);
  } catch (error) {
    console.error('[GET /api/continuity]', error);
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
      include: {
        sceneCharacters: {
          include: { character: { select: { name: true } } },
        },
        sceneProps: {
          include: { prop: { select: { name: true } } },
        },
      },
    });

    if (scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes found for this script' }, { status: 404 });
    }

    const sceneAppearances = scenes
      .map((s) => {
        const chars = s.sceneCharacters.map((sc) => sc.character.name).join(', ');
        const props = s.sceneProps.map((sp) => sp.prop.name).join(', ');
        return `Scene ${s.sceneNumber} [${s.headingRaw || 'UNKNOWN'}] (${s.timeOfDay || 'N/A'}): Characters: ${chars || 'none'}; Props: ${props || 'none'}`;
      })
      .join('\n');

    const characterNames = [
      ...new Set(scenes.flatMap((s) => s.sceneCharacters.map((sc) => sc.character.name))),
    ];
    const characterProfiles = characterNames
      .map((name) => {
        const appearances = scenes
          .filter((s) => s.sceneCharacters.some((sc) => sc.character.name === name))
          .map((s) => s.sceneNumber);
        return `${name}: appears in scenes ${appearances.join(', ')}`;
      })
      .join('\n');

    const consistencyResult = await runTextTask(
      'script.characterConsistency',
      { characterProfiles, sceneAppearances },
      PROMPTS.scriptParsing.characterConsistency.system,
      PROMPTS.scriptParsing.characterConsistency.user,
      { responseFormat: { type: 'json_object' }, maxTokens: 4096 },
    );

    let consistencyIssues: Array<{
      character: string;
      type: string;
      severity: string;
      description: string;
      scene_refs: string[];
    }> = [];
    try {
      const parsed = JSON.parse(consistencyResult);
      consistencyIssues = parsed.issues || [];
    } catch {
      console.warn('[POST /api/continuity] Failed to parse consistency result');
    }

    const sceneSynopsis = scenes
      .map((s) => `Scene ${s.sceneNumber}: ${s.headingRaw || ''} — ${s.description || 'No description'}`)
      .join('\n');

    const plotResult = await runTextTask(
      'script.plotHoles',
      { sceneSynopsis, turningPoints: '' },
      PROMPTS.scriptParsing.plotHoles.system,
      PROMPTS.scriptParsing.plotHoles.user,
      { responseFormat: { type: 'json_object' }, maxTokens: 4096 },
    );

    let plotHoles: Array<{
      severity: string;
      description: string;
      scene_refs: string[];
    }> = [];
    try {
      const parsed = JSON.parse(plotResult);
      plotHoles = parsed.plot_holes || [];
    } catch {
      console.warn('[POST /api/continuity] Failed to parse plot holes result');
    }

    const sceneMap = new Map(scenes.map((s) => [s.sceneNumber, s.id]));

    const createdWarnings: unknown[] = [];

    for (const issue of consistencyIssues) {
      const ref = issue.scene_refs?.[0];
      const sceneId = ref ? sceneMap.get(ref) : scenes[0]?.id;
      if (!sceneId) continue;

      const severity = issue.severity === 'med' ? 'medium' : issue.severity;
      const warning = await prisma.warning.create({
        data: {
          sceneId,
          warningType: 'continuity',
          severity,
          description: `[${issue.character || 'General'}] ${issue.description}`,
        },
      });
      createdWarnings.push(warning);
    }

    for (const hole of plotHoles) {
      const ref = hole.scene_refs?.[0];
      const sceneId = ref ? sceneMap.get(ref) : scenes[0]?.id;
      if (!sceneId) continue;

      const severity = hole.severity === 'med' ? 'medium' : hole.severity;
      const warning = await prisma.warning.create({
        data: {
          sceneId,
          warningType: 'plot_hole',
          severity,
          description: hole.description,
        },
      });
      createdWarnings.push(warning);
    }

    return NextResponse.json({
      warnings: createdWarnings,
      summary: {
        continuityIssues: consistencyIssues.length,
        plotHoles: plotHoles.length,
        total: createdWarnings.length,
      },
    });
  } catch (error) {
    console.error('[POST /api/continuity]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
