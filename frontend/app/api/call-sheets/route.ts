import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
  let project = await prisma.project.findFirst({ where: { userId: user.id } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: 'Default Project', userId: user.id },
    });
  }
  return project.id;
}

export type CallSheetContent = {
  callTime?: string;
  wrapTime?: string;
  location?: string;
  locationAddress?: string;
  scenes?: string[];
  crewCalls?: Array<{ name: string; role: string; department?: string; callTime?: string }>;
  weather?: string;
};

// Demo data for when database is not connected
const DEMO_CALL_SHEETS = [
  {
    id: 'demo-1',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 1 - Courtroom Opening',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'First day of principal photography. Important scenes.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '05:30',
      wrapTime: '19:00',
      location: 'Chennai Film Studios - Stage 1',
      locationAddress: 'Plot 45, Film Nagar, Chennai - 600033',
      scenes: ['1A', '1B', '2', '3', '4'],
      weather: 'Indoor - A/C',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '05:30' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '05:30' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '06:00' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '06:00' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '05:30' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '06:00' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '06:00' },
        { name: 'Arjun', role: 'Production Head', department: 'Production', callTime: '05:00' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '06:00' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '06:30' },
        { name: 'Suresh', role: 'Art Director', department: 'Art', callTime: '05:30' },
        { name: 'Karthik', role: 'Set Assistant', department: 'Art', callTime: '06:00' },
      ],
    },
  },
  {
    id: 'demo-2',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 2 - Courtroom Drama',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Major courtroom confrontation scenes.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '06:00',
      wrapTime: '20:00',
      location: 'Chennai Film Studios - Stage 3',
      locationAddress: 'Plot 45, Film Nagar, Chennai - 600033',
      scenes: ['10', '11', '12', '13', '14'],
      weather: 'Indoor - A/C',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '06:00' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '06:00' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '06:30' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '06:30' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '06:00' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '06:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '06:30' },
        { name: 'Arjun', role: 'Production Head', department: 'Production', callTime: '05:30' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '06:30' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '07:00' },
        { name: 'Suresh', role: 'Art Director', department: 'Art', callTime: '06:00' },
      ],
    },
  },
  {
    id: 'demo-3',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 3 - Flashback Sequence',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Flashback scenes - mood lighting required.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '07:00',
      wrapTime: '21:00',
      location: 'Mahabalipuram Beach',
      locationAddress: 'Mahabalipuram, Kanchipuram District',
      scenes: ['20', '21', '22', '23'],
      weather: 'Clear, 28°C',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '07:00' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '07:00' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '07:30' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '07:30' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '06:00' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '06:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '07:30' },
        { name: 'Arjun', role: 'Production Head', department: 'Production', callTime: '06:30' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '07:00' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '07:00' },
        { name: 'Suresh', role: 'Art Director', department: 'Art', callTime: '06:00' },
        { name: 'Stunt Coordinator', role: 'Stunts', department: 'Stunts', callTime: '07:00' },
      ],
    },
  },
  {
    id: 'demo-4',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 4 - Romantic Track',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Romantic scenes between lead actors.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '06:00',
      wrapTime: '19:30',
      location: 'Leela Palace Hotel',
      locationAddress: 'No. 49, GM Street, Chennai - 600002',
      scenes: ['30', '31', '32'],
      weather: 'Indoor - A/C',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '06:00' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '06:00' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '06:30' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '06:30' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '05:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '06:30' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '05:30' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '06:00' },
      ],
    },
  },
  {
    id: 'demo-5',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 5 - Action Sequence',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Action sequence - stunts involved. Safety measures in place.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '05:00',
      wrapTime: '22:00',
      location: 'Anna Nagar - Open Road',
      locationAddress: 'Anna Nagar, Chennai - 600040',
      scenes: ['40', '41', '42', '43', '44'],
      weather: 'Night shoot',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '05:00' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '05:00' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '05:30' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '05:30' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '04:00' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '04:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '05:30' },
        { name: 'Arjun', role: 'Production Head', department: 'Production', callTime: '04:30' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '05:00' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '05:00' },
        { name: 'Stunt Coordinator', role: 'Stunts', department: 'Stunts', callTime: '04:30' },
        { name: 'Safety Officer', role: 'Safety', department: 'Production', callTime: '04:30' },
        { name: 'Ambulance', role: 'Medical', department: 'Production', callTime: '05:00' },
      ],
    },
  },
  {
    id: 'demo-6',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 6 - Climax Courtroom',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Final courtroom climax. All crew required.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '05:30',
      wrapTime: '23:00',
      location: 'Chennai High Court - Set',
      locationAddress: 'Studio Set - Film Nagar',
      scenes: ['50', '51', '52', '53', '54', '55'],
      weather: 'Indoor - A/C',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '05:30' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '05:30' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '06:00' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '06:00' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '05:00' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '05:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '06:00' },
        { name: 'Arjun', role: 'Production Head', department: 'Production', callTime: '05:00' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '05:30' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '06:00' },
        { name: 'Suresh', role: 'Art Director', department: 'Art', callTime: '05:00' },
        { name: 'Karthik', role: 'Set Assistant', department: 'Art', callTime: '05:30' },
      ],
    },
  },
  {
    id: 'demo-7',
    projectId: 'default-project',
    shootingDayId: null,
    title: 'Day 7 - Rain Song',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Rain song sequence. Water tanks ready.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shootingDay: null,
    content: {
      callTime: '18:00',
      wrapTime: '03:00',
      location: 'EPR Beach Resort',
      locationAddress: 'East Coast Road, Chennai',
      scenes: ['60', '61', '62'],
      weather: 'Night with rain',
      crewCalls: [
        { name: 'Raj Kapoor', role: 'Director', department: 'Direction', callTime: '18:00' },
        { name: 'Vikram Sarathy', role: 'DOP', department: 'Camera', callTime: '18:00' },
        { name: 'Anand', role: 'Cameraman', department: 'Camera', callTime: '18:30' },
        { name: 'Kumar', role: 'Focus Puller', department: 'Camera', callTime: '18:30' },
        { name: 'Ravi', role: 'Gaffer', department: 'Lighting', callTime: '17:00' },
        { name: 'Bala', role: 'Light Assistant', department: 'Lighting', callTime: '17:30' },
        { name: 'Prakash', role: 'Sound Engineer', department: 'Sound', callTime: '18:30' },
        { name: 'Meena', role: 'Makeup Artist', department: 'Makeup', callTime: '17:30' },
        { name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', callTime: '17:30' },
        { name: 'Water Tank Unit', role: 'Water', department: 'Art', callTime: '17:00' },
      ],
    },
  },
];

