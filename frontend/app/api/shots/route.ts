import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateShotsForScene,
  generateShotsForScript,
  updateShot,
  fillShotFields,
  type DirectorStyleKey,
} from '@/lib/shots/pipeline';

// Demo data for when database is not available
const DEMO_SHOTS = [
  { id: 'shot-1', sceneId: 'scene-1', shotIndex: 0, shotSize: 'Wide', shotType: 'Establishing', cameraAngle: 'Eye Level', cameraMovement: 'Static', durationEstSec: 5, focalLengthMm: 35, keyStyle: 'Naturalistic', lighting: 'Natural', notes: 'Opening wide shot of the courtroom', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' } },
  { id: 'shot-2', sceneId: 'scene-1', shotIndex: 1, shotSize: 'Medium', shotType: 'Dialogue', cameraAngle: 'Over Shoulder', cameraMovement: 'Dolly', durationEstSec: 8, focalLengthMm: 50, keyStyle: 'Naturalistic', lighting: 'Three-Point', notes: 'Judge entering', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' } },
  { id: 'shot-3', sceneId: 'scene-1', shotIndex: 2, shotSize: 'Close-Up', shotType: 'Reaction', cameraAngle: 'Straight On', cameraMovement: 'Static', durationEstSec: 4, focalLengthMm: 85, keyStyle: 'Dramatic', lighting: 'Rembrandt', notes: 'Ravi\'s reaction to the verdict', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' } },
  { id: 'shot-4', sceneId: 'scene-2', shotIndex: 0, shotSize: 'Extreme Wide', shotType: 'Establishing', cameraAngle: 'Low Angle', cameraMovement: 'Crane', durationEstSec: 6, focalLengthMm: 24, keyStyle: 'Cinematic', lighting: 'Moonlight', notes: 'Temple at night with diyas', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'KAPALEESHWARAR TEMPLE' } },
  { id: 'shot-5', sceneId: 'scene-2', shotIndex: 1, shotSize: 'Medium', shotType: 'POV', cameraAngle: 'POV', cameraMovement: 'Steadicam', durationEstSec: 10, focalLengthMm: 35, keyStyle: 'Immersive', lighting: 'Practical', notes: 'Divya walking through temple', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'KAPALEESHWARAR TEMPLE' } },
  { id: 'shot-6', sceneId: 'scene-3', shotIndex: 0, shotSize: 'Medium', shotType: 'Dialogue', cameraAngle: 'Two Shot', cameraMovement: 'Tracking', durationEstSec: 12, focalLengthMm: 50, keyStyle: 'Naturalistic', lighting: 'Soft Natural', notes: 'Ravi and Sarath discussing', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. RAVI\'S HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' } },
  { id: 'shot-7', sceneId: 'scene-3', shotIndex: 1, shotSize: 'Close-Up', shotType: 'Insert', cameraAngle: 'Straight On', cameraMovement: 'Static', durationEstSec: 3, focalLengthMm: 100, keyStyle: 'Naturalistic', lighting: 'Practical', notes: 'Coffee cup on table', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. RAVI\'S HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' } },
];

const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM', _count: { shots: 3 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'KAPALEESHWARAR TEMPLE', _count: { shots: 2 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. RAVI\'S HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE', _count: { shots: 2 } },
];

function getDemoResponse(statsOnly: boolean) {
  const totalDuration = DEMO_SHOTS.reduce((sum, s) => sum + (s.durationEstSec || 3), 0);
  
  if (statsOnly) {
    return {
      totalShots: DEMO_SHOTS.length,
      totalDurationSec: Math.round(totalDuration),
      missingFields: 0,
      scenes: DEMO_SCENES.map(s => ({
        sceneNumber: s.sceneNumber,
        headingRaw: s.headingRaw,
        shotCount: s._count.shots,
      })),
      _demo: true,
    };
  }

  return {
    shots: DEMO_SHOTS,
    scenes: DEMO_SCENES,
    stats: {
      totalShots: DEMO_SHOTS.length,
      totalDuration: Math.round(totalDuration),
      missingFields: 0,
    },
    _demo: true,
  };
}

