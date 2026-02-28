import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Helper function to generate prompts for storyboard frames
function generateStoryboardPrompt(
  shotText: string,
  shotSize: string | null,
  characters: string[],
  scene: { headingRaw: string | null; intExt: string | null; timeOfDay: string | null },
  style: string
): string {
  const parts: string[] = [];
  
  // Scene context
  if (scene.headingRaw) parts.push(scene.headingRaw);
  if (scene.intExt) parts.push(scene.intExt.toUpperCase());
  if (scene.timeOfDay) parts.push(scene.timeOfDay.toUpperCase());
  
  // Shot size
  if (shotSize) parts.push(`Shot size: ${shotSize}`);
  
  // Action/description
  if (shotText) parts.push(`Action: ${shotText.substring(0, 200)}`);
  
  // Characters
  if (characters && characters.length > 0) {
    parts.push(`Characters: ${characters.join(', ')}`);
  }
  
  // Style modifier
  const styleModifiers: Record<string, string> = {
    cleanLineArt: 'Clean line art illustration, minimalist, storyboard style',
    pencilSketch: 'Pencil sketch style, hand-drawn, artistic',
    markerLine: 'Marker and ink illustration, bold lines, graphic novel style',
    blueprint: 'Blueprint style, technical drawing, architectural',
  };
  
  if (styleModifiers[style]) {
    parts.push(styleModifiers[style]);
  }
  
  return parts.join('. ') + '. Cinematic composition, film storyboard frame.';
}

// GET /api/storyboard — get storyboard frames
// GET /api/storyboard?stats=true — get stats for dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const scriptId = searchParams.get('scriptId') || undefined;
    const sceneId = searchParams.get('sceneId') || undefined;
    const statsOnly = searchParams.get('stats') === 'true';

    // Build the where clause
    const where: Record<string, unknown> = {};
    if (sceneId) {
      where.shot = { sceneId };
    } else if (scriptId) {
      where.shot = { scene: { scriptId } };
    }

    const frames = await prisma.storyboardFrame.findMany({
      where,
      include: {
        shot: {
          include: {
            scene: {
              select: {
                id: true,
                sceneNumber: true,
                headingRaw: true,
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
      frames: {
        id: string;
        imageUrl: string | null;
        isApproved: boolean;
      }[];
    }> = {};

    for (const f of frames) {
      const sId = f.shot.scene.id;
      if (!grouped[sId]) {
        grouped[sId] = {
          sceneId: sId,
          sceneNumber: f.shot.scene.sceneNumber,
          heading: f.shot.scene.headingRaw || `Scene ${f.shot.scene.sceneNumber}`,
          frames: [],
        };
      }
      grouped[sId].frames.push({
        id: f.id,
        imageUrl: f.imageUrl,
        isApproved: f.isApproved,
      });
    }

    const scenes = Object.values(grouped).sort((a, b) => {
      const aNum = parseInt(a.sceneNumber) || 0;
      const bNum = parseInt(b.sceneNumber) || 0;
      return aNum - bNum;
    });

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

    return NextResponse.json({ scenes, totalFrames: frames.length });
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

    // Generate storyboard frames for a scene
    if (action === 'generateScene') {
      const { sceneId, style = 'cleanLineArt', maxFrames = 3 } = body;
      if (!sceneId) return NextResponse.json({ error: 'sceneId required' }, { status: 400 });

      // Get shots for this scene
      const shots = await prisma.shot.findMany({
        where: { sceneId },
        orderBy: { shotIndex: 'asc' },
        take: maxFrames,
        include: {
          scene: {
            select: { id: true, sceneNumber: true, headingRaw: true, intExt: true, timeOfDay: true },
          },
        },
      });

      if (shots.length === 0) {
        return NextResponse.json({ error: 'No shots found for this scene' }, { status: 404 });
      }

      // Generate frames for each shot
      const generatedFrames = [];
      for (const shot of shots) {
        // Check if frame already exists
        const existingFrame = await prisma.storyboardFrame.findFirst({
          where: { shotId: shot.id },
        });

        if (existingFrame) {
          generatedFrames.push(existingFrame);
          continue;
        }

        // Generate prompt from shot description
        const prompt = generateStoryboardPrompt(shot.shotText, shot.shotSize, shot.characters, shot.scene, style);

        // Create the frame (in production, this would call an image generation API)
        const frame = await prisma.storyboardFrame.create({
          data: {
            shotId: shot.id,
            style,
            prompt,
            status: 'generating', // Would be set to 'completed' after generation
            imageUrl: null, // Would be populated by image generation API
            isApproved: false,
          },
        });
        generatedFrames.push(frame);

        // Simulate async generation - in production, this would be handled by a job queue
        setTimeout(async () => {
          try {
            // For demo: generate a placeholder image URL
            // In production, this would call DALL-E/Midjourney/Stable Diffusion
            const demoImageUrl = `https://picsum.photos/seed/${frame.id}/640/360`;
            
            await prisma.storyboardFrame.update({
              where: { id: frame.id },
              data: { status: 'completed', imageUrl: demoImageUrl },
            });
          } catch (e) {
            console.error('[Storyboard] Generation failed for frame:', frame.id);
            await prisma.storyboardFrame.update({
              where: { id: frame.id },
              data: { status: 'failed' },
            });
          }
        }, 100);
      }

      return NextResponse.json({ 
        success: true, 
        frames: generatedFrames,
        sceneId,
        generated: generatedFrames.length,
      });
    }

    // Regenerate a single frame
    if (action === 'generateFrame') {
      const { shotId, style = 'cleanLineArt', regenerate = false } = body;
      if (!shotId) return NextResponse.json({ error: 'shotId required' }, { status: 400 });

      const shot = await prisma.shot.findUnique({
        where: { id: shotId },
        include: {
          scene: {
            select: { id: true, sceneNumber: true, headingRaw: true, intExt: true, timeOfDay: true },
          },
        },
      });

      if (!shot) {
        return NextResponse.json({ error: 'Shot not found' }, { status: 404 });
      }

      // If regenerating, delete existing frame
      if (regenerate) {
        await prisma.storyboardFrame.deleteMany({ where: { shotId } });
      }

      // Generate prompt
      const prompt = generateStoryboardPrompt(shot.shotText, shot.shotSize, shot.characters, shot.scene, style);

      // Create new frame
      const frame = await prisma.storyboardFrame.create({
        data: {
          shotId,
          style,
          prompt,
          status: 'generating',
          imageUrl: null,
          isApproved: false,
        },
      });

      // Simulate async generation
      setTimeout(async () => {
        try {
          const demoImageUrl = `https://picsum.photos/seed/${frame.id}/640/360`;
          await prisma.storyboardFrame.update({
            where: { id: frame.id },
            data: { status: 'completed', imageUrl: demoImageUrl },
          });
        } catch (e) {
          await prisma.storyboardFrame.update({
            where: { id: frame.id },
            data: { status: 'failed' },
          });
        }
      }, 100);

      return NextResponse.json({ 
        success: true, 
        frame,
        shotId,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API/storyboard] POST error:', err);
    return NextResponse.json({ error: 'Storyboard operation failed' }, { status: 500 });
  }
}
