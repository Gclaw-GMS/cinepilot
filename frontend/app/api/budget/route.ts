import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBudget, forecastBudget, addExpense } from '@/lib/budget/engine';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is unavailable
const DEMO_BUDGET_ITEMS = [
  { id: 'd1', category: 'Production', subcategory: 'Camera', description: 'RED Komodo Rental (15 days)', quantity: '15', unit: 'days', rate: '15000', rateLow: '12000', rateHigh: '18000', total: '225000', actualCost: null, source: 'ai', notes: null },
  { id: 'd2', category: 'Production', subcategory: 'Camera', description: 'Arri Alexa Mini LF (20 days)', quantity: '20', unit: 'days', rate: '35000', rateLow: '30000', rateHigh: '40000', total: '700000', actualCost: null, source: 'ai', notes: null },
  { id: 'd3', category: 'Production', subcategory: 'Camera', description: 'Cooke S7/i Full Frame Lens Set', quantity: '1', unit: 'set', rate: '250000', rateLow: '200000', rateHigh: '300000', total: '250000', actualCost: null, source: 'ai', notes: null },
  { id: 'd4', category: 'Production', subcategory: 'Lighting', description: 'Arri SkyPanel S60-C (10 days)', quantity: '10', unit: 'days', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '80000', actualCost: null, source: 'ai', notes: null },
  { id: 'd5', category: 'Production', subcategory: 'Lighting', description: 'ARRI M40 + M18 Package', quantity: '1', unit: 'package', rate: '120000', rateLow: '100000', rateHigh: '150000', total: '120000', actualCost: null, source: 'ai', notes: null },
  { id: 'd6', category: 'Production', subcategory: 'Grip', description: 'DJI Ronin RS3 Pro (12 days)', quantity: '12', unit: 'days', rate: '5000', rateLow: '4000', rateHigh: '6000', total: '60000', actualCost: null, source: 'ai', notes: null },
  { id: 'd7', category: 'Production', subcategory: 'Sound', description: 'Sennheiser MKH 416 Shotgun Kit', quantity: '2', unit: 'units', rate: '2500', rateLow: '2000', rateHigh: '3000', total: '50000', actualCost: null, source: 'ai', notes: null },
  { id: 'd8', category: 'Art Department', subcategory: 'Sets', description: 'Main Temple Set Construction', quantity: '1', unit: 'set', rate: '450000', rateLow: '350000', rateHigh: '550000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd9', category: 'Art Department', subcategory: 'Sets', description: 'Village Street Set', quantity: '1', unit: 'set', rate: '280000', rateLow: '220000', rateHigh: '350000', total: '280000', actualCost: null, source: 'ai', notes: null },
  { id: 'd10', category: 'Art Department', subcategory: 'Props', description: 'Period Props Package', quantity: '1', unit: 'package', rate: '180000', rateLow: '150000', rateHigh: '220000', total: '180000', actualCost: null, source: 'ai', notes: null },
  { id: 'd11', category: 'Costume', subcategory: 'Lead', description: 'Lead Actor Costumes (4 looks)', quantity: '4', unit: 'looks', rate: '45000', rateLow: '35000', rateHigh: '55000', total: '180000', actualCost: null, source: 'ai', notes: null },
  { id: 'd12', category: 'Costume', subcategory: 'Supporting', description: 'Supporting Cast Costumes (25 pax)', quantity: '25', unit: 'pax', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '200000', actualCost: null, source: 'ai', notes: null },
  { id: 'd13', category: 'Makeup & Hair', subcategory: 'Lead', description: 'Lead Makeup Artist (30 days)', quantity: '30', unit: 'days', rate: '15000', rateLow: '12000', rateHigh: '18000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd14', category: 'Makeup & Hair', subcategory: 'Team', description: 'Makeup Team (4 pax, 30 days)', quantity: '120', unit: 'pax-days', rate: '5000', rateLow: '4000', rateHigh: '6000', total: '600000', actualCost: null, source: 'ai', notes: null },
  { id: 'd15', category: 'Locations', subcategory: 'Studio', description: 'AVM Studios Rental (10 days)', quantity: '10', unit: 'days', rate: '85000', rateLow: '70000', rateHigh: '100000', total: '850000', actualCost: null, source: 'ai', notes: null },
  { id: 'd16', category: 'Locations', subcategory: 'Location', description: 'Outdoor Location Fees (5 locations)', quantity: '5', unit: 'locations', rate: '75000', rateLow: '50000', rateHigh: '100000', total: '375000', actualCost: null, source: 'ai', notes: null },
  { id: 'd17', category: 'Locations', subcategory: 'Permits', description: 'Film Permits & Clearances', quantity: '1', unit: 'package', rate: '120000', rateLow: '80000', rateHigh: '150000', total: '120000', actualCost: null, source: 'ai', notes: null },
  { id: 'd18', category: 'Post Production', subcategory: 'Editing', description: 'Offline Editing Suite (45 days)', quantity: '45', unit: 'days', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '360000', actualCost: null, source: 'ai', notes: null },
  { id: 'd19', category: 'Post Production', subcategory: 'VFX', description: 'VFX Budget (estimated shots)', quantity: '120', unit: 'shots', rate: '25000', rateLow: '15000', rateHigh: '40000', total: '3000000', actualCost: null, source: 'ai', notes: 'Average ₹25K per shot, depends on complexity' },
  { id: 'd20', category: 'Post Production', subcategory: 'Color', description: 'Digital Intermediate (DI)', quantity: '1', unit: 'film', rate: '450000', rateLow: '350000', rateHigh: '550000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd21', category: 'Music', subcategory: 'Composition', description: 'Background Score', quantity: '1', unit: 'film', rate: '1500000', rateLow: '1000000', rateHigh: '2000000', total: '1500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd22', category: 'Music', subcategory: 'Songs', description: 'Song Composition + Recording (5 songs)', quantity: '5', unit: 'songs', rate: '400000', rateLow: '300000', rateHigh: '500000', total: '2000000', actualCost: null, source: 'ai', notes: null },
  { id: 'd23', category: 'Music', subcategory: 'Lyrics', description: 'Lyricist Fee', quantity: '5', unit: 'songs', rate: '100000', rateLow: '75000', rateHigh: '125000', total: '500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd24', category: 'Cast', subcategory: 'Lead', description: 'Lead Actor Fee', quantity: '30', unit: 'days', rate: '500000', rateLow: '300000', rateHigh: '1000000', total: '15000000', actualCost: null, source: 'ai', notes: 'Negotiable based on BO potential' },
  { id: 'd25', category: 'Cast', subcategory: 'Lead', description: 'Lead Actress Fee', quantity: '25', unit: 'days', rate: '350000', rateLow: '200000', rateHigh: '500000', total: '8750000', actualCost: null, source: 'ai', notes: null },
  { id: 'd26', category: 'Cast', subcategory: 'Supporting', description: 'Supporting Cast (15 pax avg)', quantity: '1', unit: 'package', rate: '2500000', rateLow: '2000000', rateHigh: '3000000', total: '2500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd27', category: 'Crew', subcategory: 'Direction', description: 'Director Fee + Team', quantity: '1', unit: 'package', rate: '5000000', rateLow: '3000000', rateHigh: '8000000', total: '5000000', actualCost: null, source: 'ai', notes: 'Includes director, ADs, script supervisor' },
  { id: 'd28', category: 'Crew', subcategory: 'Production', description: 'Production Team (30 days)', quantity: '1', unit: 'package', rate: '1800000', rateLow: '1500000', rateHigh: '2200000', total: '1800000', actualCost: null, source: 'ai', notes: 'Producer, production manager, coordinators' },
  { id: 'd29', category: 'Contingency', subcategory: 'Emergency', description: 'Contingency (10%)', quantity: '1', unit: 'buffer', rate: '0', rateLow: null, rateHigh: null, total: '3855000', actualCost: null, source: 'ai', notes: 'Standard 10% production buffer' },
];

