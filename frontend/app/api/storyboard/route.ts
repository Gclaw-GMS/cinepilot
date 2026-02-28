import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/storyboard — get storyboard frames
// GET /api/storyboard?stats=true — get stats for dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const scriptId = searchParams.get('scriptId') || undefined;
    const sceneId = searchParams.get('sceneId') || undefined;
    const statsOnly = searchParams.get('stats') === 'true';

    // If we have a scriptId, get all scenes that have shots
    let sceneIds: string[] = [];
    if (scriptId) {
      const scenesWithShots = await prisma.scene.findMany({
        where: { scriptId },
        select: { id: true },
      });
      sceneIds = scenesWithShots.map(s => s.id);
    } else if (sceneId) {
      sceneIds = [sceneId];
    }

    // Get existing frames
    const frameWhere: Record<string, unknown> = {};
    if (sceneId) {
      frameWhere.shot = { sceneId };
    } else if (scriptId) {
      frameWhere.shot = { scene: { scriptId } };
    }

    const frames = await prisma.storyboardFrame.findMany({
      where: frameWhere,
      include: {
        shot: {
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
        },
      },
      orderBy: [{ shot: { scene: { sceneIndex: 'asc' } } }, { shot: { shotIndex: 'asc' } }, { createdAt: 'asc' }],
    });

    // Group frames by scene
    const grouped: Record<string, {
      sceneId: string;
      sceneNumber: string;
      heading: string;
      intExt: string | null;
      timeOfDay: string | null;
      location: string | null;
      frames: {
        id: string;
        imageUrl: string | null;
        prompt: string | null;
        style: string | null;
        status: string | null;
        isApproved: boolean;
        shotId: string;
        shotIndex: number;
        shotText: string;
        shotSize: string | null;
        characters: string[];
      }[];
    }> = {};

    // Initialize with existing frames
    for (const f of frames) {
      const sId = f.shot.scene.id;
      if (!grouped[sId]) {
        grouped[sId] = {
          sceneId: sId,
          sceneNumber: f.shot.scene.sceneNumber,
          heading: f.shot.scene.headingRaw || `Scene ${f.shot.scene.sceneNumber}`,
          intExt: f.shot.scene.intExt,
          timeOfDay: f.shot.scene.timeOfDay,
          location: f.shot.scene.location,
          frames: [],
        };
      }
      grouped[sId].frames.push({
        id: f.id,
        imageUrl: f.imageUrl,
        prompt: f.prompt,
        style: f.style,
        status: f.status,
        isApproved: f.isApproved,
        shotId: f.shot.id,
        shotIndex: f.shot.shotIndex,
        shotText: f.shot.shotText || '',
        shotSize: f.shot.shotSize,
        characters: f.shot.characters || [],
      });
    }

    // If we have scenes but no frames yet, add empty scene groups with shot info
    if (sceneIds.length > 0 && Object.keys(grouped).length === 0) {
      const scenes = await prisma.scene.findMany({
        where: { id: { in: sceneIds } },
        include: {
          shots: {
            orderBy: { shotIndex: 'asc' },
            select: {
              id: true,
              shotIndex: true,
              shotText: true,
              shotSize: true,
              characters: true,
            },
          },
        },
        orderBy: { sceneIndex: 'asc' },
      });

      for (const scene of scenes) {
        if (scene.shots.length > 0) {
          grouped[scene.id] = {
            sceneId: scene.id,
            sceneNumber: scene.sceneNumber,
            heading: scene.headingRaw || `Scene ${scene.sceneNumber}`,
            intExt: scene.intExt,
            timeOfDay: scene.timeOfDay,
            location: scene.location,
            frames: scene.shots.map(shot => ({
              id: '',
              imageUrl: null,
              prompt: null,
              style: '',
              status: null,
              isApproved: false,
              shotId: shot.id,
              shotIndex: shot.shotIndex,
              shotText: shot.shotText || '',
              shotSize: shot.shotSize,
              characters: shot.characters || [],
            })),
          };
        }
      }
    }

    const scenes = Object.values(grouped).sort((a, b) => {
      const aNum = parseInt(a.sceneNumber) || 0;
      const bNum = parseInt(b.sceneNumber) || 0;
      return aNum - bNum;
    });

    // Transform to frontend format (with nested shot object)
    const transformedScenes = scenes.map(s => ({
      sceneId: s.sceneId,
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      frames: s.frames.map(f => ({
        id: f.id,
        imageUrl: f.imageUrl,
        prompt: f.prompt,
        style: f.style || '',
        status: f.status,
        directorNotes: null,
        isApproved: f.isApproved,
        shot: {
          id: f.shotId,
          shotIndex: f.shotIndex,
          shotText: f.shotText,
          shotSize: f.shotSize,
          characters: f.characters,
          scene: {
            id: s.sceneId,
            sceneNumber: parseInt(s.sceneNumber) || 0,
            headingRaw: s.heading,
            intExt: s.intExt,
            timeOfDay: s.timeOfDay,
          },
        },
      })),
    }));

    // For stats-only requests (dashboard), return flat format
    if (statsOnly) {
      const totalFrames = frames.length;
      const approvedFrames = frames.filter(f => f.isApproved).length;

      return NextResponse.json({
        totalFrames,
        approvedFrames,
        scenes: scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.heading,
          frames: s.frames.map(f => ({
            id: f.id,
            isApproved: f.isApproved,
          })),
        })),
      });
    }

    return NextResponse.json({ scenes: transformedScenes, totalFrames: frames.length });
  } catch (err: unknown) {
    console.error('[API/storyboard] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch storyboard' }, { status: 500 });
  }
}

