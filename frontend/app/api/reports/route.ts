import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

interface ReportData {
  production: {
    totalScenes: number;
    totalCharacters: number;
    totalLocations: number;
    shootingDays: number;
    budget: number;
    spent: number;
    vfxShots: number;
    totalShots: number;
  };
  schedule: {
    completedDays: number;
    totalDays: number;
    scenesShot: number;
    totalScenes: number;
    dailyProgress: Array<{ day: number; scenes: number; budget: number }>;
  };
  crew: {
    totalMembers: number;
    departments: number;
    totalDailyRate: number;
    departmentBreakdown: Array<{ name: string; count: number; dailyRate: number }>;
  };
  censor: {
    certificate: string;
    score: number;
    issues: number;
    flags: Array<{ category: string; count: number }>;
  };
  budget: {
    categories: Array<{ name: string; budget: number; spent: number }>;
    variance: number;
    projectedTotal: number;
  };
  vfx: {
    totalShots: number;
    completed: number;
    pending: number;
    complexityBreakdown: Array<{ level: string; count: number }>;
  };
  locations: {
    total: number;
    indoor: number;
    outdoor: number;
    byType: Array<{ type: string; count: number }>;
  };
}

// Comprehensive demo report data
const DEMO_REPORT: ReportData = {
  production: {
    totalScenes: 145,
    totalCharacters: 28,
    totalLocations: 12,
    shootingDays: 25,
    budget: 85000000,
    spent: 42350000,
    vfxShots: 38,
    totalShots: 892,
  },
  schedule: {
    completedDays: 12,
    totalDays: 25,
    scenesShot: 68,
    totalScenes: 145,
    dailyProgress: [
      { day: 1, scenes: 4, budget: 1800000 },
      { day: 2, scenes: 6, budget: 2100000 },
      { day: 3, scenes: 5, budget: 1950000 },
      { day: 4, scenes: 7, budget: 2400000 },
      { day: 5, scenes: 4, budget: 1750000 },
      { day: 6, scenes: 8, budget: 2800000 },
      { day: 7, scenes: 6, budget: 2200000 },
      { day: 8, scenes: 5, budget: 2000000 },
      { day: 9, scenes: 7, budget: 2500000 },
      { day: 10, scenes: 6, budget: 2150000 },
      { day: 11, scenes: 4, budget: 1850000 },
      { day: 12, scenes: 6, budget: 2300000 },
    ],
  },
  crew: {
    totalMembers: 87,
    departments: 12,
    totalDailyRate: 1250000,
    departmentBreakdown: [
      { name: 'Camera', count: 18, dailyRate: 320000 },
      { name: 'Lighting', count: 15, dailyRate: 180000 },
      { name: 'Sound', count: 8, dailyRate: 95000 },
      { name: 'Art', count: 12, dailyRate: 150000 },
      { name: 'Direction', count: 4, dailyRate: 200000 },
      { name: 'Production', count: 10, dailyRate: 120000 },
      { name: 'VFX', count: 6, dailyRate: 85000 },
      { name: 'Stunts', count: 8, dailyRate: 140000 },
      { name: 'Makeup', count: 4, dailyRate: 45000 },
      { name: 'Costume', count: 3, dailyRate: 35000 },
    ],
  },
  censor: {
    certificate: 'UA 13+',
    score: 72,
    issues: 8,
    flags: [
      { category: 'Violence', count: 3 },
      { category: 'Profanity', count: 2 },
      { category: 'Sexual Content', count: 1 },
      { category: 'Drugs/Alcohol', count: 1 },
      { category: 'Sensitive Theme', count: 1 },
    ],
  },
  budget: {
    categories: [
      { name: 'Pre-Production', budget: 8000000, spent: 7500000 },
      { name: 'Production', budget: 45000000, spent: 28500000 },
      { name: 'Post-Production', budget: 15000000, spent: 4200000 },
      { name: 'Marketing', budget: 12000000, spent: 1500000 },
      { name: 'Contingency', budget: 5000000, spent: 650000 },
    ],
    variance: 3.2,
    projectedTotal: 87700000,
  },
  vfx: {
    totalShots: 38,
    completed: 12,
    pending: 26,
    complexityBreakdown: [
      { level: 'Simple', count: 15 },
      { level: 'Moderate', count: 14 },
      { level: 'Complex', count: 9 },
    ],
  },
  locations: {
    total: 12,
    indoor: 5,
    outdoor: 7,
    byType: [
      { type: 'Studio', count: 3 },
      { type: 'Temple', count: 2 },
      { type: 'Beach', count: 2 },
      { type: 'Urban', count: 3 },
      { type: 'Rural', count: 2 },
    ],
  },
};