const DEMO_EXPENSES = [
  { id: 'e1', category: 'Production', description: 'RED Komodo Deposit', amount: '50000', date: '2026-02-15', vendor: 'Film Gear Rentals', status: 'approved', notes: 'Security deposit - refundable' },
  { id: 'e2', category: 'Locations', description: 'AVM Studios Advance', amount: '250000', date: '2026-02-20', vendor: 'AVM Studios', status: 'approved', notes: '50% advance for 10 days booking' },
  { id: 'e3', category: 'Cast', description: 'Lead Actor Signing Amount', amount: '2000000', date: '2026-02-10', vendor: 'Agent', status: 'approved', notes: 'Signing amount - non refundable' },
  { id: 'e4', category: 'Art Department', description: 'Set Construction Materials', amount: '180000', date: '2026-02-25', vendor: 'Art Fusion', status: 'approved', notes: 'Temple set materials' },
  { id: 'e5', category: 'Music', description: 'Background Score Advance', amount: '300000', date: '2026-02-28', vendor: 'Music Director', status: 'approved', notes: '30% advance to composer' },
  { id: 'e6', category: 'Crew', description: 'Director Fee - First Installment', amount: '1500000', date: '2026-02-05', vendor: 'Director', status: 'approved', notes: '30% of total fee' },
  { id: 'e7', category: 'Production', description: 'Location Scouting Expenses', amount: '45000', date: '2026-02-18', vendor: 'Production Team', status: 'pending', notes: 'Travel, accommodation for location recce' },
  { id: 'e8', category: 'Costume', description: 'Lead Actor Costume Deposit', amount: '75000', date: '2026-03-01', vendor: 'Costume Designer', status: 'pending', notes: 'Fabric and measurement advance' },
];

