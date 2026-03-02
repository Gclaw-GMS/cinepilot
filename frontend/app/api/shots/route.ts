import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateShotsForScene,
  generateShotsForScript,
  updateShot,
  fillShotFields,
  type DirectorStyleKey,
} from '@/lib/shots/pipeline';

// Demo data for shots when database is not connected
const DEMO_SHOTS = [
  { id: 'shot-1', shotIndex: 1, beatIndex: 1, shotText: 'Wide establishing shot of beach', characters: ['ARJUN', 'PRIYA'], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 24, lensType: 'zoom', keyStyle: 'golden_hour', colorTemp: 'warm', durationEstSec: 8, confidenceCamera: 0.92, confidenceLens: 0.88, confidenceLight: 0.95, confidenceDuration: 0.9, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach' } },
  { id: 'shot-2', shotIndex: 2, beatIndex: 1, shotText: 'Medium shot of couple walking', characters: ['ARJUN', 'PRIYA'], shotSize: 'MS', cameraAngle: 'eye', cameraMovement: 'steadicam', focalLengthMm: 50, lensType: 'prime', keyStyle: 'romantic', colorTemp: 'warm', durationEstSec: 6, confidenceCamera: 0.89, confidenceLens: 0.91, confidenceLight: 0.87, confidenceDuration: 0.85, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach' } },
  { id: 'shot-3', shotIndex: 3, beatIndex: 2, shotText: 'Close-up of ice cream', characters: [], shotSize: 'CU', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'macro', keyStyle: 'product', colorTemp: 'neutral', durationEstSec: 3, confidenceCamera: 0.95, confidenceLens: 0.93, confidenceLight: 0.9, confidenceDuration: 0.92, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach' } },
  { id: 'shot-4', shotIndex: 4, beatIndex: 2, shotText: 'Reaction shot - Priya laughing', characters: ['PRIYA'], shotSize: 'CU', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 50, lensType: 'prime', keyStyle: 'soft_light', colorTemp: 'warm', durationEstSec: 4, confidenceCamera: 0.88, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.88, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach' } },
  { id: 'shot-5', shotIndex: 5, beatIndex: 3, shotText: 'Sunset silhouette shot', characters: ['ARJUN', 'PRIYA'], shotSize: 'WS', cameraAngle: 'low', cameraMovement: 'dolly', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'sunset', colorTemp: 'orange', durationEstSec: 10, confidenceCamera: 0.91, confidenceLens: 0.87, confidenceLight: 0.96, confidenceDuration: 0.89, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach' } },
  { id: 'shot-6', shotIndex: 1, beatIndex: 1, shotText: 'Establishing shot of restaurant', characters: [], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'crane', focalLengthMm: 24, lensType: 'zoom', keyStyle: 'motivated', colorTemp: 'cool', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.89, confidenceLight: 0.88, confidenceDuration: 0.85, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Sea Shell Restaurant' } },
  { id: 'shot-7', shotIndex: 2, beatIndex: 1, shotText: 'Two-shot at table', characters: ['ARJUN', 'RAHUL'], shotSize: 'MS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'candlelight', colorTemp: 'warm', durationEstSec: 8, confidenceCamera: 0.87, confidenceLens: 0.86, confidenceLight: 0.92, confidenceDuration: 0.84, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Sea Shell Restaurant' } },
  { id: 'shot-8', shotIndex: 3, beatIndex: 2, shotText: 'Over-the-shoulder dialogue', characters: ['ARJUN', 'RAHUL'], shotSize: 'OTS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 50, lensType: 'prime', keyStyle: 'dialogue', colorTemp: 'neutral', durationEstSec: 12, confidenceCamera: 0.93, confidenceLens: 0.91, confidenceLight: 0.89, confidenceDuration: 0.91, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Sea Shell Restaurant' } },
  { id: 'shot-9', shotIndex: 1, beatIndex: 1, shotText: 'Interior establishing - apartment', characters: [], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'steadicam', focalLengthMm: 28, lensType: 'zoom', keyStyle: 'motivated', colorTemp: 'neutral', durationEstSec: 5, confidenceCamera: 0.88, confidenceLens: 0.87, confidenceLight: 0.86, confidenceDuration: 0.82, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. APARTMENT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: "Arjun's Apartment" } },
  { id: 'shot-10', shotIndex: 2, beatIndex: 1, shotText: 'Arjun looking at phone', characters: ['ARJUN'], shotSize: 'MCU', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'prime', keyStyle: 'natural', colorTemp: 'neutral', durationEstSec: 4, confidenceCamera: 0.9, confidenceLens: 0.92, confidenceLight: 0.88, confidenceDuration: 0.87, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. APARTMENT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: "Arjun's Apartment" } }
];

const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Chennai Beach', _count: { shots: 5 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Sea Shell Restaurant', _count: { shots: 3 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. APARTMENT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: "Arjun's Apartment", _count: { shots: 2 } },
  { id: 'scene-4', sceneNumber: '4', headingRaw: 'EXT. TEMPLE - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Kapaleeshwarar Temple', _count: { shots: 0 } },
  { id: 'scene-5', sceneNumber: '5', headingRaw: 'INT. HOSPITAL - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'General Hospital', _count: { shots: 0 } }
];

// GET /api/shots?scriptId=xxx — get all shots for a script
// GET /api/shots?stats=true — get stats for first active script (for dashboard)
export async function GET(req: NextRequest) {
  try {
    const scriptId = req.nextUrl.searchParams.get('scriptId');
    const sceneId = req.nextUrl.searchParams.get('sceneId');
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

    // If no scriptId provided, get the first active script for stats-only requests
    let targetScriptId = scriptId;
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

    // If no scriptId or sceneId provided, return demo data for stats requests
    if (!targetScriptId && !sceneId) {
      const totalDuration = DEMO_SHOTS.reduce((sum, s) => sum + (s.durationEstSec || 3), 0);
      const missingFields = DEMO_SHOTS.filter(s => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec).length;
      
      if (statsOnly) {
        return NextResponse.json({
          totalShots: DEMO_SHOTS.length,
          totalDurationSec: Math.round(totalDuration),
          missingFields,
          scenes: DEMO_SCENES.map(s => ({
            sceneNumber: s.sceneNumber,
            headingRaw: s.headingRaw,
            shotCount: s._count.shots,
          })),
          isDemoMode: true,
        });
      }
      
      return NextResponse.json({
        shots: DEMO_SHOTS,
        scenes: DEMO_SCENES,
        stats: {
          totalShots: DEMO_SHOTS.length,
          totalDuration: Math.round(totalDuration),
          missingFields,
        },
        isDemoMode: true,
      });
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
      where: targetScriptId ? { scriptId: targetScriptId } : { id: sceneId! },
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

    // If no real shots found in database, return demo data
    if (shots.length === 0 && targetScriptId) {
      const totalDuration = DEMO_SHOTS.reduce((sum, s) => sum + (s.durationEstSec || 3), 0);
      const missingFields = DEMO_SHOTS.filter(s => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec).length;
      
      if (statsOnly) {
        return NextResponse.json({
          totalShots: DEMO_SHOTS.length,
          totalDurationSec: Math.round(totalDuration),
          missingFields,
          scenes: DEMO_SCENES.map(s => ({
            sceneNumber: s.sceneNumber,
            headingRaw: s.headingRaw,
            shotCount: s._count.shots,
          })),
          isDemoMode: true,
        });
      }
      
      return NextResponse.json({
        shots: DEMO_SHOTS,
        scenes: DEMO_SCENES,
        stats: {
          totalShots: DEMO_SHOTS.length,
          totalDuration: Math.round(totalDuration),
          missingFields,
        },
        isDemoMode: true,
      });
    }

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
    console.error('[GET /api/shots]', error);
    // Return demo data when database is not connected
    const totalDuration = DEMO_SHOTS.reduce((sum, s) => sum + (s.durationEstSec || 3), 0);
    const missingFields = DEMO_SHOTS.filter(s => !s.shotSize || !s.focalLengthMm || !s.keyStyle || !s.durationEstSec).length;
    
    return NextResponse.json({
      shots: DEMO_SHOTS,
      scenes: DEMO_SCENES,
      stats: {
        totalShots: DEMO_SHOTS.length,
        totalDuration: Math.round(totalDuration),
        missingFields,
      },
      isDemoMode: true,
    });
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

    if (action === 'importCSV' && body.shots && body.scriptId) {
      // Import shots from CSV data
      const { shots: importedShots, scriptId: importScriptId } = body;
      
      let importedCount = 0;
      
      for (const shot of importedShots) {
        try {
          // Find or create scene if needed
          let sceneId = shot.sceneId;
          
          if (!sceneId && shot.sceneNumber) {
            // Try to find existing scene by scene number
            const scene = await prisma.scene.findFirst({
              where: { 
                scriptId: importScriptId,
                sceneNumber: String(shot.sceneNumber)
              },
              select: { id: true }
            });
            if (scene) {
              sceneId = scene.id;
            }
          }
          
          if (sceneId) {
            await prisma.shot.create({
              data: {
                sceneId,
                shotIndex: shot.shotIndex || 1,
                beatIndex: shot.beatIndex || 1,
                shotText: shot.shotText || '',
                shotSize: shot.shotSize,
                cameraAngle: shot.cameraAngle,
                cameraMovement: shot.cameraMovement,
                focalLengthMm: shot.focalLengthMm,
                lensType: shot.lensType,
                keyStyle: shot.keyStyle,
                colorTemp: shot.colorTemp,
                durationEstSec: shot.durationEstSec,
                isLocked: false,
                userEdited: true,
              }
            });
            importedCount++;
          }
        } catch (e) {
          console.warn('Failed to import shot:', shot, e);
        }
      }
      
      return NextResponse.json({ 
        message: `Imported ${importedCount} shots`,
        importedCount 
      });
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
