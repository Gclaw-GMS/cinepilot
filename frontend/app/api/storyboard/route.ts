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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API/storyboard] POST error:', err);
    return NextResponse.json({ error: 'Storyboard operation failed' }, { status: 500 });
  }
}
