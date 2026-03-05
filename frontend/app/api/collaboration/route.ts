import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo team members for when database is not available
const DEMO_MEMBERS: DemoMember[] = [
  { id: 'demo-1', name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'], department: 'Direction', dailyRate: 50000, notes: 'Award-winning director', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-2', name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'], department: 'Production', dailyRate: 45000, notes: 'Experienced producer', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-3', name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'], department: 'Camera', dailyRate: 35000, notes: 'Expert in cinematic lighting', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-4', name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'], department: 'Art', dailyRate: 28000, notes: 'Specializes in period dramas', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-5', name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'], department: 'Sound', dailyRate: 22000, notes: 'Location sound specialist', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-6', name: 'Divya Ramesh', role: 'Editor', email: 'divya@film.com', phone: '+91 98765 43215', status: 'active', skills: ['Editing', 'Color Grading'], department: 'Post-Production', dailyRate: 25000, notes: 'Known for fast-paced action', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-7', name: 'Karthik S', role: 'VFX Supervisor', email: 'karthik@film.com', phone: '+91 98765 43216', status: 'busy', skills: ['VFX', 'CGI'], department: 'VFX', dailyRate: 40000, notes: 'International experience', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'demo-8', name: 'Bala Subramani', role: 'Stunt Choreographer', email: 'bala@film.com', phone: '+91 98765 43217', status: 'active', skills: ['Stunts', 'Action Design'], department: 'Stunts', dailyRate: 30000, notes: 'Safety certified', createdAt: '2024-01-15T10:00:00Z' },
];

const DEMO_STATS = {
  totalMembers: 8,
  activeNow: 5,
  pendingTasks: 12,
  messages: 47,
  scriptsCount: 2,
  locationsCount: 6,
};

// In-memory storage for demo mode operations
type DemoMember = {
  id: string
  name: string
  role: string
  email: string | null
  phone: string | null
  status: 'active' | 'busy' | 'offline'
  skills: string[]
  department: string | null
  dailyRate: number | null
  notes: string | null
  createdAt: string
}

const demoMembers: Map<string, DemoMember> = new Map();
DEMO_MEMBERS.forEach(m => demoMembers.set(m.id, { ...m }));

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
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  try {
    const projectId = await ensureDefaultProject();

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
    console.error('[GET /api/collaboration] Database not available, using demo data:', error);
    // Return demo data when database is not available
    if (type === 'members') {
      return NextResponse.json({ members: DEMO_MEMBERS, isDemoMode: true });
    }
    if (type === 'stats') {
      return NextResponse.json({ ...DEMO_STATS, isDemoMode: true });
    }
    return NextResponse.json({ members: DEMO_MEMBERS, stats: DEMO_STATS, isDemoMode: true });
  }
}

// POST /api/collaboration - Invite a new team member
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { name, role, email, phone, department, dailyRate, notes } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const trimmedName = name.trim();
  const newMember = {
    id: `demo-${Date.now()}`,
    name: trimmedName,
    role: (typeof role === 'string' ? role.trim() : 'Team Member') || 'Team Member',
    email: typeof email === 'string' ? email.trim() : null,
    phone: typeof phone === 'string' ? phone.trim() : null,
    status: 'active' as const,
    skills: [typeof department === 'string' ? department.trim() : 'Production'].slice(0, 3),
    department: typeof department === 'string' ? department.trim() : null,
    dailyRate: dailyRate != null ? Number(dailyRate) : null,
    notes: typeof notes === 'string' ? notes.trim() : null,
    createdAt: new Date().toISOString(),
  };

  try {
    const projectId = await ensureDefaultProject();

    const member = await prisma.crew.create({
      data: {
        projectId,
        name: trimmedName,
        role: newMember.role,
        email: newMember.email,
        phone: newMember.phone,
        department: newMember.department,
        dailyRate: newMember.dailyRate,
        notes: newMember.notes,
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
    console.error('[POST /api/collaboration] Database not available, using demo mode:', error);
    // Add to demo storage and return success in demo mode
    demoMembers.set(newMember.id, newMember);
    return NextResponse.json({ ...newMember, _demo: true });
  }
}

// PATCH /api/collaboration - Update a team member
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { id, name, role, email, phone, department, dailyRate, notes, status } = body;

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const trimmedId = id.trim();
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

  try {
    const member = await prisma.crew.update({
      where: { id: trimmedId },
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
    console.error('[PATCH /api/collaboration] Database not available, using demo mode:', error);
    // Check if it's a demo member
    const existingDemo = demoMembers.get(trimmedId);
    if (existingDemo) {
      const updatedDemo = { ...existingDemo, ...data };
      demoMembers.set(trimmedId, updatedDemo);
      return NextResponse.json({ ...updatedDemo, _demo: true });
    }
    // For unknown IDs in demo mode, create a response
    return NextResponse.json({
      id: trimmedId,
      name: data.name || 'Unknown',
      role: data.role || 'Team Member',
      email: data.email || null,
      phone: data.phone || null,
      department: data.department || null,
      status: 'active',
      skills: [data.department || 'Production'],
      createdAt: new Date().toISOString(),
      _demo: true
    });
  }
}

// DELETE /api/collaboration - Remove a team member
export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { id } = body;

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const trimmedId = id.trim();

  try {
    await prisma.crew.delete({
      where: { id: trimmedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/collaboration] Database not available, using demo mode:', error);
    // Remove from demo storage if exists
    if (demoMembers.has(trimmedId)) {
      demoMembers.delete(trimmedId);
      return NextResponse.json({ success: true, _demo: true });
    }
    // Return success anyway for demo mode compatibility
    return NextResponse.json({ success: true, _demo: true });
  }
}
