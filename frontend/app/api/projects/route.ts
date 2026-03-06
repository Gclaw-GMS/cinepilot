import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read projects from file
function readProjects(): any[] {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading projects:', error);
  }
  return [];
}

// Write projects to file
function writeProjects(projects: any[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error writing projects:', error);
  }
}

// Demo projects for initial data
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

// GET /api/projects — list all projects
export async function GET(req: NextRequest) {
  const projects = readProjects();
  
  // If no projects exist, initialize with demo data
  if (projects.length === 0) {
    writeProjects(DEMO_PROJECTS);
    return NextResponse.json(DEMO_PROJECTS, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
  
  return NextResponse.json(projects, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projects = readProjects();
    
    const newProject = {
      id: `proj-${Date.now()}`,
      name: body.name || body.title || 'Untitled Project',
      title: body.title || body.name || 'Untitled Project',
      description: body.description || null,
      language: body.language || 'tamil',
      genre: body.genre || null,
      budget: body.budget || null,
      status: body.status || 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    projects.push(newProject);
    writeProjects(projects);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects]', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects — update a project
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const projects = readProjects();
    
    const index = projects.findIndex((p: any) => p.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    projects[index] = {
      ...projects[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    writeProjects(projects);
    
    return NextResponse.json(projects[index]);
  } catch (error) {
    console.error('[PUT /api/projects]', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects — delete a project
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }
    
    let projects = readProjects();
    const index = projects.findIndex((p: any) => p.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    projects = projects.filter((p: any) => p.id !== id);
    writeProjects(projects);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects]', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
