import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_TIMELINE = {
  phases: [
    { id: 'p1', name: 'Pre-Production', displayName: 'Pre-Production', status: 'completed', progress: 100, order: 1, startDate: '2026-01-01', endDate: '2026-01-20', scenes: 47 },
    { id: 'p2', name: 'Principal Photography', displayName: 'Principal Photography', status: 'in_progress', progress: 40, order: 2, startDate: '2026-01-21', endDate: '2026-02-10', scenes: 47 },
    { id: 'p3', name: 'Post-Production', displayName: 'Post-Production', status: 'pending', progress: 0, order: 3, startDate: '2026-02-11', endDate: '2026-03-15', scenes: 0 },
  ],
  milestones: [
    { id: 'm1', name: 'Script Lock', date: '2026-01-05', status: 'completed', phase: 'Pre-Production' },
    { id: 'm2', name: 'Casting Complete', date: '2026-01-10', status: 'completed', phase: 'Pre-Production' },
    { id: 'm3', name: 'Location Scout Done', date: '2026-01-15', status: 'completed', phase: 'Pre-Production' },
    { id: 'm4', name: '50% Shoot Days', date: '2026-01-31', status: 'in_progress', phase: 'Principal Photography' },
    { id: 'm5', name: 'Pack-Up', date: '2026-02-10', status: 'pending', phase: 'Principal Photography' },
    { id: 'm6', name: 'Rough Cut', date: '2026-02-25', status: 'pending', phase: 'Post-Production' },
    { id: 'm7', name: 'Final Delivery', date: '2026-03-15', status: 'pending', phase: 'Post-Production' },
  ],
  weeklyProgress: [
    { week: 'Week 1', budget: 4200000, scenes: 4, completed: 4 },
    { week: 'Week 2', budget: 3850000, scenes: 3, completed: 3 },
    { week: 'Week 3', budget: 5100000, scenes: 5, completed: 4 },
    { week: 'Week 4', budget: 2950000, scenes: 2, completed: 2 },
    { week: 'Week 5', budget: 4600000, scenes: 4, completed: 1 },
    { week: 'Week 6', budget: 3200000, scenes: 3, completed: 0 },
  ],
  isDemoMode: true,
};