// POST /api/storyboard — generate frames or update approval
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'generateScene' } = body;

    if (action === 'approve') {
      const { frameId, approved = true } = body;
      if (!frameId) return NextResponse.json({ error: 'frameId required' }, { status: 400 });
      const frame = await prisma.storyboardFrame.update({
        where: { id: frameId },
        data: { isApproved: approved },
      });
      return NextResponse.json({ frame });
    }

    if (action === 'addNote') {
      const { frameId, note } = body;
      if (!frameId || note === undefined) return NextResponse.json({ error: 'frameId and note required' }, { status: 400 });
      const frame = await prisma.storyboardFrame.update({
        where: { id: frameId },
        data: { directorNotes: note },
      });
      return NextResponse.json({ frame });
    }

    if (action === 'generateScene') {
      const { sceneId, style = 'cleanLineArt', maxFrames = 3 } = body;
      if (!sceneId) return NextResponse.json({ error: 'sceneId required' }, { status: 400 });

      // Get shots for this scene
      const shots = await prisma.shot.findMany({
        where: { sceneId },
        orderBy: { shotIndex: 'asc' },
        take: maxFrames,
      });

      if (shots.length === 0) {
        return NextResponse.json({ error: 'No shots found for this scene. Generate shots first in Shot Hub.' }, { status: 400 });
      }

      // Get scene info
      const scene = await prisma.scene.findUnique({
        where: { id: sceneId },
      });

      if (!scene) {
        return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
      }

      // Generate frames for each shot
      const generatedFrames = [];
      for (const shot of shots) {
        // Check if frame already exists for this shot
        const existingFrame = await prisma.storyboardFrame.findFirst({
          where: { shotId: shot.id },
        });

        if (existingFrame) {
          generatedFrames.push(existingFrame);
          continue;
        }

        // Generate a prompt based on shot details
        const prompt = generateFramePrompt(shot, scene, style);
        
        // Create the frame (in production, this would call an image generation API)
        const frame = await prisma.storyboardFrame.create({
          data: {
            shotId: shot.id,
            prompt,
            style,
            status: 'pending',
            isApproved: false,
          },
        });
        generatedFrames.push(frame);
      }

      return NextResponse.json({
        message: `Generated ${generatedFrames.length} frames`,
        frames: generatedFrames,
      });
    }

    if (action === 'generateFrame') {
      const { shotId, style = 'cleanLineArt', regenerate = false } = body;
      if (!shotId) return NextResponse.json({ error: 'shotId required' }, { status: 400 });

      // Get the shot
      const shot = await prisma.shot.findUnique({
        where: { id: shotId },
        include: { scene: true },
      });

      if (!shot) {
        return NextResponse.json({ error: 'Shot not found' }, { status: 404 });
      }

      // If regenerate, delete existing frame
      if (regenerate) {
        await prisma.storyboardFrame.deleteMany({ where: { shotId } });
      }

      // Generate prompt
      const prompt = generateFramePrompt(shot, shot.scene, style);

      // Create new frame
      const frame = await prisma.storyboardFrame.create({
        data: {
          shotId,
          prompt,
          style,
          status: 'pending',
          isApproved: false,
        },
      });

      return NextResponse.json({
        message: 'Frame generated',
        frame,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API/storyboard] POST error:', err);
    return NextResponse.json({ error: 'Storyboard operation failed' }, { status: 500 });
  }
}

// Helper function to generate frame prompts based on shot details
function generateFramePrompt(shot: any, scene: any, style: string): string {
  const sceneDesc = scene?.headingRaw || `Scene ${scene?.sceneNumber}`;
  const shotDesc = shot.shotText || shot.shotIndex;
  const size = shot.shotSize || 'medium';
  const angle = shot.cameraAngle || 'eye level';
  const movement = shot.cameraMovement || 'static';
  const characters = shot.characters?.join(', ') || 'character';
  
  const stylePrompts: Record<string, string> = {
    cleanLineArt: 'clean line art, minimalist, black and white illustration',
    pencilSketch: 'pencil sketch, hand-drawn, textured paper',
    markerLine: 'marker and ink drawing, bold lines, graphic novel style',
    blueprint: 'technical blueprint, architectural drawing, blue and white',
  };

  const stylePrompt = stylePrompts[style] || stylePrompts.cleanLineArt;

  return `Storyboard frame: ${sceneDesc} - ${shotDesc}. ${characters} in ${size} shot, ${angle} angle, ${movement} camera. ${stylePrompt}. Cinematic composition, film industry standard.`;
}
