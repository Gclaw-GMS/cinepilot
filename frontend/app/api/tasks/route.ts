import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo tasks data
const DEMO_TASKS = [
  { id: 1, projectId: DEFAULT_PROJECT_ID, title: 'Confirm venue for song shoot', description: 'Need to book Studio B for the romantic song', status: 'in_progress', priority: 'high', assignee: 'Line Producer', dueDate: '2026-03-01', createdAt: new Date().toISOString() },
  { id: 2, projectId: DEFAULT_PROJECT_ID, title: 'Get insurance approval', description: 'Production insurance for outdoor shoots', status: 'pending', priority: 'medium', assignee: 'Producer', dueDate: '2026-03-05', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, projectId: DEFAULT_PROJECT_ID, title: 'Finalize cast travel dates', description: 'Coordinate flights for lead actors', status: 'completed', priority: 'high', assignee: 'Assistant Director', dueDate: '2026-02-28', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, projectId: DEFAULT_PROJECT_ID, title: 'Review storyboard frames', description: 'Go through the 50+ frames from VFX team', status: 'pending', priority: 'low', assignee: 'Director', dueDate: '2026-03-10', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

// In-memory store for demo mode
let tasksStore = [...DEMO_TASKS];

// GET /api/tasks - Get all tasks
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const status = req.nextUrl.searchParams.get('status');

  let filtered = tasksStore.filter(t => t.projectId === projectId);
  if (status && status !== 'all') {
    filtered = filtered.filter(t => t.status === status);
  }

  // Sort by priority (high first), then by due date
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  filtered.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  return NextResponse.json(filtered);
}

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, status = 'pending', priority = 'medium', assignee, dueDate, projectId = DEFAULT_PROJECT_ID } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newTask = {
      id: Date.now(),
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
    return NextResponse.json(newTask, { status: 201 });
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

    const taskIndex = tasksStore.findIndex(t => t.id === Number(id));
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
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[PUT /api/tasks]', error);
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

  const taskIndex = tasksStore.findIndex(t => t.id === Number(id));
  if (taskIndex < 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  tasksStore.splice(taskIndex, 1);
  return NextResponse.json({ success: true });
}
