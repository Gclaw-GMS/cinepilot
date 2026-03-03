import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// Demo projects for when database is unavailable
const DEMO_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Kaadhal Vartham',
    title: 'Kaadhal Vartham',
    description: 'A romantic drama set in Chennai exploring love and relationships',
    language: 'tamil',
    genre: 'Romance',
    budget: 15000000,
    status: 'pre_production',
    createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-01T14:30:00Z').toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Vikram Vedha 2',
    title: 'Vikram Vedha 2',
    description: 'Action thriller sequel with high-octane sequences',
    language: 'tamil',
    genre: 'Action Thriller',
    budget: 45000000,
    status: 'production',
    createdAt: new Date('2026-02-01T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-02T16:45:00Z').toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Thirudan Police',
    title: 'Thirudan Police',
    description: 'Comedy drama with a unique twist',
    language: 'tamil',
    genre: 'Comedy',
    budget: 8000000,
    status: 'planning',
    createdAt: new Date('2026-02-20T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-02-28T10:00:00Z').toISOString(),
  },
];

// Helper to check if database is connected
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// GET /api/projects — list all projects
export async function GET(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    return NextResponse.json(DEMO_PROJECTS, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
  
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[GET /api/projects]', error);
    // Fallback to demo data on error
    return NextResponse.json(DEMO_PROJECTS);
  }
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    const body = await req.json();
    return NextResponse.json({
      id: `proj-${Date.now()}`,
      name: body.name || body.title,
      description: body.description,
      language: body.language || 'tamil',
      genre: body.genre,
      budget: body.budget,
      status: body.status || 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  }
  
  try {
    const body = await req.json();
    
    const project = await prisma.project.create({
      data: {
        id: `proj-${Date.now()}`,
        name: body.name || body.title,
        description: body.description,
        language: body.language || 'tamil',
        genre: body.genre,
        budget: body.budget,
        status: body.status || 'planning',
        userId: DEFAULT_USER_ID,
      },
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects]', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