// GET /api/shots?scriptId=xxx — get all shots for a script
// GET /api/shots?stats=true — get stats for first active script (for dashboard)
export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  const sceneId = req.nextUrl.searchParams.get('sceneId');
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

  // If no scriptId provided, get the first active script for stats-only requests
  let targetScriptId = scriptId;
  
  try {
    if (!targetScriptId && !sceneId && statsOnly) {
      const firstScript = await prisma.script.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (firstScript) {
        targetScriptId = firstScript.id;
      }
    }

    if (!targetScriptId && !sceneId) {
      // No scriptId provided and not statsOnly - check if we can use demo data
      return NextResponse.json(getDemoResponse(statsOnly));
    }

    const where = sceneId
      ? { sceneId }
      : { scene: { scriptId: targetScriptId! } };

    const shots = await prisma.shot.findMany({
      where,
      include: {
        scene: {
          select: {
            id: true,
            sceneNumber: true,
            headingRaw: true,
            intExt: true,
            timeOfDay: true,
            location: true,
          },
        },
      },
      orderBy: [{ scene: { sceneIndex: 'asc' } }, { shotIndex: 'asc' }],
    });

    const scenes = await prisma.scene.findMany({
      where: targetScriptId ? { id: targetScriptId } : { id: sceneId! },
      orderBy: { sceneIndex: 'asc' },
      select: {
        id: true,
        sceneNumber: true,
        headingRaw: true,
        intExt: true,
        timeOfDay: true,
        location: true,
        _count: { select: { shots: true } },
      },
    });

    const totalDuration = shots.reduce(
      (sum, s) => sum + (s.durationEstSec || 3),
      0
    );
    const missingFields = shots.filter(
      (s) => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec
    ).length;

    // For stats-only requests (dashboard), return flat format
    if (statsOnly) {
      return NextResponse.json({
        totalShots: shots.length,
        totalDurationSec: Math.round(totalDuration),
        missingFields,
        scenes: scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.headingRaw,
          shotCount: s._count.shots,
        })),
      });
    }

    return NextResponse.json({
      shots,
      scenes,
      stats: {
        totalShots: shots.length,
        totalDuration: Math.round(totalDuration),
        missingFields,
      },
    });
  } catch (error) {
    console.error('[GET /api/shots] Database not available, using demo data');
    // Use demo data when database is not available
    return NextResponse.json(getDemoResponse(statsOnly));
  }
}

// POST /api/shots — generate shots
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sceneId, scriptId, directorStyle, customStylePrompt, availableLenses, genre } = body;

    const style: DirectorStyleKey = directorStyle || 'maniRatnam';

    if (action === 'generateScene' && sceneId) {
      const result = await generateShotsForScene({
        sceneId,
        directorStyle: style,
        customStylePrompt,
        availableLenses,
        genre,
      });

      return NextResponse.json({
        message: `Generated ${result.shotCount} shots`,
        ...result,
      });
    }

    if (action === 'generateScript' && scriptId) {
      const result = await generateShotsForScript(
        scriptId,
        style,
        customStylePrompt,
        availableLenses,
        genre
      );

      return NextResponse.json({
        message: `Generated ${result.totalShots} shots across all scenes`,
        totalShots: result.totalShots,
        totalDuration: result.totalDuration,
      });
    }

    if (action === 'fillNull' && body.shotId) {
      await fillShotFields(body.shotId, style);
      return NextResponse.json({ message: 'Shot fields filled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/shots]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/shots — update a shot
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { shotId, ...updates } = body;

    if (!shotId) {
      return NextResponse.json({ error: 'shotId required' }, { status: 400 });
    }

    await updateShot(shotId, updates);
    return NextResponse.json({ message: 'Shot updated' });
  } catch (error) {
    console.error('[PATCH /api/shots]', error);
    return NextResponse.json({ error: 'Failed to update shot' }, { status: 500 });
  }
}
