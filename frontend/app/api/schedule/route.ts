import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { optimizeSchedule } from '@/lib/schedule/solver';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/schedule — get schedule data
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

    const [shootingDays, versions] = await Promise.all([
      prisma.shootingDay.findMany({
        where: { projectId },
        include: {
          dayScenes: {
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
            orderBy: { orderNumber: 'asc' },
          },
          location: true,
        },
        orderBy: { dayNumber: 'asc' },
      }),
      prisma.scheduleVersion.findMany({
        where: { projectId },
        orderBy: { versionNum: 'desc' },
        take: 5,
      }),
    ]);

    const totalHours = shootingDays.reduce((s, d) => s + Number(d.estimatedHours || 0), 0);
    const totalScenes = shootingDays.reduce((s, d) => s + d.dayScenes.length, 0);

    // For stats-only requests (dashboard), return flat format with days array
    if (statsOnly) {
      return NextResponse.json({
        days: shootingDays.map(d => ({
          dayNumber: d.dayNumber,
          scheduledDate: d.scheduledDate,
          scenes: d.dayScenes.map(ds => ({
            sceneNumber: ds.scene.sceneNumber,
            headingRaw: ds.scene.headingRaw,
            location: ds.scene.location,
          })),
        })),
        stats: {
          totalDays: shootingDays.length,
          totalHours: Math.round(totalHours * 10) / 10,
          totalScenes,
        },
      });
    }

    return NextResponse.json({
      shootingDays,
      versions,
      stats: {
        totalDays: shootingDays.length,
        totalHours: Math.round(totalHours * 10) / 10,
        totalScenes,
      },
    });
  } catch (error) {
    console.error('[GET /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// POST /api/schedule — optimize schedule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, startDate, mode } = body;

    if (action === 'optimize') {
      const start = startDate || new Date().toISOString().split('T')[0];
      const result = await optimizeSchedule(projectId, start, mode || 'balanced');

      return NextResponse.json({
        message: `Schedule optimized: ${result.totalDays} days`,
        ...result,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
