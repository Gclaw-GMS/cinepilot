import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Demo shot data for seeding
const DEMO_SHOTS = [
  {
    id: 'shot-1',
    sceneId: 'scene-1',
    shotIndex: 1,
    beatIndex: 1,
    shotText: 'CLOSE UP - RAJI enters the courtroom with determination',
    characters: ['RAVI'],
    shotSize: 'CU',
    cameraAngle: 'eye',
    cameraMovement: 'static',
    focalLengthMm: 85,
    lensType: 'prime',
    keyStyle: 'motivated',
    colorTemp: '5600K',
    durationEstSec: 4,
    confidenceCamera: 0.9,
    confidenceLens: 0.85,
    confidenceLight: 0.8,
    confidenceDuration: 0.75,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-2',
    sceneId: 'scene-1',
    shotIndex: 2,
    beatIndex: 2,
    shotText: 'MEDIUM SHOT - RAVI stands before the judge',
    characters: ['RAVI', 'JUDGE'],
    shotSize: 'MS',
    cameraAngle: 'eye',
    cameraMovement: 'steadicam',
    focalLengthMm: 50,
    lensType: 'prime',
    keyStyle: 'documentary',
    colorTemp: '5600K',
    durationEstSec: 6,
    confidenceCamera: 0.88,
    confidenceLens: 0.82,
    confidenceLight: 0.78,
    confidenceDuration: 0.7,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-3',
    sceneId: 'scene-1',
    shotIndex: 3,
    beatIndex: 1,
    shotText: 'WIDE SHOT - The crowded courtroom gallery',
    characters: [],
    shotSize: 'WS',
    cameraAngle: 'high',
    cameraMovement: 'dolly',
    focalLengthMm: 24,
    lensType: 'zoom',
    keyStyle: 'establishing',
    colorTemp: '5600K',
    durationEstSec: 5,
    confidenceCamera: 0.92,
    confidenceLens: 0.9,
    confidenceLight: 0.85,
    confidenceDuration: 0.8,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-4',
    sceneId: 'scene-2',
    shotIndex: 4,
    beatIndex: 1,
    shotText: 'EXTREME CLOSE UP - DIVYA\'s eyes welling with tears',
    characters: ['DIVYA'],
    shotSize: 'ECU',
    cameraAngle: 'low',
    cameraMovement: 'static',
    focalLengthMm: 135,
    lensType: 'prime',
    keyStyle: 'emotional',
    colorTemp: '4300K',
    durationEstSec: 3,
    confidenceCamera: 0.85,
    confidenceLens: 0.88,
    confidenceLight: 0.75,
    confidenceDuration: 0.7,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-5',
    sceneId: 'scene-2',
    shotIndex: 5,
    beatIndex: 2,
    shotText: 'MEDIUM WIDE SHOT - DIVYA walks through temple corridor',
    characters: ['DIVYA'],
    shotSize: 'MWS',
    cameraAngle: 'eye',
    cameraMovement: 'handheld',
    focalLengthMm: 35,
    lensType: 'zoom',
    keyStyle: 'realistic',
    colorTemp: '4300K',
    durationEstSec: 8,
    confidenceCamera: 0.8,
    confidenceLens: 0.78,
    confidenceLight: 0.72,
    confidenceDuration: 0.65,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-6',
    sceneId: 'scene-3',
    shotIndex: 6,
    beatIndex: 1,
    shotText: 'CLOSE UP - RAVI receives the verdict document',
    characters: ['RAVI'],
    shotSize: 'CU',
    cameraAngle: 'eye',
    cameraMovement: 'track',
    focalLengthMm: 85,
    lensType: 'prime',
    keyStyle: 'motivated',
    colorTemp: '5600K',
    durationEstSec: 4,
    confidenceCamera: 0.87,
    confidenceLens: 0.84,
    confidenceLight: 0.8,
    confidenceDuration: 0.75,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-7',
    sceneId: 'scene-3',
    shotIndex: 7,
    beatIndex: 2,
    shotText: 'OVER THE SHOULDER - RAVI looks at the opposing counsel',
    characters: ['RAVI', 'ADVOCATE'],
    shotSize: 'MS',
    cameraAngle: 'over-shoulder',
    cameraMovement: 'static',
    focalLengthMm: 50,
    lensType: 'prime',
    keyStyle: 'confrontational',
    colorTemp: '5600K',
    durationEstSec: 5,
    confidenceCamera: 0.85,
    confidenceLens: 0.82,
    confidenceLight: 0.78,
    confidenceDuration: 0.72,
    isLocked: false,
    userEdited: false,
  },
  {
    id: 'shot-8',
    sceneId: 'scene-3',
    shotIndex: 8,
    beatIndex: 3,
    shotText: 'WIDE SHOT - RAVI exits the courtroom triumphantly',
    characters: ['RAVI'],
    shotSize: 'WS',
    cameraAngle: 'low',
    cameraMovement: 'crane',
    focalLengthMm: 24,
    lensType: 'zoom',
    keyStyle: 'triumphant',
    colorTemp: '5600K',
    durationEstSec: 6,
    confidenceCamera: 0.9,
    confidenceLens: 0.88,
    confidenceLight: 0.85,
    confidenceDuration: 0.8,
    isLocked: false,
    userEdited: false,
  },
];

