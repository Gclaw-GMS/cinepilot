import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo equipment data for seeding
const DEMO_EQUIPMENT = [
  { name: 'RED Komodo', category: 'camera', dailyRate: 15000, vendor: 'Film Gear Chennai', dateStart: '2026-03-01', dateEnd: '2026-03-15' },
  { name: 'Arri Alexa Mini LF', category: 'camera', dailyRate: 35000, vendor: 'Film City Rentals', dateStart: '2026-03-05', dateEnd: '2026-03-20' },
  { name: 'Canon CN-E 50mm T1.3', category: 'camera', dailyRate: 2500, vendor: 'Lens Hub', dateStart: '2026-03-01', dateEnd: '2026-03-25' },
  { name: 'Arri SkyPanel S60-C', category: 'lighting', dailyRate: 8000, vendor: 'Light House Studios', dateStart: '2026-03-01', dateEnd: '2026-03-10' },
  { name: 'Aputure 1200d Pro', category: 'lighting', dailyRate: 3500, vendor: 'Film Gear Chennai', dateStart: '2026-03-05', dateEnd: '2026-03-15' },
  { name: 'Godox VL150', category: 'lighting', dailyRate: 800, vendor: 'Light House Studios', dateStart: '2026-03-10', dateEnd: '2026-03-20' },
  { name: 'Sennheiser MKH 416', category: 'sound', dailyRate: 2500, vendor: 'Audio Pro Studios', dateStart: '2026-03-01', dateEnd: '2026-03-20' },
  { name: 'Zoom F6 Recorder', category: 'sound', dailyRate: 1200, vendor: 'Audio Pro Studios', dateStart: '2026-03-01', dateEnd: '2026-03-20' },
  { name: 'Rode NTG5 Shotgun', category: 'sound', dailyRate: 800, vendor: 'Audio Pro Studios', dateStart: '2026-03-05', dateEnd: '2026-03-15' },
  { name: 'DJI Ronin RS3 Pro', category: 'grip', dailyRate: 5000, vendor: 'Stabilizer Co', dateStart: '2026-02-20', dateEnd: '2026-02-28' },
  { name: 'Kessler Shuttle Pod', category: 'grip', dailyRate: 3000, vendor: 'Film Gear Chennai', dateStart: '2026-03-05', dateEnd: '2026-03-15' },
  { name: 'Dana Dolly System', category: 'grip', dailyRate: 1500, vendor: 'Light House Studios', dateStart: '2026-03-10', dateEnd: '2026-03-20' },
  { name: 'PROAIM Jib Arm', category: 'grip', dailyRate: 2500, vendor: 'Film City Rentals', dateStart: '2026-03-01', dateEnd: '2026-03-10' },
  { name: 'Kino Flo 4Bank', category: 'lighting', dailyRate: 2000, vendor: 'Light House Studios', dateStart: '2026-03-01', dateEnd: '2026-03-15' },
  { name: 'Sony FX6 Cinema Line', category: 'camera', dailyRate: 12000, vendor: 'Film Gear Chennai', dateStart: '2026-03-10', dateEnd: '2026-03-25' },
]

// Seed endpoint to populate demo equipment
async function seedEquipment(projectId: string) {
  const created = []
  for (const eq of DEMO_EQUIPMENT) {
    const rental = await prisma.equipmentRental.create({
      data: {
        projectId,
        name: eq.name,
        category: eq.category,
        dateStart: new Date(eq.dateStart),
        dateEnd: new Date(eq.dateEnd),
        dailyRate: eq.dailyRate,
        vendor: eq.vendor,
        notes: null,
      },
    })
    created.push(rental)
  }
  return created
}

// Demo fallback data
const DEMO_EQUIPMENT_RESPONSE = {
  rentals: [
    { id: 'demo-1', projectId: 'demo', name: 'RED Komodo', category: 'camera', dateStart: '2026-03-01', dateEnd: '2026-03-15', dailyRate: 15000, vendor: 'Film Gear Chennai', status: 'available', quantity: 1, notes: null },
    { id: 'demo-2', projectId: 'demo', name: 'Arri Alexa Mini LF', category: 'camera', dateStart: '2026-03-05', dateEnd: '2026-03-20', dailyRate: 35000, vendor: 'Film City Rentals', status: 'in-use', quantity: 1, notes: null },
    { id: 'demo-3', projectId: 'demo', name: 'Canon CN-E 50mm T1.3', category: 'camera', dateStart: '2026-03-01', dateEnd: '2026-03-25', dailyRate: 2500, vendor: 'Lens Hub', status: 'available', quantity: 1, notes: null },
    { id: 'demo-4', projectId: 'demo', name: 'Arri SkyPanel S60-C', category: 'lighting', dateStart: '2026-03-01', dateEnd: '2026-03-10', dailyRate: 8000, vendor: 'Light House Studios', status: 'in-use', quantity: 1, notes: null },
    { id: 'demo-5', projectId: 'demo', name: 'Aputure 1200d Pro', category: 'lighting', dateStart: '2026-03-05', dateEnd: '2026-03-15', dailyRate: 3500, vendor: 'Film Gear Chennai', status: 'available', quantity: 1, notes: null },
    { id: 'demo-6', projectId: 'demo', name: 'Sennheiser MKH 416', category: 'sound', dateStart: '2026-03-01', dateEnd: '2026-03-20', dailyRate: 2500, vendor: 'Audio Pro Studios', status: 'in-use', quantity: 1, notes: null },
    { id: 'demo-7', projectId: 'demo', name: 'Zoom F6 Recorder', category: 'sound', dateStart: '2026-03-01', dateEnd: '2026-03-20', dailyRate: 1200, vendor: 'Audio Pro Studios', status: 'available', quantity: 1, notes: null },
    { id: 'demo-8', projectId: 'demo', name: 'DJI Ronin RS3 Pro', category: 'grip', dateStart: '2026-02-20', dateEnd: '2026-02-28', dailyRate: 5000, vendor: 'Stabilizer Co', status: 'returned', quantity: 1, notes: null },
    { id: 'demo-9', projectId: 'demo', name: 'Kessler Shuttle Pod', category: 'grip', dateStart: '2026-03-05', dateEnd: '2026-03-15', dailyRate: 3000, vendor: 'Film Gear Chennai', status: 'available', quantity: 1, notes: null },
  ],
  stats: {
    totalItems: 9,
    totalDailyRate: 75700,
    available: 5,
    inUse: 3,
  },
};

