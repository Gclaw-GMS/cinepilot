import { NextRequest, NextResponse } from 'next/server';

// Tag generation - generates genre, mood, setting tags and target audience
export async function POST(request: NextRequest) {
  try {
    const { text, language = 'tamil' } = await request.json();
    
    if (!text || text.length < 50) {
      return NextResponse.json({ 
        error: 'Insufficient text for analysis. Need at least 50 characters.' 
      }, { status: 400 });
    }

    const lowerText = text.toLowerCase();
    
    // Genre detection based on keywords
    const genreKeywords = {
      'Family Drama': ['family', 'relationship', 'father', 'mother', 'son', 'daughter', 'home', 'marriage'],
      'Action': ['fight', 'chase', 'explosion', 'gun', 'battle', 'war', 'attack', 'escape'],
      'Romance': ['love', 'heart', 'kiss', 'romance', 'lover', 'passion', 'attraction', 'date'],
      'Comedy': ['funny', 'laugh', 'joke', 'comedy', 'humor', 'hilarious', 'comic'],
      'Thriller': ['murder', 'mystery', 'crime', 'detective', 'investigation', 'suspense', 'twist'],
      'Fantasy': ['magic', 'supernatural', 'fantasy', 'magical', 'wizard', 'mythical'],
      'Social Message': ['society', 'problem', 'rights', 'justice', 'awareness', 'message', 'corruption'],
    };

    const detectedGenres: string[] = [];
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches >= 2) detectedGenres.push(genre);
    }
    if (detectedGenres.length === 0) detectedGenres.push('Drama');

    // Mood detection
    const moodKeywords = {
      'Feel Good': ['happy', 'joy', 'celebration', 'success', 'victory', 'love', 'wonderful'],
      'Intense': ['fight', 'death', 'danger', 'chase', 'battle', 'war', 'critical', 'dangerous'],
      'Emotional': ['cry', 'tears', 'sad', 'love', 'loss', 'emotional', 'heart', 'feel'],
      'Lighthearted': ['funny', 'laugh', 'joke', 'comedy', 'humor', 'playful'],
      'Dark': ['death', 'murder', 'crime', 'dark', 'evil', 'villain', 'danger'],
    };

    const detectedMoods: string[] = [];
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches >= 2) detectedMoods.push(mood);
    }
    if (detectedMoods.length === 0) detectedMoods.push('Dramatic');

    // Setting detection
    const settingKeywords = {
      'Urban': ['city', 'office', 'mall', 'restaurant', 'hotel', 'street', 'apartment', 'cafe'],
      'Rural': ['village', 'farm', 'field', 'temple', 'pond', 'river', 'forest', 'mountain'],
      'Domestic': ['home', 'house', 'kitchen', 'bedroom', 'living room', 'family'],
      'Workplace': ['office', 'factory', 'shop', 'hospital', 'school', 'college', 'studio'],
    };

    const detectedSettings: string[] = [];
    for (const [setting, keywords] of Object.entries(settingKeywords)) {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches >= 1) detectedSettings.push(setting);
    }
    if (detectedSettings.length === 0) detectedSettings.push('Various');

    // Target audience based on content
    let targetAudience = 'Universal';
    if (lowerText.includes('violence') || lowerText.includes('death') || lowerText.includes('murder')) {
      targetAudience = 'Adults (18+)';
    } else if (detectedGenres.includes('Family Drama') || detectedMoods.includes('Lighthearted')) {
      targetAudience = 'Family (All Ages)';
    } else if (lowerText.includes('school') || lowerText.includes('college') || lowerText.includes('student')) {
      targetAudience = 'Young Adult (13-25)';
    }

    // Certification suggestion
    let certificationSuggestion = 'U';
    if (lowerText.includes('violence') || lowerText.includes('fight') || lowerText.includes('blood')) {
      certificationSuggestion = 'A';
    } else if (lowerText.includes('romance') || lowerText.includes('kiss') || lowerText.includes('love')) {
      certificationSuggestion = 'UA';
    }

    const tags = {
      genres: detectedGenres,
      moods: detectedMoods,
      settings: detectedSettings,
      target_audience: targetAudience,
      certification_suggestion: certificationSuggestion,
      language,
    };

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Tag generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate tags' 
    }, { status: 500 });
  }
}
