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
  let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } });
  if (!project) {
    project = await prisma.project.create({
      data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
    });
  }
  return project.id;
}

// GET /api/collaboration - Get team members and collaboration stats
export async function GET(req: NextRequest) {
  try {
    const projectId = await ensureDefaultProject();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Get crew members for team collaboration
    const crew = await prisma.crew.findMany({
      where: { projectId },
      orderBy: { department: 'asc' },
    });

    // Get project stats
    const [totalCrew, scriptsCount, locationsCount] = await Promise.all([
      prisma.crew.count({ where: { projectId } }),
      prisma.script.count({ where: { projectId } }),
      prisma.location.count({ where: { projectId } }),
    ]);

    // Map crew to collaboration format with status
    const teamMembers = crew.map((member, index) => ({
      id: member.id,
      name: member.name,
      role: member.role || 'Team Member',
      email: member.email,
      phone: member.phone,
      status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'busy' : 'offline',
      skills: [member.department || 'Production'].slice(0, 3),
      dailyRate: member.dailyRate,
      notes: member.notes,
      createdAt: member.createdAt,
    }));

    // Generate collaboration stats
    const activeNow = teamMembers.filter(m => m.status === 'active').length;
    const pendingTasks = Math.floor(Math.random() * 20) + 5; // Demo data
    const messages = Math.floor(Math.random() * 100) + 20; // Demo data

    const stats = {
      totalMembers: totalCrew,
      activeNow,
      pendingTasks,
      messages,
      scriptsCount,
      locationsCount,
    };

    if (type === 'members') {
      return NextResponse.json({ members: teamMembers });
    }

    if (type === 'stats') {
      return NextResponse.json(stats);
    }

    return NextResponse.json({ members: teamMembers, stats });
  } catch (error) {
    console.error('[GET /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/collaboration - Invite a new team member
export async function POST(req: NextRequest) {
  try {
    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { name, role, email, phone, department, dailyRate, notes } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const member = await prisma.crew.create({
      data: {
        projectId,
        name: name.trim(),
        role: role?.trim() || 'Team Member',
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        dailyRate: dailyRate != null ? Number(dailyRate) : null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      status: 'active',
      skills: [member.department || 'Production'],
      createdAt: member.createdAt,
    });
  } catch (error) {
    console.error('[POST /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/collaboration - Update a team member
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, email, phone, department, dailyRate, notes, status } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowed = ['name', 'role', 'department', 'phone', 'email', 'dailyRate', 'notes'];
    const data: Record<string, unknown> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'dailyRate' && body[key] != null) {
          data[key] = Number(body[key]);
        } else if (typeof body[key] === 'string') {
          data[key] = body[key].trim() || null;
        } else {
          data[key] = body[key];
        }
      }
    }

    const member = await prisma.crew.update({
      where: { id: id.trim() },
      data,
    });

    return NextResponse.json({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      department: member.department,
      status: 'active', // In real app, would track actual status
      skills: [member.department || 'Production'],
      createdAt: member.createdAt,
    });
  } catch (error) {
    console.error('[PATCH /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/collaboration - Remove a team member
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
    console.error('[DELETE /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
