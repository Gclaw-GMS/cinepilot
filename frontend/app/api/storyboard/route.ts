import { NextRequest, NextResponse } from 'next/server';
import { getFrames, generateFrame, generateSceneFrames, StoryboardStyle } from '@/lib/storyboard/generator';
import { prisma } from '@/lib/db';

const VALID_STYLES: StoryboardStyle[] = ['cleanLineArt', 'pencilSketch', 'markerLine', 'blueprint'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const scriptId = searchParams.get('scriptId') || undefined;
    const sceneId = searchParams.get('sceneId') || undefined;

    const frames = await getFrames(scriptId, sceneId);

    const grouped: Record<string, {
      sceneId: string;
      sceneNumber: string;
      heading: string;
      frames: typeof frames;
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
      grouped[sId].frames.push(f);
    }

    const scenes = Object.values(grouped).sort((a, b) => parseInt(a.sceneNumber) - parseInt(b.sceneNumber));

    return NextResponse.json({ scenes, totalFrames: frames.length });
  } catch (err: unknown) {
    console.error('[API/storyboard] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch storyboard' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'generateScene' } = body;

    if (action === 'generateFrame') {
      const { shotId, style = 'cleanLineArt', regenerate = false } = body;
      if (!shotId) return NextResponse.json({ error: 'shotId required' }, { status: 400 });
      if (!VALID_STYLES.includes(style)) return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
      const result = await generateFrame({ shotId, style, regenerate });
      return NextResponse.json(result);
    }

    if (action === 'generateScene') {
      const { sceneId, style = 'cleanLineArt', maxFrames = 3 } = body;
      if (!sceneId) return NextResponse.json({ error: 'sceneId required' }, { status: 400 });
      if (!VALID_STYLES.includes(style)) return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
      const results = await generateSceneFrames({ sceneId, style, maxFrames });
      return NextResponse.json({ sceneId, frames: results });
    }

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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API/storyboard] POST error:', err);
    return NextResponse.json({ error: 'Storyboard operation failed' }, { status: 500 });
  }
}
