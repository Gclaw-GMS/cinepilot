import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion, AiServiceError } from '@/lib/ai/service';
import { MODELS } from '@/lib/ai/config';

const AIML_API_KEY = process.env.AIML_API_KEY || '';

// Demo responses for when AI is unavailable
const DEMO_RESPONSES: Record<string, string> = {
  default: `👋 Hi there! I'm running in demo mode since the AI service isn't configured.

Here's what I can help you with when fully set up:

• 📅 **Shooting Schedule** - Day-by-day breakdown and optimization
• 💰 **Budget Analysis** - Cost tracking, forecasts, and variance reports
• 👥 **Crew Management** - Availability, assignments, and contact info
• 🎬 **Script Insights** - Scene analysis, character breakdowns
• ⚠️ **Risk Assessment** - Production warnings and mitigation plans
• 📍 **Location Scout** - Venue recommendations and logistics

**To enable AI features:**
1. Add your AIML_API_KEY to .env.local
2. Restart the development server

Would you like to explore any of these features directly?`,
  schedule: `📅 **Shooting Schedule Overview**

Based on your project data:
- **Total Days:** 8 scheduled shooting days
- **Date Range:** To be confirmed
- **Scenes per Day:** Average 3-4 scenes/day
- **Status:** Planning in progress

Would you like me to generate a detailed schedule?`,
  budget: `💰 **Budget Status**

Based on your project data:
- **Total Planned:** ₹8.5 Crores
- **Spent so Far:** ₹3.2 Crores (38%)
- **Remaining:** ₹5.3 Crores

Major categories:
- Production: ₹3.5Cr
- Post-Production: ₹2Cr
- Contingency: ₹1Cr

Would you like a detailed breakdown?`,
  crew: `👥 **Crew Availability**

Your project has **8** team members:
- **Active:** 5 members
- **Busy:** 2 members  
- **Offline:** 1 member

Departments: Direction, Camera, Lighting, Sound, Art, VFX, Stunts

Would you like to see detailed crew assignments?`,
  script: `📜 **Script Summary**

Your project includes:
- **2 Scripts** in the system
- **47 Total Scenes** across all scripts
- **23 Characters** defined

Key scenes include action sequences, dialogues, and song sequences typical of South Indian cinema.

Would you like a detailed scene breakdown?`,
  risk: `⚠️ **Production Risk Assessment**

Current warnings in the system:
- Schedule conflicts
- Weather contingencies needed
- Budget variance tracking

**Mitigation strategies:**
- Backup locations identified
- Buffer days scheduled
- Contingency fund allocated

Would you like a detailed risk report?`,
};

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('schedule') || lower.includes('day') || lower.includes('shoot')) {
    return DEMO_RESPONSES.schedule;
  }
  if (lower.includes('budget') || lower.includes('cost') || lower.includes(' expense') || lower.includes('₹')) {
    return DEMO_RESPONSES.budget;
  }
  if (lower.includes('crew') || lower.includes('team') || lower.includes('member') || lower.includes('cast')) {
    return DEMO_RESPONSES.crew;
  }
  if (lower.includes('script') || lower.includes('scene') || lower.includes('character')) {
    return DEMO_RESPONSES.script;
  }
  if (lower.includes('risk') || lower.includes('warn') || lower.includes('issue') || lower.includes('problem')) {
    return DEMO_RESPONSES.risk;
  }
  return DEMO_RESPONSES.default;
}

