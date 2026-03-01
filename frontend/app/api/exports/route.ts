import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo fallback data when database is unavailable
const DEMO_EXPORT_TYPES = [
  { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅' },
  { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋' },
  { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰' },
  { id: 'shot_list', name: 'Shot List', format: 'CSV', icon: '🎬' },
  { id: 'crew', name: 'Crew List', format: 'CSV', icon: '👥' },
  { id: 'equipment', name: 'Equipment', format: 'CSV', icon: '🎥' },
  { id: 'full_json', name: 'Full Project JSON', format: 'JSON', icon: '📦' },
  { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍' },
];

const DEMO_SCHEDULE = [
  { dayNumber: 1, date: '2026-03-15', location: 'Studio A', scenes: ['Scene 1', 'Scene 2', 'Scene 3'], notes: 'Hero introduction' },
  { dayNumber: 2, date: '2026-03-16', location: 'Temple Road', scenes: ['Scene 4', 'Scene 5'], notes: 'Outdoor shoot' },
  { dayNumber: 3, date: '2026-03-17', location: 'Office Building', scenes: ['Scene 6', 'Scene 7', 'Scene 8'], notes: 'Day interior' },
];

const DEMO_BUDGET = {
  items: [
    { category: 'Production', item: 'Camera Equipment', planned: 500000, actual: 480000 },
    { category: 'Production', item: 'Lighting', planned: 200000, actual: 210000 },
    { category: 'Post', item: 'Editing', planned: 300000, actual: 280000 },
    { category: 'Post', item: 'VFX', planned: 800000, actual: 750000 },
  ],
  totalPlanned: 1800000,
  totalActual: 1720000,
  variance: 80000,
};

const DEMO_CREW = [
  { name: 'John Smith', role: 'Director', department: 'Direction' },
  { name: 'Sarah Johnson', role: 'Cinematographer', department: 'Camera' },
  { name: 'Mike Davis', role: 'Gaffer', department: 'Electrical' },
];

async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
  let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } });
  if (!project) {
    project = await prisma.project.create({
      data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
    });
  }
  return project.id;
}

