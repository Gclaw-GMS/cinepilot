import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

async function ensureDefaultProject(): Promise<string> {
  let user = await prisma.user.findFirst({ where: { id: 'default-user' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'default-user',
        email: 'dev@cinepilot.ai',
        passwordHash: 'none',
        name: 'Dev User',
      },
    });
  }
  // Use fixed project ID to match seed data
  let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } });
  if (!project) {
    project = await prisma.project.create({
      data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
    });
  }
  return project.id;
}

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const crew = await prisma.crew.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(crew);
  } catch (error) {
    console.error('[GET /api/crew]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, department, phone, email, dailyRate, notes } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (typeof role !== 'string' || !role.trim()) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    const projectId = await ensureDefaultProject();

    const crew = await prisma.crew.create({
      data: {
        projectId,
        name: name.trim(),
        role: role.trim(),
        department: department?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        dailyRate: dailyRate != null ? Number(dailyRate) : null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(crew);
  } catch (error) {
    console.error('[POST /api/crew]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowed = ['name', 'role', 'department', 'phone', 'email', 'dailyRate', 'notes'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'dailyRate' && fields[key] != null) {
          data[key] = Number(fields[key]);
        } else if (typeof fields[key] === 'string') {
          data[key] = fields[key].trim() || null;
        } else {
          data[key] = fields[key];
        }
      }
    }

    const crew = await prisma.crew.update({
      where: { id: id.trim() },
      data,
    });

    return NextResponse.json(crew);
  } catch (error) {
    console.error('[PATCH /api/crew]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.crew.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/crew]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
