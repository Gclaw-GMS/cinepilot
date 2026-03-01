import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for fallback when database is not connected
const DEMO_TEAM_MEMBERS = [
  { id: 'demo-1', name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'], createdAt: new Date().toISOString() },
  { id: 'demo-2', name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'], createdAt: new Date().toISOString() },
  { id: 'demo-3', name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'], createdAt: new Date().toISOString() },
  { id: 'demo-4', name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'], createdAt: new Date().toISOString() },
  { id: 'demo-5', name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'], createdAt: new Date().toISOString() },
];

// Helper to ensure default project exists
async function ensureDefaultProject(): Promise<string> {
  try {
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
  } catch (error) {
    console.error('[ensureDefaultProject]', error);
    throw error;
  }
}

// Check if database is connected
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Helper to seed demo team members
async function seedDemoTeamMembers(projectId: string) {
  try {
    const existing = await prisma.teamMember.findMany({ where: { projectId } });
    if (existing.length === 0) {
      await prisma.teamMember.createMany({
        data: DEMO_TEAM_MEMBERS.map(m => ({
          projectId,
          name: m.name,
          role: m.role,
          email: m.email,
          phone: m.phone,
          status: m.status,
          skills: m.skills,
        })),
      });
    }
  } catch (error) {
    console.error('[seedDemoTeamMembers]', error);
  }
}

// GET /api/collaboration - Get all team members
export async function GET(req: NextRequest) {
  try {
    const dbConnected = await checkDbConnection();
    
    if (!dbConnected) {
      // Return demo data when database is not connected
      return NextResponse.json({ 
        members: DEMO_TEAM_MEMBERS,
        stats: {
          total: DEMO_TEAM_MEMBERS.length,
          active: DEMO_TEAM_MEMBERS.filter(m => m.status === 'active').length,
          busy: DEMO_TEAM_MEMBERS.filter(m => m.status === 'busy').length,
          offline: DEMO_TEAM_MEMBERS.filter(m => m.status === 'offline').length,
        },
        isDemoMode: true
      });
    }

    const projectId = await ensureDefaultProject();
    await seedDemoTeamMembers(projectId);

    const members = await prisma.teamMember.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email,
      phone: m.phone,
      status: m.status,
      skills: m.skills,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ 
      members: formattedMembers,
      stats: {
        total: members.length,
        active: members.filter(m => m.status === 'active').length,
        busy: members.filter(m => m.status === 'busy').length,
        offline: members.filter(m => m.status === 'offline').length,
      },
      isDemoMode: false
    });
  } catch (error) {
    console.error('[GET /api/collaboration]', error);
    // Return demo data on error
    return NextResponse.json({ 
      members: DEMO_TEAM_MEMBERS,
      stats: {
        total: DEMO_TEAM_MEMBERS.length,
        active: DEMO_TEAM_MEMBERS.filter(m => m.status === 'active').length,
        busy: DEMO_TEAM_MEMBERS.filter(m => m.status === 'busy').length,
        offline: DEMO_TEAM_MEMBERS.filter(m => m.status === 'offline').length,
      },
      isDemoMode: true
    });
  }
}

// POST /api/collaboration - Create new team member
export async function POST(req: NextRequest) {
  try {
    const dbConnected = await checkDbConnection();
    
    if (!dbConnected) {
      // Handle fallback mode
      const body = await req.json();
      const { name, role, email, phone, skills, status } = body;

      if (!name || !role) {
        return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
      }

      // Create a demo member with a generated ID
      const newMember = {
        id: `demo-${Date.now()}`,
        name,
        role,
        email: email || '',
        phone: phone || '',
        status: status || 'offline',
        skills: skills || [],
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({ member: newMember, isDemoMode: true });
    }

    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { name, role, email, phone, skills, status } = body;

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        projectId,
        name: name.trim(),
        role: role.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: status || 'offline',
        skills: skills || [],
      },
    });

    return NextResponse.json({ 
      member: {
        id: member.id,
        name: member.name,
        role: member.role,
        email: member.email,
        phone: member.phone,
        status: member.status,
        skills: member.skills,
        createdAt: member.createdAt.toISOString(),
      },
      isDemoMode: false
    });
  } catch (error) {
    console.error('[POST /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/collaboration - Update team member
export async function PATCH(req: NextRequest) {
  try {
    const dbConnected = await checkDbConnection();
    
    if (!dbConnected) {
      // Handle fallback mode - just return success
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
      }

      return NextResponse.json({ 
        member: { id, ...updates },
        isDemoMode: true 
      });
    }

    const body = await req.json();
    const { id, name, role, email, phone, skills, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim() || null;
    if (role !== undefined) updateData.role = role.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (skills !== undefined) updateData.skills = skills;
    if (status !== undefined) updateData.status = status;

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      member: {
        id: member.id,
        name: member.name,
        role: member.role,
        email: member.email,
        phone: member.phone,
        status: member.status,
        skills: member.skills,
        createdAt: member.createdAt.toISOString(),
      },
      isDemoMode: false
    });
  } catch (error) {
    console.error('[PATCH /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/collaboration - Delete team member
export async function DELETE(req: NextRequest) {
  try {
    const dbConnected = await checkDbConnection();
    
    if (!dbConnected) {
      // Handle fallback mode - just return success
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
      }

      return NextResponse.json({ success: true, isDemoMode: true });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, isDemoMode: false });
  } catch (error) {
    console.error('[DELETE /api/collaboration]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
