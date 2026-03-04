import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// In-memory storage for demo mode
let templatesStore = [
  { id: 'tpl-1', name: 'Schedule Update', category: 'schedule', content: '📅 *Shooting Schedule Update*\n\nHi {name}!\n\n*Date:* {date}\n*Time:* {time}\n*Location:* {location}\n\nPlease confirm.', variables: ['name', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
  { id: 'tpl-2', name: 'Call Reminder', category: 'reminder', content: '⏰ *Call Reminder*\n\nHi {name}!\n\nDon\'t forget: {date} at {time}\nLocation: {location}', variables: ['name', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
  { id: 'tpl-3', name: 'Call Sheet', category: 'call_sheet', content: '🎬 *Call Sheet*\n\n*Scene:* {scene}\n*Date:* {date}\n*Call Time:* {time}\n*Location:* {location}', variables: ['scene', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
];

let isDemoMode = true;

// Check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const dbConnected = await checkDbConnection();
  isDemoMode = !dbConnected;

  return NextResponse.json({ 
    templates: templatesStore,
    isDemoMode 
  });
}

export async function POST(request: NextRequest) {
  const dbConnected = await checkDbConnection();
  isDemoMode = !dbConnected;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, category, content, id } = body;

  if (!name || !content) {
    return NextResponse.json(
      { success: false, error: 'Name and content are required' },
      { status: 400 }
    );
  }

  // Extract variables from content
  const variableRegex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  // Update existing or create new
  if (id) {
    templatesStore = templatesStore.map(t => 
      t.id === id 
        ? { ...t, name, category: category || 'schedule', content, variables }
        : t
    );
    const updated = templatesStore.find(t => t.id === id);
    return NextResponse.json({ 
      success: true, 
      template: updated,
      isDemoMode 
    });
  }

  const newTemplate = {
    id: `tpl-${Date.now()}`,
    name,
    category: category || 'schedule',
    content,
    variables,
    createdAt: new Date().toISOString(),
  };

  templatesStore = [...templatesStore, newTemplate];

  return NextResponse.json({ 
    success: true, 
    template: newTemplate,
    isDemoMode 
  });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Template ID is required' },
      { status: 400 }
    );
  }

  templatesStore = templatesStore.filter(t => t.id !== id);
  return NextResponse.json({ success: true, isDemoMode });
}
