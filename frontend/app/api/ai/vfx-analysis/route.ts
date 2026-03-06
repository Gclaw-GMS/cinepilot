import { NextRequest, NextResponse } from 'next/server';

// VFX Requirements Analysis API
// Analyzes scenes for visual effects requirements and estimates costs

export async function POST(request: NextRequest) {
  try {
    const { scenes = [] } = await request.json();
    
    // VFX indicators in scene descriptions
    const vfxIndicators: Record<string, string[]> = {
      fantasy: ['dream', 'magical', 'fantasy', 'illusion', 'surreal', 'morph', 'floating', 'vision', 'ghost', 'spirit'],
      action: ['chase', 'explosion', 'fire', 'crash', 'stunt', 'battle', 'fight', 'weapon', 'gun', 'bomb'],
      crowd: ['crowd', 'festival', 'mass', 'thousands', 'extras', 'public', 'people', 'audience', 'procession'],
      composite: ['green screen', 'blue screen', 'background', 'sky', 'plate', '合成', 'vfx'],
      beauty: ['beauty', 'retouch', 'enhance', 'clean', 'grade', 'color', 'diya', 'glow'],
      lighting: ['light', 'glow', 'fireworks', 'laser', 'neon', 'lamp', 'candle', 'torch'],
      destruction: ['explosion', 'crash', 'destroy', 'ruin', 'debris', 'fire', 'collapse', 'fall'],
      weather: ['rain', 'storm', 'snow', 'wind', 'fog', 'mist', 'cloud'],
    };
    
    const complexityCosts: Record<string, number> = {
      fantasy: 8500000,
      action: 6200000,
      crowd: 4500000,
      composite: 2800000,
      beauty: 1200000,
      lighting: 800000,
      destruction: 4800000,
      weather: 2500000,
    };
    
    // Analyze each scene for VFX potential
    const vfxScenes = scenes.map((scene: any, idx: number) => {
      const sceneText = `${scene.headingRaw || ''} ${scene.description || ''} ${scene.action || ''}`.toLowerCase();
      
      // Determine VFX type
      let vfxType = 'composite';
      for (const [type, keywords] of Object.entries(vfxIndicators)) {
        if (keywords.some(keyword => sceneText.includes(keyword))) {
          vfxType = type;
          break;
        }
      }
      
      // Determine complexity based on keywords
      let complexity: 'low' | 'medium' | 'high' = 'low';
      const highComplexity = ['explosion', 'fantasy', 'magical', 'destruction', 'battle', 'surreal'];
      const mediumComplexity = ['crowd', 'fire', 'storm', 'chase', 'stunt'];
      
      if (highComplexity.some(k => sceneText.includes(k))) {
        complexity = 'high';
      } else if (mediumComplexity.some(k => sceneText.includes(k))) {
        complexity = 'medium';
      }
      
      // Estimate cost based on complexity
      const baseCost = complexityCosts[vfxType] || 2000000;
      const complexityMultiplier = complexity === 'high' ? 1.5 : complexity === 'medium' ? 1.0 : 0.5;
      const estimatedCost = Math.round(baseCost * complexityMultiplier / 10) * 100000;
      
      return {
        scene_number: scene.sceneNumber || `SCENE_${idx + 1}`,
        location: scene.location || 'Unknown',
        vfx_type: vfxType,
        complexity,
        estimated_cost: estimatedCost,
        description: sceneText.substring(0, 100),
      };
    }).filter((s: any) => s.vfx_type !== 'composite' || s.estimated_cost > 0);
    
    // Calculate totals
    const totalVfxScenes = vfxScenes.length;
    const totalCost = vfxScenes.reduce((sum: number, s: any) => sum + s.estimated_cost, 0);
    
    // Group by complexity
    const byComplexity = {
      high: vfxScenes.filter((s: any) => s.complexity === 'high').length,
      medium: vfxScenes.filter((s: any) => s.complexity === 'medium').length,
      low: vfxScenes.filter((s: any) => s.complexity === 'low').length,
    };
    
    // Group by type
    const byType = vfxScenes.reduce((acc: Record<string, number>, s: any) => {
      acc[s.vfx_type] = (acc[s.vfx_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // If no scenes provided, return demo data
    if (scenes.length === 0) {
      return NextResponse.json({
        total_scenes: 45,
        vfx_scenes_count: 12,
        estimated_total_cost: 15000000,
        vfx_scenes: [
          { scene_number: '1A', location: 'Dream Sequence', vfx_type: 'fantasy', complexity: 'high', estimated_cost: 2500000 },
          { scene_number: '15', location: 'Market Chase', vfx_type: 'action', complexity: 'high', estimated_cost: 1800000 },
          { scene_number: '22', location: 'Festival Crowd', vfx_type: 'crowd', complexity: 'medium', estimated_cost: 1200000 },
          { scene_number: '28', location: 'Green Screen', vfx_type: 'composite', complexity: 'low', estimated_cost: 500000 },
          { scene_number: '35', location: 'Storm Sequence', vfx_type: 'weather', complexity: 'medium', estimated_cost: 1500000 },
        ],
        breakdown: {
          by_complexity: { high: 4, medium: 5, low: 3 },
          by_type: { fantasy: 2, action: 3, crowd: 2, composite: 2, weather: 3 },
        },
        recommendations: [
          'Schedule VFX-heavy scenes early to allow post-production time',
          'Consider pre-visualization for complex fantasy sequences',
          'Coordinate with VFX studio during principal photography for plate shots',
        ],
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({
      total_scenes: scenes.length,
      vfx_scenes_count: totalVfxScenes,
      estimated_total_cost: totalCost,
      vfx_scenes: vfxScenes,
      breakdown: {
        by_complexity: byComplexity,
        by_type: byType,
      },
      recommendations: totalVfxScenes > 5 ? [
        'Schedule VFX-heavy scenes early to allow post-production time',
        'Consider pre-visualization for complex sequences',
        'Coordinate with VFX studio during principal photography for plate shots',
      ] : [
        'Low VFX requirements - standard post-production workflow',
      ],
      isDemoMode: false,
    });
    
  } catch (error) {
    console.error('VFX analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze VFX requirements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
