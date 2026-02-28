import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// Demo data for when database is not connected
const DEMO_PROJECTS = [
  {
    id: 'demo-project-1',
    name: 'Kaathal - The Core',
    description: 'A gripping political drama set in Tamil Nadu',
    status: 'shooting',
    language: 'tamil',
    genre: 'Drama/Political',
    budget: '85000000',
    startDate: '2026-01-15',
    endDate: '2026-03-15',
    createdAt: '2025-12-01',
    scriptCount: 2,
    crewCount: 45,
    isDemo: true,
  },
  {
    id: 'demo-project-2',
    name: 'Vettaiyaadu',
    description: 'An investigative thriller in the hills of Ooty',
    status: 'pre-production',
    language: 'tamil',
    genre: 'Thriller/Mystery',
    budget: '42000000',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    createdAt: '2025-11-15',
    scriptCount: 1,
    crewCount: 28,
    isDemo: true,
  },
  {
    id: 'demo-project-3',
    name: 'Madras Talkies',
    description: 'A coming-of-age story about film students',
    status: 'planning',
    language: 'tamil',
    genre: 'Comedy/Drama',
    budget: '25000000',
    startDate: '2026-07-01',
    endDate: '2026-09-15',
    createdAt: '2026-01-10',
    scriptCount: 1,
    crewCount: 12,
    isDemo: true,
  },
];

async function ensureDefaultUser(): Promise<string> {
  try {
    let user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'dev@cinepilot.ai',
          passwordHash: 'none',
          name: 'Dev User',
        },
      });
    }
    return user.id;
  } catch {
    return DEFAULT_USER_ID;
  }
}

// GET /api/projects - List all projects
export async function GET(req: NextRequest) {
  // Check for demo mode flag
  const isDemoMode = req.nextUrl.searchParams.get('demo') === 'true';
  
  try {
    const userId = await ensureDefaultUser();
    
    // Get all projects for this user
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            scripts: true,
            crew: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend interface
    const transformed = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      language: p.language,
      genre: p.genre,
      budget: p.budget?.toString() || null,
      startDate: p.startDate?.toISOString().split('T')[0] || null,
      endDate: p.endDate?.toISOString().split('T')[0] || null,
      createdAt: p.createdAt.toISOString().split('T')[0],
      scriptCount: p._count.scripts,
      crewCount: p._count.crew,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    // If database is not connected, return demo data
    console.log('[GET /api/projects] Database not connected, using demo data');
    if (isDemoMode || process.env.NODE_ENV !== 'production') {
      return NextResponse.json(DEMO_PROJECTS);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, demoData: DEMO_PROJECTS }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, language, genre, budget, startDate, endDate } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const userId = await ensureDefaultUser();

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        language: language || 'tamil',
        genre: genre?.trim() || null,
        budget: budget != null ? budget : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId,
      },
      include: {
        _count: {
          select: {
            scripts: true,
            crew: true,
          },
        },
      },
    });

    const transformed = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      language: project.language,
      genre: project.genre,
      budget: project.budget?.toString() || null,
      startDate: project.startDate?.toISOString().split('T')[0] || null,
      endDate: project.endDate?.toISOString().split('T')[0] || null,
      createdAt: project.createdAt.toISOString().split('T')[0],
      scriptCount: project._count.scripts,
      crewCount: project._count.crew,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('[POST /api/projects]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/projects - Update a project
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, language, genre, budget, startDate, endDate, status } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowedFields = ['name', 'description', 'language', 'genre', 'budget', 'startDate', 'endDate', 'status'];
    const data: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'budget' && body[key] != null) {
          data[key] = Number(body[key]);
        } else if (key === 'startDate' || key === 'endDate') {
          data[key] = body[key] ? new Date(body[key]) : null;
        } else if (typeof body[key] === 'string') {
          data[key] = body[key].trim() || null;
        } else {
          data[key] = body[key];
        }
      }
    }

    const project = await prisma.project.update({
      where: { id: id.trim() },
      data,
      include: {
        _count: {
          select: {
            scripts: true,
            crew: true,
          },
        },
      },
    });

    const transformed = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      language: project.language,
      genre: project.genre,
      budget: project.budget?.toString() || null,
      startDate: project.startDate?.toISOString().split('T')[0] || null,
      endDate: project.endDate?.toISOString().split('T')[0] || null,
      createdAt: project.createdAt.toISOString().split('T')[0],
      scriptCount: project._count.scripts,
      crewCount: project._count.crew,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('[PATCH /api/projects]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/projects - Delete a project
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
