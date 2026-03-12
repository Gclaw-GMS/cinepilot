import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not available
const DEMO_EXPORT_TYPES = [
  { id: 'schedule', name: 'Shooting Schedule', format: 'JSON', icon: '📅', description: 'Day-by-day shooting plan' },
  { id: 'callsheet', name: 'Call Sheet', format: 'JSON', icon: '📋', description: 'Daily call sheets for crew' },
  { id: 'budget', name: 'Budget Report', format: 'JSON', icon: '💰', description: 'Full budget breakdown' },
  { id: 'shot_list', name: 'Shot List', format: 'JSON', icon: '🎬', description: 'Complete shot breakdown' },
  { id: 'crew', name: 'Crew List', format: 'JSON', icon: '👥', description: 'Crew directory with contact info' },
  { id: 'equipment', name: 'Equipment', format: 'JSON', icon: '🎥', description: 'Rental inventory' },
  { id: 'full_json', name: 'Full Project JSON', format: 'JSON', icon: '📦', description: 'Complete project archive' },
  { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍', description: 'Location scout data' },
];

const DEMO_SCHEDULE = {
  shootingDays: [
    {
      id: 'demo-day-1',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 1,
      date: '2026-03-15',
      callTime: '05:30',
      wrapTime: '19:00',
      location: { id: 'loc-1', name: 'Chennai Film Studios - Stage 1', address: 'Plot 45, Film Nagar, Chennai', latitude: 13.0827, longitude: 80.2707 },
      scenes: [
        { sceneNumber: '1A', headingRaw: 'INT. COURTROOM - DAY', locationName: 'Chennai Court', pageCount: 3 },
        { sceneNumber: '1B', headingRaw: 'INT. COURTROOM - DAY', locationName: 'Chennai Court', pageCount: 2 },
      ],
      weather: 'Indoor',
      notes: 'First day - courthouse opening sequence',
      status: 'scheduled'
    },
    {
      id: 'demo-day-2',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 2,
      date: '2026-03-16',
      callTime: '06:00',
      wrapTime: '20:00',
      location: { id: 'loc-2', name: 'Marina Beach', address: 'Marina Beach, Chennai', latitude: 13.0500, longitude: 80.2824 },
      scenes: [
        { sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNSET', locationName: 'Marina Beach', pageCount: 4 },
        { sceneNumber: '6', headingRaw: 'EXT. BEACH - NIGHT', locationName: 'Marina Beach', pageCount: 3 },
      ],
      weather: 'Sunset shoot - check weather',
      notes: 'Sunset sequence - backup indoor if rain',
      status: 'scheduled'
    },
    {
      id: 'demo-day-3',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 3,
      date: '2026-03-17',
      callTime: '05:00',
      wrapTime: '21:00',
      location: { id: 'loc-3', name: 'Meenakshi Temple', address: 'Meenakshi Temple, Madurai', latitude: 9.9195, longitude: 78.1193 },
      scenes: [
        { sceneNumber: '12', headingRaw: 'EXT. TEMPLE - DAY', locationName: 'Meenakshi Temple', pageCount: 5 },
        { sceneNumber: '13', headingRaw: 'INT. TEMPLE - DAY', locationName: 'Meenakshi Temple', pageCount: 4 },
      ],
      weather: 'Outdoor - early morning',
      notes: 'Temple song sequence - permits confirmed',
      status: 'scheduled'
    },
    {
      id: 'demo-day-4',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 4,
      date: '2026-03-18',
      callTime: '06:30',
      wrapTime: '18:00',
      location: { id: 'loc-4', name: 'Ooty Tea Gardens', address: 'Ooty, Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
      scenes: [
        { sceneNumber: '20', headingRaw: 'EXT. TEA GARDEN - DAY', locationName: 'Ooty', pageCount: 6 },
        { sceneNumber: '21', headingRaw: 'EXT. HILL TOP - DAY', locationName: 'Ooty', pageCount: 4 },
      ],
      weather: 'Cold - morning mist',
      notes: 'Song sequence - pack warm',
      status: 'scheduled'
    },
    {
      id: 'demo-day-5',
      projectId: DEFAULT_PROJECT_ID,
      dayNumber: 5,
      date: '2026-03-19',
      callTime: '07:00',
      wrapTime: '17:00',
      location: { id: 'loc-5', name: 'EVP Studios', address: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      scenes: [
        { sceneNumber: '25', headingRaw: 'INT. OFFICE - DAY', locationName: 'EVP Studios', pageCount: 5 },
        { sceneNumber: '26', headingRaw: 'INT. APARTMENT - DAY', locationName: 'EVP Studios', pageCount: 3 },
      ],
      weather: 'Indoor',
      notes: 'Office drama sequences',
      status: 'scheduled'
    }
  ],
  totalDays: 5,
  scheduledDays: 5,
  completedDays: 0
};

const DEMO_BUDGET = {
  items: [
    { id: 'b1', category: 'Pre-Production', item: 'Script Writing', planned: 500000, actual: 450000, notes: 'Completed under budget' },
    { id: 'b2', category: 'Pre-Production', item: 'Casting', planned: 2000000, actual: 1800000, notes: 'Lead actors confirmed' },
    { id: 'b3', category: 'Pre-Production', item: 'Location Scout', planned: 500000, actual: 550000, notes: 'Extra locations added' },
    { id: 'b4', category: 'Production', item: 'Camera Equipment', planned: 3000000, actual: 2800000, notes: 'Package deal saved cost' },
    { id: 'b5', category: 'Production', item: 'Lighting Equipment', planned: 1500000, actual: 1400000, notes: '' },
    { id: 'b6', category: 'Production', item: 'Sound Equipment', planned: 800000, actual: 750000, notes: '' },
    { id: 'b7', category: 'Production', item: 'Set Construction', planned: 2500000, actual: 2700000, notes: 'Additional sets required' },
    { id: 'b8', category: 'Production', item: 'Location Fees', planned: 2000000, actual: 1800000, notes: 'Permit discounts applied' },
    { id: 'b9', category: 'Production', item: 'Catering', planned: 1500000, actual: 1400000, notes: '' },
    { id: 'b10', category: 'Production', item: 'Transportation', planned: 1000000, actual: 950000, notes: '' },
    { id: 'b11', category: 'Post-Production', item: 'Editing', planned: 2000000, actual: 0, notes: 'To be done' },
    { id: 'b12', category: 'Post-Production', item: 'VFX', planned: 5000000, actual: 0, notes: 'Pending' },
    { id: 'b13', category: 'Post-Production', item: 'Dubbing', planned: 1500000, actual: 0, notes: '5 languages planned' },
    { id: 'b14', category: 'Post-Production', item: 'Music', planned: 3000000, actual: 1000000, notes: 'Background score started' },
    { id: 'b15', category: 'Marketing', item: 'Promotions', planned: 5000000, actual: 500000, notes: 'Teaser released' },
  ],
  totalPlanned: 32800000,
  totalActual: 18450000,
  variance: 14350000,
  percentSpent: 56.3,
  summary: {
    preProduction: { planned: 3000000, actual: 2800000 },
    production: { planned: 12300000, actual: 11800000 },
    postProduction: { planned: 12500000, actual: 1000000 },
    marketing: { planned: 5000000, actual: 500000 }
  }
};

const DEMO_SHOTS = {
  shots: [
    { sceneNumber: '1A', shotIndex: 1, shotText: 'Wide shot of courtroom', shotSize: 'Wide', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: ['Judge', 'Advocate'], durationEstSec: 15 },
    { sceneNumber: '1A', shotIndex: 2, shotText: 'Close-up of defendant', shotSize: 'Close Up', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: ['Arjun'], durationEstSec: 8 },
    { sceneNumber: '1A', shotIndex: 3, shotText: 'Over shoulder of advocate', shotSize: 'Medium', cameraAngle: 'Over Shoulder', cameraMovement: 'Pan', characters: ['Advocate', 'Judge'], durationEstSec: 12 },
    { sceneNumber: '1B', shotIndex: 1, shotText: 'Reaction shot - surprise', shotSize: 'Medium Close Up', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: ['Arjun'], durationEstSec: 6 },
    { sceneNumber: '5', shotIndex: 1, shotText: 'Wide establishing - beach sunset', shotSize: 'Extreme Wide', cameraAngle: 'Low Angle', cameraMovement: 'Dolly', characters: [], durationEstSec: 20 },
    { sceneNumber: '5', shotIndex: 2, shotText: 'Couple walking - silhouette', shotSize: 'Wide', cameraAngle: 'Eye Level', cameraMovement: 'Tracking', characters: ['Arjun', 'Priya'], durationEstSec: 18 },
    { sceneNumber: '5', shotIndex: 3, shotText: 'Close-up - hands holding', shotSize: 'Close Up', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: ['Arjun', 'Priya'], durationEstSec: 10 },
    { sceneNumber: '6', shotIndex: 1, shotText: 'Moonlit beach - romantic', shotSize: 'Wide', cameraAngle: 'High Angle', cameraMovement: 'Drone', characters: ['Arjun', 'Priya'], durationEstSec: 25 },
    { sceneNumber: '12', shotIndex: 1, shotText: 'Temple exterior - wide', shotSize: 'Extreme Wide', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: [], durationEstSec: 15 },
    { sceneNumber: '12', shotIndex: 2, shotText: 'Procession - dynamic', shotSize: 'Wide', cameraAngle: 'Low Angle', cameraMovement: 'Steadicam', characters: ['Arjun', 'Extras'], durationEstSec: 30 },
    { sceneNumber: '20', shotIndex: 1, shotText: 'Tea garden - aerial', shotSize: 'Extreme Wide', cameraAngle: 'High Angle', cameraMovement: 'Drone', characters: [], durationEstSec: 20 },
    { sceneNumber: '20', shotIndex: 2, shotText: 'Song intro - lead entry', shotSize: 'Wide', cameraAngle: 'Eye Level', cameraMovement: 'Tracking', characters: ['Priya'], durationEstSec: 15 },
    { sceneNumber: '25', shotIndex: 1, shotText: 'Office interior - wide', shotSize: 'Wide', cameraAngle: 'Eye Level', cameraMovement: 'Static', characters: ['Arjun', 'Colleague'], durationEstSec: 12 },
    { sceneNumber: '25', shotIndex: 2, shotText: 'Argument scene - intense', shotSize: 'Medium', cameraAngle: 'Two Shot', cameraMovement: 'Push In', characters: ['Arjun', 'Mahendra'], durationEstSec: 45 },
  ],
  totalShots: 14,
  summary: {
    bySize: { 'Wide': 5, 'Medium': 3, 'Close Up': 2, 'Medium Close Up': 1, 'Extreme Wide': 3 },
    byMovement: { 'Static': 5, 'Tracking': 3, 'Pan': 1, 'Dolly': 1, 'Steadicam': 1, 'Drone': 2, 'Push In': 1 },
    avgDuration: 17.3
  }
};

const DEMO_CREW = {
  crew: [
    { id: 'c1', name: 'Raj Kapoor', role: 'Director', department: 'Direction', email: 'raj@film.com', phone: '+91 98765 43210', dailyRate: 100000, status: 'confirmed' },
    { id: 'c2', name: 'Vikram Sarathy', role: 'Director of Photography', department: 'Camera', email: 'vikram@cinema.in', phone: '+91 98765 43211', dailyRate: 75000, status: 'confirmed' },
    { id: 'c3', name: 'Anand Christ', role: 'Cameraman', department: 'Camera', email: 'anand@camera.co', phone: '+91 98765 43212', dailyRate: 5000, status: 'confirmed' },
    { id: 'c4', name: 'Kumar R', role: 'Focus Puller', department: 'Camera', email: 'kumar@focus.in', phone: '+91 98765 43213', dailyRate: 3500, status: 'confirmed' },
    { id: 'c5', name: 'Ravi Shankar', role: 'Gaffer', department: 'Lighting', email: 'ravi@lights.co', phone: '+91 98765 43214', dailyRate: 8000, status: 'confirmed' },
    { id: 'c6', name: 'Bala Subramanian', role: 'Light Assistant', department: 'Lighting', email: 'bala@light.in', phone: '+91 98765 43215', dailyRate: 1500, status: 'confirmed' },
    { id: 'c7', name: 'Prakash Raj', role: 'Sound Engineer', department: 'Sound', email: 'prakash@sound.co', phone: '+91 98765 43216', dailyRate: 6000, status: 'confirmed' },
    { id: 'c8', name: 'Arjun Production', role: 'Production Head', department: 'Production', email: 'arjun@prod.in', phone: '+91 98765 43217', dailyRate: 25000, status: 'confirmed' },
    { id: 'c9', name: 'Meena Styles', role: 'Makeup Artist', department: 'Makeup', email: 'meena@makeup.in', phone: '+91 98765 43218', dailyRate: 5000, status: 'confirmed' },
    { id: 'c10', name: 'Lakshmi Designs', role: 'Costume Designer', department: 'Costume', email: 'lakshmi@costume.in', phone: '+91 98765 43219', dailyRate: 8000, status: 'confirmed' },
    { id: 'c11', name: 'Suresh Art', role: 'Art Director', department: 'Art', email: 'suresh@art.in', phone: '+91 98765 43220', dailyRate: 15000, status: 'confirmed' },
    { id: 'c12', name: 'Karthik Set', role: 'Set Assistant', department: 'Art', email: 'karthik@set.co', phone: '+91 98765 43221', dailyRate: 2000, status: 'confirmed' },
  ],
  totalCrew: 12,
  departments: ['Direction', 'Camera', 'Lighting', 'Sound', 'Production', 'Makeup', 'Costume', 'Art'],
  totalDailyRate: 273500
};

const DEMO_EQUIPMENT = {
  equipment: [
    { id: 'e1', name: 'RED Komodo', category: 'Camera', dailyRate: 15000, vendor: 'Film Gear Chennai', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-20' },
    { id: 'e2', name: 'Arri Alexa Mini LF', category: 'Camera', dailyRate: 35000, vendor: 'Film City Rentals', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-25' },
    { id: 'e3', name: 'Canon CN-E 50mm T1.3', category: 'Lens', dailyRate: 2500, vendor: 'Lens Hub', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-25' },
    { id: 'e4', name: 'Arri SkyPanel S60-C', category: 'Lighting', dailyRate: 8000, vendor: 'Light House Studios', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-20' },
    { id: 'e5', name: 'Aputure 1200d Pro', category: 'Lighting', dailyRate: 3500, vendor: 'Film Gear Chennai', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-25' },
    { id: 'e6', name: 'Sennheiser MKH 416', category: 'Sound', dailyRate: 2500, vendor: 'Audio Pro Studios', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-25' },
    { id: 'e7', name: 'DJI Ronin RS3 Pro', category: 'Grip', dailyRate: 5000, vendor: 'Stabilizer Co', status: 'confirmed', dateStart: '2026-03-15', dateEnd: '2026-03-20' },
    { id: 'e8', name: 'Kessler Shuttle Pod', category: 'Grip', dailyRate: 3000, vendor: 'Film Gear Chennai', status: 'pending', dateStart: '2026-03-18', dateEnd: '2026-03-22' },
  ],
  totalItems: 8,
  totalValue: 74100,
  categories: ['Camera', 'Lens', 'Lighting', 'Sound', 'Grip']
};

const DEMO_LOCATIONS = {
  locations: [
    { 
      id: 'loc-1', 
      name: 'Chennai Film Studios - Stage 1', 
      type: 'studio',
      address: 'Plot 45, Film Nagar, Chennai - 600033',
      latitude: 13.0827, 
      longitude: 80.2707,
      status: 'confirmed',
      estimatedCost: 500000,
      notes: 'Primary shooting location',
      amenities: ['Power backup', 'Green room', 'Parking'],
      contactName: 'Ramesh',
      contactPhone: '+91 98765 43001'
    },
    { 
      id: 'loc-2', 
      name: 'Marina Beach', 
      type: 'location',
      address: 'Marina Beach, Chennai',
      latitude: 13.0500, 
      longitude: 80.2824,
      status: 'confirmed',
      estimatedCost: 150000,
      notes: 'Sunset sequences - permit required',
      amenities: [],
      contactName: 'Beach Office',
      contactPhone: '+91 44 2345 6789'
    },
    { 
      id: 'loc-3', 
      name: 'Meenakshi Temple', 
      type: 'location',
      address: 'Meenakshi Temple, Madurai',
      latitude: 9.9195, 
      longitude: 78.1193,
      status: 'confirmed',
      estimatedCost: 300000,
      notes: 'Song sequence - early morning slot confirmed',
      amenities: ['Permit secured'],
      contactName: 'Temple Authority',
      contactPhone: '+91 452 234 5678'
    },
    { 
      id: 'loc-4', 
      name: 'Ooty Tea Gardens', 
      type: 'location',
      address: 'Ooty, Tamil Nadu',
      latitude: 11.4102, 
      longitude: 76.6950,
      status: 'confirmed',
      estimatedCost: 200000,
      notes: 'Song sequence - winter season',
      amenities: [' Accommodation nearby'],
      contactName: 'Estate Manager',
      contactPhone: '+91 423 234 5678'
    },
    { 
      id: 'loc-5', 
      name: 'EVP Studios', 
      type: 'studio',
      address: 'Chennai',
      latitude: 13.0827, 
      longitude: 80.2707,
      status: 'backup',
      estimatedCost: 350000,
      notes: 'Backup for rain days',
      amenities: ['Indoor', 'All facilities'],
      contactName: 'EVP Office',
      contactPhone: '+91 44 2345 0000'
    },
  ],
  totalLocations: 5,
  confirmed: 4,
  backup: 1,
  totalEstimatedCost: 1500000
};

const DEMO_FULL_PROJECT = {
  project: {
    id: DEFAULT_PROJECT_ID,
    name: 'Kaadhal Enbadhu (Demo Project)',
    description: 'Romantic Drama - Tamil Film',
    status: 'pre-production',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    budget: 35000000,
    createdAt: '2026-01-10T00:00:00Z',
    scripts: [
      {
        id: 'script-1',
        title: 'Kaadhal Enbadhu',
        language: 'tamil',
        totalScenes: 30,
        totalPages: 180,
        isActive: true,
        scenes: [
          { id: 's-1', sceneNumber: '1A', headingRaw: 'INT. COURTROOM - DAY', pageCount: 3, summary: 'Opening courtroom sequence' },
          { id: 's-2', sceneNumber: '1B', headingRaw: 'INT. COURTROOM - DAY', pageCount: 2, summary: 'Testimony begins' },
        ]
      }
    ],
    characters: [
      { id: 'char-1', name: 'Arjun', actorName: 'Ajith Kumar', type: 'lead', description: 'Protagonist - lawyer' },
      { id: 'char-2', name: 'Priya', actorName: 'Sai Pallavi', type: 'lead', description: 'Lead actress' },
      { id: 'char-3', name: 'Mahendra', actorName: 'Vijay Sethupathi', type: 'supporting', description: 'Antagonist' },
    ],
    crew: DEMO_CREW.crew,
    locations: DEMO_LOCATIONS.locations,
    shootingDays: DEMO_SCHEDULE.shootingDays,
    budgetItems: DEMO_BUDGET.items,
  },
  metadata: {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    projectType: 'demo'
  }
};

// Helper to check if database is available
async function isDbAvailable(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

// GET handler with demo fallback
export async function GET(req: NextRequest) {
  const dbAvailable = await isDbAvailable();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // If database not available, use demo data
  if (!dbAvailable) {
    return handleDemoExport(type);
  }

  try {
    const projectId = await ensureDefaultProject();

    // Base export types
    const exportTypes = DEMO_EXPORT_TYPES;

    if (type) {
      return handleDbExport(req, projectId, type);
    }

    return NextResponse.json({ exportTypes, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/exports] Database error, falling back to demo:', error);
    return handleDemoExport(type);
  }
}

function handleDemoExport(type: string | null) {
  if (!type) {
    return NextResponse.json({ exportTypes: DEMO_EXPORT_TYPES, isDemoMode: true });
  }

  let data: Record<string, unknown> = {};
  let filename = '';

  switch (type) {
    case 'schedule':
      data = DEMO_SCHEDULE;
      filename = 'schedule_demo.json';
      break;
    case 'budget':
    case 'callsheet':
      data = DEMO_BUDGET;
      filename = 'budget_demo.json';
      break;
    case 'shot_list':
      data = DEMO_SHOTS;
      filename = 'shot_list_demo.json';
      break;
    case 'crew':
      data = DEMO_CREW;
      filename = 'crew_demo.json';
      break;
    case 'equipment':
      data = DEMO_EQUIPMENT;
      filename = 'equipment_demo.json';
      break;
    case 'locations':
      data = DEMO_LOCATIONS;
      filename = 'locations_demo.json';
      break;
    case 'full_json':
      data = DEMO_FULL_PROJECT;
      filename = 'full_project_demo.json';
      break;
    default:
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
  }

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/json',
      'X-Demo-Mode': 'true'
    },
  });
}

async function handleDbExport(req: NextRequest, projectId: string, type: string) {
  let data: Record<string, unknown> = {};
  let filename = '';

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
      // Fall back to demo data if no shooting days in DB
      if (shootingDays.length === 0) {
        data = DEMO_SCHEDULE;
      } else {
        const scheduledDays = shootingDays.filter(d => d.status === 'scheduled' || d.status === 'in_progress').length;
        const completedDays = shootingDays.filter(d => d.status === 'completed').length;
        data = { shootingDays, totalDays: shootingDays.length, scheduledDays, completedDays };
      }
      filename = 'schedule.json';
      break;
    }
    case 'budget': {
      const items = await prisma.budgetItem.findMany({
        where: { projectId },
        orderBy: { category: 'asc' },
      });
      // Fall back to demo data if no budget items in DB
      if (items.length === 0) {
        data = DEMO_BUDGET;
      } else {
        const totalPlanned = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
        const totalActual = items.reduce((sum, i) => sum + Number(i.actualCost || 0), 0);
        const variance = totalPlanned - totalActual;
        const percentSpent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
        data = { items, totalPlanned, totalActual, variance, percentSpent };
      }
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
      // Fall back to demo data if no scripts/shots in DB
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
      if (allShots.length === 0) {
        data = DEMO_SHOTS;
      } else {
        // Calculate summary statistics
        const bySize: Record<string, number> = {};
        const byMovement: Record<string, number> = {};
        let totalDuration = 0;
        allShots.forEach(shot => {
          const size = shot.shotSize || 'Unknown';
          const movement = shot.cameraMovement || 'Unknown';
          bySize[size] = (bySize[size] || 0) + 1;
          byMovement[movement] = (byMovement[movement] || 0) + 1;
          totalDuration += shot.durationEstSec || 0;
        });
        const summary = {
          bySize,
          byMovement,
          avgDuration: allShots.length > 0 ? totalDuration / allShots.length : 0
        };
        data = { shots: allShots, totalShots: allShots.length, summary };
      }
      filename = 'shot_list.json';
      break;
    }
    case 'crew': {
      const crew = await prisma.crew.findMany({
        where: { projectId },
        orderBy: { department: 'asc' },
      });
      // Fall back to demo data if no crew in DB
      if (crew.length === 0) {
        data = DEMO_CREW;
      } else {
        const departments = [...new Set(crew.map(c => c.department))];
        const totalDailyRate = crew.reduce((sum, c) => sum + Number(c.dailyRate || 0), 0);
        data = { crew, totalCrew: crew.length, departments, totalDailyRate };
      }
      filename = 'crew.json';
      break;
    }
    case 'equipment': {
      const equipment = await prisma.equipmentRental.findMany({
        where: { projectId },
      });
      // Fall back to demo data if no equipment in DB
      if (equipment.length === 0) {
        data = DEMO_EQUIPMENT;
      } else {
        const categories = [...new Set(equipment.map(e => e.category))];
        const totalValue = equipment.reduce((sum, e) => sum + Number(e.dailyRate || 0), 0);
        data = { equipment, totalItems: equipment.length, totalValue, categories };
      }
      filename = 'equipment.json';
      break;
    }
    case 'locations': {
      const locations = await prisma.location.findMany({
        where: { projectId },
      });
      // Fall back to demo data if no locations in DB
      if (locations.length === 0) {
        data = DEMO_LOCATIONS;
      } else {
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
        data = { locations: locationsWithCandidates, totalLocations: locations.length };
      }
      filename = 'locations.json';
      break;
    }
    case 'full_json': {
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
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        projectType: 'database'
      };
      data = { project, metadata };
      filename = 'full_project.json';
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
  }

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/json',
      'X-Demo-Mode': 'false'
    },
  });
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

// POST handler for batch exports
export async function POST(req: NextRequest) {
  const dbAvailable = await isDbAvailable();

  if (!dbAvailable) {
    // Demo mode batch export
    return handleDemoBatchExport(req);
  }

  try {
    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { types } = body;

    if (!types || !Array.isArray(types)) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 });
    }

    const exports: Record<string, unknown> = {};

    for (const type of types) {
      await handleDbExportSingle(projectId, type, exports);
    }

    return NextResponse.json({ exports, generatedAt: new Date().toISOString(), isDemoMode: false });
  } catch (error) {
    console.error('[POST /api/exports] Database error, falling back to demo:', error);
    return handleDemoBatchExport(req);
  }
}

async function handleDemoBatchExport(req: NextRequest) {
  // Parse body for types - async approach
  let body: { types?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  const { types } = body || {};
  
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
      case 'callsheet':
        exports.budget = DEMO_BUDGET;
        break;
      case 'shot_list':
        exports.shot_list = DEMO_SHOTS;
        break;
      case 'crew':
        exports.crew = DEMO_CREW;
        break;
      case 'equipment':
        exports.equipment = DEMO_EQUIPMENT;
        break;
      case 'locations':
        exports.locations = DEMO_LOCATIONS;
        break;
      case 'full_json':
        exports.full_project = DEMO_FULL_PROJECT;
        break;
    }
  }

  return NextResponse.json({ 
    exports, 
    generatedAt: new Date().toISOString(),
    isDemoMode: true 
  });
}

async function handleDbExportSingle(projectId: string, type: string, exports: Record<string, unknown>) {
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
    case 'budget':
    case 'callsheet': {
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
    case 'full_json': {
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
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        projectType: 'database'
      };
      exports.full_project = { project, metadata };
      break;
    }
  }
}
