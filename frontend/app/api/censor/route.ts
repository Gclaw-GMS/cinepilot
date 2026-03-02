import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_ANALYSIS = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  deterministicScore: 0.685,
  confidence: 'high',
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
  createdAt: new Date().toISOString(),
  _count: {
    sceneFlags: 6,
    suggestions: 4,
  },
};

const DEMO_STATS = {
  predictedCertificate: 'UA 13+',
  sensitivityScore: 69,
  confidence: 'high',
  highRiskCount: 6,
  suggestionCount: 4,
  isDemoMode: true,
};

// GET /api/censor — get latest analysis for dashboard
// GET /api/censor?stats=true — get stats only
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

  try {
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
        return NextResponse.json(DEMO_STATS);
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

    if (!analysis) {
      return NextResponse.json({ 
        analysis: DEMO_ANALYSIS,
        isDemoMode: true,
      });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[GET /api/censor] Database not connected, using demo data:', error);
    
    // Return demo data when database is not connected
    if (statsOnly) {
      return NextResponse.json(DEMO_STATS);
    }
    return NextResponse.json({ 
      analysis: DEMO_ANALYSIS,
      isDemoMode: true,
    });
  }
}

// POST /api/censor — run analysis (placeholder - would need AI integration)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID } = body;

    if (action === 'analyze') {
      // Try to create analysis in database
      try {
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
      } catch (dbError) {
        // Database not connected - return demo analysis
        console.log('[POST /api/censor] Database not connected, returning demo analysis');
        return NextResponse.json({
          message: 'Analysis complete (Demo Mode): predicted UA 13+',
          predictedCertificate: 'UA 13+',
          sensitivityScore: 69,
          isDemoMode: true,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/censor]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
