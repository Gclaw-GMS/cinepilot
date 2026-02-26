import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateShotsForScene,
  generateShotsForScript,
  updateShot,
  fillShotFields,
  type DirectorStyleKey,
} from '@/lib/shots/pipeline';

// GET /api/shots?scriptId=xxx — get all shots for a script
export async function GET(req: NextRequest) {
  try {
    const scriptId = req.nextUrl.searchParams.get('scriptId');
    const sceneId = req.nextUrl.searchParams.get('sceneId');

    if (!scriptId && !sceneId) {
      return NextResponse.json({ error: 'scriptId or sceneId required' }, { status: 400 });
    }

    const where = sceneId
      ? { sceneId }
      : { scene: { scriptId: scriptId! } };

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
      where: scriptId ? { scriptId } : { id: sceneId! },
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
    console.error('[GET /api/shots]', error);
    return NextResponse.json({ error: 'Failed to fetch shots' }, { status: 500 });
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
