import { NextRequest, NextResponse } from 'next/server';

// Pacing analysis - analyzes dialogue vs action ratio, scene lengths, and pacing score
export async function POST(request: NextRequest) {
  try {
    const { text, language = 'tamil' } = await request.json();
    
    if (!text || text.length < 50) {
      return NextResponse.json({ 
        error: 'Insufficient text for analysis. Need at least 50 characters.' 
      }, { status: 400 });
    }

    // Analyze the script content for pacing
    const lines: string[] = text.split('\n').filter((l: string) => l.trim().length > 0);
    const dialogueLines: string[] = lines.filter((l: string) => l.match(/^[A-Z\s]+:|^\(/));
    const actionLines: string[] = lines.filter((l: string) => !l.match(/^[A-Z\s]+:|^\(/));
    
    const totalLines = lines.length || 1;
    const dialogueRatio = Math.round((dialogueLines.length / totalLines) * 100);
    const actionRatio = 100 - dialogueRatio;
    
    // Estimate pages (roughly 250 words per page for screenplay)
    const words = text.split(/\s+/).length;
    const totalPages = Math.max(1, Math.round(words / 250));
    
    // Calculate pacing score based on dialogue/action balance
    let pacingScore = 75;
    if (dialogueRatio > 80) pacingScore = 65; // Too dialogue-heavy
    else if (dialogueRatio < 30) pacingScore = 70; // Too action-heavy
    else if (dialogueRatio >= 50 && dialogueRatio <= 75) pacingScore = 85; // Good balance
    
    // Scene length analysis
    const scenes = text.split(/^INT\.|^EXT\.|^INT\/EXT\./im);
    const sceneCount = Math.max(1, scenes.length - 1);
    const avgDialoguePerScene = Math.round(dialogueLines.length / sceneCount);
    const avgActionPerScene = Math.round(actionLines.length / sceneCount);
    
    // Estimate runtime (1 page = ~1 minute)
    const estimatedRuntime = `${totalPages} min`;

    const pacing_analysis = {
      dialogue_ratio: dialogueRatio,
      action_ratio: actionRatio,
      total_pages: totalPages,
      pacing_score: pacingScore,
      scene_lengths: {
        avg_dialogue_per_scene: avgDialoguePerScene,
        avg_action_per_scene: avgActionPerScene,
      },
      estimated_runtime: estimatedRuntime,
      total_scenes: sceneCount,
      language,
    };

    return NextResponse.json(pacing_analysis);
  } catch (error) {
    console.error('Pacing analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze pacing' 
    }, { status: 500 });
  }
}
