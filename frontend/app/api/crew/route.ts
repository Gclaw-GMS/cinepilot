import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo crew data for fallback when database is unavailable
const DEMO_CREW = [
  { id: 'd1', name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@film.com', dailyRate: 75000, notes: 'Award-winning cinematographer', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'd2', name: 'Anand Venkatesh', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43211', email: 'anand@film.com', dailyRate: 15000, notes: '15+ years experience', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'd3', name: 'Vijay Raghavan', role: 'Sound Mixer', department: 'Sound', phone: '+91 98765 43212', email: 'vijay@film.com', dailyRate: 12000, notes: null, createdAt: '2026-01-15T00:00:00Z' },
  { id: 'd4', name: 'Madhan Kumar', role: 'Production Designer', department: 'Art', phone: '+91 98765 43213', email: 'madhan@film.com', dailyRate: 45000, notes: 'Specializes in period films', createdAt: '2026-01-16T00:00:00Z' },
  { id: 'd5', name: 'Lakshmi Devi', role: 'Chief Makeup Artist', department: 'Makeup', phone: '+91 98765 43214', email: 'lakshmi@film.com', dailyRate: 25000, notes: 'Nationally awarded', createdAt: '2026-01-16T00:00:00Z' },
  { id: 'd6', name: 'Vasantha Kumar', role: 'Costume Designer', department: 'Costume', phone: '+91 98765 43215', email: 'vasantha@film.com', dailyRate: 35000, notes: 'Authentic Tamil costumes', createdAt: '2026-01-16T00:00:00Z' },
  { id: 'd7', name: 'Kamal Haasan', role: 'Director', department: 'Direction', phone: '+91 98765 43216', email: 'kamal@film.com', dailyRate: 150000, notes: 'Visionary director', createdAt: '2026-01-10T00:00:00Z' },
  { id: 'd8', name: 'Rajesh Kumar', role: 'Line Producer', department: 'Production', phone: '+91 98765 43217', email: 'rajesh@film.com', dailyRate: 20000, notes: 'Expert in Tamil Nadu locations', createdAt: '2026-01-17T00:00:00Z' },
  { id: 'd9', name: 'Prakash Raj', role: 'VFX Supervisor', department: 'VFX', phone: '+91 98765 43218', email: 'prakash@film.com', dailyRate: 60000, notes: 'Hollywood-level VFX expertise', createdAt: '2026-01-17T00:00:00Z' },
  { id: 'd10', name: 'Bala Chandran', role: 'Stunt Choreographer', department: 'Stunts', phone: '+91 98765 43219', email: 'bala@film.com', dailyRate: 30000, notes: 'Master of action choreography', createdAt: '2026-01-18T00:00:00Z' },
];

// Helper function to check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

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
  // Check database connection first
  const isDbConnected = await checkDbConnection();

  if (!isDbConnected) {
    // Return demo data if database is not connected
    return NextResponse.json({
      crew: DEMO_CREW,
      isDemoMode: true,
    });
  }

  try {
    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const projectId = await ensureDefaultProject();
    
    const crew = await prisma.crew.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    
    clearTimeout(timeoutId);
    
    // Return demo data if database returns empty (no crew added yet)
    if (crew.length === 0) {
      return NextResponse.json({
        crew: DEMO_CREW,
        isDemoMode: true,
        isEmptyFallback: true,
      });
    }
    
    return NextResponse.json({
      crew,
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/crew]', error);
    
    // Handle specific error types - return demo data on failure
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timed out')) {
        return NextResponse.json({
          crew: DEMO_CREW,
          isDemoMode: true,
          error: 'Request timed out, using demo data',
        });
      }
      if (error.message.includes('connection')) {
        return NextResponse.json({
          crew: DEMO_CREW,
          isDemoMode: true,
          error: 'Database connection failed, using demo data',
        });
      }
    }
    
    // Return demo data on any error
    return NextResponse.json({
      crew: DEMO_CREW,
      isDemoMode: true,
      error: 'Using demo data',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, department, phone, email, dailyRate, notes } = body;

    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (typeof role !== 'string' || !role.trim()) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Validate optional fields
    if (email !== undefined && email !== null && typeof email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string' }, { status: 400 });
    }
    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone must be a string' }, { status: 400 });
    }
    if (dailyRate !== undefined && dailyRate !== null && isNaN(Number(dailyRate))) {
      return NextResponse.json({ error: 'Daily rate must be a number' }, { status: 400 });
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
