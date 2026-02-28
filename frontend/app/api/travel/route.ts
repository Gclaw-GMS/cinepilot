import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// In-memory storage for demo mode
const demoExpenses: Map<string, TravelExpense[]> = new Map();

// Demo data
const DEMO_EXPENSES: TravelExpense[] = [
  { id: 't1', category: 'Flight', description: 'Ajith Kumar: Flight to Chennai', amount: 12500, date: '2026-02-10', vendor: 'IndiGo', status: 'approved', notes: 'Mumbai to Chennai for recce' },
  { id: 't2', category: 'Flight', description: 'Sai Pallavi: Flight to Bangalore', amount: 9800, date: '2026-02-12', vendor: 'Air India', status: 'approved', notes: 'Promotional event' },
  { id: 't3', category: 'Hotel', description: 'Vijay Sethupathi: Stay at Hyatt', amount: 45000, date: '2026-02-15', vendor: 'Hyatt Chennai', status: 'approved', notes: '5 nights during temple shoot' },
  { id: 't4', category: 'Train', description: 'Production Team: Train to Ooty', amount: 8500, date: '2026-02-18', vendor: 'Indian Railways', status: 'approved', notes: '10 tickets - 2nd AC' },
  { id: 't5', category: 'Taxi', description: 'Director: Airport transfers', amount: 4500, date: '2026-02-20', vendor: 'Ola', status: 'reimbursed', notes: 'Multiple trips across 2 weeks' },
  { id: 't6', category: 'Per Diem', description: 'Cast Per Diem - Week 1', amount: 35000, date: '2026-02-22', vendor: 'Production', status: 'approved', notes: '5 principal actors x 7 days' },
  { id: 't7', category: 'Daily Allowance', description: 'Crew DA - 20 pax x 10 days', amount: 60000, date: '2026-02-25', vendor: 'Production', status: 'pending', notes: 'Technicians and assistants' },
  { id: 't8', category: 'Flight', description: 'Music Director: Chennai to Mumbai', amount: 11200, date: '2026-02-28', vendor: 'SpiceJet', status: 'pending', notes: 'Recording session coordination' },
  { id: 't9', category: 'Stay', description: 'Guest Actor: Hotel stay', amount: 18000, date: '2026-03-01', vendor: 'The Leela Palace', status: 'pending', notes: '3 nights for song sequence' },
  { id: 't10', category: 'Auto', description: 'Local transport - Location recce', amount: 2500, date: '2026-03-02', vendor: 'Auto Rickshaw', status: 'reimbursed', notes: 'Various trips in and around Ooty' },
  { id: 't11', category: 'Flight', description: 'VFX Team: Mumbai to Chennai', amount: 15600, date: '2026-03-05', vendor: 'Vistara', status: 'pending', notes: 'VFX recce and sync' },
  { id: 't12', category: 'Bus', description: 'Background Artists transport', amount: 6000, date: '2026-03-08', vendor: 'TNSTC', status: 'approved', notes: '50 BA for temple sequence' },
];

// Initialize demo data
demoExpenses.set(DEFAULT_PROJECT_ID, [...DEMO_EXPENSES]);

interface TravelExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  status: string;
  notes?: string;
}

const TRAVEL_CATEGORIES = ['Flight', 'Train', 'Bus', 'Taxi', 'Auto', 'Hotel', 'Stay', 'Per Diem', 'Daily Allowance'];
const EXPENSE_STATUSES = ['pending', 'approved', 'rejected', 'reimbursed'];

