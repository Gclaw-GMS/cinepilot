import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Demo templates
const DEMO_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Schedule Update',
    category: 'schedule',
    content: '📅 *Shooting Schedule Update*\n\nHi {name}!\n\n*Date:* {date}\n*Time:* {time}\n*Location:* {location}\n\nPlease confirm your availability.',
    variables: ['name', 'date', 'time', 'location'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    name: 'Call Reminder',
    category: 'reminder',
    content: '⏰ *Call Reminder*\n\nHi {name}!\n\nDon\'t forget: {date} at {time}\nLocation: {location}\n\nSee you there!',
    variables: ['name', 'date', 'time', 'location'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-3',
    name: 'Call Sheet',
    category: 'call_sheet',
    content: '🎬 *Call Sheet*\n\n*Scene:* {scene}\n*Date:* {date}\n*Call Time:* {time}\n*Location:* {location}\n\nReport to: {report_to}',
    variables: ['scene', 'date', 'time', 'location', 'report_to'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-4',
    name: 'Location Change',
    category: 'update',
    content: '📍 *Location Change*\n\nHi {name}!\n\nToday\'s shooting location has changed:\n\n*New Location:* {location}\n*Address:* {address}\n\nPlease update your travel plans.',
    variables: ['name', 'location', 'address'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-5',
    name: 'Casting Call',
    category: 'casting',
    content: '🎭 *Casting Call*\n\n*Project:* {project}\n*Role:* {role}\n*Date:* {date}\n*Location:* {location}\n\nAudition required. Reply to confirm.',
    variables: ['project', 'role', 'date', 'location'],
    createdAt: new Date().toISOString(),
  },
];

// In-memory template storage for demo
let templates = [...DEMO_TEMPLATES];

// GET /api/whatsapp/templates - Get all templates
export async function GET() {
  return NextResponse.json({
    templates,
    isDemoMode: true,
  });
}

// POST /api/whatsapp/templates - Create a new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, content, variables } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const newTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      category: category || 'custom',
      content,
      variables: variables || [],
      createdAt: new Date().toISOString(),
    };

    templates.push(newTemplate);

    return NextResponse.json({
      template: newTemplate,
      success: true,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[POST /api/whatsapp/templates]', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PATCH /api/whatsapp/templates - Update a template
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, content, variables } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      ...(name && { name }),
      ...(category && { category }),
      ...(content && { content }),
      ...(variables && { variables }),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      template: templates[templateIndex],
      success: true,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[PATCH /api/whatsapp/templates]', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp/templates - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    templates.splice(templateIndex, 1);

    return NextResponse.json({
      success: true,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[DELETE /api/whatsapp/templates]', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
