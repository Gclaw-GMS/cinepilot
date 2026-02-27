import { NextRequest, NextResponse } from 'next/server';

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

// Helper to check if we're in demo mode (no DB)
function isDemoMode(): boolean {
  try {
    // Try to import prisma - if it fails or DB not available, use demo mode
    const { PrismaClient } = require('@prisma/client');
    return false; // Prisma available
  } catch {
    return true; // Demo mode
  }
}

// Safe prisma accessor
function getPrisma() {
  try {
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const isDemo = !prisma || isDemoMode();
  
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  if (isDemo) {
    // Demo mode - return demo data with filters
    let expenses = demoExpenses.get(projectId) || [];
    
    if (category && category !== 'all') {
      expenses = expenses.filter(e => e.category === category);
    }
    if (status && status !== 'all') {
      expenses = expenses.filter(e => e.status === status);
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
  }

  // Database mode
  try {
    const where: Record<string, unknown> = { projectId };
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { project: { select: { name: true } } },
    });

    const allExpenses = await prisma.expense.findMany({ where: { projectId } });
    const totalAmount = allExpenses.reduce((sum: number, e: { amount: unknown }) => sum + Number(e.amount), 0);
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
    // Fallback to demo data on error
    const expenses = demoExpenses.get(DEFAULT_PROJECT_ID) || [];
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const expense of expenses) {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
      byStatus[expense.status] = (byStatus[expense.status] || 0) + expense.amount;
    }
    return NextResponse.json({
      expenses,
      summary: { totalAmount, totalCount: expenses.length, byCategory, byStatus },
      isDemoMode: true,
    });
  }
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma();
  const isDemo = !prisma || isDemoMode();
  
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

    if (isDemo) {
      // Demo mode - add to in-memory storage
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
      return NextResponse.json(newExpense);
    }

    // Database mode
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[POST /api/travel]', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const prisma = getPrisma();
  const isDemo = !prisma || isDemoMode();
  
  try {
    const body = await req.json();
    const { id, category, description, amount, date, vendor, personName, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (isDemo) {
      // Demo mode - update in-memory storage
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
          return NextResponse.json(exp);
        }
      }
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Database mode
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[PATCH /api/travel]', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const prisma = getPrisma();
  const isDemo = !prisma || isDemoMode();
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  if (isDemo) {
    // Demo mode - remove from in-memory storage
    for (const [projectId, expenses] of demoExpenses.entries()) {
      const idx = expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        expenses.splice(idx, 1);
        demoExpenses.set(projectId, expenses);
        return NextResponse.json({ success: true });
      }
    }
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/travel]', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
