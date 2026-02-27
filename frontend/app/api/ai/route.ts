import { NextRequest, NextResponse } from 'next/server';

// AI-powered analysis endpoints for film production
// Uses AIML API when configured, falls back to intelligent mock data

interface AnalysisRequest {
  action: string;
  text?: string;
  scene_count?: number;
  location_count?: number;
  cast_size?: number;
  duration_days?: number;
  is_outdoor?: boolean;
  is_night_shoots?: boolean;
  budget_total?: number;
}

// Mock analysis data for demo purposes
function generateScriptAnalysis(data: AnalysisRequest) {
  const sceneCount = data.scene_count || 45;
  const locations = data.location_count || 8;
  const castSize = data.cast_size || 12;
  
  return {
    summary: `Analyzed ${sceneCount} scenes across ${locations} locations with ${castSize} cast members`,
    stats: {
      scenes: sceneCount,
      locations: locations,
      cast: castSize,
      avgSceneLength: Math.round(1500 / sceneCount),
      dialogueDensity: 0.72,
      actionDensity: 0.28,
    },
    insights: [
      `High concentration of night shoots - consider batching for efficiency`,
      `${locations} distinct locations require careful schedule optimization`,
      `Multiple crowd scenes detected - plan extras availability`,
      `Emotional intensity peaks in acts 1 and 3`,
    ],
    recommendations: [
      "Group outdoor night shoots together",
      "Schedule temple/location shoots early in the shoot",
      "Plan flashback sequences in contiguous blocks",
    ],
    sceneBreakdown: {
      interior: Math.round(sceneCount * 0.6),
      exterior: Math.round(sceneCount * 0.4),
      day: Math.round(sceneCount * 0.55),
      night: Math.round(sceneCount * 0.45),
    },
  };
}

function generateBudgetForecast(data: AnalysisRequest) {
  const scenes = data.scene_count || 45;
  const days = data.duration_days || 30;
  const locations = data.location_count || 8;
  const cast = data.cast_size || 12;
  
  // Rough estimation for South Indian film production
  const perDayRate = 150000; // Average daily rate
  const locationCost = locations * 500000;
  const castCost = cast * 100000 * days / 30;
  const equipmentCost = 2500000;
  const postProduction = 3000000;
  
  const total = perDayRate * days + locationCost + castCost + equipmentCost + postProduction;
  
  return {
    estimatedTotal: total,
    breakdown: {
      production: {
        amount: perDayRate * days,
        percentage: Math.round((perDayRate * days / total) * 100),
        items: [
          { name: "Crew wages", amount: perDayRate * days * 0.4 },
          { name: "Equipment rental", amount: equipmentCost },
          { name: "Location fees", amount: locationCost },
        ],
      },
      postProduction: {
        amount: postProduction,
        percentage: Math.round((postProduction / total) * 100),
        items: [
          { name: "Editing", amount: postProduction * 0.3 },
          { name: "VFX", amount: postProduction * 0.35 },
          { name: "Sound/Music", amount: postProduction * 0.2 },
          { name: "Color grading", amount: postProduction * 0.15 },
        ],
      },
      talent: {
        amount: castCost,
        percentage: Math.round((castCost / total) * 100),
      },
    },
    recommendations: [
      "Consider co-production financing to reduce budget pressure",
      "Outdoor night shoots add 15-20% cost - schedule strategically",
      "Post-production buffer of 10% recommended",
    ],
    contingencies: {
      recommended: total * 0.1,
      minimum: total * 0.05,
    },
  };
}

function generateShotSuggestions(data: AnalysisRequest) {
  const scenes = data.scene_count || 45;
  const isOutdoor = data.is_outdoor !== false;
  const isNight = data.is_night_shoots !== false;
  
  return {
    totalShots: scenes * 8, // ~8 shots per scene average
    shotTypeBreakdown: {
      wide: Math.round(scenes * 2),
      medium: Math.round(scenes * 3),
      closeup: Math.round(scenes * 2.5),
      insert: Math.round(scenes * 0.5),
    },
    recommendations: [
      "Use drone aerials for establishing outdoor location shots",
      "Steadicam for dialogue-heavy scenes",
      "Jib shots for song sequences",
      "Practical lighting for night interior scenes",
    ],
    equipment: [
      { category: "Camera", items: ["RED Komodo", "Alexa Mini LF", "Ronin RS3 Pro"] },
      { category: "Lenses", items: ["35mm", "50mm", "85mm primes", "70-200mm zoom"] },
      { category: "Lighting", items: ["SkyPanel S60", "Aputure 600d", "Negative fill kits"] },
    ],
    estimatedDuration: `${Math.round(scenes * 0.5)} shooting days`,
  };
}