const DEMO_FORECAST = {
  planned: 38550000,
  actual: 6630000,
  eacTotal: 41200000,
  variance: -2650000,
  percentSpent: 17.2,
  categories: [
    { category: 'Production', planned: 1865000, actual: 350000, forecast: 1950000, status: 'on_track' },
    { category: 'Art Department', planned: 910000, actual: 180000, forecast: 950000, status: 'on_track' },
    { category: 'Costume', planned: 380000, actual: 75000, forecast: 400000, status: 'on_track' },
    { category: 'Makeup & Hair', planned: 1050000, actual: 0, forecast: 1100000, status: 'warning' },
    { category: 'Locations', planned: 1345000, actual: 250000, forecast: 1400000, status: 'on_track' },
    { category: 'Post Production', planned: 5160000, actual: 0, forecast: 5500000, status: 'warning' },
    { category: 'Music', planned: 4500000, actual: 300000, forecast: 4800000, status: 'on_track' },
    { category: 'Cast', planned: 21250000, actual: 2000000, forecast: 22000000, status: 'on_track' },
    { category: 'Crew', planned: 6800000, actual: 1500000, forecast: 7000000, status: 'on_track' },
    { category: 'Contingency', planned: 1530510, actual: 0, forecast: 1650000, status: 'on_track' },
  ]
};

// Helper to check if we're in demo mode (no database OR no data)
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Helper to check if there's budget data in the database
async function hasBudgetData(projectId: string): Promise<boolean> {
  try {
    const itemCount = await prisma.budgetItem.count({ where: { projectId } });
    return itemCount > 0;
  } catch {
    return false;
  }
}