// In-memory store for demo mode (non-persistent)
let demoCallSheets = [...DEMO_CALL_SHEETS];
let demoNextId = DEMO_CALL_SHEETS.length + 1;

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const callSheets = await prisma.callSheet.findMany({
      where: { projectId },
      include: { shootingDay: true },
      orderBy: { date: 'desc' },
    });
    
    // If no call sheets exist, use demo data for better UX
    if (callSheets.length === 0) {
      console.log('[GET /api/call-sheets] No data found, using demo data');
      return NextResponse.json({ data: demoCallSheets, isDemoMode: true });
    }
    
    return NextResponse.json({ data: callSheets, isDemoMode: false });
  } catch (error) {
    // Fall back to demo data
    console.log('[GET /api/call-sheets] Using demo data - database not connected');
    return NextResponse.json({ data: demoCallSheets, isDemoMode: true });
  }
}

export async function POST(req: NextRequest) {
  // Parse body outside try block so it's available in catch block
  const body = await req.json();
  
  try {
    const { action, shootingDayId, date, title, content, notes } = body;

    const projectId = await ensureDefaultProject();

    if (action === 'generate') {
      const dayId = typeof shootingDayId === 'string' ? shootingDayId : body.shootingDayId;
      if (!dayId) {
        return NextResponse.json(
          { error: 'shootingDayId is required for generate action' },
          { status: 400 }
        );
      }

      const shootingDay = await prisma.shootingDay.findFirst({
        where: { id: dayId, projectId },
        include: {
          dayScenes: {
            include: {
              scene: {
                select: {
                  sceneNumber: true,
                  location: true,
                  headingRaw: true,
                  intExt: true,
                  timeOfDay: true,
                },
              },
            },
            orderBy: { orderNumber: 'asc' },
          },
          location: true,
        },
      });

      if (!shootingDay) {
        return NextResponse.json(
          { error: 'Shooting day not found' },
          { status: 404 }
        );
      }

      const crew = await prisma.crew.findMany({
        where: { projectId },
        orderBy: { role: 'asc' },
      });

      const scenes = shootingDay.dayScenes.map((ds) =>
        String(ds.scene.sceneNumber ?? '')
      );
      const crewCalls = crew.map((c) => ({
        name: c.name,
        role: c.role,
        department: c.department ?? undefined,
        callTime: shootingDay.callTime ?? '06:00',
      }));

      const contentJson: CallSheetContent = {
        callTime: shootingDay.callTime ?? '06:00',
        wrapTime: undefined,
        location: shootingDay.location?.name ?? 'TBD',
        locationAddress: shootingDay.location?.address ?? undefined,
        scenes,
        crewCalls,
        weather: undefined,
      };

      const sheetDate = shootingDay.scheduledDate
        ? new Date(shootingDay.scheduledDate)
        : new Date();

      const callSheet = await prisma.callSheet.create({
        data: {
          projectId,
          shootingDayId: shootingDay.id,
          title: title ?? `Day ${shootingDay.dayNumber} Call Sheet`,
          date: sheetDate,
          content: contentJson as object,
          notes: shootingDay.notes ?? undefined,
        },
        include: { shootingDay: true },
      });

      return NextResponse.json(callSheet);
    }

    const dateVal = date ?? new Date().toISOString().split('T')[0];
    const parsedDate = typeof dateVal === 'string' ? new Date(dateVal) : new Date(dateVal);

    const callSheet = await prisma.callSheet.create({
      data: {
        projectId,
        shootingDayId: shootingDayId ?? undefined,
        title: typeof title === 'string' ? title : undefined,
        date: parsedDate,
        content: content != null ? (typeof content === 'object' ? content : {}) : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
      },
      include: { shootingDay: true },
    });

    return NextResponse.json(callSheet);
  } catch (error) {
    // Demo mode: create a new call sheet in demo data
    console.log('[POST /api/call-sheets] Using demo data - database not connected');
    
    const { action, shootingDayId, date, title, content, notes } = body;
    
    // Validate generate action even in demo mode
    if (action === 'generate' && !shootingDayId) {
      return NextResponse.json(
        { error: 'shootingDayId is required for generate action' },
        { status: 400 }
      );
    }
    
    const newDemoSheet = {
      id: `demo-${demoNextId++}`,
      projectId: 'default-project',
      shootingDayId: null,
      title: title ?? 'New Call Sheet',
      date: date ?? new Date().toISOString(),
      notes: notes ?? null,
      createdAt: new Date().toISOString(),
      shootingDay: null,
      content: content ?? {
        callTime: '06:00',
        wrapTime: '19:00',
        location: '',
        locationAddress: '',
        scenes: [],
        crewCalls: [],
        weather: '',
      },
    };
    
    demoCallSheets = [newDemoSheet, ...demoCallSheets];
    return NextResponse.json(newDemoSheet);
  }
}