// GET /api/travel - Get all travel expenses with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  try {
    // Try database first
    await prisma.$connect();
    
    const where: Record<string, unknown> = { projectId };
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;
    
    // Date range filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { project: { select: { name: true } } },
    });

    // Get all expenses for summary
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

    // Format expenses for response
    const formattedExpenses = expenses.map(e => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: Number(e.amount),
      date: e.date.toISOString().split('T')[0],
      vendor: e.vendor || undefined,
      status: e.status,
      notes: e.notes || undefined,
    }));

    return NextResponse.json({
      expenses: formattedExpenses,
      summary: {
        totalAmount,
        totalCount: allExpenses.length,
        byCategory,
        byStatus,
      },
      isDemoMode: false,
    });
  } catch (error) {
    console.log('[GET /api/travel] Database not connected, using demo data');
    
    // Demo mode - return demo data with filters
    let expenses = demoExpenses.get(projectId) || [];
    
    if (category && category !== 'all') {
      expenses = expenses.filter(e => e.category === category);
    }
    if (status && status !== 'all') {
      expenses = expenses.filter(e => e.status === status);
    }
    // Date range filtering
    if (startDate) {
      expenses = expenses.filter(e => new Date(e.date) >= new Date(startDate));
    }
    if (endDate) {
      expenses = expenses.filter(e => new Date(e.date) <= new Date(endDate));
    }
    
    // Sort by date descending
    expenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate summary
    const allExpenses = demoExpenses.get(projectId) || [];
    const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    for (const expense of allExpenses) {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
      byStatus[expense.status] = (byStatus[expense.status] || 0) + expense.amount;
    }
    
    return NextResponse.json({
      expenses,
      summary: {
        totalAmount,
        totalCount: allExpenses.length,
        byCategory,
        byStatus,
      },
      isDemoMode: true,
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// POST /api/travel - Create a new travel expense
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, description, amount, date, vendor, personName, status, notes } = body;
    const projectId = body.projectId || DEFAULT_PROJECT_ID;

    // Validation
    if (!category || !TRAVEL_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Valid category required: ' + TRAVEL_CATEGORIES.join(', ') }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const fullDescription = personName ? `${personName}: ${description}` : description;

    // Try database first
    await prisma.$connect();
    
    const expense = await prisma.expense.create({
      data: {
        projectId,
        category,
        description: fullDescription,
        amount,
        date: new Date(date),
        vendor: vendor || null,
        status: (status && EXPENSE_STATUSES.includes(status)) ? status : 'pending',
        notes: notes || null,
      },
    });

    return NextResponse.json({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      vendor: expense.vendor || undefined,
      status: expense.status,
      notes: expense.notes || undefined,
    });
  } catch (error) {
    console.error('[POST /api/travel]', error);
    
    // Demo mode - add to in-memory storage
    try {
      const body = await req.json();
      const { category, description, amount, date, vendor, personName, status, notes } = body;
      const projectId = body.projectId || DEFAULT_PROJECT_ID;
      
      const fullDescription = personName ? `${personName}: ${description}` : description;
      const expenses = demoExpenses.get(projectId) || [];
      const newExpense: TravelExpense = {
        id: `t${Date.now()}`,
        category,
        description: fullDescription,
        amount,
        date,
        vendor: vendor || undefined,
        status: status || 'pending',
        notes: notes || undefined,
      };
      expenses.push(newExpense);
      demoExpenses.set(projectId, expenses);
      return NextResponse.json({ ...newExpense, isDemoMode: true });
    } catch {
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// PATCH /api/travel - Update an existing expense
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category, description, amount, date, vendor, personName, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Try database first
    await prisma.$connect();
    
    const updateData: Record<string, unknown> = {};
    if (category && TRAVEL_CATEGORIES.includes(category)) updateData.category = category;
    if (description !== undefined) {
      updateData.description = personName ? `${personName}: ${description}` : description;
    }
    if (amount !== undefined) updateData.amount = amount;
    if (date !== undefined) updateData.date = new Date(date);
    if (vendor !== undefined) updateData.vendor = vendor;
    if (status && EXPENSE_STATUSES.includes(status)) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      vendor: expense.vendor || undefined,
      status: expense.status,
      notes: expense.notes || undefined,
    });
  } catch (error) {
    console.error('[PATCH /api/travel]', error);
    
    // Demo mode - update in-memory storage
    try {
      const body = await req.json();
      const { id, category, description, amount, date, vendor, personName, status, notes } = body;
      
      for (const [projectId, expenses] of demoExpenses.entries()) {
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
          const exp = expenses[idx];
          if (category) exp.category = category;
          if (description) exp.description = personName ? `${personName}: ${description}` : description;
          if (amount !== undefined) exp.amount = amount;
          if (date) exp.date = date;
          if (vendor !== undefined) exp.vendor = vendor;
          if (status) exp.status = status;
          if (notes !== undefined) exp.notes = notes;
          demoExpenses.set(projectId, expenses);
          return NextResponse.json({ ...exp, isDemoMode: true });
        }
      }
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    } catch {
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// DELETE /api/travel - Delete an expense
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    // Try database first
    await prisma.$connect();
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/travel]', error);
    
    // Demo mode - remove from in-memory storage
    for (const [projectId, expenses] of demoExpenses.entries()) {
      const idx = expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        expenses.splice(idx, 1);
        demoExpenses.set(projectId, expenses);
        return NextResponse.json({ success: true, isDemoMode: true });
      }
    }
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