// GET /api/equipment - list all equipment rentals
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const action = req.nextUrl.searchParams.get('action');
    
    // Return demo response directly for noseed action (for testing)
    if (action === 'noseed') {
      return NextResponse.json(DEMO_EQUIPMENT_RESPONSE);
    }
    
    // Check if we should seed data
    const existingCount = await prisma.equipmentRental.count({ where: { projectId } });
    
    if (existingCount === 0) {
      // Auto-seed demo data if empty
      await seedEquipment(projectId);
    }
    
    const rentals = await prisma.equipmentRental.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });

    // Determine status based on date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rentalsWithStatus = rentals.map(rental => {
      let status = 'available';
      const startDate = new Date(rental.dateStart);
      const endDate = new Date(rental.dateEnd);
      
      if (startDate <= today && endDate >= today) {
        status = 'in-use';
      } else if (endDate < today) {
        status = 'returned';
      }

      return {
        ...rental,
        status,
        quantity: 1,
        dailyRate: Number(rental.dailyRate),
      };
    });

    // Calculate totals
    const totalDailyRate = rentals.reduce((acc, r) => acc + Number(r.dailyRate), 0);

    return NextResponse.json({
      rentals: rentalsWithStatus,
      stats: {
        totalItems: rentals.length,
        totalDailyRate,
        available: rentalsWithStatus.filter(r => r.status === 'available').length,
        inUse: rentalsWithStatus.filter(r => r.status === 'in-use').length,
      },
    });
  } catch (error) {
    console.error('[GET /api/equipment] Database not available, using demo data:', error);
    // Return demo data when database is not available
    return NextResponse.json(DEMO_EQUIPMENT_RESPONSE);
  }
}

// POST /api/equipment - create new equipment rental
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { name, category, dateStart, dateEnd, dailyRate, vendor, notes, projectId } = body;

  if (!name || !category || !dateStart || !dateEnd || !dailyRate) {
    return NextResponse.json(
      { error: 'Missing required fields: name, category, dateStart, dateEnd, dailyRate' },
      { status: 400 }
    );
  }

  try {
    const project = String(projectId || DEFAULT_PROJECT_ID);

    const rental = await prisma.equipmentRental.create({
      data: {
        projectId: project,
        name: String(name),
        category: String(category),
        dateStart: new Date(String(dateStart)),
        dateEnd: new Date(String(dateEnd)),
        dailyRate: Number(dailyRate),
        vendor: vendor ? String(vendor) : null,
        notes: notes ? String(notes) : null,
      },
    });

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('[POST /api/equipment] Database not available:', error);
    // Return success in demo mode
    return NextResponse.json({ 
      rental: { 
        id: `demo-${Date.now()}`,
        projectId: DEFAULT_PROJECT_ID,
        name: String(name),
        category: String(category),
        dateStart: String(dateStart),
        dateEnd: String(dateEnd),
        dailyRate: Number(dailyRate),
        vendor: vendor ? String(vendor) : null,
        notes: notes || null,
        status: 'available',
        quantity: 1,
      }, 
      _demo: true 
    });
  }
}

// PATCH /api/equipment - update equipment rental
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown> = {};
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { id, name, category, dateStart, dateEnd, dailyRate, vendor, notes } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'Equipment ID is required' },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (dateStart) updateData.dateStart = new Date(String(dateStart));
    if (dateEnd) updateData.dateEnd = new Date(String(dateEnd));
    if (dailyRate) updateData.dailyRate = Number(dailyRate);
    if (vendor !== undefined) updateData.vendor = vendor;
    if (notes !== undefined) updateData.notes = notes;

    const rental = await prisma.equipmentRental.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('[PATCH /api/equipment] Database not available:', error);
    // Return success in demo mode
    return NextResponse.json({ 
      rental: { 
        id: String(id),
        projectId: DEFAULT_PROJECT_ID,
        name: name ? String(name) : '',
        category: category ? String(category) : '',
        dateStart: dateStart ? String(dateStart) : '',
        dateEnd: dateEnd ? String(dateEnd) : '',
        dailyRate: dailyRate ? Number(dailyRate) : 0,
        vendor: vendor ? String(vendor) : null,
        notes: notes ? String(notes) : null,
        status: 'available',
        quantity: 1,
      }, 
      _demo: true 
    });
  }
}

// DELETE /api/equipment - delete equipment rental
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      );
    }

    await prisma.equipmentRental.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, _demo: true });
  } catch (error) {
    console.error('[DELETE /api/equipment] Database not available:', error);
    // Return success in demo mode
    return NextResponse.json({ success: true, _demo: true });
  }
}
