import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo tasks for when database is not connected
const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    projectId: 'default-project',
    title: 'Complete pre-shoot location scouting',
    description: 'Visit all pending locations and capture photos for director review',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Location Manager',
    dueDate: '2026-03-10',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-04T14:30:00Z',
  },
  {
    id: 'demo-task-2',
    projectId: 'default-project',
    title: 'Finalize cast availability for April',
    description: 'Confirm dates with all supporting actors',
    status: 'pending',
    priority: 'high',
    assignee: 'Production Coordinator',
    dueDate: '2026-03-15',
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'demo-task-3',
    projectId: 'default-project',
    title: 'Equipment rental agreement',
    description: 'Review and sign contracts with equipment vendors',
    status: 'pending',
    priority: 'medium',
    assignee: 'Line Producer',
    dueDate: '2026-03-12',
    createdAt: '2026-03-03T11:00:00Z',
    updatedAt: '2026-03-03T11:00:00Z',
  },
  {
    id: 'demo-task-4',
    projectId: 'default-project',
    title: 'Catering menu selection',
    description: 'Finalize menu options considering dietary restrictions',
    status: 'completed',
    priority: 'medium',
    assignee: 'Unit Production Manager',
    dueDate: '2026-03-05',
    createdAt: '2026-02-28T08:00:00Z',
    updatedAt: '2026-03-04T16:00:00Z',
  },
  {
    id: 'demo-task-5',
    projectId: 'default-project',
    title: 'VFX shot breakdown review',
    description: 'Go through script with VFX supervisor to identify all VFX shots',
    status: 'blocked',
    priority: 'high',
    assignee: 'VFX Supervisor',
    dueDate: '2026-03-08',
    createdAt: '2026-03-01T15:00:00Z',
    updatedAt: '2026-03-04T10:00:00Z',
  },
  {
    id: 'demo-task-6',
    projectId: 'default-project',
    title: 'Insurance certificates collection',
    description: 'Gather all required insurance documents for shoot days',
    status: 'pending',
    priority: 'low',
    assignee: 'Production Accountant',
    dueDate: '2026-03-20',
    createdAt: '2026-03-04T09:00:00Z',
    updatedAt: '2026-03-04T09:00:00Z',
  },
  {
    id: 'demo-task-7',
    projectId: 'default-project',
    title: 'Storyboard approval from director',
    description: 'Get final sign-off on all key frames',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Storyboard Artist',
    dueDate: '2026-03-07',
    createdAt: '2026-02-25T10:00:00Z',
    updatedAt: '2026-03-04T12:00:00Z',
  },
  {
    id: 'demo-task-8',
    projectId: 'default-project',
    title: 'Create call sheets for Week 1',
    description: 'Generate and distribute call sheets for first 5 shoot days',
    status: 'pending',
    priority: 'medium',
    assignee: 'Assistant Director',
    dueDate: '2026-03-18',
    createdAt: '2026-03-04T14:00:00Z',
    updatedAt: '2026-03-04T14:00:00Z',
  },
];

async function ensureDefaultProject(): Promise<string> {
  try {
    // Try to find default project
    let project = await prisma.project.findFirst({
      where: { id: DEFAULT_PROJECT_ID },
    });
    
    if (!project) {
      // Try to find any existing project
      project = await prisma.project.findFirst();
    }
    
    return project?.id || DEFAULT_PROJECT_ID;
  } catch {
    return DEFAULT_PROJECT_ID;
  }
}

// GET /api/tasks - List all tasks
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const status = req.nextUrl.searchParams.get('status');
  const priority = req.nextUrl.searchParams.get('priority');
  
  try {
    // Try to fetch from database using ProductionTask
    const where: Record<string, unknown> = { projectId };
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;

    const tasks = await prisma.productionTask.findMany({
      where,
      include: {
        milestone: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform to match frontend interface
    const transformed = tasks.map(t => ({
      id: t.id,
      projectId: t.projectId,
      title: t.name,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignee: null, // ProductionTask doesn't have assignee field
      dueDate: t.dueDate?.toISOString().split('T')[0] || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    // If no tasks found in database, use demo data
    if (transformed.length === 0) {
      console.log('[GET /api/tasks] No tasks in database, using demo data');
      let filtered = DEMO_TASKS.filter(t => t.projectId === projectId);
      if (status && status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
      }
      if (priority && priority !== 'all') {
        filtered = filtered.filter(t => t.priority === priority);
      }
      return NextResponse.json({ data: filtered, isDemoMode: true });
    }
    
    return NextResponse.json({ data: transformed, isDemoMode: false });
  } catch (error) {
    // If database is not connected, return demo data
    console.log('[GET /api/tasks] Database not connected, using demo data');
    
    let filtered = DEMO_TASKS.filter(t => t.projectId === projectId);
    if (status && status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }
    if (priority && priority !== 'all') {
      filtered = filtered.filter(t => t.priority === priority);
    }
    
    return NextResponse.json({ data: filtered, isDemoMode: true });
  }
}

// Valid status and priority values
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'blocked'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, status, priority, assignee, dueDate, projectId } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` 
      }, { status: 400 });
    }

    const resolvedProjectId = projectId || await ensureDefaultProject();

    const task = await prisma.productionTask.create({
      data: {
        projectId: resolvedProjectId,
        name: title.trim(),
        description: description?.trim() || null,
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    const transformed = {
      id: task.id,
      projectId: task.projectId,
      title: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: null,
      dueDate: task.dueDate?.toISOString().split('T')[0] || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    
    // Fallback to demo mode - create task locally
    const body = await req.json().catch(() => ({}));
    const { title, description, status, priority, assignee, dueDate, projectId } = body;
    
    const newTask = {
      id: `demo-task-${Date.now()}`,
      projectId: projectId || DEFAULT_PROJECT_ID,
      title: title || 'New Task',
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    DEMO_TASKS.push(newTask);
    return NextResponse.json({ data: newTask, isDemoMode: true });
  }
}

// PUT /api/tasks - Update a task
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, status, priority, assignee, dueDate } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.name = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.productionTask.update({
      where: { id },
      data: updateData,
    });

    const transformed = {
      id: task.id,
      projectId: task.projectId,
      title: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: null,
      dueDate: task.dueDate?.toISOString().split('T')[0] || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error('[PUT /api/tasks]', error);
    
    // Fallback to demo mode
    const id = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    
    const taskIndex = DEMO_TASKS.findIndex(t => t.id === id);
    if (taskIndex >= 0) {
      const updated = {
        ...DEMO_TASKS[taskIndex],
        ...body,
        title: body.title || DEMO_TASKS[taskIndex].title,
        updatedAt: new Date().toISOString(),
      };
      DEMO_TASKS[taskIndex] = updated;
      return NextResponse.json({ data: updated, isDemoMode: true });
    }
    
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.productionTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tasks]', error);
    
    // Fallback to demo mode
    const id = req.nextUrl.searchParams.get('id');
    const taskIndex = DEMO_TASKS.findIndex(t => t.id === id);
    
    if (taskIndex >= 0) {
      DEMO_TASKS.splice(taskIndex, 1);
      return NextResponse.json({ success: true, isDemoMode: true });
    }
    
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
}
