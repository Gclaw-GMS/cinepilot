import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/equipment - list all equipment rentals
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    
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
    console.error('[GET /api/equipment]', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

// POST /api/equipment - create new equipment rental
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, dateStart, dateEnd, dailyRate, vendor, notes, projectId } = body;

    if (!name || !category || !dateStart || !dateEnd || !dailyRate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, dateStart, dateEnd, dailyRate' },
        { status: 400 }
      );
    }

    const project = projectId || DEFAULT_PROJECT_ID;

    const rental = await prisma.equipmentRental.create({
      data: {
        projectId: project,
        name,
        category,
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        dailyRate: Number(dailyRate),
        vendor: vendor || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('[POST /api/equipment]', error);
    return NextResponse.json(
      { error: 'Failed to create equipment rental' },
      { status: 500 }
    );
  }
}

// PATCH /api/equipment - update equipment rental
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, dateStart, dateEnd, dailyRate, vendor, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (dateStart) updateData.dateStart = new Date(dateStart);
    if (dateEnd) updateData.dateEnd = new Date(dateEnd);
    if (dailyRate) updateData.dailyRate = Number(dailyRate);
    if (vendor !== undefined) updateData.vendor = vendor;
    if (notes !== undefined) updateData.notes = notes;

    const rental = await prisma.equipmentRental.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('[PATCH /api/equipment]', error);
    return NextResponse.json(
      { error: 'Failed to update equipment rental' },
      { status: 500 }
    );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/equipment]', error);
    return NextResponse.json(
      { error: 'Failed to delete equipment rental' },
      { status: 500 }
    );
  }
}
