import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBudget, forecastBudget, addExpense } from '@/lib/budget/engine';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/budget — get budget data
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

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

    return NextResponse.json({ items, expenses, forecast });
  } catch (error) {
    console.error('[GET /api/budget]', error);
    return NextResponse.json({ error: 'Failed to fetch budget data' }, { status: 500 });
  }
}

// POST /api/budget — generate budget or add expense
export async function POST(req: NextRequest) {
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/budget]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
