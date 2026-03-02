import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo schedule data for when database is unavailable
const DEMO_SCHEDULE = {
  shootingDays: [
    {
      id: 'day-1',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 1,
      scheduledDate: '2026-03-01',
      location: { id: 'loc-1', name: 'Anna Nagar Studio', address: 'Chennai' },
      status: 'completed',
      estimatedHours: 10,
      actualHours: 9.5,
      notes: 'Opening sequence',
      dayScenes: [
        { id: 'ds-1', scene: { id: 's-1', sceneNumber: '1', headingRaw: 'INT. APARTMENT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Apartment' } },
        { id: 'ds-2', scene: { id: 's-2', sceneNumber: '2', headingRaw: 'INT. APARTMENT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Apartment' } },
        { id: 'ds-3', scene: { id: 's-3', sceneNumber: '3', headingRaw: 'EXT. STREET - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Anna Nagar' } },
      ],
    },
    {
      id: 'day-2',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 2,
      scheduledDate: '2026-03-02',
      location: { id: 'loc-2', name: 'Mahabalipuram Beach', address: 'Chennai' },
      status: 'completed',
      estimatedHours: 12,
      actualHours: 11,
      notes: 'Beach sequence',
      dayScenes: [
        { id: 'ds-4', scene: { id: 's-4', sceneNumber: '4', headingRaw: 'EXT. BEACH - SUNRISE', intExt: 'EXT', timeOfDay: 'DAWN', location: 'Mahabalipuram' } },
        { id: 'ds-5', scene: { id: 's-5', sceneNumber: '5', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Mahabalipuram' } },
        { id: 'ds-6', scene: { id: 's-6', sceneNumber: '6', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Mahabalipuram' } },
      ],
    },
    {
      id: 'day-3',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 3,
      scheduledDate: '2026-03-03',
      location: { id: 'loc-3', name: 'Hotel Taj Connemara', address: 'Chennai' },
      status: 'in-progress',
      estimatedHours: 10,
      actualHours: null,
      notes: 'Hotel songs',
      dayScenes: [
        { id: 'ds-7', scene: { id: 's-7', sceneNumber: '7', headingRaw: 'INT. HOTEL LOBBY - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Hotel' } },
        { id: 'ds-8', scene: { id: 's-8', sceneNumber: '8', headingRaw: 'INT. HOTEL ROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Hotel' } },
        { id: 'ds-9', scene: { id: 's-9', sceneNumber: '9', headingRaw: 'EXT. HOTEL POOL - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Hotel' } },
      ],
    },
    {
      id: 'day-4',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 4,
      scheduledDate: '2026-03-04',
      location: { id: 'loc-4', name: 'Ram Studios', address: 'Chennai' },
      status: 'pending',
      estimatedHours: 8,
      actualHours: null,
      notes: 'Night shoot',
      dayScenes: [
        { id: 'ds-10', scene: { id: 's-10', sceneNumber: '10', headingRaw: 'INT. STUDIO - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Studio' } },
        { id: 'ds-11', scene: { id: 's-11', sceneNumber: '11', headingRaw: 'INT. STUDIO - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Studio' } },
      ],
    },
    {
      id: 'day-5',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 5,
      scheduledDate: '2026-03-05',
      location: { id: 'loc-5', name: 'Kodaikanal Hill Station', address: 'Tamil Nadu' },
      status: 'pending',
      estimatedHours: 12,
      actualHours: null,
      notes: 'Forest sequence',
      dayScenes: [
        { id: 'ds-12', scene: { id: 's-12', sceneNumber: '12', headingRaw: 'EXT. FOREST - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Kodaikanal' } },
        { id: 'ds-13', scene: { id: 's-13', sceneNumber: '13', headingRaw: 'EXT. FOREST - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Kodaikanal' } },
        { id: 'ds-14', scene: { id: 's-14', sceneNumber: '14', headingRaw: 'EXT. FOREST - EVENING', intExt: 'EXT', timeOfDay: 'EVENING', location: 'Kodaikanal' } },
      ],
    },
  ],
  versions: [
    { id: 'v-1', versionNum: 1, createdAt: '2026-02-15T10:00:00Z', totalDays: 18, notes: 'Initial schedule' },
    { id: 'v-2', versionNum: 2, createdAt: '2026-02-20T14:30:00Z', totalDays: 20, notes: 'Added buffer days' },
    { id: 'v-3', versionNum: 3, createdAt: '2026-02-25T09:15:00Z', totalDays: 18, notes: 'Optimized for weather' },
  ],
};

// Helper to check if we're in demo mode (no database)
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// GET /api/schedule — get schedule data
export async function GET(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // Return demo data when database is unavailable
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';
    const shootingDays = DEMO_SCHEDULE.shootingDays;
    
    const totalHours = shootingDays.reduce((s, d) => s + (d.estimatedHours || 0), 0);
    const totalScenes = shootingDays.reduce((s, d) => s + d.dayScenes.length, 0);
    
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
          totalHours,
          totalScenes,
        },
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({
      shootingDays,
      versions: DEMO_SCHEDULE.versions,
      stats: {
        totalDays: shootingDays.length,
        totalHours,
        totalScenes,
      },
      isDemoMode: true,
    });
  }
  
  // Database is available - use real data
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
        isDemoMode: false,
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
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/schedule]', error);
    
    // Fallback to demo data on any error
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';
    const shootingDays = DEMO_SCHEDULE.shootingDays;
    const totalHours = shootingDays.reduce((s, d) => s + (d.estimatedHours || 0), 0);
    const totalScenes = shootingDays.reduce((s, d) => s + d.dayScenes.length, 0);
    
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
          totalHours,
          totalScenes,
        },
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({
      shootingDays,
      versions: DEMO_SCHEDULE.versions,
      stats: {
        totalDays: shootingDays.length,
        totalHours,
        totalScenes,
      },
      isDemoMode: true,
    });
  }
}

