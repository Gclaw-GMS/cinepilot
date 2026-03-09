import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { optimizeSchedule } from '@/lib/schedule/solver';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not available
const DEMO_SHOOTING_DAYS = [
  { id: 'day-1', dayNumber: 1, scheduledDate: '2026-03-15', callTime: '06:00', estimatedHours: 12, location: { name: 'Marina Beach' }, status: 'scheduled', dayScenes: [
    { scene: { sceneNumber: '1', headingRaw: 'EXT. BEACH - SUNRISE', location: 'Marina Beach' }, orderNumber: 1, estimatedMinutes: 90 },
    { scene: { sceneNumber: '2', headingRaw: 'EXT. BEACH - DAY', location: 'Marina Beach' }, orderNumber: 2, estimatedMinutes: 120 },
  ]},
  { id: 'day-2', dayNumber: 2, scheduledDate: '2026-03-16', callTime: '07:00', estimatedHours: 10, location: { name: 'Kapaleeshwarar Temple' }, status: 'scheduled', dayScenes: [
    { scene: { sceneNumber: '3', headingRaw: 'EXT. TEMPLE - MORNING', location: 'Kapaleeshwarar Temple' }, orderNumber: 1, estimatedMinutes: 150 },
    { scene: { sceneNumber: '5', headingRaw: 'INT. TEMPLE - DAY', location: 'Kapaleeshwarar Temple' }, orderNumber: 2, estimatedMinutes: 90 },
  ]},
  { id: 'day-3', dayNumber: 3, scheduledDate: '2026-03-17', callTime: '08:00', estimatedHours: 14, location: { name: 'Chennai Studio' }, status: 'scheduled', dayScenes: [
    { scene: { sceneNumber: '8', headingRaw: 'INT. COURTROOM - DAY', location: 'Courtroom Set' }, orderNumber: 1, estimatedMinutes: 180 },
    { scene: { sceneNumber: '10', headingRaw: 'INT. COURTROOM - DAY', location: 'Courtroom Set' }, orderNumber: 2, estimatedMinutes: 120 },
  ]},
  { id: 'day-4', dayNumber: 4, scheduledDate: '2026-03-18', callTime: '06:00', estimatedHours: 12, location: { name: 'Ooty Hill Station' }, status: 'scheduled', dayScenes: [
    { scene: { sceneNumber: '12', headingRaw: 'EXT. HILL STATION - MORNING', location: 'Ooty' }, orderNumber: 1, estimatedMinutes: 150 },
    { scene: { sceneNumber: '15', headingRaw: 'EXT. HILL STATION - SUNSET', location: 'Ooty' }, orderNumber: 2, estimatedMinutes: 90 },
  ]},
  { id: 'day-5', dayNumber: 5, scheduledDate: '2026-03-19', callTime: '07:00', estimatedHours: 10, location: { name: 'Tamil Restaurant' }, status: 'scheduled', dayScenes: [
    { scene: { sceneNumber: '18', headingRaw: 'INT. RESTAURANT - DAY', location: 'Saravana Bhavan' }, orderNumber: 1, estimatedMinutes: 120 },
    { scene: { sceneNumber: '20', headingRaw: 'INT. RESTAURANT - NIGHT', location: 'Saravana Bhavan' }, orderNumber: 2, estimatedMinutes: 90 },
  ]},
]

const DEMO_VERSIONS = [
  { id: 'v-1', versionNum: 1, label: 'Initial Schedule', createdAt: '2026-01-10' },
  { id: 'v-2', versionNum: 2, label: 'Optimized v1', createdAt: '2026-02-01' },
  { id: 'v-3', versionNum: 3, label: 'Final Draft', createdAt: '2026-02-15' },
]

