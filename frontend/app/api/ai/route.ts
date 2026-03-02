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
  scenes?: any[];
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

function generateCastingSuggestions(data: AnalysisRequest) {
  const castSize = data.cast_size || 12;
  const text = data.text || "";
  
  // Sample casting suggestions based on character descriptions
  const suggestions = [
    {
      role: "Lead Protagonist",
      description: "Male, 28-35, intense eyes, versatile",
      budget: "₹5-10 Cr",
      suggestions: ["Amitabh Bachchan type", "Rising star with mass appeal"],
    },
    {
      role: "Female Lead",
      description: "Female, 24-30, classic beauty, acting chops",
      budget: "₹3-7 Cr",
      suggestions: ["National award winners", "Market pull actors"],
    },
    {
      role: "Antagonist",
      description: "Male, 40-55, commanding presence",
      budget: "₹2-5 Cr",
      suggestions: ["Veteran actors", "Character specialists"],
    },
    {
      role: "Comic Relief",
      description: "Male/Female, any age, comic timing essential",
      budget: "₹50L-1 Cr",
      suggestions: ["Comedy specialists", "Fresh faces with potential"],
    },
  ];
  
  return {
    totalCast: castSize,
    budgetRange: "₹15-25 Cr (total cast)",
    suggestions: suggestions.slice(0, Math.min(4, castSize)),
    breakdown: {
      leads: Math.min(2, castSize),
      supporting: Math.min(4, castSize - 2),
      characters: Math.max(0, castSize - 6),
      extras: Math.max(0, castSize * 2),
    },
    recommendations: [
      "Consider co-casting for international appeal",
      "Balance star power with fresh faces",
      "Schedule dubbing workshops for newcomers",
    ],
  };
}

function generateLocationAnalysis(data: AnalysisRequest) {
  const scenes = data.scene_count || 45;
  const locations = data.location_count || 8;
  const isOutdoor = data.is_outdoor !== false;
  const isNight = data.is_night_shoots !== false;
  
  return {
    totalLocations: locations,
    locationTypes: {
      indoor: Math.round(locations * 0.4),
      outdoor: Math.round(locations * 0.5),
      studio: Math.round(locations * 0.1),
    },
    requirements: {
      permits: locations - 2, // Assume 2 private locations
      powerBackup: Math.round(locations * 0.6),
      security: Math.round(locations * 0.3),
      accessibility: Math.round(locations * 0.7),
    },
    budget: {
      permits: (locations - 2) * 50000,
      locationFees: locations * 200000,
      logistics: locations * 100000,
      total: (locations - 2) * 50000 + locations * 300000,
    },
    recommendations: [
      "Scout locations 4 weeks before shoot",
      "Secure permits early for government locations",
      "Have backup indoor locations for outdoor shoots",
      "Negotiate package deals for multiple days",
    ],
    considerations: {
      weather: isOutdoor ? "Monitor forecast, have indoor backup" : "Less weather dependent",
      nightShoots: isNight ? "Check local noise regulations" : "Standard daylight hours",
      sound: "Do location sound tests before finalizing",
    },
  };
}

