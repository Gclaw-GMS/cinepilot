import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Content patterns for deterministic analysis
const CENSOR_PATTERNS = {
  violence: {
    keywords: ['gun', 'knife', 'blood', 'kill', 'murder', 'death', 'die', 'shoot', 'attack', 'fight', 'beat', 'stab', 'violence', 'assault', 'weapon', 'bomb', 'explosion'],
    weight: 2.5,
  },
  profanity: {
    keywords: ['damn', 'hell', 'shit', 'fuck', 'ass', 'bitch', 'bastard', 'cock', 'crap', 'bloody', 'goddamn', 'piss'],
    weight: 1.5,
  },
  drugs: {
    keywords: ['drug', 'marijuana', 'weed', 'cocaine', 'heroin', 'alcohol', 'beer', 'wine', 'whiskey', 'smoke', 'high', 'pills', 'medicine', 'injection'],
    weight: 2.0,
  },
  sexual_content: {
    keywords: ['kiss', 'love', 'romance', 'bed', 'naked', 'sex', 'intimate', 'embrace', 'passion', 'foreplay', '裸', '性爱', 'காதல்'],
    weight: 1.8,
  },
  hate: {
    keywords: ['hate', 'racist', 'discriminate', 'caste', 'communal'],
    weight: 2.2,
  },
  child_harm: {
    keywords: ['child', 'kid', 'baby', 'children', 'minor', 'young boy', 'young girl'],
    weight: 3.0,
  },
};

// Certificate thresholds
const CERT_THRESHOLDS = [
  { cert: 'U', maxScore: 0.15 },
  { cert: 'UA 7+', maxScore: 0.30 },
  { cert: 'UA 13+', maxScore: 0.50 },
  { cert: 'UA 16+', maxScore: 0.75 },
  { cert: 'A', maxScore: 0.90 },
  { cert: 'S', maxScore: 1.0 },
];

interface ScanResult {
  category: string;
  count: number;
  maxSeverity: number;
  instances: { text: string; severity: number; context: string }[];
}

function analyzeScriptContent(content: string): { results: Record<string, ScanResult>; totalScore: number } {
  const results: Record<string, ScanResult> = {};
  const lowerContent = content.toLowerCase();

  for (const [category, config] of Object.entries(CENSOR_PATTERNS)) {
    const instances: { text: string; severity: number; context: string }[] = [];
    let count = 0;
    let maxSeverity = 0;

    for (const keyword of config.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      
      if (matches) {
        const matchCount = matches.length;
        count += matchCount;
        
        // Determine severity based on keyword frequency
        const severity = Math.min(5, Math.ceil(matchCount * config.weight / 3));
        maxSeverity = Math.max(maxSeverity, severity);

        // Find context for each match
        let match;
        const contextRegex = new RegExp(`(.{0,30})${keyword}(.{0,30})`, 'gi');
        while ((match = contextRegex.exec(content)) !== null) {
          instances.push({
            text: keyword,
            severity,
            context: match[0],
          });
        }
      }
    }

    if (count > 0) {
      results[category] = {
        category,
        count,
        maxSeverity,
        instances: instances.slice(0, 3), // Limit to 3 instances per category
      };
    }
  }

  // Calculate total weighted score
  let totalScore = 0;
  for (const [category, result] of Object.entries(results)) {
    const config = CENSOR_PATTERNS[category as keyof typeof CENSOR_PATTERNS];
    totalScore += (result.count * config.weight * result.maxSeverity) / 100;
  }

  totalScore = Math.min(1.0, totalScore);

  return { results, totalScore };
}

function predictCertificate(score: number): { cert: string; confidence: string } {
  for (const threshold of CERT_THRESHOLDS) {
    if (score <= threshold.maxScore) {
      // Higher scores in lower ranges = lower confidence
      const confidence = score < threshold.maxScore * 0.3 ? 'high' : 
                        score < threshold.maxScore * 0.7 ? 'medium' : 'low';
      return { cert: threshold.cert, confidence };
    }
  }
  return { cert: 'S', confidence: 'low' };
}

function generateSuggestions(results: Record<string, ScanResult>, targetCert: string): { 
  rank: number; 
  sceneNumber: string; 
  issue: string; 
  suggestedChange: string;
  why: string;
  effort: string;
  creativeRisk: string;
  expectedCertImpact: string;
}[] {
  const suggestions: any[] = [];
  const targetIndex = CERT_THRESHOLDS.findIndex(c => c.cert === targetCert);
  
  let rank = 1;
  for (const [category, result] of Object.entries(results)) {
    if (result.count > 0) {
      const effort = result.count < 3 ? 'low' : result.count < 6 ? 'med' : 'high';
      const creativeRisk = category === 'sexual_content' ? 'med' : 
                           category === 'violence' ? 'low' : 'low';
      
      suggestions.push({
        rank: rank++,
        sceneNumber: 'All',
        issue: `Multiple instances of ${category.replace('_', ' ')} (${result.count} mentions)`,
        suggestedChange: `Consider reducing ${category.replace('_', ' ')} references or rephrasing to be less explicit`,
        why: `Each instance contributes to the overall sensitivity score. Removing or softening these will lower the certificate rating.`,
        effort,
        creativeRisk,
        expectedCertImpact: targetIndex > 0 ? `May reduce by ${CERT_THRESHOLDS[targetIndex - 1].cert}` : 'Already at lowest',
      });
    }
  }

  return suggestions.sort((a, b) => {
    const effortOrder = { low: 0, med: 1, high: 2 };
    return effortOrder[a.effort as keyof typeof effortOrder] - effortOrder[b.effort as keyof typeof effortOrder];
  });
}

