import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/redis/cache';
import { runTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';
import {
  SceneFlaggingSchema,
  CertificateCalibrationSchema,
  TargetOptimizerSchema,
  type SceneFlaggingResult,
  type CertificateCalibrationResult,
  type TargetOptimizerResult,
} from '@/lib/ai/schemas';

// =============================================================================
// Censor Board Analyzer
// Scene flagging → Deterministic score → Certificate prediction → Cut suggestions
// =============================================================================

const CATEGORY_WEIGHTS: Record<string, number> = {
  child_harm: 5.0,
  sexual_content: 3.5,
  hate: 3.0,
  drugs: 2.5,
  violence: 2.0,
  profanity: 1.5,
};

const CERT_THRESHOLDS = [
  { cert: 'U', maxScore: 2 },
  { cert: 'UA 7+', maxScore: 5 },
  { cert: 'UA 13+', maxScore: 12 },
  { cert: 'UA 16+', maxScore: 20 },
  { cert: 'A', maxScore: 40 },
  { cert: 'S', maxScore: Infinity },
];

// -----------------------------------------------------------------------------
// Stage 1: Scene-by-Scene Flagging
// -----------------------------------------------------------------------------

async function flagScene(
  sceneId: string,
  sceneNumber: string,
  sceneText: string
): Promise<SceneFlaggingResult> {
  const cacheKey = `censor_flag:${sceneId}`;
  const cached = await cacheGet<SceneFlaggingResult>(cacheKey);
  if (cached) return cached;

  const result = await runTask<SceneFlaggingResult>(
    'censor.sceneFlagging',
    { sceneId, sceneNumber, sceneText },
    PROMPTS.censorBoard.sceneFlagging.system,
    PROMPTS.censorBoard.sceneFlagging.user,
    SceneFlaggingSchema,
    { maxTokens: 2048 }
  );

  await cacheSet(cacheKey, result, CACHE_TTL.ai);
  return result;
}

// -----------------------------------------------------------------------------
// Stage 2: Deterministic Score
// -----------------------------------------------------------------------------

function computeDeterministicScore(
  allFlags: { category: string; severity: number; context: string }[]
): number {
  let score = 0;
  for (const flag of allFlags) {
    const weight = CATEGORY_WEIGHTS[flag.category] || 1;
    const contextMultiplier = flag.context === 'glorified' ? 1.5 : flag.context === 'comic' ? 0.6 : 1.0;
    score += flag.severity * weight * contextMultiplier;
  }
  return Math.round(score * 100) / 100;
}

function predictCertFromScore(score: number): string {
  for (const t of CERT_THRESHOLDS) {
    if (score <= t.maxScore) return t.cert;
  }
  return 'S';
}

// -----------------------------------------------------------------------------
// Full Censor Analysis Pipeline
// -----------------------------------------------------------------------------

export async function runCensorAnalysis(projectId: string) {
  const scenes = await prisma.scene.findMany({
    where: { script: { projectId } },
    include: { script: { select: { content: true } } },
    orderBy: { sceneIndex: 'asc' },
  });

  if (scenes.length === 0) throw new Error('No scenes found');

  const allFlags: { sceneId: string; sceneNumber: string; flags: SceneFlaggingResult['flags'] }[] = [];

  for (const scene of scenes) {
    const scriptLines = scene.script?.content?.split('\n') || [];
    const sceneText = scriptLines
      .slice(Math.max(0, (scene.startLine || 1) - 1), scene.endLine || scriptLines.length)
      .join('\n');

    if (!sceneText || sceneText.trim().length < 10) continue;

    try {
      const result = await flagScene(scene.id, scene.sceneNumber, sceneText);
      if (result.flags.length > 0) {
        allFlags.push({ sceneId: scene.id, sceneNumber: scene.sceneNumber, flags: result.flags });
      }
    } catch (err) {
      console.warn(`[Censor] Failed to flag scene ${scene.sceneNumber}:`, err);
    }
  }

  const flatFlags = allFlags.flatMap(sf => sf.flags);
  const deterministicScore = computeDeterministicScore(flatFlags);
  const deterministicCert = predictCertFromScore(deterministicScore);

  let aiPrediction: CertificateCalibrationResult | null = null;
  try {
    const aggregatedFlags = allFlags.map(sf => ({
      scene: sf.sceneNumber,
      flags: sf.flags.map(f => ({ category: f.category, severity: f.severity, context: f.context })),
    }));

    const rkbSummary = Object.entries(CATEGORY_WEIGHTS).map(([cat]) => {
      const catFlags = flatFlags.filter(f => f.category === cat);
      const maxSev = catFlags.length > 0 ? Math.max(...catFlags.map(f => f.severity)) : 0;
      return `${cat}: ${catFlags.length} instances, max severity ${maxSev}`;
    }).join('. ');

    aiPrediction = await runTask<CertificateCalibrationResult>(
      'censor.certificateCalibration',
      {
        aggregatedFlags: JSON.stringify(aggregatedFlags),
        deterministicScore: deterministicScore.toString(),
        rkbSummary,
      },
      PROMPTS.censorBoard.certificateCalibration.system,
      PROMPTS.censorBoard.certificateCalibration.user,
      CertificateCalibrationSchema,
      { maxTokens: 2048 }
    );
  } catch (err) {
    console.warn('[Censor] AI calibration failed, using deterministic only:', err);
  }

  const analysis = await prisma.censorAnalysis.create({
    data: {
      projectId,
      predictedCertificate: aiPrediction?.predicted_certificate || deterministicCert,
      confidence: aiPrediction?.confidence || 'med',
      deterministicScore,
      topDrivers: aiPrediction?.top_drivers || [],
      highRiskScenes: aiPrediction?.high_risk_scenes || [],
      uncertainties: aiPrediction?.uncertainties || [],
    },
  });

  for (const sf of allFlags) {
    for (const flag of sf.flags) {
      await prisma.censorSceneFlag.create({
        data: {
          analysisId: analysis.id,
          sceneId: sf.sceneId,
          category: flag.category,
          severity: flag.severity,
          context: flag.context,
          evidence: flag.evidence as any,
        },
      });
    }
  }

  return {
    analysisId: analysis.id,
    predictedCertificate: aiPrediction?.predicted_certificate || deterministicCert,
    confidence: aiPrediction?.confidence || 'med',
    deterministicScore,
    topDrivers: aiPrediction?.top_drivers || [],
    highRiskScenes: aiPrediction?.high_risk_scenes || [],
    uncertainties: aiPrediction?.uncertainties || [],
    flaggedScenes: allFlags.length,
    totalFlags: flatFlags.length,
  };
}

// -----------------------------------------------------------------------------
// Target Optimizer (Cut Suggestions)
// -----------------------------------------------------------------------------

export async function suggestCuts(analysisId: string, targetCertificate: string) {
  const analysis = await prisma.censorAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      sceneFlags: { orderBy: { severity: 'desc' } },
    },
  });

  if (!analysis) throw new Error('Analysis not found');

  const blockers = analysis.sceneFlags
    .filter(f => f.severity >= 3)
    .map(f => `Scene ${f.sceneId}: ${f.category} (severity ${f.severity}, context: ${f.context})`);

  const result = await runTask<TargetOptimizerResult>(
    'censor.targetOptimizer',
    {
      targetCertificate,
      currentPrediction: analysis.predictedCertificate || 'Unknown',
      blockers: blockers.join('\n'),
    },
    PROMPTS.censorBoard.targetOptimizer.system,
    PROMPTS.censorBoard.targetOptimizer.user,
    TargetOptimizerSchema,
    { maxTokens: 4096 }
  );

  for (const rec of result.recommendations) {
    await prisma.censorSuggestion.create({
      data: {
        analysisId,
        sceneNumber: rec.scene_number,
        rank: rec.rank,
        issue: rec.issue,
        suggestedChange: rec.suggested_change,
        why: rec.why || null,
        expectedSeverityDelta: rec.expected_severity_delta,
        effort: rec.effort,
        creativeRisk: rec.creative_risk,
        expectedCertImpact: rec.expected_certificate_impact || null,
      },
    });
  }

  return result;
}

// -----------------------------------------------------------------------------
// Get Latest Analysis
// -----------------------------------------------------------------------------

export async function getLatestAnalysis(projectId: string) {
  return prisma.censorAnalysis.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      sceneFlags: {
        orderBy: { severity: 'desc' },
        include: { scene: { select: { sceneNumber: true, headingRaw: true } } },
      },
      suggestions: { orderBy: { rank: 'asc' } },
    },
  });
}
