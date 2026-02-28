import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runTextTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

// Demo data for continuity warnings when database is not connected
const DEMO_WARNINGS = [
  { id: 'cw1', sceneId: 'scene-1', warningType: 'continuity', severity: 'high', description: 'Arjun is described as having short hair in Scene 1 but long hair in Scene 5', scene: { sceneNumber: '5', headingRaw: 'INT. APARTMENT - DAY' } },
  { id: 'cw2', sceneId: 'scene-3', warningType: 'continuity', severity: 'medium', description: 'Priya\'s dress color changes from blue to red between Scene 3 and Scene 4', scene: { sceneNumber: '4', headingRaw: 'EXT. TEMPLE - EVENING' } },
  { id: 'cw3', sceneId: 'scene-7', warningType: 'continuity', severity: 'low', description: 'Time inconsistency: Scene 7 mentions "morning" but shadows suggest afternoon', scene: { sceneNumber: '7', headingRaw: 'EXT. PARK - MORNING' } },
  { id: 'pw1', sceneId: 'scene-8', warningType: 'plot_hole', severity: 'high', description: 'Raghav mentions knowing about the treasure in Scene 8 but was never introduced to this information earlier', scene: { sceneNumber: '8', headingRaw: 'INT. OFFICE - DAY' } },
  { id: 'pw2', sceneId: 'scene-12', warningType: 'plot_hole', severity: 'medium', description: 'Priya suddenly knows about the secret passage despite no prior scene showing her discovering it', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT' } },
  { id: 'pw3', sceneId: 'scene-15', warningType: 'plot_hole', severity: 'low', description: 'The broken phone is seen working again in Scene 15 with no explanation', scene: { sceneNumber: '15', headingRaw: 'INT. HOSPITAL - DAY' } },
  { id: 'cw4', sceneId: 'scene-2', warningType: 'continuity', severity: 'medium', description: 'Restaurant table setting differs between Scene 2 (intro) and Scene 2 (dialogue)', scene: { sceneNumber: '2', headingRaw: 'INT. RESTAURANT - NIGHT' } },
  { id: 'cw5', sceneId: 'scene-10', warningType: 'continuity', severity: 'low', description: 'Watch time shows 9:00 PM but exterior shot shows daylight', scene: { sceneNumber: '10', headingRaw: 'INT. APARTMENT - NIGHT' } },
];

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  if (!scriptId) {
    return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
  }

  try {
    // Try database first
    await prisma.$connect();

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
    // Return demo data when database is not connected
    console.log('[GET /api/continuity] Using demo data - database not connected');
    return NextResponse.json({
      warnings: DEMO_WARNINGS,
      isDemo: true
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
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
    // Return demo analysis when database is not connected
    console.log('[POST /api/continuity] Using demo data - database not connected');
    
    // Return demo warnings in demo mode
    return NextResponse.json({
      warnings: DEMO_WARNINGS,
      summary: {
        continuityIssues: DEMO_WARNINGS.filter(w => w.warningType === 'continuity').length,
        plotHoles: DEMO_WARNINGS.filter(w => w.warningType === 'plot_hole').length,
        total: DEMO_WARNINGS.length,
      },
      isDemo: true,
      message: 'Demo mode - AI analysis simulated'
    });
  }
}
