import { NextRequest, NextResponse } from 'next/server';
import { runCensorAnalysis, suggestCuts, getLatestAnalysis } from '@/lib/censor/analyzer';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/censor — get latest analysis
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const analysis = await getLatestAnalysis(projectId);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[GET /api/censor]', error);
    return NextResponse.json({ error: 'Failed to fetch censor data' }, { status: 500 });
  }
}

// POST /api/censor — run analysis or suggest cuts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, analysisId, targetCertificate } = body;

    if (action === 'analyze') {
      const result = await runCensorAnalysis(projectId);
      return NextResponse.json({
        message: `Analysis complete: predicted ${result.predictedCertificate}`,
        ...result,
      });
    }

    if (action === 'suggestCuts' && analysisId && targetCertificate) {
      const result = await suggestCuts(analysisId, targetCertificate);
      return NextResponse.json({
        message: `${result.recommendations.length} cut suggestions generated`,
        ...result,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/censor]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