// Demo scenes for shot context
const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM', _count: { shots: 3 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'TEMPLE', _count: { shots: 2 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: "INT. COURTROOM - DAY", intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM', _count: { shots: 3 } },
];

const DEMO_SHOT_RESPONSE = {
  shots: DEMO_SHOTS,
  scenes: DEMO_SCENES,
  stats: {
    totalShots: DEMO_SHOTS.length,
    totalDuration: DEMO_SHOTS.reduce((acc, s) => acc + (s.durationEstSec || 0), 0),
    missingFields: DEMO_SHOTS.filter(s => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec).length,
  },
  isDemo: true,
};

// Check if database model exists
async function checkShotModel() {
  try {
    await prisma.shot.count();
    return true;
  } catch {
    return false;
  }
}

// GET /api/shot-list - list all shots with optional filtering
export async function GET(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get('sceneId');
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  const action = req.nextUrl.searchParams.get('action');

  const dbAvailable = await checkShotModel();

  if (!dbAvailable) {
    console.log('[GET /api/shot-list] Database not available, returning demo data');
    return NextResponse.json(DEMO_SHOT_RESPONSE);
  }

  try {
    // Check if we should seed data
    const existingCount = await prisma.shot.count();

    if (existingCount === 0 && action !== 'noseed') {
      // Auto-seed demo data if empty
      for (const shot of DEMO_SHOTS) {
        await prisma.shot.create({
          data: {
            sceneId: shot.sceneId,
            shotIndex: shot.shotIndex,
            beatIndex: shot.beatIndex,
            shotText: shot.shotText,
            characters: shot.characters,
            shotSize: shot.shotSize,
            cameraAngle: shot.cameraAngle,
            cameraMovement: shot.cameraMovement,
            focalLengthMm: shot.focalLengthMm,
            lensType: shot.lensType,
            keyStyle: shot.keyStyle,
            colorTemp: shot.colorTemp,
            durationEstSec: shot.durationEstSec,
            confidenceCamera: shot.confidenceCamera,
            confidenceLens: shot.confidenceLens,
            confidenceLight: shot.confidenceLight,
            confidenceDuration: shot.confidenceDuration,
            isLocked: shot.isLocked,
            userEdited: shot.userEdited,
          },
        });
      }
    }

    // Build query - shots are linked to scenes
    const where: Record<string, unknown> = {};
    if (sceneId) {
      where.sceneId = sceneId;
    }

    const shots = await prisma.shot.findMany({
      where,
      orderBy: [{ sceneId: 'asc' }, { shotIndex: 'asc' }],
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
    });

    // Get unique scenes with shot counts
    const scenes = await prisma.scene.findMany({
      where: scriptId ? { scriptId } : undefined,
      select: {
        id: true,
        sceneNumber: true,
        headingRaw: true,
        intExt: true,
        timeOfDay: true,
        location: true,
        _count: {
          select: { shots: true },
        },
      },
      orderBy: { sceneNumber: 'asc' },
    });

    // Calculate stats
    const totalDuration = shots.reduce((acc, s) => acc + (s.durationEstSec || 0), 0);
    const missingFields = shots.filter(
      s => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec
    ).length;

    return NextResponse.json({
      shots,
      scenes: scenes.length > 0 ? scenes : DEMO_SCENES,
      stats: {
        totalShots: shots.length || DEMO_SHOTS.length,
        totalDuration: totalDuration || DEMO_SHOTS.reduce((acc, s) => acc + (s.durationEstSec || 0), 0),
        missingFields: missingFields || 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/shot-list] Database error, using demo data:', error);
    return NextResponse.json(DEMO_SHOT_RESPONSE);
  }
}

// POST /api/shot-list - create new shot
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    sceneId,
    shotIndex,
    beatIndex,
    shotText,
    characters,
    shotSize,
    cameraAngle,
    cameraMovement,
    focalLengthMm,
    lensType,
    keyStyle,
    colorTemp,
    durationEstSec,
  } = body;

  if (!sceneId || shotIndex === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: sceneId, shotIndex' },
      { status: 400 }
    );
  }

  const dbAvailable = await checkShotModel();

  if (!dbAvailable) {
    // Return success in demo mode
    return NextResponse.json({
      shot: {
        id: `demo-shot-${Date.now()}`,
        sceneId: String(sceneId),
        shotIndex: Number(shotIndex),
        beatIndex: beatIndex ? Number(beatIndex) : 1,
        shotText: shotText ? String(shotText) : '',
        characters: (Array.isArray(characters) ? characters : []) as string[],
        shotSize: shotSize ? String(shotSize) : null,
        cameraAngle: cameraAngle ? String(cameraAngle) : null,
        cameraMovement: cameraMovement ? String(cameraMovement) : null,
        focalLengthMm: focalLengthMm ? Number(focalLengthMm) : null,
        lensType: lensType ? String(lensType) : null,
        keyStyle: keyStyle ? String(keyStyle) : null,
        colorTemp: colorTemp ? String(colorTemp) : null,
        durationEstSec: durationEstSec ? Number(durationEstSec) : null,
        isLocked: false,
        userEdited: true,
      },
      _demo: true,
    });
  }

  try {
    const shot = await prisma.shot.create({
      data: {
        sceneId: String(sceneId),
        shotIndex: Number(shotIndex),
        beatIndex: beatIndex ? Number(beatIndex) : 1,
        shotText: shotText ? String(shotText) : '',
        characters: (Array.isArray(characters) ? characters : []) as string[],
        shotSize: shotSize ? String(shotSize) : null,
        cameraAngle: cameraAngle ? String(cameraAngle) : null,
        cameraMovement: cameraMovement ? String(cameraMovement) : null,
        focalLengthMm: focalLengthMm ? Number(focalLengthMm) : null,
        lensType: lensType ? String(lensType) : null,
        keyStyle: keyStyle ? String(keyStyle) : null,
        colorTemp: colorTemp ? String(colorTemp) : null,
        durationEstSec: durationEstSec ? Number(durationEstSec) : null,
        isLocked: false,
        userEdited: true,
      },
    });

    return NextResponse.json({ shot });
  } catch (error) {
    console.error('[POST /api/shot-list] Database error:', error);
    return NextResponse.json({
      shot: {
        id: `demo-shot-${Date.now()}`,
        sceneId: String(sceneId),
        shotIndex: Number(shotIndex),
        beatIndex: beatIndex ? Number(beatIndex) : 1,
        shotText: shotText ? String(shotText) : '',
        characters: (Array.isArray(characters) ? characters : []) as string[],
        shotSize: shotSize ? String(shotSize) : null,
        cameraAngle: cameraAngle ? String(cameraAngle) : null,
        cameraMovement: cameraMovement ? String(cameraMovement) : null,
        focalLengthMm: focalLengthMm ? Number(focalLengthMm) : null,
        lensType: lensType ? String(lensType) : null,
        keyStyle: keyStyle ? String(keyStyle) : null,
        colorTemp: colorTemp ? String(colorTemp) : null,
        durationEstSec: durationEstSec ? Number(durationEstSec) : null,
        isLocked: false,
        userEdited: true,
      },
      _demo: true,
    });
  }
}

