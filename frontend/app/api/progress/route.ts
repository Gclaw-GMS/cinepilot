import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// In-memory storage for demo mode
interface TimelineEvent {
  id: string
  title: string
  description: string
  type: 'shoot' | 'pre-production' | 'post-production' | 'milestone' | 'review'
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  startDate: string
  endDate: string
  projectId: string
  location?: string
  scenes?: number
  budget?: number
  notes?: string
}

interface Task {
  id: string
  name: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  milestoneId?: string
}

interface Milestone {
  id: string
  name: string
  description?: string
  targetDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  phase: string
  tasks: Task[]
}

// Demo milestones with empty task arrays (for display purposes)
const demoMilestones: Milestone[] = [
  { id: 'm1', name: 'Script Lock', targetDate: '2026-01-15', status: 'completed', phase: 'pre_production', tasks: [] },
  { id: 'm2', name: 'Casting Complete', targetDate: '2026-01-30', status: 'completed', phase: 'pre_production', tasks: [] },
  { id: 'm3', name: 'Location Scouting', targetDate: '2026-02-15', status: 'in-progress', phase: 'pre_production', tasks: [] },
  { id: 'm4', name: 'Pre-Production Complete', targetDate: '2026-03-01', status: 'pending', phase: 'pre_production', tasks: [] },
  { id: 'm5', name: 'Principal Photography', targetDate: '2026-03-15', status: 'pending', phase: 'production', tasks: [] },
  { id: 'm6', name: 'First Cut', targetDate: '2026-04-30', status: 'pending', phase: 'post_production', tasks: [] },
  { id: 'm7', name: 'Final Delivery', targetDate: '2026-05-15', status: 'pending', phase: 'post_production', tasks: [] },
]

interface Phase {
  name: string
  displayName: string
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  progress: number
  order: number
}