export async function PATCH(req: NextRequest) {
  // Parse body outside try block so it's available in catch block
  const body = await req.json();
  
  try {
    const { id, ...updates } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowedFields = ['title', 'date', 'content', 'notes'];
    const data: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'date' && typeof updates[key] === 'string') {
          data[key] = new Date(updates[key]);
        } else if (key === 'content' && typeof updates[key] === 'object') {
          data[key] = updates[key];
        } else if (typeof updates[key] === 'string') {
          data[key] = updates[key].trim() || null;
        } else {
          data[key] = updates[key];
        }
      }
    }

    const callSheet = await prisma.callSheet.update({
      where: { id: id.trim() },
      data,
      include: { shootingDay: true },
    });

    return NextResponse.json(callSheet);
  } catch (error) {
    // Demo mode: update in-memory demo data
    console.log('[PATCH /api/call-sheets] Using demo data - database not connected');
    
    const { id, title, date, content, notes } = body;
    
    const index = demoCallSheets.findIndex(s => s.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Call sheet not found' }, { status: 404 });
    }
    
    demoCallSheets[index] = {
      ...demoCallSheets[index],
      title: title ?? demoCallSheets[index].title,
      date: date ?? demoCallSheets[index].date,
      content: content ?? demoCallSheets[index].content,
      notes: notes ?? demoCallSheets[index].notes,
    };
    
    return NextResponse.json(demoCallSheets[index]);
  }
}

export async function DELETE(req: NextRequest) {
  // Parse body outside try block so it's available in catch block
  const body = await req.json();
  
  try {
    const { id } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.callSheet.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Demo mode: remove from in-memory demo data
    console.log('[DELETE /api/call-sheets] Using demo data - database not connected');
    
    const { id } = body;
    
    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const index = demoCallSheets.findIndex(s => s.id === id.trim());
    if (index === -1) {
      return NextResponse.json({ error: 'Call sheet not found' }, { status: 404 });
    }
    
    demoCallSheets = demoCallSheets.filter(s => s.id !== id.trim());
    
    return NextResponse.json({ success: true });
  }
}
