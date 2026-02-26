import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/service';
import { MODELS } from '@/lib/ai/config';

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

async function buildProjectContext(projectId: string) {
  const [scriptsCount, scenesCount, budgetItems, shootingDays, warnings, crewCount] =
    await Promise.all([
      prisma.script.count({ where: { projectId } }),
      prisma.scene.count({
        where: { script: { projectId } },
      }),
      prisma.budgetItem.findMany({
        where: { projectId },
        select: { category: true, total: true, actualCost: true },
      }),
      prisma.shootingDay.findMany({
        where: { projectId },
        select: { dayNumber: true, scheduledDate: true, status: true },
        orderBy: { dayNumber: 'asc' },
      }),
      prisma.warning.findMany({
        where: { scene: { script: { projectId } } },
        select: { warningType: true, description: true, severity: true },
        orderBy: { severity: 'desc' },
        take: 10,
      }),
      prisma.crew.count({ where: { projectId } }),
    ]);

  const budgetSummary = {
    totalPlanned: budgetItems.reduce(
      (sum, item) => sum + (item.total ? Number(item.total) : 0),
      0,
    ),
    totalActual: budgetItems.reduce(
      (sum, item) => sum + (item.actualCost ? Number(item.actualCost) : 0),
      0,
    ),
    categories: [...new Set(budgetItems.map((b) => b.category))],
    itemCount: budgetItems.length,
  };

  const scheduleSummary = {
    totalDays: shootingDays.length,
    dateRange:
      shootingDays.length > 0
        ? {
            start: shootingDays[0].scheduledDate,
            end: shootingDays[shootingDays.length - 1].scheduledDate,
          }
        : null,
    statusBreakdown: shootingDays.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return {
    scriptsCount,
    scenesCount,
    budgetSummary,
    scheduleSummary,
    recentWarnings: warnings,
    crewCount,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const projectId = await ensureDefaultProject();
    const context = await buildProjectContext(projectId);

    const response = await chatCompletion(MODELS.gpt4o, [
      {
        role: 'system',
        content: `You are CinePilot AI, a production assistant for South Indian cinema. You have access to the project's data. Answer questions about the production using the context provided. Be concise and helpful. Context: ${JSON.stringify(context)}`,
      },
      ...(history || []).map((h) => ({
        role: h.role as 'user' | 'assistant' | 'system',
        content: h.content,
      })),
      { role: 'user', content: message },
    ]);

    return NextResponse.json({
      response,
      context: {
        scriptsCount: context.scriptsCount,
        scenesCount: context.scenesCount,
        budgetTotal: context.budgetSummary.totalPlanned,
        scheduleDays: context.scheduleSummary.totalDays,
        crewCount: context.crewCount,
        warningsCount: context.recentWarnings.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