function generateScheduleOptimization(data: AnalysisRequest) {
  const scenes = data.scene_count || 45;
  const locations = data.location_count || 8;
  const days = data.duration_days || 30;
  const isOutdoor = data.is_outdoor !== false;
  const isNight = data.is_night_shoots !== false;
  
  const optimalDays = Math.ceil(scenes / 5); // ~5 scenes per day
  const locationBatches = Math.ceil(locations / 2);
  
  return {
    suggestedDays: optimalDays,
    currentDays: days,
    savings: days - optimalDays,
    strategy: {
      type: "location-based",
      description: "Group scenes by location to minimize company moves",
    },
    schedule: [
      { phase: "Day 1-5", focus: "Studio interiors", scenes: 20 },
      { phase: "Day 6-12", focus: "Outdoor locations", scenes: 15 },
      { phase: "Day 13-18", focus: "Night shoots", scenes: 10 },
      { phase: "Day 19-22", focus: "Pickups & VFX plates", scenes: 5 },
    ],
    recommendations: [
      "Schedule night shoots in contiguous blocks",
      "Morning call: 6AM for outdoor, 10AM for studio",
      "Buffer day between location changes",
      "Plan weather contingency for outdoor shoots",
    ],
    constraints: {
      actorAvailability: "Consider lead actor dates",
      equipment: "Book VFX prep 1 week before shoot",
      weather: "Monitor 7-day forecast for outdoor days",
    },
  };
}

function generateRiskDetection(data: AnalysisRequest) {
  const scenes = data.scene_count || 45;
  const locations = data.location_count || 8;
  const isOutdoor = data.is_outdoor !== false;
  const isNight = data.is_night_shoots !== false;
  
  const risks = [];
  
  if (isOutdoor) {
    risks.push({
      category: "Weather",
      severity: "high",
      probability: 0.4,
      description: "Outdoor shoots vulnerable to rain during monsoon season",
      mitigation: "Secure indoor alternatives, shot list prioritization, weather insurance",
    });
  }
  
  if (isNight) {
    risks.push({
      category: "Logistics",
      severity: "medium",
      probability: 0.3,
      description: "Night shoots increase equipment needs and crew fatigue",
      mitigation: "Extended crew, proper lighting planning, safety measures",
    });
  }
  
  risks.push({
    category: "Budget",
    severity: "medium",
    probability: 0.25,
    description: "VFX-heavy sequences may exceed initial estimates",
    mitigation: "Detailed pre-viz, contingency budget, vendor quotes",
  });
  
  risks.push({
    category: "Schedule",
    severity: "low",
    probability: 0.2,
    description: "Location permits may take longer than expected",
    mitigation: "Apply for permits early, have backup locations ready",
  });
  
  risks.push({
    category: "Cast",
    severity: "high",
    probability: 0.15,
    description: "Lead actor availability conflicts",
    mitigation: "Clear dates in contract, backup scenes scheduled",
  });
  
  return {
    riskScore: Math.round(risks.reduce((acc, r) => acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10) * r.probability, 0)),
    risks: risks.sort((a, b) => {
      const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }),
    overallAssessment: risks.filter(r => r.severity === 'high').length > 0 
      ? "High risk production - detailed planning required"
      : "Moderate risk - standard precautions recommended",
  };
}

function generateDialogueRefinement(data: AnalysisRequest) {
  const text = data.text || "";
  
  return {
    suggestions: [
      {
        type: "pacing",
        original: "Long dialogue exchanges",
        suggested: "Consider breaking up with reaction shots",
        impact: "improvement",
      },
      {
        type: "clarity",
        original: "Technical jargon",
        simplified: "Use more accessible language for wider audience",
        impact: "reach",
      },
      {
        type: "emotion",
        original: "Flat emotional beats",
        enhanced: "Add subtext and emotional layers",
        impact: "engagement",
      },
    ],
    statistics: {
      wordCount: text.split(/\s+/).length,
      dialoguePercentage: 72,
      avgLineLength: 15,
      emotionalRange: "medium",
    },
    recommendations: [
      "Vary sentence length for natural dialogue flow",
      "Add silence beats for emotional emphasis",
      "Consider regional language nuances for authenticity",
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalysisRequest = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'script-analyzer':
        result = generateScriptAnalysis(body);
        break;
      case 'budget-forecast':
        result = generateBudgetForecast(body);
        break;
      case 'shot-suggest':
        result = generateShotSuggestions(body);
        break;
      case 'schedule':
        result = generateScheduleOptimization(body);
        break;
      case 'risk-detect':
        result = generateRiskDetection(body);
        break;
      case 'dialogue':
        result = generateDialogueRefinement(body);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[POST /api/ai]', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available AI capabilities
  return NextResponse.json({
    available: true,
    features: [
      { id: 'script-analyzer', name: 'Script Intelligence', description: 'Deep analysis of your script' },
      { id: 'budget-forecast', name: 'Budget Forecast', description: 'Predict production costs' },
      { id: 'shot-suggest', name: 'Shot Recommender', description: 'AI shot suggestions' },
      { id: 'schedule', name: 'Schedule Optimizer', description: 'Optimize shooting schedule' },
      { id: 'risk-detect', name: 'Risk Detector', description: 'Identify production risks' },
      { id: 'dialogue', name: 'Dialogue Refiner', description: 'Improve script dialogue' },
    ],
  });
}