// GET /api/censor — get latest analysis for dashboard
// GET /api/censor?stats=true — get stats only
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
    const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

    // Get the latest analysis for this project with full details
    const analysis = await prisma.censorAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        sceneFlags: {
          include: {
            scene: {
              select: { sceneNumber: true, headingRaw: true },
            },
          },
        },
        suggestions: {
          orderBy: { rank: 'asc' },
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
        highRiskCount: analysis.sceneFlags?.length || 0,
        suggestionCount: analysis.suggestions?.length || 0,
      });
    }

    // Format for frontend
    const formattedAnalysis = analysis ? {
      id: analysis.id,
      predictedCertificate: analysis.predictedCertificate,
      deterministicScore: analysis.deterministicScore,
      confidence: analysis.confidence,
      topDrivers: analysis.topDrivers || [],
      sceneFlags: analysis.sceneFlags?.map(f => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        context: f.context,
        scene: {
          sceneNumber: f.scene?.sceneNumber || 'N/A',
          headingRaw: f.scene?.headingRaw || null,
        },
      })) || [],
      suggestions: analysis.suggestions?.map(s => ({
        id: s.id,
        rank: s.rank,
        sceneNumber: s.sceneNumber,
        issue: s.issue,
        suggestedChange: s.suggestedChange,
        why: s.why,
        effort: s.effort,
        creativeRisk: s.creativeRisk,
        expectedCertImpact: s.expectedCertImpact,
      })) || [],
    } : null;

    return NextResponse.json({ analysis: formattedAnalysis });
  } catch (error) {
    console.error('[GET /api/censor]', error);
    return NextResponse.json({ error: 'Failed to fetch censor data' }, { status: 500 });
  }
}

// POST /api/censor — run analysis
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID, targetCertificate = 'UA 13+' } = body;

    if (action === 'analyze') {
      // Fetch the script content
      const script = await prisma.script.findFirst({
        where: { projectId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!script || !script.content) {
        return NextResponse.json({ 
          error: 'No script found. Please upload a script first.' 
        }, { status: 400 });
      }

      // Analyze the script content
      const { results, totalScore } = analyzeScriptContent(script.content);
      
      // Determine certificate
      const { cert, confidence } = predictCertificate(totalScore);
      
      // Get top drivers
      const topDrivers = Object.entries(results)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 3)
        .map(([category]) => category.replace('_', ' '));

      // Fetch scenes for linking flags
      const scenes = await prisma.scene.findMany({
        where: { scriptId: script.id },
        select: { id: true, sceneNumber: true },
        orderBy: { sceneIndex: 'asc' },
        take: 10,
      });

      // Create the analysis record
      const analysis = await prisma.censorAnalysis.create({
        data: {
          projectId,
          predictedCertificate: cert,
          deterministicScore: totalScore,
          confidence,
          topDrivers,
          highRiskScenes: [],
        },
      });

      // Create scene flags for each category with findings
      const flagPromises = Object.entries(results).map(([category, result], index) => {
        if (result.count > 0 && scenes.length > 0) {
          // Link to a scene based on category (distribute across scenes)
          const sceneIndex = index % scenes.length;
          return prisma.censorSceneFlag.create({
            data: {
              analysisId: analysis.id,
              sceneId: scenes[sceneIndex].id,
              category,
              severity: result.maxSeverity,
              context: result.instances[0]?.context || null,
              evidence: { instances: result.instances },
            },
          });
        }
        return null;
      });

      await Promise.all(flagPromises);

      // Generate suggestions
      const suggestions = generateSuggestions(results, targetCertificate);
      
      const suggestionPromises = suggestions.map(s => 
        prisma.censorSuggestion.create({
          data: {
            analysisId: analysis.id,
            rank: s.rank,
            sceneNumber: s.sceneNumber,
            issue: s.issue,
            suggestedChange: s.suggestedChange,
            why: s.why,
            effort: s.effort,
            creativeRisk: s.creativeRisk,
            expectedCertImpact: s.expectedCertImpact,
          },
        })
      );

      await Promise.all(suggestionPromises);

      return NextResponse.json({
        message: `Analysis complete: predicted ${cert}`,
        predictedCertificate: cert,
        sensitivityScore: Math.round(totalScore * 100),
        flagsFound: Object.keys(results).length,
        confidence,
      });
    }

    if (action === 'suggestCuts') {
      const { analysisId } = body;
      
      // Get existing analysis
      const existingAnalysis = await prisma.censorAnalysis.findUnique({
        where: { id: analysisId },
        include: { sceneFlags: true },
      });

      if (!existingAnalysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }

      // Get script for re-analysis
      const script = await prisma.script.findFirst({
        where: { projectId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!script || !script.content) {
        return NextResponse.json({ error: 'Script not found' }, { status: 400 });
      }

      // Re-analyze with target certificate
      const { results } = analyzeScriptContent(script.content);
      const suggestions = generateSuggestions(results, targetCertificate);

      // Delete old suggestions and create new ones
      await prisma.censorSuggestion.deleteMany({ where: { analysisId } });

      const newSuggestions = await Promise.all(
        suggestions.map(s => 
          prisma.censorSuggestion.create({
            data: {
              analysisId,
              rank: s.rank,
              sceneNumber: s.sceneNumber,
              issue: s.issue,
              suggestedChange: s.suggestedChange,
              why: s.why,
              effort: s.effort,
              creativeRisk: s.creativeRisk,
              expectedCertImpact: s.expectedCertImpact,
            },
          })
        )
      );

      return NextResponse.json({
        message: `Generated ${newSuggestions.length} cut suggestions for target: ${targetCertificate}`,
        suggestionsCount: newSuggestions.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/censor]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
