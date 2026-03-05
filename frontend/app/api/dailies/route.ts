import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo dailies data for when database is unavailable
const DEMO_DAILIES = [
  {
    id: 'd1',
    date: '2026-03-04',
    dayNumber: 12,
    location: 'AVM Studios, Chennai',
    locationId: 'loc-1',
    callTime: '06:00',
    wrapTime: '19:30',
    weather: 'Indoor (Studio)',
    scenes: [
      { sceneId: 's1', sceneNumber: '24', description: 'Arjun & Priya conversation', plannedShots: 8, actualShots: 8, status: 'completed', notes: 'Perfect take on 3rd shot' },
      { sceneId: 's2', sceneNumber: '25', description: 'Emotional confrontation', plannedShots: 12, actualShots: 12, status: 'completed', notes: 'Excellent performance' },
      { sceneId: 's3', sceneNumber: '26', description: 'Reaction shots', plannedShots: 4, actualShots: 4, status: 'completed', notes: '' },
    ],
    totalShotsPlanned: 24,
    totalShotsShot: 24,
    crewPresent: 45,
    castPresent: 8,
    incidents: [],
    notes: 'Great day of shooting. All scenes completed ahead of schedule.',
    createdAt: '2026-03-04T20:00:00Z',
    createdBy: 'Production Manager'
  },
  {
    id: 'd2',
    date: '2026-03-03',
    dayNumber: 11,
    location: 'Mahabalipuram Beach',
    locationId: 'loc-2',
    callTime: '05:30',
    wrapTime: '18:00',
    weather: 'Sunny, 32°C',
    scenes: [
      { sceneId: 's4', sceneNumber: '15', description: 'Beach song sequence', plannedShots: 20, actualShots: 18, status: 'partial', notes: '2 shots pending due to tide' },
      { sceneId: 's5', sceneNumber: '16', description: 'Sunset dialogue', plannedShots: 6, actualShots: 6, status: 'completed', notes: 'Golden hour captured perfectly' },
    ],
    totalShotsPlanned: 26,
    totalShotsShot: 24,
    crewPresent: 52,
    castPresent: 12,
    incidents: ['Equipment issue with drone - delayed by 30 mins'],
    notes: 'Beautiful sunset shots. Some shots rescheduled for next outdoor day.',
    createdAt: '2026-03-03T19:30:00Z',
    createdBy: 'Production Manager'
  },
  {
    id: 'd3',
    date: '2026-03-02',
    dayNumber: 10,
    location: 'Ram Studios',
    locationId: 'loc-3',
    callTime: '07:00',
    wrapTime: '20:00',
    weather: 'Indoor (Studio)',
    scenes: [
      { sceneId: 's6', sceneNumber: '8', description: 'Office confrontation', plannedShots: 10, actualShots: 10, status: 'completed', notes: '' },
      { sceneId: 's7', sceneNumber: '9', description: 'Phone call scene', plannedShots: 5, actualShots: 4, status: 'partial', notes: 'One angle needs reshoot' },
    ],
    totalShotsPlanned: 15,
    totalShotsShot: 14,
    crewPresent: 38,
    castPresent: 4,
    incidents: [],
    notes: 'Good progress. Reshoot scheduled.',
    createdAt: '2026-03-02T21:00:00Z',
    createdBy: 'Production Manager'
  },
  {
    id: 'd4',
    date: '2026-03-01',
    dayNumber: 9,
    location: 'Chennai Railway Station',
    locationId: 'loc-4',
    callTime: '04:00',
    wrapTime: '14:00',
    weather: 'Overcast, 28°C',
    scenes: [
      { sceneId: 's8', sceneNumber: '42', description: 'Arrival sequence', plannedShots: 15, actualShots: 15, status: 'completed', notes: 'Early morning golden hour' },
      { sceneId: 's9', sceneNumber: '43', description: 'Platform dialogue', plannedShots: 8, actualShots: 8, status: 'completed', notes: '' },
    ],
    totalShotsPlanned: 23,
    totalShotsShot: 23,
    crewPresent: 65,
    castPresent: 6,
    incidents: [],
    notes: 'Perfect natural light. Completed ahead of schedule.',
    createdAt: '2026-03-01T15:30:00Z',
    createdBy: 'Production Manager'
  }
];

