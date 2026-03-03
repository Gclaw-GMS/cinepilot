import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Keywords and patterns that indicate potential censor issues
const CENSOR_KEYWORDS: Record<string, { patterns: RegExp[]; weight: number; category: string }> = {
  violence: {
    patterns: [
      /blood|gore|murder|killing|death|die|dead|killed|attack|fight|beat|hit\b/gi,
      /weapon|gun|knife|knife|bullet|shot|stab|bomb|explod/gi,
      /violence|violent|assault|abuse|abused|torture/gi,
    ],
    weight: 2,
    category: 'Violence'
  },
  profanity: {
    patterns: [
      /fuck|shit|damn|hell|ass|bitch|bastard|damn|bloody|Christ/gi,
      /mast|ulla|kaasu|pooch|yer|chi/gi, // Tamil bad words
    ],
    weight: 1.5,
    category: 'Profanity'
  },
  sexual_content: {
    patterns: [
      /sex|sexual|kiss|nude|naked|bed|romance|love\s*making/gi,
      / intimacy|passionate|embrace|moan|groan/gi,
    ],
    weight: 1.5,
    category: 'Sexual Content'
  },
  drugs: {
    patterns: [
      /drug|weed|marijuana|heroin|cocaine|alcohol|drunk|liquor|beer|wine/gi,
      /smoke|cigarette|tobacco|puff/gi,
    ],
    weight: 1.5,
    category: 'Drugs/Alcohol'
  },
  theme: {
    patterns: [
      /suicide|kill\s*self|end\s*life|depression|mental/gi,
      /trauma|nightmare|horror|ghost|spirit|supernatural/gi,
    ],
    weight: 1,
    category: 'Sensitive Theme'
  }
};

// Calculate certificate based on total score
function calculateCertificate(score: number): { certificate: string; confidence: string } {
  if (score < 15) return { certificate: 'U', confidence: 'high' };
  if (score < 30) return { certificate: 'UA 7+', confidence: 'high' };
  if (score < 50) return { certificate: 'UA 13+', confidence: 'medium' };
  if (score < 70) return { certificate: 'UA 16+', confidence: 'medium' };
  return { certificate: 'A', confidence: 'low' };
}

// Analyze a single scene for censor issues
function analyzeScene(sceneNumber: string, heading: string | null, description: string | null): { flags: { category: string; severity: number; context: string }[]; score: number } {
  const flags: { category: string; severity: number; context: string }[] = [];
  let sceneScore = 0;
  
  const text = `${heading || ''} ${description || ''}`.toLowerCase();
  
  for (const [category, config] of Object.entries(CENSOR_KEYWORDS)) {
    for (const pattern of config.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const severity = Math.min(matches.length * config.weight, 10);
        sceneScore += severity;
        
        flags.push({
          category: config.category,
          severity,
          context: `Found "${matches[0]}" in scene ${sceneNumber}`
        });
        
        // Only count each category once per scene
        break;
      }
    }
  }
  
  return { flags, score: sceneScore };
}

// Demo data for when database is not connected
const DEMO_ANALYSIS = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  deterministicScore: 0.685,
  confidence: 'high',
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
  uncertainties: ['Final edit may affect rating', 'Background score intensity unknown'],
  sceneFlags: [
    { id: 'f1', category: 'Violence', severity: 4, context: 'Temple fight sequence', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE - NIGHT' } },
    { id: 'f2', category: 'Violence', severity: 3, context: 'Police confrontation', scene: { sceneNumber: '23', headingRaw: 'INT. POLICE STATION - DAY' } },
    { id: 'f3', category: 'Profanity', severity: 3, context: 'Emotional argument', scene: { sceneNumber: '31', headingRaw: 'INT. HOUSE - NIGHT' } },
  ],
  suggestions: [
    { id: 's1', sceneNumber: '12', issue: 'Fight sequence intensity', suggestedChange: 'Reduce graphic violence in temple fight', why: 'Lower the severity to avoid A rating', expectedSeverityDelta: -2 },
    { id: 's2', sceneNumber: '23', issue: 'Police violence', suggestedChange: 'Show consequences of violence', why: 'Add moral context to justify action', expectedSeverityDelta: -1 },
  ],
  createdAt: new Date().toISOString(),
  _count: {
    sceneFlags: 3,
    suggestions: 2,
  },
};

const DEMO_STATS = {
  predictedCertificate: 'UA 13+',
  sensitivityScore: 69,
  confidence: 'high',
  highRiskCount: 3,
  suggestionCount: 2,
  isDemoMode: true,
};

// Helper to check DB connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