// GET /api/budget — get budget data
// GET /api/budget?action=forecast — get forecast only (for dashboard)
export async function GET(req: NextRequest) {
  const isDbConnected = await checkDbConnection();
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const hasData = isDbConnected && await hasBudgetData(projectId);
  const isDemo = !hasData;
  
  if (isDemo) {
    const action = req.nextUrl.searchParams.get('action');
    
    // Handle action=forecast for dashboard compatibility
    if (action === 'forecast') {
      return NextResponse.json({
        totalPlanned: DEMO_FORECAST.planned,
        totalActual: DEMO_FORECAST.actual,
        variance: DEMO_FORECAST.variance,
        percentSpent: DEMO_FORECAST.percentSpent,
        forecast: DEMO_FORECAST,
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({
      items: DEMO_BUDGET_ITEMS,
      expenses: DEMO_EXPENSES,
      forecast: DEMO_FORECAST,
      isDemoMode: true,
    });
  }
  
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const action = req.nextUrl.searchParams.get('action');
    
    // Handle action=forecast for dashboard compatibility
    if (action === 'forecast') {
      const forecast = await forecastBudget(projectId);
      return NextResponse.json({
        totalPlanned: forecast.planned,
        totalActual: forecast.actual,
        variance: forecast.variance,
        percentSpent: forecast.percentSpent,
        forecast,
        isDemoMode: false,
      });
    }

    const [items, expenses, forecast] = await Promise.all([
      prisma.budgetItem.findMany({
        where: { projectId },
        orderBy: { category: 'asc' },
      }),
      prisma.expense.findMany({
        where: { projectId },
        orderBy: { date: 'desc' },
      }),
      forecastBudget(projectId),
    ]);

    return NextResponse.json({ items, expenses, forecast, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/budget]', error);
    // Fallback to demo data on error
    return NextResponse.json({
      items: DEMO_BUDGET_ITEMS,
      expenses: DEMO_EXPENSES,
      forecast: DEMO_FORECAST,
      isDemoMode: true,
    });
  }
}

// POST /api/budget — generate budget or add expense
export async function POST(req: NextRequest) {
  const isDbConnected = await checkDbConnection();
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const hasData = isDbConnected && await hasBudgetData(projectId);
  const isDemo = !hasData;
  
  if (isDemo) {
    // In demo mode, return simulated responses
    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      return NextResponse.json({
        message: 'Budget generated (Demo Mode)',
        items: DEMO_BUDGET_ITEMS,
        totalPlanned: 38550000,
        isDemoMode: true,
      });
    }

    if (action === 'addExpense') {
      // Simulate adding expense in demo mode
      const newExpense = {
        id: `demo-exp-${Date.now()}`,
        category: body.category,
        description: body.description,
        amount: body.amount.toString(),
        date: body.date || new Date().toISOString().split('T')[0],
        vendor: body.vendor || null,
        status: 'pending',
        notes: body.notes || null,
      };
      return NextResponse.json({
        message: 'Expense added (Demo Mode)',
        expense: newExpense,
        isDemoMode: true,
      });
    }

    if (action === 'forecast') {
      return NextResponse.json(DEMO_FORECAST);
    }

    // Handle updateExpenseStatus action
    if (action === 'updateExpenseStatus') {
      const { id, status } = body;
      return NextResponse.json({
        message: 'Status updated (Demo Mode)',
        id,
        status,
        isDemoMode: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      const result = await generateBudget({
        projectId: body.projectId || DEFAULT_PROJECT_ID,
        region: body.region,
        targetScale: body.targetScale,
        budgetCap: body.budgetCap,
        overrides: body.overrides,
      });

      return NextResponse.json({
        message: `Budget generated: ${result.items.length} line items`,
        ...result,
        isDemoMode: false,
      });
    }

    if (action === 'addExpense') {
      const expense = await addExpense(
        body.projectId || DEFAULT_PROJECT_ID,
        {
          category: body.category,
          description: body.description,
          amount: body.amount,
          date: body.date,
          vendor: body.vendor,
          notes: body.notes,
        }
      );

      return NextResponse.json({ message: 'Expense added', expense, isDemoMode: false });
    }

    if (action === 'forecast') {
      const forecast = await forecastBudget(body.projectId || DEFAULT_PROJECT_ID);
      return NextResponse.json({ ...forecast, isDemoMode: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/budget]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/budget — update budget item or expense
export async function PATCH(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    const body = await req.json();
    const { id, type, action, ...updates } = body;
    
    // Handle expense status update in demo mode
    if (action === 'updateExpenseStatus') {
      return NextResponse.json({
        message: 'Status updated (Demo Mode)',
        id,
        status: updates.status,
        isDemoMode: true,
      });
    }
    
    // Simulate update in demo mode
    return NextResponse.json({
      message: 'Updated successfully (Demo Mode)',
      id,
      type,
      updates,
      isDemoMode: true,
    });
  }
  
  try {
    const body = await req.json();
    const { id, type, action, ...data } = body;
    
    // Handle expense status update
    if (action === 'updateExpenseStatus') {
      const expense = await prisma.expense.update({
        where: { id },
        data: { status: data.status },
      });
      return NextResponse.json({ message: 'Status updated', expense, isDemoMode: false });
    }
    
    if (type === 'item') {
      const item = await prisma.budgetItem.update({
        where: { id },
        data: {
          description: data.description,
          quantity: data.quantity ? new (require('@prisma/client')).Decimal(data.quantity) : undefined,
          unit: data.unit,
          rate: data.rate ? new (require('@prisma/client')).Decimal(data.rate) : undefined,
          rateLow: data.rateLow ? new (require('@prisma/client')).Decimal(data.rateLow) : undefined,
          rateHigh: data.rateHigh ? new (require('@prisma/client')).Decimal(data.rateHigh) : undefined,
          total: data.total ? new (require('@prisma/client')).Decimal(data.total) : undefined,
          notes: data.notes,
        },
      });
      return NextResponse.json({ message: 'Item updated', item, isDemoMode: false });
    }
    
    if (type === 'expense') {
      const expense = await prisma.expense.update({
        where: { id },
        data: {
          category: data.category,
          description: data.description,
          amount: data.amount ? new (require('@prisma/client')).Decimal(data.amount) : undefined,
          date: data.date ? new Date(data.date) : undefined,
          vendor: data.vendor,
          status: data.status,
          notes: data.notes,
        },
      });
      return NextResponse.json({ message: 'Expense updated', expense, isDemoMode: false });
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[PATCH /api/budget]', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/budget — delete expense
export async function DELETE(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    const body = await req.json();
    const { action, id } = body;
    
    if (action === 'deleteExpense') {
      return NextResponse.json({
        message: 'Expense deleted (Demo Mode)',
        id,
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const { action, id } = body;
    
    if (action === 'deleteExpense') {
      await prisma.expense.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Expense deleted', isDemoMode: false });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[DELETE /api/budget]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