// POST /api/schedule — create or update schedule
export async function POST(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // In demo mode, return a simulated response
    const body = await req.json();
    const { action } = body;

    if (action === 'optimize') {
      return NextResponse.json({
        message: 'Schedule optimized (Demo Mode)',
        totalDays: 18,
        shootingDays: DEMO_SCHEDULE.shootingDays.map((d, i) => ({
          dayNumber: i + 1,
          scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scenes: d.dayScenes.length,
          location: d.location.name,
        })),
        isDemoMode: true,
      });
    }

    return NextResponse.json({
      message: 'Schedule saved (Demo Mode)',
      shootingDays: DEMO_SCHEDULE.shootingDays,
      isDemoMode: true,
    });
  }
  
  // Database mode
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, startDate, shootingDays: days } = body;

    if (action === 'optimize') {
      // For now, return a simple schedule based on start date
      const start = startDate || new Date().toISOString().split('T')[0];
      const scenes = await prisma.scene.findMany({
        where: { script: { projectId } },
        orderBy: { sceneIndex: 'asc' },
        take: 20,
      });
      
      const totalDays = Math.ceil(scenes.length / 4); // Rough estimate
      
      return NextResponse.json({
        message: `Schedule optimized: ${totalDays} days`,
        totalDays,
        shootingDays: Array.from({ length: totalDays }, (_, i) => ({
          dayNumber: i + 1,
          scheduledDate: new Date(new Date(start).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scenes: Math.min(4, scenes.length - i * 4),
        })),
        isDemoMode: false,
      });
    }

    if (action === 'save' && days) {
      // Save shooting days
      for (const day of days) {
        await prisma.shootingDay.upsert({
          where: { id: day.id || `new-${day.dayNumber}` },
          update: {
            scheduledDate: day.scheduledDate,
            locationId: day.locationId,
            estimatedHours: day.estimatedHours,
            notes: day.notes,
          },
          create: {
            projectId,
            dayNumber: day.dayNumber,
            scheduledDate: day.scheduledDate,
            locationId: day.locationId,
            estimatedHours: day.estimatedHours || 8,
            notes: day.notes,
          },
        });
      }
      
      return NextResponse.json({ message: 'Schedule saved', isDemoMode: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/schedule — update a shooting day
export async function PATCH(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    const body = await req.json();
    const { id, ...updates } = body;
    
    // In demo mode, just return success
    return NextResponse.json({
      message: 'Day updated (Demo Mode)',
      day: { id, ...updates },
      isDemoMode: true,
    });
  }
  
  try {
    const body = await req.json();
    const { id, ...data } = body;
    
    const day = await prisma.shootingDay.update({
      where: { id },
      data: {
        scheduledDate: data.scheduledDate,
        locationId: data.locationId,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        status: data.status,
        notes: data.notes,
      },
    });
    
    return NextResponse.json({ day, isDemoMode: false });
  } catch (error) {
    console.error('[PATCH /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  }
}