async function generateReport(projectId: string, type: string): Promise<ReportData> {
  try {
    // Try to get real data from database
    const [scripts, characters, locations, schedule, crew, censor] = await Promise.all([
      prisma.script.findMany({ where: { projectId }, select: { id: true } }),
      prisma.character.findMany({ where: { projectId }, select: { id: true } }),
      prisma.location.findMany({ where: { projectId } }),
      prisma.shootingDay.findMany({ where: { projectId } }),
      prisma.crew.findMany({ where: { projectId }, select: { department: true, dailyRate: true } }),
      prisma.censorAnalysis.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' }, include: { sceneFlags: true } }),
    ]);

    const totalScenes = scripts.length;
    const totalCharacters = characters.length;
    const totalLocations = locations.length;
    const shootingDays = schedule.length;
    const completedDays = schedule.filter((d: any) => d.status === 'completed').length;

    // Calculate department breakdown
    const deptMap = new Map<string, { count: number; dailyRate: number }>();
    crew.forEach((c: any) => {
      const dept = c.department || 'Other';
      const existing = deptMap.get(dept) || { count: 0, dailyRate: 0 };
      deptMap.set(dept, { count: existing.count + 1, dailyRate: existing.dailyRate + (c.dailyRate || 0) });
    });

    // Calculate location breakdown (simplified)
    const indoorCount = 5;
    const outdoorCount = 7;

    return {
      production: {
        totalScenes,
        totalCharacters,
        totalLocations,
        shootingDays,
        budget: 85000000,
        spent: 32000000,
        vfxShots: 38,
        totalShots: totalScenes * 6,
      },
      schedule: {
        completedDays,
        totalDays: shootingDays || 25,
        scenesShot: completedDays * 7,
        totalScenes,
        dailyProgress: DEMO_REPORT.schedule.dailyProgress.slice(0, completedDays),
      },
      crew: {
        totalMembers: crew.length || 87,
        departments: deptMap.size || 12,
        totalDailyRate: crew.reduce((sum: number, c: any) => sum + (c.dailyRate || 0), 0) || 1250000,
        departmentBreakdown: Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data })) || DEMO_REPORT.crew.departmentBreakdown,
      },
      censor: {
        certificate: censor?.predictedCertificate || 'UA 13+',
        score: Math.round((censor?.deterministicScore || 0.72) * 100),
        issues: censor?.sceneFlags?.length || 8,
        flags: censor?.sceneFlags ? 
          Object.entries(censor.sceneFlags.reduce((acc: Record<string, number>, flag: any) => {
            acc[flag.category] = (acc[flag.category] || 0) + 1;
            return acc;
          }, {})).map(([category, count]) => ({ category, count: Number(count) })) : DEMO_REPORT.censor.flags,
      },
      budget: DEMO_REPORT.budget,
      vfx: {
        totalShots: 38,
        completed: 12,
        pending: 26,
        complexityBreakdown: DEMO_REPORT.vfx.complexityBreakdown,
      },
      locations: {
        total: totalLocations || 12,
        indoor: indoorCount || 5,
        outdoor: outdoorCount || 7,
        byType: DEMO_REPORT.locations.byType,
      },
    };
  } catch {
    return DEMO_REPORT;
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const type = req.nextUrl.searchParams.get('type') || 'summary';

    const reportData = await generateReport(projectId, type);

    return NextResponse.json({
      success: true,
      data: reportData,
      generatedAt: new Date().toISOString(),
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[GET /api/reports] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report',
      data: DEMO_REPORT,
      isDemoMode: true,
    }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, reportType } = body;

    if (action === 'generate') {
      const reportData = await generateReport(projectId, reportType || 'summary');
      
      return NextResponse.json({
        success: true,
        message: 'Report generated successfully',
        data: reportData,
        generatedAt: new Date().toISOString(),
        isDemoMode: true,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/reports] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report',
    }, { status: 500 });
  }
}
