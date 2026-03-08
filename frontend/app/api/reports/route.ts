import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Report types
interface ReportSummary {
  id: string;
  type: string;
  name: string;
  description: string;
  generatedAt: string;
  data: any;
}

interface ReportData {
  production: {
    totalScenes: number;
    totalCharacters: number;
    totalLocations: number;
    shootingDays: number;
    budget: number;
    spent: number;
  };
  schedule: {
    completedDays: number;
    totalDays: number;
    scenesShot: number;
    totalScenes: number;
  };
  crew: {
    totalMembers: number;
    departments: number;
    totalDailyRate: number;
  };
  censor: {
    certificate: string;
    score: number;
    issues: number;
  };
}

// Demo report data
const DEMO_REPORT: ReportData = {
  production: {
    totalScenes: 145,
    totalCharacters: 28,
    totalLocations: 12,
    shootingDays: 20,
    budget: 85000000,
    spent: 32000000,
  },
  schedule: {
    completedDays: 5,
    totalDays: 20,
    scenesShot: 38,
    totalScenes: 145,
  },
  crew: {
    totalMembers: 45,
    departments: 10,
    totalDailyRate: 450000,
  },
  censor: {
    certificate: 'UA 13+',
    score: 72,
    issues: 8,
  },
};

// Generate report based on type
async function generateReport(projectId: string, type: string): Promise<ReportData> {
  try {
    // Try to get real data from database
    const [scripts, characters, locations, schedule, crew, censor] = await Promise.all([
      prisma.script.findMany({ where: { projectId }, select: { id: true } }),
      prisma.character.findMany({ where: { projectId }, select: { id: true } }),
      prisma.location.findMany({ where: { projectId }, select: { id: true } }),
      prisma.shootingDay.findMany({ where: { projectId } }),
      prisma.crew.findMany({ where: { projectId } }),
      prisma.censorAnalysis.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' }, include: { sceneFlags: true } }),
    ]);

    const totalScenes = scripts.length;
    const totalCharacters = characters.length;
    const totalLocations = locations.length;
    const shootingDays = schedule.length;
    const completedDays = schedule.filter((d: any) => d.status === 'completed').length;

    return {
      production: {
        totalScenes,
        totalCharacters,
        totalLocations,
        shootingDays,
        budget: 85000000, // Would come from budget table
        spent: 32000000,
      },
      schedule: {
        completedDays,
        totalDays: shootingDays || 20,
        scenesShot: completedDays * 7, // Estimated
        totalScenes,
      },
      crew: {
        totalMembers: crew.length || 45,
        departments: new Set(crew.map((c: any) => c.department)).size || 10,
        totalDailyRate: crew.reduce((sum: number, c: any) => sum + (c.dailyRate || 0), 0) || 450000,
      },
      censor: {
        certificate: censor?.predictedCertificate || 'UA 13+',
        score: censor?.deterministicScore || 72,
        issues: censor?.sceneFlags?.length || 8,
      },
    };
  } catch {
    // Return demo data if database not available
    return DEMO_REPORT;
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const type = req.nextUrl.searchParams.get('type') || 'summary';

    // Generate report data
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
