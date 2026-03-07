import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo fallback data
const DEMO_DATA = {
  overall: 42,
  phases: [
    { name: 'pre_production', displayName: 'Pre-Production', status: 'in_progress', progress: 75, order: 0 },
    { name: 'production', displayName: 'Production', status: 'pending', progress: 15, order: 1 },
    { name: 'post_production', displayName: 'Post-Production', status: 'pending', progress: 0, order: 2 },
  ],
  milestones: [
    { id: '1', name: 'Script Lock', date: '2026-01-15', status: 'completed', tasks: 3 },
    { id: '2', name: 'Casting Complete', date: '2026-02-20', status: 'in_progress', tasks: 3 },
    { id: '3', name: 'Location Scouting', date: '2026-03-15', status: 'in_progress', tasks: 2 },
    { id: '4', name: 'Pre-Production Complete', date: '2026-04-01', status: 'pending', tasks: 3 },
    { id: '5', name: 'Principal Photography', date: '2026-05-01', status: 'pending', tasks: 0 },
    { id: '6', name: 'First Cut', date: '2026-07-15', status: 'pending', tasks: 0 },
    { id: '7', name: 'Final Delivery', date: '2026-09-01', status: 'pending', tasks: 0 },
  ],
  tasks: [
    { id: 't1', name: 'Script Analysis', description: 'Initial script review and breakdown', status: 'completed', progress: 100, priority: 'critical', dueDate: '2026-01-10' },
    { id: 't2', name: 'Script Revisions', description: 'Incorporate feedback', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-15' },
    { id: 't3', name: 'Character Breakdown', description: 'Detailed character analysis', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-20' },
    { id: 't4', name: 'Location Shortlist', description: 'Create list of potential locations', status: 'in_progress', progress: 75, priority: 'high', dueDate: '2026-03-10' },
    { id: 't5', name: 'Casting Calls', description: 'Post casting calls and auditions', status: 'in_progress', progress: 50, priority: 'critical', dueDate: '2026-02-15' },
    { id: 't6', name: 'Auditions', description: 'Conduct actor auditions', status: 'in_progress', progress: 30, priority: 'critical', dueDate: '2026-02-20' },
    { id: 't7', name: 'Permits Application', description: 'Film permits for locations', status: 'in_progress', progress: 20, priority: 'high', dueDate: '2026-03-25' },
    { id: 't8', name: 'Equipment Booking', description: 'Reserve cameras, lights, grip', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-04-01' },
    { id: 't9', name: 'Crew Hiring', description: 'Hire key crew members', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-04-05' },
    { id: 't10', name: 'Shot List Creation', description: 'Detailed shot list for production', status: 'pending', progress: 0, priority: 'medium', dueDate: '2026-04-10' },
  ],
  upcoming_deadlines: [
    { task: 'Casting Calls', date: '2026-02-15', days_left: 14 },
    { task: 'Auditions', date: '2026-02-20', days_left: 19 },
    { task: 'Location Shortlist', date: '2026-03-10', days_left: 37 },
    { task: 'Permits Application', date: '2026-03-25', days_left: 52 },
  ],
};

// GET /api/progress — get production progress data
// GET /api/progress?summary=true — get just the summary for dashboard
export async function GET(req: NextRequest) {
  let isDemoMode = false;
  
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const summaryOnly = req.nextUrl.searchParams.get('summary') === 'true';

    // Get production phases
    const phases = await prisma.productionPhase.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    // Get milestones
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Get tasks without milestones
    const orphanTasks = await prisma.productionTask.findMany({
      where: { projectId, milestoneId: null },
      orderBy: { order: 'asc' },
    });

    // Calculate overall progress
    const allTasks = [...milestones.flatMap(m => m.tasks), ...orphanTasks];
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const totalTasks = allTasks.length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate phase progress
    const phaseProgress: Record<string, { progress: number; status: string }> = {};
    for (const phase of phases) {
      phaseProgress[phase.name] = {
        progress: phase.progress,
        status: phase.status,
      };
    }

    // Ensure default phases exist
    const defaultPhases = ['pre_production', 'production', 'post_production'];
    for (const phaseName of defaultPhases) {
      if (!phaseProgress[phaseName]) {
        phaseProgress[phaseName] = { progress: 0, status: 'pending' };
      }
    }

    // Get upcoming deadlines (tasks due in next 14 days)
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const upcomingTasks = allTasks
      .filter(t => t.dueDate && t.status !== 'completed' && t.dueDate <= twoWeeksLater)
      .map(t => ({
        task: t.name,
        date: t.dueDate?.toISOString().split('T')[0],
        days_left: Math.ceil((t.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.days_left - b.days_left);

    if (summaryOnly) {
      // Check if database has no data - use demo fallback
      const hasNoData = phases.length === 0 && milestones.length === 0 && allTasks.length === 0;
      
      if (hasNoData) {
        return NextResponse.json({
          overall: DEMO_DATA.overall,
          phases: DEMO_DATA.phases,
          tasks: DEMO_DATA.tasks.slice(0, 5).map(t => ({
            name: t.name,
            complete: t.status === 'completed',
            progress: t.progress,
          })),
          upcoming_deadlines: DEMO_DATA.upcoming_deadlines.slice(0, 5),
          isDemoMode: true,
        });
      }
      
      return NextResponse.json({
        overall: overallProgress,
        phases: phaseProgress,
        tasks: allTasks.map(t => ({
          name: t.name,
          complete: t.status === 'completed',
          progress: t.progress,
        })),
        upcoming_deadlines: upcomingTasks.slice(0, 5),
        isDemoMode,
      });
    }

    // Check if database has no data - use demo fallback
    const hasNoData = phases.length === 0 && milestones.length === 0 && allTasks.length === 0;
    
    if (hasNoData) {
      return NextResponse.json({
        ...DEMO_DATA,
        isDemoMode: true,
      });
    }

    return NextResponse.json({
      overall: overallProgress,
      phases: phases.length > 0 ? phases : defaultPhases.map((name, i) => ({
        name,
        displayName: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        status: phaseProgress[name]?.status || 'pending',
        progress: phaseProgress[name]?.progress || 0,
        order: i,
      })),
      milestones: milestones.map(m => ({
        id: m.id,
        name: m.name,
        date: m.targetDate.toISOString().split('T')[0],
        status: m.status,
        tasks: m.tasks.length,
      })),
      tasks: allTasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        progress: t.progress,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString().split('T')[0],
        milestoneId: t.milestoneId,
      })),
      upcoming_deadlines: upcomingTasks,
      isDemoMode,
    });
  } catch (error) {
    console.error('[GET /api/progress]', error);
    // Return demo data on error
    return NextResponse.json({
      ...DEMO_DATA,
      isDemoMode: true,
    });
  }
}

// POST /api/progress — create or update progress data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID } = body;

    if (action === 'initialize') {
      // Create default phases and starter milestones
      const defaultPhases = [
        { name: 'pre_production', displayName: 'Pre-Production', order: 0 },
        { name: 'production', displayName: 'Production', order: 1 },
        { name: 'post_production', displayName: 'Post-Production', order: 2 },
      ];

      // Create phases
      for (const phase of defaultPhases) {
        await prisma.productionPhase.upsert({
          where: { projectId_name: { projectId, name: phase.name } },
          update: {},
          create: { projectId, ...phase, status: 'pending', progress: 0 },
        });
      }

      // Create starter milestones
      const starterMilestones = [
        { name: 'Script Lock', phase: 'pre_production', order: 0, daysFromNow: -30 },
        { name: 'Casting Complete', phase: 'pre_production', order: 1, daysFromNow: 14 },
        { name: 'Location Scouting', phase: 'pre_production', order: 2, daysFromNow: 30 },
        { name: 'Pre-Production Complete', phase: 'pre_production', order: 3, daysFromNow: 45 },
        { name: 'Principal Photography', phase: 'production', order: 4, daysFromNow: 60 },
        { name: 'First Cut', phase: 'post_production', order: 5, daysFromNow: 90 },
        { name: 'Final Delivery', phase: 'post_production', order: 6, daysFromNow: 120 },
      ];

      const now = new Date();
      const createdMilestones = [];

      for (const m of starterMilestones) {
        const targetDate = new Date(now.getTime() + m.daysFromNow * 24 * 60 * 60 * 1000);
        const milestone = await prisma.milestone.create({
          data: {
            projectId,
            name: m.name,
            phase: m.phase,
            order: m.order,
            targetDate,
            status: m.daysFromNow < 0 ? 'completed' : 'pending',
            completedAt: m.daysFromNow < 0 ? now : null,
          },
        });
        createdMilestones.push(milestone);
      }

      // Create starter tasks
      const starterTasks = [
        { name: 'Script Analysis', milestoneIdx: 0, progress: 100, status: 'completed' },
        { name: 'Script Revisions', milestoneIdx: 0, progress: 100, status: 'completed' },
        { name: 'Character Breakdown', milestoneIdx: 0, progress: 100, status: 'completed' },
        { name: 'Location Shortlist', milestoneIdx: 2, progress: 75, status: 'in_progress' },
        { name: 'Casting Calls', milestoneIdx: 1, progress: 50, status: 'in_progress' },
        { name: 'Auditions', milestoneIdx: 1, progress: 30, status: 'in_progress' },
        { name: 'Permits Application', milestoneIdx: 3, progress: 20, status: 'in_progress' },
        { name: 'Equipment Booking', milestoneIdx: 3, progress: 0, status: 'pending' },
        { name: 'Crew Hiring', milestoneIdx: 3, progress: 0, status: 'pending' },
        { name: 'Shot List Creation', milestoneIdx: 3, progress: 0, status: 'pending' },
      ];

      for (const t of starterTasks) {
        await prisma.productionTask.create({
          data: {
            projectId,
            milestoneId: createdMilestones[t.milestoneIdx]?.id,
            name: t.name,
            progress: t.progress,
            status: t.status as any,
            priority: 'medium',
            order: t.milestoneIdx * 10,
          },
        });
      }

      return NextResponse.json({
        message: 'Production tracking initialized',
        phases: defaultPhases.length,
        milestones: createdMilestones.length,
        tasks: starterTasks.length,
      });
    }

    if (action === 'addMilestone') {
      const milestone = await prisma.milestone.create({
        data: {
          projectId,
          name: body.name,
          description: body.description,
          targetDate: new Date(body.targetDate),
          phase: body.phase,
          status: body.status || 'pending',
          order: body.order || 0,
        },
      });
      return NextResponse.json({ milestone });
    }

    if (action === 'addTask') {
      const task = await prisma.productionTask.create({
        data: {
          projectId,
          milestoneId: body.milestoneId || null,
          name: body.name,
          description: body.description,
          status: body.status || 'pending',
          progress: body.progress || 0,
          priority: body.priority || 'medium',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          order: body.order || 0,
        },
      });
      return NextResponse.json({ task });
    }

    if (action === 'updateTask') {
      const { taskId, ...updates } = body;
      const task = await prisma.productionTask.update({
        where: { id: taskId },
        data: {
          ...updates,
          completedAt: updates.status === 'completed' ? new Date() : undefined,
        },
      });
      return NextResponse.json({ task });
    }

    if (action === 'updateMilestone') {
      const { milestoneId, ...updates } = body;
      const milestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          ...updates,
          completedAt: updates.status === 'completed' ? new Date() : undefined,
        },
      });
      return NextResponse.json({ milestone });
    }

    if (action === 'updatePhase') {
      const { phaseName, status, progress } = body;
      const phase = await prisma.productionPhase.upsert({
        where: { projectId_name: { projectId, name: phaseName } },
        update: { status, progress },
        create: { projectId, name: phaseName, displayName: phaseName, status, progress, order: 0 },
      });
      return NextResponse.json({ phase });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/progress]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/progress — update progress (alias for POST actions)
export async function PATCH(req: NextRequest) {
  return POST(req);
}
