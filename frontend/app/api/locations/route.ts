import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scoutLocations, getCandidatesForScene } from '@/lib/locations/scouter';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/locations — get scenes with location intents and candidates
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const sceneId = req.nextUrl.searchParams.get('sceneId');

    if (sceneId) {
      const intent = await getCandidatesForScene(sceneId);
      return NextResponse.json({ intent });
    }

    const scenes = await prisma.scene.findMany({
      where: { script: { projectId } },
      select: {
        id: true,
        sceneNumber: true,
        headingRaw: true,
        intExt: true,
        timeOfDay: true,
        location: true,
        locationIntents: {
          select: {
            id: true,
            keywords: true,
            terrainType: true,
            _count: { select: { candidates: true } },
          },
        },
      },
      orderBy: { sceneIndex: 'asc' },
    });

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('[GET /api/locations]', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST /api/locations — scout locations for a scene
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sceneId, region } = body;

    if (action === 'scout' && sceneId) {
      const result = await scoutLocations(sceneId, region);
      return NextResponse.json({
        message: `Found ${result.candidates.length} candidates from ${result.total} results`,
        ...result,
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing sceneId' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/locations]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