// PATCH /api/shot-list - update a shot
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({ error: 'Shot ID is required' }, { status: 400 });
  }

  // Build update object
  const dataToUpdate: Record<string, unknown> = {};
  const allowedFields = [
    'sceneId', 'shotIndex', 'beatIndex', 'shotText', 'characters',
    'shotSize', 'cameraAngle', 'cameraMovement', 'focalLengthMm',
    'lensType', 'keyStyle', 'colorTemp', 'durationEstSec',
    'confidenceCamera', 'confidenceLens', 'confidenceLight', 'confidenceDuration',
    'isLocked', 'userEdited'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'characters') {
        dataToUpdate[field] = updateData[field];
      } else if (['shotIndex', 'beatIndex', 'focalLengthMm', 'durationEstSec'].includes(field)) {
        dataToUpdate[field] = Number(updateData[field]);
      } else {
        dataToUpdate[field] = updateData[field];
      }
    }
  }

  dataToUpdate.userEdited = true;

  const dbAvailable = await checkShotModel();

  if (!dbAvailable) {
    return NextResponse.json({
      shot: {
        id: String(id),
        ...dataToUpdate,
        scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' },
      },
      _demo: true,
    });
  }

  try {
    const shot = await prisma.shot.update({
      where: { id: String(id) },
      data: dataToUpdate,
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
    });

    return NextResponse.json({ shot });
  } catch (error) {
    console.error('[PATCH /api/shot-list] Database error:', error);
    return NextResponse.json({
      shot: {
        id: String(id),
        ...dataToUpdate,
        scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' },
      },
      _demo: true,
    });
  }
}

// DELETE /api/shot-list - delete a shot
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Shot ID is required' }, { status: 400 });
    }

    const dbAvailable = await checkShotModel();

    if (!dbAvailable) {
      return NextResponse.json({ success: true, _demo: true });
    }

    await prisma.shot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/shot-list] Database error:', error);
    return NextResponse.json({ success: true, _demo: true });
  }
}