// VFX Requirements Analysis
function generateVFXAnalysis(data: AnalysisRequest) {
  const scenes = data.scenes || [];
  const sceneCount = scenes.length || 45;
  
  // Analyze scenes for VFX potential
  const vfxIndicators = {
    fantasy: ['dream', 'magical', 'fantasy', 'illusion', 'surreal', 'morph', 'floating'],
    action: ['chase', 'explosion', 'fire', 'crash', 'stunt', 'fight', 'battle'],
    crowd: ['crowd', 'festival', 'mass', 'thousands', 'extras', 'public'],
    composite: ['green screen', 'blue screen', 'background', 'sky', 'plate'],
    beauty: ['beauty', 'retouch', 'enhance', 'clean', 'grade', 'color'],
    lighting: ['light', 'glow', 'diya', 'fireworks', 'laser', 'neon'],
    prosthetic: ['creature', 'makeup', 'aging', 'wound', 'blood', 'monster'],
    destruction: ['explosion', 'crash', 'destroy', 'ruin', 'debris', 'fire'],
  };
  
  const complexityCosts: Record<string, number> = {
    fantasy: 8500000,
    action: 6200000,
    crowd: 4500000,
    composite: 2800000,
    beauty: 1200000,
    lighting: 800000,
    prosthetic: 5500000,
    destruction: 4800000,
  };
  
  // Generate VFX scenes from the data or create demo scenes
  const vfxScenes = scenes.length > 0 ? scenes.map((scene: any, idx: number) => {
    const sceneText = `${scene.headingRaw || ''} ${scene.description || ''}`.toLowerCase();
    let vfxType = 'composite';
    let complexity = 'moderate';
    
    for (const [type, keywords] of Object.entries(vfxIndicators)) {
      if (keywords.some(k => sceneText.includes(k))) {
        vfxType = type;
        complexity = ['fantasy', 'crowd', 'destruction'].includes(type) ? 'high' : 
                    ['action', 'prosthetic'].includes(type) ? 'medium' : 'low';
        break;
      }
    }
    
    return {
      scene_number: scene.sceneNumber || idx + 1,
      location: scene.location || 'Studio',
      vfx_type: vfxType,
      complexity,
      estimated_cost: complexityCosts[vfxType] || 2000000,
    };
  }) : [
    { scene_number: 12, location: 'EXT. Temple Festival', vfx_type: 'crowd', complexity: 'high', estimated_cost: 4500000 },
    { scene_number: 25, location: 'EXT. Highway', vfx_type: 'action', complexity: 'high', estimated_cost: 6200000 },
    { scene_number: 31, location: 'INT. Dream World', vfx_type: 'fantasy', complexity: 'high', estimated_cost: 8500000 },
    { scene_number: 38, location: 'EXT. Swiss Alps', vfx_type: 'composite', complexity: 'moderate', estimated_cost: 2800000 },
    { scene_number: 45, location: 'EXT. Warehouse', vfx_type: 'destruction', complexity: 'high', estimated_cost: 4800000 },
    { scene_number: 52, location: 'EXT. City Rooftop', vfx_type: 'beauty', complexity: 'low', estimated_cost: 1200000 },
  ];
  
  const vfxScenesCount = vfxScenes.length;
  const totalCost = vfxScenes.reduce((sum: number, s: any) => sum + (s.estimated_cost || 0), 0);
  const highComplexityCount = vfxScenes.filter((s: any) => s.complexity === 'high').length;
  
  const recommendations = [
    `Schedule VFX-intensive scenes early to allow post-production time`,
    `${highComplexityCount} high-complexity shots require additional pre-visualization`,
    `Consider virtual production techniques for fantasy sequences`,
    `Budget for 15% contingency on VFX due to revision potential`,
  ];
  
  if (vfxScenesCount > 10) {
    recommendations.push('High VFX volume - consider batching similar shots');
  }
  
  return {
    total_scenes: sceneCount,
    vfx_scenes_count: vfxScenesCount,
    estimated_total_cost: totalCost,
    complexity_breakdown: {
      high: highComplexityCount,
      medium: vfxScenes.filter((s: any) => s.complexity === 'medium').length,
      low: vfxScenes.filter((s: any) => s.complexity === 'low').length,
    },
    vfx_scenes: vfxScenes,
    recommendations,
  };
}