// Helper to check if database is available
async function isDbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// GET /api/dailies - Get all dailies reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    
    const dbAvailable = await isDbAvailable();
    
    if (!dbAvailable) {
      return NextResponse.json({
        success: true,
        data: DEMO_DAILIES,
        stats: {
          totalDays: DEMO_DAILIES.length,
          totalScenesShot: DEMO_DAILIES.reduce((acc, d) => acc + d.scenes.filter(s => s.status === 'completed').length, 0),
          totalShotsShot: DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0),
          avgShotsPerDay: Math.round(DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0) / DEMO_DAILIES.length),
          completionRate: Math.round((DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0) / DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsPlanned, 0)) * 100),
        },
        mode: 'demo'
      });
    }

    const shootingDays = await prisma.shootingDay.findMany({
      where: { projectId },
      include: {
        location: true,
        dayScenes: {
          include: {
            scene: {
              include: {
                shots: true
              }
            }
          }
        }
      },
      orderBy: { dayNumber: 'desc' }
    });

    const dailies = shootingDays.map(day => ({
      id: day.id,
      date: day.scheduledDate?.toISOString().split('T')[0] || '',
      dayNumber: day.dayNumber,
      location: day.location?.name || 'Unknown',
      locationId: day.locationId,
      callTime: day.callTime || '',
      wrapTime: '',
      weather: day.weatherData ? JSON.stringify(day.weatherData) : 'Indoor (Studio)',
      scenes: day.dayScenes.map(ds => ({
        sceneId: ds.sceneId,
        sceneNumber: ds.scene.sceneNumber,
        description: ds.scene.description || '',
        plannedShots: ds.estimatedMinutes || 0,
        actualShots: ds.actualMinutes || 0,
        status: day.status === 'completed' ? 'completed' : day.status === 'in-progress' ? 'partial' : 'pending',
        notes: ds.notes || ''
      })),
      totalShotsPlanned: day.dayScenes.reduce((acc, ds) => acc + (ds.estimatedMinutes || 0), 0),
      totalShotsShot: day.dayScenes.reduce((acc, ds) => acc + (ds.actualMinutes || 0), 0),
      crewPresent: 0,
      castPresent: 0,
      incidents: [],
      notes: day.notes || '',
      createdAt: day.createdAt.toISOString(),
      createdBy: 'Production Manager'
    }));

    const stats = {
      totalDays: dailies.length,
      totalScenesShot: dailies.reduce((acc, d) => acc + d.scenes.filter(s => s.status === 'completed').length, 0),
      totalShotsShot: dailies.reduce((acc, d) => acc + d.totalShotsShot, 0),
      avgShotsPerDay: dailies.length > 0 ? Math.round(dailies.reduce((acc, d) => acc + d.totalShotsShot, 0) / dailies.length) : 0,
      completionRate: dailies.length > 0 ? Math.round((dailies.reduce((acc, d) => acc + d.totalShotsShot, 0) / Math.max(dailies.reduce((acc, d) => acc + d.totalShotsPlanned, 0), 1)) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      data: dailies,
      stats,
      mode: 'live'
    });
  } catch (error) {
    console.error('Error fetching dailies:', error);
    return NextResponse.json({
      success: true,
      data: DEMO_DAILIES,
      stats: {
        totalDays: DEMO_DAILIES.length,
        totalScenesShot: DEMO_DAILIES.reduce((acc, d) => acc + d.scenes.filter(s => s.status === 'completed').length, 0),
        totalShotsShot: DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0),
        avgShotsPerDay: Math.round(DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0) / DEMO_DAILIES.length),
        completionRate: Math.round((DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsShot, 0) / DEMO_DAILIES.reduce((acc, d) => acc + d.totalShotsPlanned, 0)) * 100),
      },
      mode: 'demo'
    });
  }
}

// POST /api/dailies - Create a new daily report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId = DEFAULT_PROJECT_ID,
      dayNumber,
      scheduledDate,
      locationId,
      callTime,
      wrapTime,
      weather,
      notes,
      scenes = []
    } = body;

    const dbAvailable = await isDbAvailable();
    
    if (!dbAvailable) {
      // Return demo response
      const newId = `d${Date.now()}`;
      return NextResponse.json({
        success: true,
        data: {
          id: newId,
          ...body,
          createdAt: new Date().toISOString(),
          createdBy: 'Production Manager'
        },
        mode: 'demo'
      });
    }

    // Create shooting day in database
    const shootingDay = await prisma.shootingDay.create({
      data: {
        projectId,
        dayNumber,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        locationId,
        callTime,
        weatherData: weather ? { weather } : undefined,
        notes,
        status: 'completed',
        actualHours: wrapTime && callTime ? 
          (parseInt(wrapTime.split(':')[0]) - parseInt(callTime.split(':')[0])) : null
      }
    });

    // Create day scenes
    if (scenes.length > 0) {
      await prisma.dayScene.createMany({
        data: scenes.map((scene: any, index: number) => ({
          shootingDayId: shootingDay.id,
          sceneId: scene.sceneId,
          orderNumber: index + 1,
          estimatedMinutes: scene.plannedShots,
          actualMinutes: scene.actualShots,
          notes: scene.notes
        }))
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shootingDay.id,
        ...body,
        createdAt: shootingDay.createdAt.toISOString(),
        createdBy: 'Production Manager'
      },
      mode: 'live'
    });
  } catch (error) {
    console.error('Error creating daily report:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create daily report'
    }, { status: 500 });
  }
}

// PUT /api/dailies - Update a daily report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const dbAvailable = await isDbAvailable();
    
    if (!dbAvailable) {
      // Update demo data in memory
      const index = DEMO_DAILIES.findIndex(d => d.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }
      DEMO_DAILIES[index] = { ...DEMO_DAILIES[index], ...updateData };
      return NextResponse.json({
        success: true,
        data: DEMO_DAILIES[index],
        mode: 'demo'
      });
    }

    // Update in database
    const shootingDay = await prisma.shootingDay.update({
      where: { id },
      data: {
        dayNumber: updateData.dayNumber,
        scheduledDate: updateData.date ? new Date(updateData.date) : null,
        locationId: updateData.locationId,
        callTime: updateData.callTime,
        weatherData: updateData.weather ? { weather: updateData.weather } : undefined,
        notes: updateData.notes,
        status: 'completed',
        actualHours: updateData.wrapTime && updateData.callTime ? 
          (parseInt(updateData.wrapTime.split(':')[0]) - parseInt(updateData.callTime.split(':')[0])) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: { id: shootingDay.id, ...updateData },
      mode: 'live'
    });
  } catch (error) {
    console.error('Error updating daily report:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
}

// DELETE /api/dailies - Delete a daily report
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const dbAvailable = await isDbAvailable();
    
    if (!dbAvailable) {
      const index = DEMO_DAILIES.findIndex(d => d.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }
      DEMO_DAILIES.splice(index, 1);
      return NextResponse.json({ success: true, mode: 'demo' });
    }

    await prisma.shootingDay.delete({ where: { id } });

    return NextResponse.json({ success: true, mode: 'live' });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete report' }, { status: 500 });
  }
}
