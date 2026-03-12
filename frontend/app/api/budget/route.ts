import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBudget, forecastBudget, addExpense } from '@/lib/budget/engine';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not available
const DEMO_ITEMS = [
  { id: '1', category: 'Production', subcategory: 'Director', description: 'Director Fee', quantity: '1', unit: 'film', rate: '5000000', total: '5000000', source: 'manual' },
  { id: '2', category: 'Production', subcategory: 'Cinematography', description: 'Cinematographer Fee', quantity: '1', unit: 'film', rate: '3000000', total: '3000000', source: 'manual' },
  { id: '3', category: 'Production', subcategory: 'Cast', description: 'Lead Actor', quantity: '2', unit: 'film', rate: '10000000', total: '20000000', source: 'manual' },
  { id: '4', category: 'Production', subcategory: 'Cast', description: 'Lead Actress', quantity: '1', unit: 'film', rate: '8000000', total: '8000000', source: 'manual' },
  { id: '5', category: 'Crew', subcategory: 'Camera', description: 'Camera Team', quantity: '30', unit: 'days', rate: '5000', total: '1500000', source: 'manual' },
  { id: '6', category: 'Crew', subcategory: 'Lighting', description: 'Lighting Team', quantity: '30', unit: 'days', rate: '8000', total: '2400000', source: 'manual' },
  { id: '7', category: 'Crew', subcategory: 'Sound', description: 'Sound Team', quantity: '30', unit: 'days', rate: '3000', total: '900000', source: 'manual' },
  { id: '8', category: 'Equipment', subcategory: 'Camera Rentals', description: 'ARRI Alexa Mini LF', quantity: '30', unit: 'days', rate: '75000', total: '2250000', source: 'manual' },
  { id: '9', category: 'Equipment', subcategory: 'Grip', description: 'Grip Equipment', quantity: '30', unit: 'days', rate: '15000', total: '450000', source: 'manual' },
  { id: '10', category: 'Locations', subcategory: 'Location Fees', description: 'Location Booking', quantity: '15', unit: 'days', rate: '100000', total: '1500000', source: 'manual' },
  { id: '11', category: 'Locations', subcategory: 'Permits', description: 'Government Permits', quantity: '1', unit: 'lump', rate: '500000', total: '500000', source: 'manual' },
  { id: '12', category: 'Art', subcategory: 'Set Construction', description: 'Set Build', quantity: '5', unit: 'sets', rate: '800000', total: '4000000', source: 'manual' },
  { id: '13', category: 'Art', subcategory: 'Props', description: 'Props & Furnishings', quantity: '1', unit: 'lump', rate: '1500000', total: '1500000', source: 'manual' },
  { id: '14', category: 'Costume', subcategory: 'Wardrobe', description: 'Costumes', quantity: '1', unit: 'lump', rate: '2000000', total: '2000000', source: 'manual' },
  { id: '15', category: 'Post-Production', subcategory: 'Editing', description: 'Editor Fee', quantity: '1', unit: 'film', rate: '2000000', total: '2000000', source: 'manual' },
  { id: '16', category: 'Post-Production', subcategory: 'VFX', description: 'VFX Work', quantity: '1', unit: 'lump', rate: '15000000', total: '15000000', source: 'manual' },
  { id: '17', category: 'Post-Production', subcategory: 'DI', description: 'Digital Intermediate', quantity: '1', unit: 'film', rate: '3000000', total: '3000000', source: 'manual' },
  { id: '18', category: 'Music', subcategory: 'Composition', description: 'Music Composer', quantity: '1', unit: 'film', rate: '5000000', total: '5000000', source: 'manual' },
  { id: '19', category: 'Music', subcategory: 'Lyrics', description: 'Lyricist', quantity: '5', unit: 'songs', rate: '200000', total: '1000000', source: 'manual' },
  { id: '20', category: 'Music', subcategory: 'Recording', description: 'Studio Recording', quantity: '5', unit: 'songs', rate: '150000', total: '750000', source: 'manual' },
  { id: '21', category: 'Marketing', subcategory: 'Promotions', description: 'Marketing Budget', quantity: '1', unit: 'lump', rate: '10000000', total: '10000000', source: 'manual' },
  { id: '22', category: 'Contingency', subcategory: 'Emergency', description: 'Contingency Fund', quantity: '1', unit: 'lump', rate: '8500000', total: '8500000', source: 'manual' },
]

const DEMO_EXPENSES = [
  { id: '1', category: 'Production', description: 'Director Advance', amount: '1000000', date: '2026-01-15', vendor: 'Director Account', status: 'approved', notes: 'First installment' },
  { id: '2', category: 'Equipment', description: 'Camera Rental Deposit', amount: '500000', date: '2026-01-20', vendor: 'Aries Films', status: 'approved', notes: 'Deposit for Alexa Mini' },
  { id: '3', category: 'Locations', description: 'Temple Permit', amount: '150000', date: '2026-01-25', vendor: 'HR & CE', status: 'approved', notes: 'Kapaleeshwarar Temple booking' },
  { id: '4', category: 'Art', description: 'Set Design Advance', amount: '800000', date: '2026-02-01', vendor: 'Art Director', status: 'pending', notes: 'Courtroom set design' },
  { id: '5', category: 'Crew', description: 'First Month Crew Salary', amount: '2500000', date: '2026-02-05', vendor: 'Multiple', status: 'approved', notes: 'Camera, Lighting, Sound teams' },
]

