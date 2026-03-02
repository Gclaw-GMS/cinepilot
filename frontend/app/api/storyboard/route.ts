import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for storyboard when database is not connected
const DEMO_FRAMES = [
  { id: 'demo-f1', imageUrl: null, prompt: 'Wide beach shot at sunset', style: 'cleanLineArt', status: 'generated', directorNotes: null, isApproved: false, shot: { id: 's1', shotIndex: 1, shotText: 'Wide establishing shot of beach', shotSize: 'WS', characters: ['ARJUN', 'PRIYA'], scene: { id: 'sc1', sceneNumber: 1, headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY' } } },
  { id: 'demo-f2', imageUrl: null, prompt: 'Medium shot couple walking', style: 'cleanLineArt', status: 'generated', directorNotes: null, isApproved: true, shot: { id: 's2', shotIndex: 2, shotText: 'Medium shot of couple walking', shotSize: 'MS', characters: ['ARJUN', 'PRIYA'], scene: { id: 'sc1', sceneNumber: 1, headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY' } } },
  { id: 'demo-f3', imageUrl: null, prompt: 'Close-up ice cream', style: 'cleanLineArt', status: 'generated', directorNotes: 'Focus on texture', isApproved: false, shot: { id: 's3', shotIndex: 3, shotText: 'Close-up of ice cream', shotSize: 'CU', characters: [], scene: { id: 'sc1', sceneNumber: 1, headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY' } } },
  { id: 'demo-f4', imageUrl: null, prompt: 'Reaction shot Priya laughing', style: 'pencilSketch', status: 'generated', directorNotes: null, isApproved: true, shot: { id: 's4', shotIndex: 4, shotText: 'Reaction shot - Priya laughing', shotSize: 'CU', characters: ['PRIYA'], scene: { id: 'sc1', sceneNumber: 1, headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY' } } },
  { id: 'demo-f5', imageUrl: null, prompt: 'Sunset silhouette', style: 'blueprint', status: 'generated', directorNotes: 'Use golden hour lighting', isApproved: false, shot: { id: 's5', shotIndex: 5, shotText: 'Sunset silhouette shot', shotSize: 'WS', characters: ['ARJUN', 'PRIYA'], scene: { id: 'sc1', sceneNumber: 1, headingRaw: 'EXT. CHENNAI BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY' } } },
  { id: 'demo-f6', imageUrl: null, prompt: 'Restaurant establishing', style: 'cleanLineArt', status: 'generated', directorNotes: null, isApproved: false, shot: { id: 's6', shotIndex: 1, shotText: 'Establishing shot of restaurant', shotSize: 'WS', characters: [], scene: { id: 'sc2', sceneNumber: 2, headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT' } } },
  { id: 'demo-f7', imageUrl: null, prompt: 'Two-shot at table', style: 'markerLine', status: 'generated', directorNotes: 'Romantic angle', isApproved: true, shot: { id: 's7', shotIndex: 2, shotText: 'Two-shot at table', shotSize: 'MS', characters: ['ARJUN', 'RAHUL'], scene: { id: 'sc2', sceneNumber: 2, headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT' } } },
  { id: 'demo-f8', imageUrl: null, prompt: 'Over-shoulder dialogue', style: 'cleanLineArt', status: 'generated', directorNotes: null, isApproved: false, shot: { id: 's8', shotIndex: 3, shotText: 'Over-the-shoulder dialogue', shotSize: 'OTS', characters: ['ARJUN', 'RAHUL'], scene: { id: 'sc2', sceneNumber: 2, headingRaw: 'INT. RESTAURANT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT' } } },
];

function groupDemoFrames(frames: typeof DEMO_FRAMES) {
  const grouped: Record<string, { sceneId: string; sceneNumber: number; heading: string; frames: typeof frames }> = {};
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
    grouped[sId].frames.push(f);
  }
  return Object.values(grouped).sort((a, b) => {
    const aNum = a.sceneNumber || 0;
    const bNum = b.sceneNumber || 0;
    return aNum - bNum;
  });
}

// Helper function to check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

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
  const { searchParams } = req.nextUrl;
  const scriptId = searchParams.get('scriptId') || undefined;
  const sceneId = searchParams.get('sceneId') || undefined;
  const statsOnly = searchParams.get('stats') === 'true';

  // Check database connection
  const isDbConnected = await checkDbConnection();

  // If database not connected, return demo data
  if (!isDbConnected) {
    const demoScenes = groupDemoFrames(DEMO_FRAMES);
    if (statsOnly) {
      return NextResponse.json({
        totalFrames: DEMO_FRAMES.length,
        approvedFrames: DEMO_FRAMES.filter(f => f.isApproved).length,
        scenes: demoScenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.heading,
          frames: s.frames.map(f => ({ id: f.id, isApproved: f.isApproved })),
        })),
        isDemoMode: true,
      });
    }
    return NextResponse.json({ scenes: demoScenes, totalFrames: DEMO_FRAMES.length, isDemoMode: true });
  }

  try {
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

    return NextResponse.json({ scenes, totalFrames: frames.length, isDemoMode: false });
  } catch (err: unknown) {
    console.error('[API/storyboard] GET error:', err);
    // Return demo data on error
    const demoScenes = groupDemoFrames(DEMO_FRAMES);
    if (statsOnly) {
      return NextResponse.json({
        totalFrames: DEMO_FRAMES.length,
        approvedFrames: DEMO_FRAMES.filter(f => f.isApproved).length,
        scenes: demoScenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.heading,
          frames: s.frames.map(f => ({ id: f.id, isApproved: f.isApproved })),
        })),
        isDemoMode: true,
      });
    }
    return NextResponse.json({ scenes: demoScenes, totalFrames: DEMO_FRAMES.length, isDemoMode: true });
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