// GET /api/exports - List available export types and recent exports
export async function GET(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // Return demo data with isDemoMode flag
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    if (type) {
      let data: Record<string, unknown> = {};
      let filename = '';
      
      switch (type) {
        case 'schedule':
          data = { shootingDays: DEMO_SCHEDULE };
          filename = 'schedule.json';
          break;
        case 'budget':
          data = DEMO_BUDGET;
          filename = 'budget.json';
          break;
        case 'crew':
          data = { crew: DEMO_CREW };
          filename = 'crew.json';
          break;
        case 'shot_list':
          data = { shots: [], totalShots: 0, message: 'No shots in demo mode' };
          filename = 'shot_list.json';
          break;
        case 'locations':
          data = { locations: [], message: 'No locations in demo mode' };
          filename = 'locations.json';
          break;
        case 'full_json':
          data = { project: null, message: 'No project data in demo mode' };
          filename = 'full_project.json';
          break;
        default:
          data = { message: 'Demo export not available for this type' };
          filename = 'demo.json';
      }
      
      return NextResponse.json({ ...data, isDemoMode: true });
    }
    
    return NextResponse.json({ exportTypes: DEMO_EXPORT_TYPES, isDemoMode: true });
  }
  
  try {
    const projectId = await ensureDefaultProject();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Base export types
    const exportTypes = [
      { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅' },
      { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋' },
      { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰' },
      { id: 'shot_list', name: 'Shot List', format: 'CSV', icon: '🎬' },
      { id: 'crew', name: 'Crew List', format: 'CSV', icon: '👥' },
      { id: 'equipment', name: 'Equipment', format: 'CSV', icon: '🎥' },
      { id: 'full_json', name: 'Full Project JSON', format: 'JSON', icon: '📦' },
      { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍' },
    ];

    if (type) {
      // Generate specific export
      let data: Record<string, unknown> = {};
      let filename = '';
      let contentType = 'application/json';

      switch (type) {
        case 'schedule': {
          const shootingDays = await prisma.shootingDay.findMany({
            where: { projectId },
            include: {
              location: true,
              dayScenes: {
                include: { scene: { include: { sceneCharacters: { include: { character: true } } } } },
              },
            },
            orderBy: { dayNumber: 'asc' },
          });
          data = { shootingDays };
          filename = 'schedule.json';
          break;
        }
        case 'budget': {
          const items = await prisma.budgetItem.findMany({
            where: { projectId },
            orderBy: { category: 'asc' },
          });
          const totalPlanned = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
          const totalActual = items.reduce((sum, i) => sum + Number(i.actualCost || 0), 0);
          data = { items, totalPlanned, totalActual, variance: totalPlanned - totalActual };
          filename = 'budget.json';
          break;
        }
        case 'shot_list': {
          const scripts = await prisma.script.findMany({
            where: { projectId, isActive: true },
            include: {
              scenes: {
                include: {
                  shots: {
                    orderBy: { shotIndex: 'asc' },
                  },
                },
              },
            },
          });
          const allShots = scripts.flatMap(s => 
            s.scenes.flatMap(scene => 
              scene.shots.map(shot => ({
                sceneNumber: scene.sceneNumber,
                shotIndex: shot.shotIndex,
                shotText: shot.shotText,
                shotSize: shot.shotSize,
                cameraAngle: shot.cameraAngle,
                cameraMovement: shot.cameraMovement,
                characters: shot.characters,
                durationEstSec: shot.durationEstSec,
              }))
            )
          );
          data = { shots: allShots, totalShots: allShots.length };
          filename = 'shot_list.json';
          break;
        }
        case 'crew': {
          const crew = await prisma.crew.findMany({
            where: { projectId },
            orderBy: { department: 'asc' },
          });
          data = { crew };
          filename = 'crew.json';
          break;
        }
        case 'equipment': {
          // Equipment rentals
          const equipment = await prisma.equipmentRental.findMany({
            where: { projectId },
          });
          data = { equipment };
          filename = 'equipment.json';
          break;
        }
        case 'locations': {
          const locations = await prisma.location.findMany({
            where: { projectId },
          });
          // Get candidates count for each location
          const locationIntents = await prisma.locationIntent.findMany({
            where: { scene: { script: { projectId } } },
            include: { candidates: true },
          });
          const locationsWithCandidates = locations.map(loc => ({
            ...loc,
            candidateCount: locationIntents.filter(li => 
              li.candidates.some(c => Number(c.latitude) === Number(loc.latitude) && Number(c.longitude) === Number(loc.longitude))
            ).reduce((sum, li) => sum + li.candidates.length, 0)
          }));
          data = { locations: locationsWithCandidates };
          filename = 'locations.json';
          break;
        }
        case 'full_json': {
          // Full project dump
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
              scripts: { include: { scenes: { include: { shots: true } } } },
              characters: true,
              crew: true,
              locations: true,
              shootingDays: { include: { dayScenes: true } },
              budgetItems: true,
            },
          });
          data = { project };
          filename = 'full_project.json';
          break;
        }
        default:
          return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
      }

      // Return as downloadable JSON
      return NextResponse.json({ ...data, isDemoMode: false }, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': contentType,
        },
      });
    }

    // Return export types list
    return NextResponse.json({ exportTypes, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/exports]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/exports - Generate export (for batch exports)
export async function POST(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // Return demo data
    const body = await req.json().catch(() => ({}));
    const { types } = body;
    
    if (!types || !Array.isArray(types)) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 });
    }
    
    const exports: Record<string, unknown> = {};
    for (const type of types) {
      switch (type) {
        case 'schedule':
          exports.schedule = DEMO_SCHEDULE;
          break;
        case 'budget':
          exports.budget = DEMO_BUDGET;
          break;
        case 'crew':
          exports.crew = { crew: DEMO_CREW, count: DEMO_CREW.length };
          break;
        default:
          exports[type] = { message: 'Demo data not available' };
      }
    }
    
    return NextResponse.json({ exports, generatedAt: new Date().toISOString(), isDemoMode: true });
  }
  
  try {
    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { types } = body;

    if (!types || !Array.isArray(types)) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 });
    }

    // Generate multiple exports
    const exports: Record<string, unknown> = {};

    for (const type of types) {
      switch (type) {
        case 'schedule': {
          const shootingDays = await prisma.shootingDay.findMany({
            where: { projectId },
            include: { location: true, dayScenes: { include: { scene: true } } },
            orderBy: { dayNumber: 'asc' },
          });
          exports.schedule = shootingDays;
          break;
        }
        case 'budget': {
          const items = await prisma.budgetItem.findMany({ where: { projectId } });
          exports.budget = { items, count: items.length };
          break;
        }
        case 'shot_list': {
          const scripts = await prisma.script.findMany({
            where: { projectId, isActive: true },
            include: { scenes: { include: { shots: true } } },
          });
          exports.shot_list = { scripts, count: scripts.length };
          break;
        }
        case 'crew': {
          const crew = await prisma.crew.findMany({ where: { projectId } });
          exports.crew = { crew, count: crew.length };
          break;
        }
        case 'equipment': {
          exports.equipment = [];
          break;
        }
        case 'locations': {
          const locations = await prisma.location.findMany({ where: { projectId } });
          exports.locations = { locations, count: locations.length };
          break;
        }
      }
    }

    return NextResponse.json({ exports, generatedAt: new Date().toISOString(), isDemoMode: false });
  } catch (error) {
    console.error('[POST /api/exports]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