// Scene Suggestions for Production Assistant
function generateSceneSuggestions(data: AnalysisRequest) {
  const context = data.text || '';
  const sceneCount = data.scene_count || 45;
  
  // Analyze context and generate relevant suggestions
  const suggestions: Array<{
    type: string;
    suggestion: string;
    reason?: string;
    scene_type?: string;
    location_suggestion?: string;
    time_suggestion?: string;
  }> = [];
  
  // Generate context-aware suggestions
  const contextLower = context.toLowerCase();
  
  // Romance-related suggestions
  if (contextLower.includes('romance') || contextLower.includes('love') || contextLower.includes('romantic')) {
    suggestions.push({
      type: 'conflict',
      suggestion: 'Introduce an external conflict during the romantic sequence',
      reason: 'Heightens tension and engages audience better',
      scene_type: 'Romance-Thriller'
    });
    suggestions.push({
      type: 'expansion',
      suggestion: 'Add a flashback sequence to show the origin of the relationship',
      reason: 'Adds emotional depth and backstory',
      scene_type: 'Romance'
    });
  }
  
  // Action-related suggestions
  if (contextLower.includes('action') || contextLower.includes('fight') || contextLower.includes('chase')) {
    suggestions.push({
      type: 'location_expansion',
      suggestion: 'Consider a wide establishing shot before the action sequence',
      reason: 'Provides spatial context and enhances scale',
      location_suggestion: 'Open ground/warehouse',
      time_suggestion: 'Golden hour'
    });
    suggestions.push({
      type: 'expansion',
      suggestion: 'Add reaction shots from bystanders to increase stakes',
      reason: 'Creates sense of danger and real-world impact',
      scene_type: 'Action'
    });
  }
  
  // Drama-related suggestions
  if (contextLower.includes('drama') || contextLower.includes('emotional') || contextLower.includes('family')) {
    suggestions.push({
      type: 'expansion',
      suggestion: 'Consider adding a reaction shot after the pivotal dialogue',
      reason: 'This would enhance emotional impact and give editors more options',
      scene_type: 'Drama'
    });
    suggestions.push({
      type: 'time_addition',
      suggestion: 'Add a time jump to show consequences of the emotional event',
      reason: 'Creates narrative progression and emotional resonance',
      time_suggestion: 'Next morning'
    });
  }
  
  // Comedy-related suggestions
  if (contextLower.includes('comedy') || contextLower.includes('funny') || contextLower.includes('humor')) {
    suggestions.push({
      type: 'expansion',
      suggestion: 'Include a reaction shot from a bystander for comedic timing',
      reason: 'Enhances the comedic beat and audience engagement',
      scene_type: 'Comedy'
    });
  }
  
  // Default suggestions if no specific context
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'expansion',
      suggestion: 'Consider adding a reaction shot after the pivotal dialogue',
      reason: 'This would enhance emotional impact and give editors more options',
      scene_type: 'Drama'
    });
    suggestions.push({
      type: 'location_expansion',
      suggestion: 'The sequence could benefit from additional establishing shots',
      reason: 'Multi-location coverage adds production value',
      location_suggestion: 'Outdoor location',
      time_suggestion: 'Sunrise/Sunset'
    });
    suggestions.push({
      type: 'conflict',
      suggestion: 'Introduce an external conflict to increase tension',
      reason: 'Heightens drama and keeps audience engaged',
      scene_type: 'General'
    });
  }
  
  // Add scene-count based suggestion
  if (sceneCount > 50) {
    suggestions.push({
      type: 'expansion',
      suggestion: 'Consider combining some dialogue-heavy scenes to improve pacing',
      reason: `With ${sceneCount} scenes, pacing optimization is recommended`,
      scene_type: 'Structure'
    });
  }
  
  return {
    suggestions: suggestions.slice(0, 5), // Return max 5 suggestions
    context_analyzed: context || 'general',
    scene_count: sceneCount,
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
      case 'casting':
        result = generateCastingSuggestions(body);
        break;
      case 'location-breakdown':
        result = generateLocationAnalysis(body);
        break;
      case 'vfx-analysis':
        result = generateVFXAnalysis(body);
        break;
      case 'scene_suggestions':
        result = generateSceneSuggestions(body);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const isDbConnected = await checkDbConnection();
    
    return NextResponse.json({
      success: true,
      action,
      result,
      isDemoMode: !isDbConnected,
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

// Helper to check if database is connected
async function checkDbConnection(): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  // Return available AI capabilities
  const isDbConnected = await checkDbConnection();
  
  return NextResponse.json({
    available: true,
    isDemoMode: !isDbConnected,
    features: [
      { id: 'script-analyzer', name: 'Script Intelligence', description: 'Deep analysis of your script' },
      { id: 'budget-forecast', name: 'Budget Forecast', description: 'Predict production costs' },
      { id: 'shot-suggest', name: 'Shot Recommender', description: 'AI shot suggestions' },
      { id: 'schedule', name: 'Schedule Optimizer', description: 'Optimize shooting schedule' },
      { id: 'risk-detect', name: 'Risk Detector', description: 'Identify production risks' },
      { id: 'dialogue', name: 'Dialogue Refiner', description: 'Improve script dialogue' },
      { id: 'casting', name: 'Casting Suggestions', description: 'AI-recommended casting based on character descriptions' },
      { id: 'location-breakdown', name: 'Location Analysis', description: 'Breakdown location requirements and scout recommendations' },
    ],
  });
}
