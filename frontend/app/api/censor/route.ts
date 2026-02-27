import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/censor — get latest analysis for dashboard
// GET /api/censor?stats=true — get stats only
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

    // Get the latest analysis for this project
    const analysis = await prisma.censorAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        predictedCertificate: true,
        deterministicScore: true,
        confidence: true,
        topDrivers: true,
        highRiskScenes: true,
        createdAt: true,
        _count: {
          select: {
            sceneFlags: true,
            suggestions: true,
          },
        },
      },
    });

    // For stats-only requests (dashboard), return flat format
    if (statsOnly) {
      if (!analysis) {
        return NextResponse.json({
          predictedCertificate: '--',
          sensitivityScore: 0,
        });
      }

      // Convert deterministic score (0-100) to sensitivity score
      const sensitivityScore = Math.round((analysis.deterministicScore || 0) * 100);

      return NextResponse.json({
        predictedCertificate: analysis.predictedCertificate || '--',
        sensitivityScore,
        confidence: analysis.confidence,
        highRiskCount: analysis._count.sceneFlags,
        suggestionCount: analysis._count.suggestions,
      });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[GET /api/censor]', error);
    return NextResponse.json({ error: 'Failed to fetch censor data' }, { status: 500 });
  }
}

// POST /api/censor — run analysis (placeholder - would need AI integration)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID } = body;

    if (action === 'analyze') {
      // This would normally call an AI service to analyze the script
      // For now, create a placeholder analysis
      const analysis = await prisma.censorAnalysis.create({
        data: {
          projectId,
          predictedCertificate: 'UA',
          confidence: 'medium',
          deterministicScore: 0.65,
          topDrivers: ['violence', 'language'],
          highRiskScenes: [],
        },
      });

      return NextResponse.json({
        message: `Analysis complete: predicted ${analysis.predictedCertificate}`,
        predictedCertificate: analysis.predictedCertificate,
        sensitivityScore: Math.round((analysis.deterministicScore || 0) * 100),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/censor]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