const DEMO_FORECAST = {
  planned: 105000000,
  actual: 32000000,
  eacTotal: 98000000,
  variance: 73000000,
  percentSpent: 30.5,
  categories: [
    { category: 'Production', planned: 36800000, actual: 15000000, forecast: 36000000, status: 'on_track' },
    { category: 'Crew', planned: 4800000, actual: 2500000, forecast: 4800000, status: 'on_track' },
    { category: 'Equipment', planned: 2700000, actual: 500000, forecast: 2700000, status: 'on_track' },
    { category: 'Locations', planned: 2000000, actual: 650000, forecast: 2000000, status: 'on_track' },
    { category: 'Art', planned: 7500000, actual: 800000, forecast: 7500000, status: 'warning' },
    { category: 'Costume', planned: 2000000, actual: 0, forecast: 2000000, status: 'pending' },
    { category: 'Post-Production', planned: 20000000, actual: 0, forecast: 20000000, status: 'pending' },
    { category: 'Music', planned: 6750000, actual: 0, forecast: 6750000, status: 'pending' },
    { category: 'Marketing', planned: 10000000, actual: 0, forecast: 8000000, status: 'pending' },
    { category: 'Contingency', planned: 8500000, actual: 0, forecast: 8500000, status: 'pending' },
  ],
}

// GET /api/budget — get budget data
// GET /api/budget?action=forecast — get forecast only (for dashboard)
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

    // Handle action=forecast for dashboard compatibility
    if (action === 'forecast') {
      const forecast = await forecastBudget(projectId);
      return NextResponse.json({
        totalPlanned: forecast.planned,
        totalActual: forecast.actual,
        variance: forecast.variance,
        percentSpent: forecast.percentSpent,
        forecast,
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

    return NextResponse.json({ items, expenses, forecast, _demo: false });
  } catch (error) {
    console.error('[GET /api/budget] Database not available, using demo data');
    // Use demo data when database is not available
    if (action === 'forecast') {
      return NextResponse.json({
        totalPlanned: DEMO_FORECAST.planned,
        totalActual: DEMO_FORECAST.actual,
        variance: DEMO_FORECAST.variance,
        percentSpent: DEMO_FORECAST.percentSpent,
        forecast: DEMO_FORECAST,
        _demo: true,
      });
    }
    
    return NextResponse.json({ 
      items: DEMO_ITEMS, 
      expenses: DEMO_EXPENSES, 
      forecast: DEMO_FORECAST,
      _demo: true,
    });
  }
}

// POST /api/budget — generate budget or add expense
export async function POST(req: NextRequest) {
  let body;
  let action;
  
  try {
    body = await req.json();
    action = body.action;

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

      return NextResponse.json({ message: 'Expense added', expense });
    }

    if (action === 'forecast') {
      const forecast = await forecastBudget(body.projectId || DEFAULT_PROJECT_ID);
      return NextResponse.json(forecast);
    }

    // Demo mode: return generated demo budget
    if (action === 'generate' && process.env.NODE_ENV !== 'production') {
      const scaleMultipliers: Record<string, number> = {
        micro: 0.2,
        indie: 0.5,
        mid: 1.0,
        big: 2.0,
      };
      const mult = scaleMultipliers[body.targetScale] || 1.0;
      
      return NextResponse.json({
        message: `Budget generated: ${DEMO_ITEMS.length} line items (demo mode)`,
        items: DEMO_ITEMS,
        totalPlanned: Math.round(105000000 * mult),
        totalActual: 0,
        _demo: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/budget]', error);
    
    // If action is generate, return demo data on error
    if (action === 'generate') {
      const scaleMultipliers: Record<string, number> = {
        micro: 0.2,
        indie: 0.5,
        mid: 1.0,
        big: 2.0,
      };
      const mult = scaleMultipliers[body.targetScale] || 1.0;
      
      return NextResponse.json({
        message: `Budget generated: ${DEMO_ITEMS.length} line items (demo mode)`,
        items: DEMO_ITEMS,
        totalPlanned: Math.round(105000000 * mult),
        totalActual: 0,
        isDemoMode: true,
      });
    }
    
    // If action is addExpense, return demo response
    if (action === 'addExpense') {
      return NextResponse.json({
        message: 'Expense added (demo mode)',
        expense: {
          id: `demo-${Date.now()}`,
          category: body.category,
          description: body.description,
          amount: body.amount,
          date: body.date,
          vendor: body.vendor,
          status: 'pending',
          notes: body.notes,
        },
        isDemoMode: true,
      });
    }
    
    // If action is forecast, return demo forecast
    if (action === 'forecast') {
      return NextResponse.json({
        ...DEMO_FORECAST,
        isDemoMode: true,
      });
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