// GET /api/schedule — get schedule data
export async function GET(req: NextRequest) {
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

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

    // If no shooting days found in database, fall back to demo data
    if (shootingDays.length === 0) {
      console.log('[GET /api/schedule] No shooting days in database, using demo data');
      if (statsOnly) {
        return NextResponse.json({
          days: DEMO_SHOOTING_DAYS.map(d => ({
            dayNumber: d.dayNumber,
            scheduledDate: d.scheduledDate,
            scenes: d.dayScenes.map(ds => ({
              sceneNumber: ds.scene.sceneNumber,
              headingRaw: ds.scene.headingRaw,
              location: ds.scene.location,
            })),
          })),
          stats: {
            totalDays: DEMO_SHOOTING_DAYS.length,
            totalHours: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.estimatedHours, 0),
            totalScenes: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.dayScenes.length, 0),
          },
          _demo: true,
        });
      }

      return NextResponse.json({
        shootingDays: DEMO_SHOOTING_DAYS,
        versions: DEMO_VERSIONS,
        stats: {
          totalDays: DEMO_SHOOTING_DAYS.length,
          totalHours: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.estimatedHours, 0),
          totalScenes: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.dayScenes.length, 0),
        },
        _demo: true,
      });
    }

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
    console.error('[GET /api/schedule] Database not available, using demo data');
    // Use demo data when database is not available
    if (statsOnly) {
      return NextResponse.json({
        days: DEMO_SHOOTING_DAYS.map(d => ({
          dayNumber: d.dayNumber,
          scheduledDate: d.scheduledDate,
          scenes: d.dayScenes.map(ds => ({
            sceneNumber: ds.scene.sceneNumber,
            headingRaw: ds.scene.headingRaw,
            location: ds.scene.location,
          })),
        })),
        stats: {
          totalDays: DEMO_SHOOTING_DAYS.length,
          totalHours: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.estimatedHours, 0),
          totalScenes: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.dayScenes.length, 0),
        },
        _demo: true,
      });
    }

    return NextResponse.json({
      shootingDays: DEMO_SHOOTING_DAYS,
      versions: DEMO_VERSIONS,
      stats: {
        totalDays: DEMO_SHOOTING_DAYS.length,
        totalHours: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.estimatedHours, 0),
        totalScenes: DEMO_SHOOTING_DAYS.reduce((s, d) => s + d.dayScenes.length, 0),
      },
      _demo: true,
    });
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

      // Convert result.days to shootingDays format for frontend compatibility
      const shootingDays = result.days.map(d => ({
        id: `day-${d.dayNumber}`,
        dayNumber: d.dayNumber,
        scheduledDate: d.date,
        callTime: d.isNight ? '18:00' : '06:00',
        estimatedHours: Math.round(d.totalMinutes / 60 * 10) / 10,
        notes: d.warnings.length > 0 ? d.warnings.join('; ') : null,
        status: 'scheduled',
        locationId: null,
        location: d.location ? { name: d.location } : null,
        dayScenes: d.scenes.map((s, idx) => ({
          id: `ds-${d.dayNumber}-${idx}`,
          orderNumber: idx + 1,
          estimatedMinutes: s.estimatedMinutes,
          scene: {
            id: s.sceneId,
            sceneNumber: s.sceneNumber,
            headingRaw: null,
            intExt: null,
            timeOfDay: null,
            location: d.location,
          },
        })),
      }));

      const totalHours = result.totalMinutes / 60;
      const totalScenes = result.days.reduce((s, d) => s + d.scenes.length, 0);

      return NextResponse.json({
        message: `Schedule optimized: ${result.totalDays} days`,
        shootingDays,
        versions: [],
        stats: {
          totalDays: result.totalDays,
          totalHours: Math.round(totalHours * 10) / 10,
          totalScenes,
        },
        warnings: result.warnings,
        unscheduledScenes: result.unscheduledScenes,
      });
    }

    // Demo mode: return mock optimized schedule
    if (action === 'optimize' && process.env.NODE_ENV !== 'production') {
      const startDateStr = startDate || new Date().toISOString().split('T')[0];
      const shootingDays = DEMO_SHOOTING_DAYS.map((d, i) => {
        const date = new Date(startDateStr);
        date.setDate(date.getDate() + i);
        return {
          ...d,
          scheduledDate: date.toISOString().split('T')[0],
        };
      });

      const totalHours = shootingDays.reduce((s, d) => s + Number(d.estimatedHours || 0), 0);
      const totalScenes = shootingDays.reduce((s, d) => s + d.dayScenes.length, 0);

      return NextResponse.json({
        message: `Schedule optimized: ${shootingDays.length} days (demo mode)`,
        shootingDays,
        versions: DEMO_VERSIONS,
        stats: {
          totalDays: shootingDays.length,
          totalHours: Math.round(totalHours * 10) / 10,
          totalScenes,
        },
        _demo: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
