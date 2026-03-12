import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not available
const DEMO_CREW = [
  { id: 'crew-1', name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@cinepilot.ai', dailyRate: 25000, notes: 'Award-winning cinematographer with 15+ years experience' },
  { id: 'crew-2', name: 'Priya Venkatesh', role: 'Director', department: 'Direction', phone: '+91 98765 43211', email: 'priya@cinepilot.ai', dailyRate: 50000, notes: 'National Award winning director' },
  { id: 'crew-3', name: 'Arun Raj', role: 'Sound Engineer', department: 'Sound', phone: '+91 98765 43212', email: 'arun@cinepilot.ai', dailyRate: 15000, notes: 'Specialist in outdoor location sound' },
  { id: 'crew-4', name: 'Madhavan S', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43213', email: 'madhavan@cinepilot.ai', dailyRate: 12000, notes: 'Expert in LED and traditional lighting setups' },
  { id: 'crew-5', name: 'Lakshmi Narayanan', role: 'Production Designer', department: 'Art', phone: '+91 98765 43214', email: 'lakshmi@cinepilot.ai', dailyRate: 20000, notes: 'Specializes in period dramas' },
  { id: 'crew-6', name: 'Karthik R', role: 'Makeup Artist', department: 'Makeup', phone: '+91 98765 43215', email: 'karthik@cinepilot.ai', dailyRate: 10000, notes: 'Prosthetics and special effects makeup expert' },
  { id: 'crew-7', name: 'Samantha R', role: 'Costume Designer', department: 'Costume', phone: '+91 98765 43216', email: 'samantha@cinepilot.ai', dailyRate: 18000, notes: 'Contemporary and traditional South Indian costumes' },
  { id: 'crew-8', name: 'Vijay B', role: 'Editor', department: 'Production', phone: '+91 98765 43217', email: 'vijay@cinepilot.ai', dailyRate: 22000, notes: 'Known for fast-paced action sequences' },
  { id: 'crew-9', name: 'Anand Prakash', role: 'VFX Supervisor', department: 'VFX', phone: '+91 98765 43218', email: 'anand@cinepilot.ai', dailyRate: 35000, notes: 'Specialist in CGI and compositing' },
  { id: 'crew-10', name: 'Bala Subramani', role: 'Stunt Choreographer', department: 'Stunts', phone: '+91 98765 43219', email: 'bala@cinepilot.ai', dailyRate: 28000, notes: 'International stunt coordination experience' },
  { id: 'crew-11', name: 'Divya K', role: 'Assistant Director', department: 'Direction', phone: '+91 98765 43220', email: 'divya@cinepilot.ai', dailyRate: 8000, notes: 'Assisted on 10+ major Tamil films' },
  { id: 'crew-12', name: 'Ramesh T', role: 'Camera Operator', department: 'Camera', phone: '+91 98765 43221', email: 'ramesh@cinepilot.ai', dailyRate: 9000, notes: 'Steadicam and gimbal specialist' },
]

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
    // Use fixed project ID to match seed data
    let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } });
    if (!project) {
      project = await prisma.project.create({
        data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
      });
    }
    return project.id;
  } catch (error) {
    console.log('[ensureDefaultProject] Database not available');
    return DEFAULT_PROJECT_ID;
  }
}

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const crew = await prisma.crew.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Return demo data if no crew members exist in database
    if (!crew || crew.length === 0) {
      console.log('[GET /api/crew] No crew found in DB, returning demo data');
      return NextResponse.json(DEMO_CREW);
    }
    
    return NextResponse.json(crew);
  } catch (error) {
    console.error('[GET /api/crew] Database not available, using demo data');
    // Use demo data when database is not available
    return NextResponse.json(DEMO_CREW);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const name = body.name as string | undefined;
  const role = body.role as string | undefined;
  const department = body.department as string | undefined;
  const phone = body.phone as string | undefined;
  const email = body.email as string | undefined;
  const dailyRate = body.dailyRate;
  const notes = body.notes as string | undefined;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (typeof role !== 'string' || !role.trim()) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 });
  }

  try {
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
  } catch (error: unknown) {
    // Check if it's a database unavailable error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('PrismaClientInitialization') || errorMessage.includes('database')) {
      console.log('[POST /api/crew] Database not available, running in demo mode');
      // Return demo mode success response
      return NextResponse.json({ 
        id: `demo-crew-${Date.now()}`,
        name: name.trim(),
        role: role.trim(),
        department: department?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        dailyRate: dailyRate != null ? Number(dailyRate) : null,
        notes: notes?.trim() || null,
        isDemoMode: true,
        message: 'Created in demo mode - database not available'
      }, { status: 200 });
    }
    console.error('[POST /api/crew]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
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

  try {
    const crew = await prisma.crew.update({
      where: { id: id.trim() },
      data,
    });

    return NextResponse.json(crew);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('PrismaClientInitialization') || errorMessage.includes('database')) {
      console.log('[PATCH /api/crew] Database not available, running in demo mode');
      return NextResponse.json({ 
        id: id.trim(),
        ...fields,
        isDemoMode: true,
        message: 'Updated in demo mode - database not available'
      }, { status: 200 });
    }
    console.error('[PATCH /api/crew]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { id } = body;

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await prisma.crew.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('PrismaClientInitialization') || errorMessage.includes('database')) {
      console.log('[DELETE /api/crew] Database not available, running in demo mode');
      return NextResponse.json({ 
        success: true,
        isDemoMode: true,
        message: 'Deleted in demo mode - database not available'
      }, { status: 200 });
    }
    console.error('[DELETE /api/crew]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