// Demo data for progress tracking
const DEMO_PROGRESS = {
  overall: 42,
  phases: [
    { name: 'pre_production', displayName: 'Pre-Production', status: 'in-progress', progress: 75, order: 0 },
    { name: 'production', displayName: 'Production', status: 'in-progress', progress: 35, order: 1 },
    { name: 'post_production', displayName: 'Post-Production', status: 'pending', progress: 0, order: 2 },
  ] as Phase[],
  milestones: demoMilestones,
  tasks: [
    { id: 't1', name: 'Script Analysis', description: 'Analyze script for scenes, characters, props', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-10', milestoneId: 'm1' },
    { id: 't2', name: 'Script Revisions', description: 'Incorporate director feedback', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-12', milestoneId: 'm1' },
    { id: 't3', name: 'Character Breakdown', description: 'Identify all characters and their roles', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-14', milestoneId: 'm1' },
    { id: 't4', name: 'Scene Breakdown', description: 'Break down each scene by elements', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-15', milestoneId: 'm1' },
    { id: 't5', name: 'Lead Casting', description: 'Finalize lead actors', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-25', milestoneId: 'm2' },
    { id: 't6', name: 'Supporting Cast', description: 'Finalize supporting actors', status: 'completed', progress: 100, priority: 'medium', dueDate: '2026-01-28', milestoneId: 'm2' },
    { id: 't7', name: 'Extras Casting', description: 'Cast background actors', status: 'completed', progress: 100, priority: 'low', dueDate: '2026-01-30', milestoneId: 'm2' },
    { id: 't8', name: 'Location Scout - Chennai', description: 'Scout Chennai locations', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-02-01', milestoneId: 'm3' },
    { id: 't9', name: 'Location Scout - Ooty', description: 'Scout Ooty hill station', status: 'in-progress', progress: 80, priority: 'high', dueDate: '2026-02-08', milestoneId: 'm3' },
    { id: 't10', name: 'Location Scout - Madurai', description: 'Scout Madurai temple locations', status: 'in-progress', progress: 60, priority: 'high', dueDate: '2026-02-12', milestoneId: 'm3' },
    { id: 't11', name: 'Location Contracts', description: 'Sign location agreements', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-02-15', milestoneId: 'm3' },
    { id: 't12', name: 'Permit Applications', description: 'Apply for shooting permits', status: 'in-progress', progress: 40, priority: 'critical', dueDate: '2026-02-10', milestoneId: 'm4' },
    { id: 't13', name: 'Equipment Booking', description: 'Book cameras, lights, grip', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-02-20', milestoneId: 'm4' },
    { id: 't14', name: 'Crew Hiring', description: 'Hire DP, sound, art department', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-02-22', milestoneId: 'm4' },
    { id: 't15', name: 'Shot List Creation', description: 'Create detailed shot list', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-02-25', milestoneId: 'm4' },
    { id: 't16', name: 'Storyboard Complete', description: 'Finish storyboards for key scenes', status: 'pending', progress: 0, priority: 'medium', dueDate: '2026-02-28', milestoneId: 'm4' },
  ] as Task[],
  upcoming_deadlines: [
    { task: 'Permit Applications', date: '2026-02-10', days_left: 8 },
    { task: 'Location Scout - Madurai', date: '2026-02-12', days_left: 10 },
    { task: 'Location Contracts', date: '2026-02-15', days_left: 13 },
    { task: 'Pre-Production Complete', date: '2026-03-01', days_left: 27 },
    { task: 'Principal Photography', date: '2026-03-15', days_left: 41 },
  ]
}

// Demo mode state (in-memory)
let demoProgress = JSON.parse(JSON.stringify(DEMO_PROGRESS))

// Helper to check if we're in demo mode
async function isDemoMode(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return false
  } catch {
    return true
  }
}

// GET /api/progress — get production progress data
// GET /api/progress?summary=true — get just the summary for dashboard
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const summaryOnly = req.nextUrl.searchParams.get('summary') === 'true';

  // Check if database is available
  const demoMode = await isDemoMode()

  if (demoMode) {
    // Return demo data
    if (summaryOnly) {
      return NextResponse.json({
        overall: demoProgress.overall,
        phases: demoProgress.phases.reduce((acc: Record<string, { progress: number; status: string }>, p: Phase) => {
          acc[p.name] = { progress: p.progress, status: p.status }
          return acc
        }, {}),
        tasks: demoProgress.tasks.map((t: Task) => ({
          name: t.name,
          complete: t.status === 'completed',
          progress: t.progress,
        })),
        upcoming_deadlines: demoProgress.upcoming_deadlines.slice(0, 5),
        isDemoMode: true
      });
    }

    return NextResponse.json({
      ...demoProgress,
      isDemoMode: true
    });
  }

  try {
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
      return NextResponse.json({
        overall: overallProgress,
        phases: phaseProgress,
        tasks: allTasks.map(t => ({
          name: t.name,
          complete: t.status === 'completed',
          progress: t.progress,
        })),
        upcoming_deadlines: upcomingTasks.slice(0, 5),
        isDemoMode: false
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
      isDemoMode: false
    });
  } catch (error) {
    console.error('[GET /api/progress]', error);
    return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
  }
}

// POST /api/progress — create or update progress data
export async function POST(req: NextRequest) {
  const demoMode = await isDemoMode()

  // Handle demo mode
  if (demoMode) {
    const body = await req.json()
    const { action } = body

    if (action === 'initialize') {
      // Reset to demo data
      demoProgress = JSON.parse(JSON.stringify(DEMO_PROGRESS))
      return NextResponse.json({
        message: 'Production tracking initialized (demo mode)',
        phases: demoProgress.phases.length,
        milestones: demoProgress.milestones.length,
        tasks: demoProgress.tasks.length,
        isDemoMode: true
      })
    }

    if (action === 'addMilestone') {
      const newMilestone = {
        id: `m${Date.now()}`,
        name: body.name,
        description: body.description,
        targetDate: body.targetDate,
        status: body.status || 'pending',
        phase: body.phase,
        tasks: 0
      }
      demoProgress.milestones.push(newMilestone)
      return NextResponse.json({ milestone: newMilestone, isDemoMode: true })
    }

    if (action === 'addTask') {
      const newTask = {
        id: `t${Date.now()}`,
        name: body.name,
        description: body.description,
        status: body.status || 'pending',
        progress: body.progress || 0,
        priority: body.priority || 'medium',
        dueDate: body.dueDate,
        milestoneId: body.milestoneId || null
      }
      demoProgress.tasks.push(newTask)
      // Recalculate overall progress
      const completed = demoProgress.tasks.filter((t: Task) => t.status === 'completed').length
      demoProgress.overall = Math.round((completed / demoProgress.tasks.length) * 100)
      return NextResponse.json({ task: newTask, isDemoMode: true })
    }

    if (action === 'updateTask') {
      const { taskId, ...updates } = body
      const taskIndex = demoProgress.tasks.findIndex((t: Task) => t.id === taskId)
      if (taskIndex >= 0) {
        demoProgress.tasks[taskIndex] = { ...demoProgress.tasks[taskIndex], ...updates }
        // Recalculate overall progress
        const completed = demoProgress.tasks.filter((t: Task) => t.status === 'completed').length
        demoProgress.overall = Math.round((completed / demoProgress.tasks.length) * 100)
        return NextResponse.json({ task: demoProgress.tasks[taskIndex], isDemoMode: true })
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (action === 'updateMilestone') {
      const { milestoneId, ...updates } = body
      const milestoneIndex = demoProgress.milestones.findIndex((m: Milestone) => m.id === milestoneId)
      if (milestoneIndex >= 0) {
        demoProgress.milestones[milestoneIndex] = { ...demoProgress.milestones[milestoneIndex], ...updates }
        return NextResponse.json({ milestone: demoProgress.milestones[milestoneIndex], isDemoMode: true })
      }
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (action === 'updatePhase') {
      const { phaseName, status, progress } = body
      const phaseIndex = demoProgress.phases.findIndex((p: Phase) => p.name === phaseName)
      if (phaseIndex >= 0) {
        demoProgress.phases[phaseIndex] = { ...demoProgress.phases[phaseIndex], status, progress }
        return NextResponse.json({ phase: demoProgress.phases[phaseIndex], isDemoMode: true })
      }
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Database mode
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
        isDemoMode: false
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
      return NextResponse.json({ milestone, isDemoMode: false });
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
      return NextResponse.json({ task, isDemoMode: false });
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
      return NextResponse.json({ task, isDemoMode: false });
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
      return NextResponse.json({ milestone, isDemoMode: false });
    }

    if (action === 'updatePhase') {
      const { phaseName, status, progress } = body;
      const phase = await prisma.productionPhase.upsert({
        where: { projectId_name: { projectId, name: phaseName } },
        update: { status, progress },
        create: { projectId, name: phaseName, displayName: phaseName, status, progress, order: 0 },
      });
      return NextResponse.json({ phase, isDemoMode: false });
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

// DELETE /api/progress — delete tasks/milestones
export async function DELETE(req: NextRequest) {
  const demoMode = await isDemoMode()
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')
  const milestoneId = searchParams.get('milestoneId')

  if (demoMode) {
    if (taskId) {
      const index = demoProgress.tasks.findIndex((t: Task) => t.id === taskId)
      if (index >= 0) {
        demoProgress.tasks.splice(index, 1)
        return NextResponse.json({ success: true, isDemoMode: true })
      }
    }
    if (milestoneId) {
      const index = demoProgress.milestones.findIndex((m: Milestone) => m.id === milestoneId)
      if (index >= 0) {
        demoProgress.milestones.splice(index, 1)
        return NextResponse.json({ success: true, isDemoMode: true })
      }
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    if (taskId) {
      await prisma.productionTask.delete({ where: { id: taskId } })
      return NextResponse.json({ success: true, isDemoMode: false })
    }
    if (milestoneId) {
      await prisma.milestone.delete({ where: { id: milestoneId } })
      return NextResponse.json({ success: true, isDemoMode: false })
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  } catch (error) {
    console.error('[DELETE /api/progress]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