async function ensureDefaultProject(): Promise<string> {
  try {
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
  } catch (dbError) {
    // Return demo project ID if database unavailable
    return 'demo-project';
  }
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

// GET /api/chat - Get chat context and capabilities
export async function GET(req: NextRequest) {
  let context: any = null;
  let projectId = 'demo-project';
  let isDemoMode = false;

  // Try to get project context
  try {
    projectId = await ensureDefaultProject();
    if (projectId !== 'demo-project') {
      context = await buildProjectContext(projectId);
    }
  } catch (dbError) {
    console.warn('Database unavailable, using demo mode');
    isDemoMode = true;
  }

  // Default context for demo mode
  if (!context) {
    context = {
      scriptsCount: 2,
      scenesCount: 47,
      budgetSummary: { totalPlanned: 85000000, totalActual: 32000000 },
      scheduleSummary: { totalDays: 8 },
      crewCount: 8,
      recentWarnings: [],
    };
  }

  const aiConfigured = Boolean(AIML_API_KEY && AIML_API_KEY !== 'your-aiml-api-key-here');

  return NextResponse.json({
    capabilities: [
      'schedule_query',
      'budget_analysis', 
      'crew_management',
      'script_insights',
      'risk_assessment',
      'general_assistance'
    ],
    context: {
      scriptsCount: context.scriptsCount,
      scenesCount: context.scenesCount,
      budgetTotal: context.budgetSummary?.totalPlanned || 0,
      scheduleDays: context.scheduleSummary?.totalDays || 0,
      crewCount: context.crewCount || 0,
      warningsCount: context.recentWarnings?.length || 0,
    },
    isDemoMode: !aiConfigured,
    aiEnabled: aiConfigured,
    suggestions: [
      'What scenes are scheduled for today?',
      'What is the current budget status?',
      'Show me the crew availability',
      'Give me an overview of the shooting schedule',
      'What are the current production risks?'
    ]
  });
}

export async function POST(req: NextRequest) {
  let context: any = null;
  let projectId = 'demo-project';
  let isDemoMode = false;

  // Try to get project context, fallback to demo if unavailable
  try {
    projectId = await ensureDefaultProject();
    if (projectId !== 'demo-project') {
      context = await buildProjectContext(projectId);
    }
  } catch (dbError) {
    console.warn('Database unavailable, using demo mode');
    isDemoMode = true;
  }

  // Default context for demo mode
  if (!context) {
    context = {
      scriptsCount: 2,
      scenesCount: 47,
      budgetSummary: { totalPlanned: 85000000, totalActual: 32000000 },
      scheduleSummary: { totalDays: 8 },
      crewCount: 8,
      recentWarnings: [],
    };
  }

  try {
    const body = await req.json();
    const { message, history } = body as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Check if AI API key is configured
    if (!AIML_API_KEY || AIML_API_KEY === 'your-aiml-api-key-here') {
      console.warn('AIML_API_KEY not configured, using demo responses');
      const demoResponse = getDemoResponse(message);
      return NextResponse.json({
        response: demoResponse,
        context: {
          scriptsCount: context.scriptsCount,
          scenesCount: context.scenesCount,
          budgetTotal: context.budgetSummary?.totalPlanned || 0,
          scheduleDays: context.scheduleSummary?.totalDays || 0,
          crewCount: context.crewCount || 0,
          warningsCount: context.recentWarnings?.length || 0,
        },
        isDemoMode: true,
        demoMessage: 'Running in demo mode - configure AIML_API_KEY for AI responses',
      });
    }

    // Try to get AI response
    try {
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
          budgetTotal: context.budgetSummary?.totalPlanned || 0,
          scheduleDays: context.scheduleSummary?.totalDays || 0,
          crewCount: context.crewCount || 0,
          warningsCount: context.recentWarnings?.length || 0,
        },
        isDemoMode: false,
      });
    } catch (aiError) {
      // AI service failed, fall back to demo responses
      console.error('AI service error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'AI service unavailable';
      
      // Check if it's an API key issue
      if (errorMessage.includes('API_KEY') || errorMessage.includes('not set')) {
        const demoResponse = getDemoResponse(message);
        return NextResponse.json({
          response: demoResponse,
          context: {
            scriptsCount: context.scriptsCount,
            scenesCount: context.scenesCount,
            budgetTotal: context.budgetSummary?.totalPlanned || 0,
            scheduleDays: context.scheduleSummary?.totalDays || 0,
            crewCount: context.crewCount || 0,
            warningsCount: context.recentWarnings?.length || 0,
          },
          isDemoMode: true,
          demoMessage: 'AI service error - using demo responses',
        });
      }
      
      throw aiError;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chat API error:', err);
    
    // Always return a response instead of erroring out
    return NextResponse.json({
      response: `I encountered an issue: ${errorMessage}. Please try again or check the console for details.`,
      context: {
        scriptsCount: context.scriptsCount,
        scenesCount: context.scenesCount,
        budgetTotal: context.budgetSummary?.totalPlanned || 0,
        scheduleDays: context.scheduleSummary?.totalDays || 0,
        crewCount: context.crewCount || 0,
        warningsCount: context.recentWarnings?.length || 0,
      },
      isDemoMode: true,
      error: errorMessage,
    });
  }
}
