import { NextRequest, NextResponse } from 'next/server';

// Emotional arc analysis - analyzes emotional journey through the script
export async function POST(request: NextRequest) {
  try {
    const { text, language = 'tamil' } = await request.json();
    
    if (!text || text.length < 50) {
      return NextResponse.json({ 
        error: 'Insufficient text for analysis. Need at least 50 characters.' 
      }, { status: 400 });
    }

    // Detect emotional keywords in the script
    const emotionKeywords = {
      joy: ['happy', 'joy', 'love', 'celebrate', 'wonderful', 'great', 'beautiful', 'delight', 'cheer', 'laugh', 'smiling', 'excited'],
      sadness: ['sad', 'cry', 'tears', 'loss', 'death', 'grief', 'sorrow', 'lonely', 'miss', 'pain', 'hurt', 'heartbroken'],
      anger: ['angry', 'rage', 'furious', 'hate', 'fight', 'kill', 'destroy', 'scream', 'yell', 'mad', 'enraged'],
      fear: ['fear', 'scared', 'terrified', 'afraid', 'danger', 'threat', 'horror', 'panic', 'nervous', 'anxious', 'worried'],
      surprise: ['shock', 'surprise', 'unexpected', 'sudden', 'amazing', 'incredible', 'twist', 'stunned', 'astonished'],
      tension: ['suspense', 'mystery', 'secret', 'danger', 'threat', 'chase', 'escape', 'confront', 'conflict', 'argument'],
    };

    const lowerText = text.toLowerCase();
    const markers: Record<string, number> = {};
    
    // Count emotions
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerText.match(regex);
        if (matches) count += matches.length;
      }
      markers[emotion] = count;
    }

    // Determine arc shape based on emotion distribution
    const joyScore = (markers.joy || 0);
    const sadnessScore = (markers.sadness || 0);
    const tensionScore = (markers.tension || 0);
    
    let arcShape = 'rising_action';
    if (sadnessScore > joyScore * 1.5 && tensionScore > 5) {
      arcShape = 'tragedy';
    } else if (joyScore > sadnessScore * 2 && tensionScore < 5) {
      arcShape = 'happy_ending';
    } else if (tensionScore > Math.max(joyScore, sadnessScore) * 2) {
      arcShape = 'dramatic';
    } else if (joyScore > 10 && sadnessScore > 8) {
      arcShape = 'bittersweet';
    }

    // Analyze emotional flow by act (divide text into 3 parts)
    const third = Math.floor(text.length / 3);
    const acts = [
      text.substring(0, third),
      text.substring(third, third * 2),
      text.substring(third * 2),
    ];

    const actEmotions = acts.map(act => {
      const lower = act.toLowerCase();
      return {
        joy: (lower.match(/happy|joy|love|celebrate/g) || []).length,
        sadness: (lower.match(/sad|cry|tears|death|grief/g) || []).length,
        tension: (lower.match(/danger|threat|secret|conflict/g) || []).length,
      };
    });

    const emotional_journey = {
      arc_shape: arcShape,
      markers,
      act_breakdown: actEmotions,
      language,
      summary: `Detected ${Object.values(markers).reduce((a, b) => a + b, 0)} emotional moments across the script`,
    };

    return NextResponse.json(emotional_journey);
  } catch (error) {
    console.error('Emotional analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze emotions' 
    }, { status: 500 });
  }
}
