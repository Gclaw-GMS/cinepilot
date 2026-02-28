import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo tasks data
const DEMO_TASKS = [
  { id: 'demo-1', projectId: DEFAULT_PROJECT_ID, title: 'Confirm venue for song shoot', description: 'Need to book Studio B for the romantic song', status: 'in_progress', priority: 'high', assignee: 'Line Producer', dueDate: '2026-03-01', createdAt: new Date().toISOString() },
  { id: 'demo-2', projectId: DEFAULT_PROJECT_ID, title: 'Get insurance approval', description: 'Production insurance for outdoor shoots', status: 'pending', priority: 'medium', assignee: 'Producer', dueDate: '2026-03-05', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-3', projectId: DEFAULT_PROJECT_ID, title: 'Finalize cast travel dates', description: 'Coordinate flights for lead actors', status: 'completed', priority: 'high', assignee: 'Assistant Director', dueDate: '2026-02-28', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'demo-4', projectId: DEFAULT_PROJECT_ID, title: 'Review storyboard frames', description: 'Go through the 50+ frames from VFX team', status: 'pending', priority: 'low', assignee: 'Director', dueDate: '2026-03-10', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

// In-memory store for demo mode
let tasksStore = [...DEMO_TASKS];

// Helper to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

// GET /api/tasks - Get all tasks
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const status = req.nextUrl.searchParams.get('status');

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    // Return demo data
    let filtered = tasksStore.filter(t => t.projectId === projectId);
    if (status && status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }

    // Sort by priority (high first), then by due date
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    filtered.sort((a: any, b: any) => {
      const priorityDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (priorityDiff !== 0) return priorityDiff;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return 0;
    });

    return NextResponse.json({ 
      data: filtered, 
      isDemoMode: true 
    });
  }

  try {
    const where: any = { projectId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const tasks = await prisma.productionTask.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { order: 'asc' },
      ],
      include: {
        milestone: true,
      },
    });

    // Transform to match expected format
    const transformed = tasks.map(task => ({
      id: task.id,
      projectId: task.projectId,
      milestoneId: task.milestoneId,
      title: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assignee: '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      order: task.order,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return NextResponse.json({ 
      data: transformed, 
      isDemoMode: false 
    });
  } catch (error) {
    console.error('[GET /api/tasks] Database error:', error);
    // Fall back to demo data
    let filtered = tasksStore.filter(t => t.projectId === projectId);
    if (status && status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }
    return NextResponse.json({ 
      data: filtered, 
      isDemoMode: true 
    });
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      status = 'pending', 
      priority = 'medium', 
      assignee, 
      dueDate, 
      projectId = DEFAULT_PROJECT_ID,
      milestoneId 
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      const newTask = {
        id: `demo-${Date.now()}`,
        projectId,
        title: title.trim(),
        description: description?.trim() || '',
        status,
        priority,
        assignee: assignee || '',
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tasksStore.push(newTask);
      return NextResponse.json({ 
        data: newTask, 
        isDemoMode: true 
      }, { status: 201 });
    }

    const newTask = await prisma.productionTask.create({
      data: {
        projectId,
        name: title.trim(),
        description: description?.trim() || '',
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        milestoneId: milestoneId || null,
      },
    });

    return NextResponse.json({ 
      data: {
        id: newTask.id,
        projectId: newTask.projectId,
        milestoneId: newTask.milestoneId,
        title: newTask.name,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        progress: newTask.progress,
        assignee: '',
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString().split('T')[0] : null,
        completedAt: newTask.completedAt ? newTask.completedAt.toISOString() : null,
        order: newTask.order,
        createdAt: newTask.createdAt.toISOString(),
        updatedAt: newTask.updatedAt.toISOString(),
      }, 
      isDemoMode: false 
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT /api/tasks - Update a task
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable || id.startsWith('demo-')) {
      const taskIndex = tasksStore.findIndex(t => t.id === id);
      if (taskIndex < 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const updatedTask = {
        ...tasksStore[taskIndex],
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.assignee !== undefined && { assignee: body.assignee }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        updatedAt: new Date().toISOString(),
      };

      tasksStore[taskIndex] = updatedTask;
      return NextResponse.json({ 
        data: updatedTask, 
        isDemoMode: true 
      });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.name = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.order !== undefined) updateData.order = body.order;

    const updatedTask = await prisma.productionTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      data: {
        id: updatedTask.id,
        projectId: updatedTask.projectId,
        milestoneId: updatedTask.milestoneId,
        title: updatedTask.name,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        progress: updatedTask.progress,
        assignee: '',
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString().split('T')[0] : null,
        completedAt: updatedTask.completedAt ? updatedTask.completedAt.toISOString() : null,
        order: updatedTask.order,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      }, 
      isDemoMode: false 
    });
  } catch (error: any) {
    console.error('[PUT /api/tasks]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable || id.startsWith('demo-')) {
    const taskIndex = tasksStore.findIndex(t => t.id === id);
    if (taskIndex < 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    tasksStore.splice(taskIndex, 1);
    return NextResponse.json({ 
      success: true, 
      isDemoMode: true 
    });
  }

  try {
    await prisma.productionTask.delete({
      where: { id },
    });
    return NextResponse.json({ 
      success: true, 
      isDemoMode: false 
    });
  } catch (error: any) {
    console.error('[DELETE /api/tasks]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