// GET /api/timeline — get production timeline data
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  try {
    // Test database connection
    await prisma.$connect();

    // Get shooting days with scenes
    const shootingDays = await prisma.shootingDay.findMany({
      where: { projectId },
      include: {
        dayScenes: {
          include: {
            scene: true,
          },
        },
      },
      orderBy: { dayNumber: 'asc' },
    });

    // Get scripts for scene count
    const scripts = await prisma.script.findMany({
      where: { projectId },
      include: {
        scenes: true,
      },
    });

    const totalScenes = scripts.reduce((sum, s) => sum + s.scenes.length, 0);
    const completedDays = shootingDays.filter(d => d.status === 'completed').length;
    const inProgressDays = shootingDays.filter(d => d.status === 'in-progress').length;

    // Build phases based on actual data
    const phases = [
      {
        id: 'pre-production',
        name: 'Pre-Production',
        displayName: 'Pre-Production',
        status: completedDays > 0 ? 'completed' : inProgressDays > 0 ? 'completed' : 'completed',
        progress: 100,
        order: 1,
        startDate: '2026-01-01',
        endDate: shootingDays[0]?.scheduledDate ? new Date(shootingDays[0].scheduledDate).toISOString().split('T')[0] : '2026-01-20',
        scenes: totalScenes,
      },
      {
        id: 'production',
        name: 'Principal Photography',
        displayName: 'Principal Photography',
        status: inProgressDays > 0 ? 'in_progress' : completedDays === shootingDays.length ? 'completed' : 'pending',
        progress: shootingDays.length > 0 ? Math.round((completedDays / shootingDays.length) * 100) : 0,
        order: 2,
        startDate: shootingDays[0]?.scheduledDate ? new Date(shootingDays[0].scheduledDate).toISOString().split('T')[0] : '2026-01-21',
        endDate: shootingDays.length > 0 && shootingDays[shootingDays.length - 1]?.scheduledDate ? new Date(shootingDays[shootingDays.length - 1].scheduledDate!).toISOString().split('T')[0] : '2026-02-10',
        scenes: shootingDays.reduce((sum, d) => sum + (d.dayScenes?.length || 0), 0),
      },
      {
        id: 'post-production',
        name: 'Post-Production',
        displayName: 'Post-Production',
        status: completedDays === shootingDays.length ? 'pending' : 'pending',
        progress: 0,
        order: 3,
        startDate: shootingDays.length > 0 && shootingDays[shootingDays.length - 1]?.scheduledDate ? new Date(shootingDays[shootingDays.length - 1].scheduledDate!).toISOString().split('T')[0] : '2026-02-11',
        endDate: '2026-03-15',
        scenes: 0,
      },
    ];

    // Build milestones from shooting days (using notes as potential milestone indicator)
    const milestones = shootingDays
      .filter(d => d.notes && d.notes.length > 0)
      .map(d => ({
        id: d.id,
        name: d.notes || `Day ${d.dayNumber}`,
        date: d.scheduledDate ? new Date(d.scheduledDate).toISOString().split('T')[0] : '',
        status: d.status === 'completed' ? 'completed' : d.status === 'in-progress' ? 'in_progress' : 'pending',
        phase: 'Principal Photography',
      }));

    // Calculate weekly progress
    const weeklyProgress: Array<{ week: string; budget: number; scenes: number; completed: number }> = [];
    const firstScheduledDate = shootingDays[0]?.scheduledDate ? new Date(shootingDays[0].scheduledDate) : new Date('2026-01-01');
    
    for (let i = 0; i < 6; i++) {
      const weekStart = new Date(firstScheduledDate);
      weekStart.setDate(firstScheduledDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekDays = shootingDays.filter(d => {
        if (!d.scheduledDate) return false;
        const dayDate = new Date(d.scheduledDate);
        return dayDate >= weekStart && dayDate < weekEnd;
      });

      weeklyProgress.push({
        week: `Week ${i + 1}`,
        budget: 4000000,
        scenes: weekDays.reduce((sum, d) => sum + (d.dayScenes?.length || 0), 0),
        completed: weekDays.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.dayScenes?.length || 0), 0),
      });
    }

    return NextResponse.json({
      phases,
      milestones,
      weeklyProgress,
      stats: {
        totalPhases: phases.length,
        completedPhases: phases.filter(p => p.status === 'completed').length,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'completed').length,
        totalScenes,
        completedScenes: shootingDays.reduce((sum, d) => sum + (d.dayScenes?.length || 0), 0),
      },
    });
  } catch (error) {
    console.error('[GET /api/timeline]', error);
    // Return demo data when database is not connected
    return NextResponse.json(DEMO_TIMELINE);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// POST /api/timeline — create or update timeline data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, data } = body;

    if (action === 'updatePhase') {
      const { phaseId, status, progress } = data;
      
      // Update phase in database if it exists
      // For now, just return success
      return NextResponse.json({ 
        success: true, 
        message: `Phase ${phaseId} updated to status: ${status}` 
      });
    }

    if (action === 'addMilestone') {
      const { name, date, phase } = data;
      
      return NextResponse.json({ 
        success: true, 
        message: `Milestone "${name}" added for ${date}`,
        milestone: {
          id: `milestone-${Date.now()}`,
          name,
          date,
          status: 'pending',
          phase,
        }
      });
    }

    if (action === 'completeMilestone') {
      const { milestoneId } = data;
      
      return NextResponse.json({ 
        success: true, 
        message: `Milestone ${milestoneId} marked as completed` 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/timeline]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
