import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo travel expense data
const DEMO_EXPENSES = [
  { id: 'demo-1', category: 'Flight', description: 'Ravi Kumar: Flight to Hyderabad', amount: 8500, date: '2026-03-05', vendor: 'IndiGo', status: 'reimbursed', notes: 'Location scout trip' },
  { id: 'demo-2', category: 'Flight', description: 'Priya Venkatesh: Flight to Chennai', amount: 6200, date: '2026-03-06', vendor: 'Air India', status: 'reimbursed', notes: null },
  { id: 'demo-3', category: 'Train', description: 'Arun Raj: Train to Coimbatore', amount: 850, date: '2026-03-07', vendor: 'Indian Railways', status: 'approved', notes: 'Equipment transport' },
  { id: 'demo-4', category: 'Hotel', description: 'Madhavan S: Hotel stay in Ooty', amount: 12000, date: '2026-03-08', vendor: 'Hotel Glenview', status: 'pending', notes: '3 nights - location recce' },
  { id: 'demo-5', category: 'Taxi', description: 'Lakshmi Narayanan: Taxi to shooting location', amount: 2500, date: '2026-03-09', vendor: 'Ola', status: 'approved', notes: null },
  { id: 'demo-6', category: 'Per Diem', description: 'Karthik R: Daily allowance', amount: 3000, date: '2026-03-09', vendor: null, status: 'reimbursed', notes: 'Per diem for 3 days' },
  { id: 'demo-7', category: 'Flight', description: 'Samantha R: Flight to Bangalore', amount: 5800, date: '2026-03-10', vendor: 'SpiceJet', status: 'pending', notes: 'Costume fitting' },
  { id: 'demo-8', category: 'Bus', description: 'Vijay B: Bus to studio', amount: 450, date: '2026-03-11', vendor: 'TNSTC', status: 'reimbursed', notes: null },
  { id: 'demo-9', category: 'Hotel', description: 'Anand Prakash: Hotel stay in Chennai', amount: 8500, date: '2026-03-11', vendor: 'Hotel Park', status: 'approved', notes: 'VFX prep - 2 nights' },
  { id: 'demo-10', category: 'Auto', description: 'Divya K: Auto to location', amount: 350, date: '2026-03-12', vendor: 'Auto Rickshaw', status: 'pending', notes: null },
  { id: 'demo-11', category: 'Daily Allowance', description: 'Bala Subramani: Daily allowance', amount: 2000, date: '2026-03-12', vendor: null, status: 'approved', notes: 'Stunt coordination' },
  { id: 'demo-12', category: 'Flight', description: 'Ramesh T: Flight to Delhi', amount: 12500, date: '2026-03-12', vendor: 'Vistara', status: 'reimbursed', notes: 'Camera equipment pickup' },
];

function calculateSummary(expenses: any[]) {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalAmount = 0;
  
  for (const expense of expenses) {
    totalAmount += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] || 0) + 1;
    byStatus[expense.status] = (byStatus[expense.status] || 0) + 1;
  }
  
  return {
    totalAmount,
    totalCount: expenses.length,
    byCategory,
    byStatus,
  };
}

// Demo fallback response
function getDemoResponse() {
  const expenses = DEMO_EXPENSES.map(e => ({
    ...e,
    date: e.date,
  }));
  return {
    expenses,
    summary: calculateSummary(expenses),
    isDemoMode: true,
  };
}

// GET /api/travel - list all travel expenses
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const category = req.nextUrl.searchParams.get('category');
    const status = req.nextUrl.searchParams.get('status');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const id = req.nextUrl.searchParams.get('id');

    // If ID is provided, return single expense
    if (id) {
      // Check demo data first
      const demoExpense = DEMO_EXPENSES.find(e => e.id === id);
      if (demoExpense) {
        return NextResponse.json({ ...demoExpense, isDemoMode: true });
      }
      // Try database
      try {
        const expense = await prisma.travelExpense.findUnique({ where: { id } });
        if (expense) {
          return NextResponse.json({ ...expense, isDemoMode: false });
        }
      } catch (dbError) {
        // Continue to demo data
      }
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Try to fetch from database
    try {
      const where: any = { projectId };
      
      if (category && category !== 'all') where.category = category;
      if (status && status !== 'all') where.status = status;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const expenses = await prisma.travelExpense.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      if (expenses.length > 0) {
        return NextResponse.json({
          expenses,
          summary: calculateSummary(expenses),
          isDemoMode: false,
        });
      }
    } catch (dbError) {
      console.log('[GET /api/travel] Database not available, using demo data');
    }

    // Fall back to demo data
    let demoExpenses = DEMO_EXPENSES.map(e => ({
      ...e,
      date: e.date,
    }));
    
    // Apply filters to demo data (case-insensitive)
    if (category && category !== 'all') {
      demoExpenses = demoExpenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'all') {
      demoExpenses = demoExpenses.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }
    
    return NextResponse.json({
      expenses: demoExpenses,
      summary: calculateSummary(demoExpenses),
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[GET /api/travel]', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST /api/travel - create new expense
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, personName, description, amount, date, vendor, status, notes, projectId } = body;

    // Validate required fields
    if (!category || !description || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to create in database
    try {
      const fullDescription = personName ? `${personName}: ${description}` : description;
      
      const expense = await prisma.travelExpense.create({
        data: {
          projectId: projectId || DEFAULT_PROJECT_ID,
          category,
          description: fullDescription,
          amount: parseFloat(amount),
          date: new Date(date),
          vendor: vendor || null,
          status: status || 'pending',
          notes: notes || null,
        },
      });

      return NextResponse.json(expense);
    } catch (dbError) {
      console.log('[POST /api/travel] Database not available');
    }

    // Demo mode - return mock response
    const newExpense = {
      id: `demo-${Date.now()}`,
      projectId: projectId || DEFAULT_PROJECT_ID,
      category,
      description: personName ? `${personName}: ${description}` : description,
      amount: parseFloat(amount),
      date,
      vendor: vendor || null,
      status: status || 'pending',
      notes: notes || null,
    };

    return NextResponse.json(newExpense);
  } catch (error) {
    console.error('[POST /api/travel]', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

// PATCH /api/travel - update expense
export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { category, personName, description, amount, date, vendor, status, notes } = body;

    // Try to update in database
    try {
      const fullDescription = personName ? `${personName}: ${description}` : description;
      
      const expense = await prisma.travelExpense.update({
        where: { id },
        data: {
          category,
          description: fullDescription,
          amount: parseFloat(amount),
          date: new Date(date),
          vendor: vendor || null,
          status: status || 'pending',
          notes: notes || null,
        },
      });

      return NextResponse.json(expense);
    } catch (dbError) {
      console.log('[PATCH /api/travel] Database not available');
    }

    // Demo mode - return mock response
    return NextResponse.json({
      id,
      category,
      description: personName ? `${personName}: ${description}` : description,
      amount: parseFloat(amount),
      date,
      vendor: vendor || null,
      status: status || 'pending',
      notes: notes || null,
    });
  } catch (error) {
    console.error('[PATCH /api/travel]', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

// DELETE /api/travel - delete expense
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    // Try to delete from database
    try {
      await prisma.travelExpense.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.log('[DELETE /api/travel] Database not available');
    }

    // Demo mode
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/travel]', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