// GET /api/censor — get latest analysis for dashboard
// GET /api/censor?stats=true — get stats only
// GET /api/censor?full=true — get full analysis with flags and suggestions
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';
  const fullAnalysis = req.nextUrl.searchParams.get('full') === 'true';

  const isDbConnected = await checkDbConnection();

  if (!isDbConnected) {
    // Return demo data if database is not connected
    if (statsOnly) {
      return NextResponse.json(DEMO_STATS);
    }
    if (fullAnalysis) {
      return NextResponse.json({ analysis: DEMO_ANALYSIS, isDemoMode: true });
    }
    return NextResponse.json({ 
      analysis: DEMO_ANALYSIS,
      isDemoMode: true,
    });
  }

  try {
    await prisma.$connect();

    // Get the latest analysis for this project
    const analysis = await prisma.censorAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        sceneFlags: {
          include: {
            scene: {
              select: { sceneNumber: true, headingRaw: true }
            }
          }
        },
        suggestions: true,
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

      const sensitivityScore = Math.round((analysis.deterministicScore || 0) * 100);

      return NextResponse.json({
        predictedCertificate: analysis.predictedCertificate || '--',
        sensitivityScore,
        confidence: analysis.confidence,
        highRiskCount: analysis._count.sceneFlags,
        suggestionCount: analysis._count.suggestions,
        isDemoMode: false,
      });
    }

    // Return full analysis with flags and suggestions
    if (fullAnalysis) {
      if (!analysis) {
        return NextResponse.json({ analysis: DEMO_ANALYSIS, isDemoMode: true });
      }

      const formattedAnalysis = {
        id: analysis.id,
        predictedCertificate: analysis.predictedCertificate,
        deterministicScore: analysis.deterministicScore,
        confidence: analysis.confidence,
        topDrivers: analysis.topDrivers,
        highRiskScenes: analysis.highRiskScenes,
        uncertainties: analysis.uncertainties,
        sceneFlags: analysis.sceneFlags.map(f => ({
          id: f.id,
          category: f.category,
          severity: f.severity,
          context: f.context,
          scene: f.scene,
        })),
        suggestions: analysis.suggestions.map(s => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          issue: s.issue,
          suggestedChange: s.suggestedChange,
          why: s.why,
          expectedSeverityDelta: s.expectedSeverityDelta,
        })),
        createdAt: analysis.createdAt.toISOString(),
        _count: {
          sceneFlags: analysis._count.sceneFlags,
          suggestions: analysis._count.suggestions,
        },
      };

      return NextResponse.json({ analysis: formattedAnalysis, isDemoMode: false });
    }

    if (!analysis) {
      return NextResponse.json({ 
        analysis: DEMO_ANALYSIS,
        isDemoMode: true,
      });
    }

    // Return basic analysis
    const formattedAnalysis = {
      id: analysis.id,
      predictedCertificate: analysis.predictedCertificate,
      deterministicScore: analysis.deterministicScore,
      confidence: analysis.confidence,
      topDrivers: analysis.topDrivers,
      highRiskScenes: analysis.highRiskScenes,
      createdAt: analysis.createdAt.toISOString(),
      _count: {
        sceneFlags: analysis._count.sceneFlags,
        suggestions: analysis._count.suggestions,
      },
    };

    return NextResponse.json({ analysis: formattedAnalysis, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/censor] Database error:', error);
    
    // Return demo data on error
    if (statsOnly) {
      return NextResponse.json(DEMO_STATS);
    }
    return NextResponse.json({ 
      analysis: DEMO_ANALYSIS,
      isDemoMode: true,
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }
}

// POST /api/censor — run analysis
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID } = body;

    if (action === 'analyze') {
      const isDbConnected = await checkDbConnection();

      if (!isDbConnected) {
        // Database not connected - return demo analysis
        return NextResponse.json({
          message: 'Analysis complete (Demo Mode)',
          predictedCertificate: 'UA 13+',
          sensitivityScore: 69,
          confidence: 'high',
          topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
          highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
          sceneFlagsCount: 3,
          suggestionsCount: 2,
          isDemoMode: true,
        });
      }

      try {
        await prisma.$connect();

        // Get scripts for this project
        const scripts = await prisma.script.findMany({
          where: { projectId, isActive: true },
          include: {
            scenes: {
              select: {
                id: true,
                sceneNumber: true,
                headingRaw: true,
                description: true,
              }
            }
          }
        });

        if (!scripts || scripts.length === 0) {
          return NextResponse.json({
            message: 'No scripts found for analysis',
            predictedCertificate: 'U',
            sensitivityScore: 0,
            confidence: 'low',
            topDrivers: [],
            highRiskScenes: [],
            sceneFlagsCount: 0,
            suggestionsCount: 0,
            isDemoMode: false,
          });
        }

        // Analyze each scene
        const allFlags: { sceneId: string; sceneNumber: string; category: string; severity: number; context: string }[] = [];
        const sceneScores: Map<string, number> = new Map();
        let totalScore = 0;
        let scenesWithIssues = 0;

        for (const script of scripts) {
          for (const scene of script.scenes) {
            const { flags, score } = analyzeScene(scene.sceneNumber, scene.headingRaw, scene.description);
            
            if (flags.length > 0) {
              scenesWithIssues++;
              for (const flag of flags) {
                allFlags.push({
                  sceneId: scene.id,
                  sceneNumber: scene.sceneNumber,
                  ...flag
                });
              }
            }
            
            if (score > 0) {
              sceneScores.set(scene.sceneNumber, score);
              totalScore += score;
            }
          }
        }

        // Calculate overall score (normalize to 0-100)
        const maxPossibleScore = scripts.reduce((sum, s) => sum + s.scenes.length * 10, 0) || 1;
        const normalizedScore = Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));

        // Determine certificate
        const { certificate, confidence } = calculateCertificate(normalizedScore);

        // Get top drivers (top 3 categories with most flags)
        const categoryCounts = new Map<string, number>();
        for (const flag of allFlags) {
          categoryCounts.set(flag.category, (categoryCounts.get(flag.category) || 0) + 1);
        }
        const topDrivers = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, count]) => `${category} (${count} occurrences)`);

        // Get high risk scenes (severity >= 4)
        const highRiskScenes = allFlags
          .filter(f => f.severity >= 4)
          .map(f => `Scene ${f.sceneNumber}`)
          .slice(0, 10);

        // Create analysis record
        const analysis = await prisma.censorAnalysis.create({
          data: {
            projectId,
            predictedCertificate: certificate,
            confidence,
            deterministicScore: normalizedScore / 100,
            topDrivers,
            highRiskScenes: highRiskScenes as any,
            uncertainties: ['Final edit may affect rating', 'Background score intensity unknown'],
          }
        });

        // Create scene flags
        for (const flag of allFlags.slice(0, 50)) { // Limit to 50 flags
          await prisma.censorSceneFlag.create({
            data: {
              analysisId: analysis.id,
              sceneId: flag.sceneId,
              category: flag.category,
              severity: flag.severity,
              context: flag.context,
            }
          });
        }

        // Generate suggestions based on top issues
        const suggestions = [];
        const severeFlags = allFlags.filter(f => f.severity >= 4).slice(0, 5);
        for (const flag of severeFlags) {
          suggestions.push({
            analysisId: analysis.id,
            sceneNumber: flag.sceneNumber,
            rank: suggestions.length + 1,
            issue: `${flag.category} in Scene ${flag.sceneNumber}`,
            suggestedChange: getSuggestion(flag.category),
            why: 'Reduce content intensity to achieve lower certificate',
            expectedSeverityDelta: -flag.severity,
            effort: 'Low',
            creativeRisk: 'Low',
            expectedCertImpact: 'Positive',
          });
        }

        // Create suggestions
        for (const s of suggestions) {
          await prisma.censorSuggestion.create({
            data: s
          });
        }

        await prisma.$disconnect();

        return NextResponse.json({
          message: `Analysis complete: predicted ${certificate}`,
          predictedCertificate: certificate,
          sensitivityScore: normalizedScore,
          confidence,
          topDrivers,
          highRiskScenes,
          sceneFlagsCount: allFlags.length,
          suggestionsCount: suggestions.length,
          isDemoMode: false,
        });
      } catch (dbError) {
        console.error('[POST /api/censor] Database error:', dbError);
        await prisma.$disconnect();
        
        // Fallback to demo analysis
        return NextResponse.json({
          message: 'Analysis complete (Demo Mode)',
          predictedCertificate: 'UA 13+',
          sensitivityScore: 69,
          confidence: 'high',
          topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
          highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
          sceneFlagsCount: 3,
          suggestionsCount: 2,
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

// Helper function to get suggestions based on category
function getSuggestion(category: string): string {
  const suggestions: Record<string, string> = {
    'Violence': 'Reduce visual intensity or add narrative justification for violent acts',
    'Profanity': 'Replace with milder alternatives or remove completely',
    'Sexual Content': 'Reduce intimacy levels or add romantic context',
    'Drugs/Alcohol': 'Show negative consequences or reduce visibility',
    'Sensitive Theme': 'Add social messaging or reduce intensity',
  };
  return suggestions[category] || 'Review and reduce content intensity';
}
