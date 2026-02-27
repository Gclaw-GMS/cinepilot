import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

const TRAVEL_CATEGORIES = ['Flight', 'Train', 'Bus', 'Taxi', 'Auto', 'Hotel', 'Stay', 'Per Diem', 'Daily Allowance'] as const;
const EXPENSE_STATUSES = ['pending', 'approved', 'rejected', 'reimbursed'] as const;

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

export async function GET(req: NextRequest) {
  try {
    const projectId = await ensureDefaultProject();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { projectId };
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { project: { select: { name: true } } },
    });

    // Get summary stats
    const allExpenses = await prisma.expense.findMany({ where: { projectId } });
    const totalAmount = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const expense of allExpenses) {
      const cat = expense.category;
      const stat = expense.status;
      byCategory[cat] = (byCategory[cat] || 0) + Number(expense.amount);
      byStatus[stat] = (byStatus[stat] || 0) + Number(expense.amount);
    }

    return NextResponse.json({
      expenses,
      summary: {
        totalAmount,
        totalCount: allExpenses.length,
        byCategory,
        byStatus,
      },
    });
  } catch (error) {
    console.error('[GET /api/travel]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { category, description, amount, date, vendor, personName, status, notes } = body;

    if (typeof category !== 'string' || !TRAVEL_CATEGORIES.includes(category as typeof TRAVEL_CATEGORIES[number])) {
      return NextResponse.json({ error: 'Valid category required: ' + TRAVEL_CATEGORIES.join(', ') }, { status: 400 });
    }
    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        projectId,
        category,
        description: `${personName ? personName + ': ' : ''}${description}`,
        amount,
        date: new Date(date),
        vendor: vendor || null,
        status: (status && EXPENSE_STATUSES.includes(status as typeof EXPENSE_STATUSES[number])) ? status : 'pending',
        notes: notes || null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[POST /api/travel]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category, description, amount, date, vendor, personName, status, notes } = body;

    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (category && TRAVEL_CATEGORIES.includes(category as typeof TRAVEL_CATEGORIES[number])) {
      updateData.category = category;
    }
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (date !== undefined) updateData.date = new Date(date);
    if (vendor !== undefined) updateData.vendor = vendor;
    if (status && EXPENSE_STATUSES.includes(status as typeof EXPENSE_STATUSES[number])) {
      updateData.status = status;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (personName !== undefined && description) {
      updateData.description = `${personName ? personName + ': ' : ''}${description}`;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[PATCH /api/travel]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/travel]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
