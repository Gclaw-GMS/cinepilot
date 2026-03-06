import { NextRequest, NextResponse } from 'next/server';

// Film Comparison & Benchmarking API
// Compares script content with similar films and provides estimates

// Similar films database (mock data for benchmarking)
const SIMILAR_FILMS_DB: Record<string, Array<{title: string; year: number; box_office: number; budget: number; match_factors: string[]}>> = {
  drama: [
    { title: 'Vikram Vedha', year: 2017, box_office: 65000000, budget: 25000000, match_factors: ['action', 'thriller', 'urban'] },
    { title: 'Thalapathi', year: 1991, box_office: 12000000, budget: 8000000, match_factors: ['drama', 'friendship', 'mass'] },
    { title: 'Anbe Sivam', year: 2003, box_office: 8000000, budget: 15000000, match_factors: ['drama', 'emotional', 'journey'] },
    { title: 'Pather Panchali', year: 1955, box_office: 100000, budget: 50000, match_factors: ['drama', 'rural', 'classic'] },
  ],
  action: [
    { title: 'Baahubali 2', year: 2017, box_office: 230000000, budget: 250000000, match_factors: ['epic', 'fantasy', 'action'] },
    { title: 'Enthiran', year: 2008, box_office: 150000000, budget: 150000000, match_factors: ['sci-fi', 'action', 'visual'] },
    { title: 'Ghajini', year: 2008, box_office: 100000000, budget: 35000000, match_factors: ['thriller', 'action', 'romance'] },
    { title: 'Theri', year: 2016, box_office: 110000000, budget: 60000000, match_factors: ['action', 'family', 'mass'] },
  ],
  romance: [
    { title: 'Mouna Ragam', year: 1986, box_office: 2000000, budget: 3000000, match_factors: ['romance', 'family', 'classic'] },
    { title: 'Vinnaithaandi Varuvaag', year: 2014, box_office: 50000000, budget: 20000000, match_factors: ['romance', 'youth', 'comedy'] },
    { title: 'Kadhalum Kadandhu Pogum', year: 2016, box_office: 15000000, budget: 8000000, match_factors: ['romance', 'comedy', 'slice-of-life'] },
    { title: '96', year: 2018, box_office: 40000000, budget: 15000000, match_factors: ['romance', 'nostalgia', 'emotional'] },
  ],
  comedy: [
    { title: 'Soodhu Kavvum', year: 2013, box_office: 25000000, budget: 8000000, match_factors: ['comedy', 'thriller', 'dark'] },
    { title: 'Super Deluxe', year: 2019, box_office: 35000000, budget: 20000000, match_factors: ['comedy', 'drama', 'anthology'] },
    { title: 'Pyaar Ka Punchnama 2', year: 2015, box_office: 45000000, budget: 12000000, match_factors: ['comedy', 'romance', 'ensemble'] },
    { title: 'Brinda', year: 2024, box_office: 0, budget: 35000000, match_factors: ['comedy', 'drama', 'family'] },
  ],
  thriller: [
    { title: 'Mahanati', year: 2018, box_office: 75000000, budget: 25000000, match_factors: ['biopic', 'drama', 'classic'] },
    { title: 'Nayakan', year: 1987, box_office: 3000000, budget: 4000000, match_factors: ['crime', 'thriller', 'classic'] },
    { title: 'Pariyerum Perumal', year: 2018, box_office: 20000000, budget: 4000000, match_factors: ['thriller', 'social', 'drama'] },
    { title: 'Asuran', year: 2019, box_office: 35000000, budget: 12000000, match_factors: ['thriller', 'action', 'revenge'] },
  ],
  horror: [
    { title: 'Maya', year: 2015, box_office: 15000000, budget: 8000000, match_factors: ['horror', 'thriller', 'mystery'] },
    { title: 'Karnan', year: 1973, box_office: 1000000, budget: 2000000, match_factors: ['horror', 'mythology', 'classic'] },
    { title: 'Rajathan', year: 2005, box_office: 5000000, budget: 3000000, match_factors: ['horror', 'thriller', 'mystery'] },
    { title: 'Arundhati', year: 2009, box_office: 18000000, budget: 12000000, match_factors: ['horror', 'fantasy', 'mystery'] },
  ],
  historical: [
    { title: 'Ponniyin Selvan 1', year: 2022, box_office: 180000000, budget: 250000000, match_factors: ['historical', 'epic', 'ensemble'] },
    { title: 'Thalapathi', year: 1991, box_office: 12000000, budget: 8000000, match_factors: ['historical', 'drama', 'folk'] },
    { title: 'Kandukondain Kandukondain', year: 2000, box_office: 2500000, budget: 5000000, match_factors: ['historical', 'period', 'drama'] },
  ],
};

// Budget multipliers by genre
const BUDGET_MULTIPLIERS: Record<string, { min: number; max: number }> = {
  drama: { min: 3000000, max: 30000000 },
  action: { min: 25000000, max: 250000000 },
  romance: { min: 5000000, max: 40000000 },
  comedy: { min: 5000000, max: 30000000 },
  thriller: { min: 8000000, max: 50000000 },
  horror: { min: 3000000, max: 20000000 },
  historical: { min: 50000000, max: 300000000 },
};

// Box office multipliers by genre
const BOX_OFFICE_MULTIPLIERS: Record<string, { min: number; max: number }> = {
  drama: { min: 1.5, max: 5 },
  action: { min: 2, max: 10 },
  romance: { min: 1.5, max: 4 },
  comedy: { min: 1.5, max: 5 },
  thriller: { min: 2, max: 6 },
  horror: { min: 2, max: 8 },
  historical: { min: 1.5, max: 5 },
};

// Target audiences by genre
const TARGET_AUDIENCES: Record<string, string[]> = {
  drama: ['Family', 'Adults', 'Critical'],
  action: ['Mass', 'Youth', 'Family'],
  romance: ['Youth', 'Couples', 'Family'],
  comedy: ['Family', 'Youth', 'All Ages'],
  thriller: ['Adults', 'Youth'],
  horror: ['Adults', 'Youth'],
  historical: ['Family', 'Critics', 'Classic'],
};

// Optimal runtimes by genre (in minutes)
const OPTIMAL_RUNTIMES: Record<string, { min: number; max: number }> = {
  drama: { min: 140, max: 180 },
  action: { min: 150, max: 180 },
  romance: { min: 140, max: 165 },
  comedy: { min: 130, max: 160 },
  thriller: { min: 130, max: 165 },
  horror: { min: 110, max: 140 },
  historical: { min: 160, max: 210 },
};

export async function POST(request: NextRequest) {
  try {
    const { script_content = '', genre = 'drama', scene_count = 0 } = await request.json();
    
    // Get similar films for the genre
    const similarFilms = SIMILAR_FILMS_DB[genre.toLowerCase()] || SIMILAR_FILMS_DB.drama;
    
    // Calculate match scores based on content analysis
    const scriptLower = script_content.toLowerCase();
    const analyzedFilms = similarFilms.map(film => {
      let matchScore = 50; // Base score
      
      // Increase score based on matching factors
      film.match_factors.forEach(factor => {
        if (scriptLower.includes(factor)) {
          matchScore += 10;
        }
      });
      
      // Adjust based on scene count
      if (scene_count > 0) {
        if (scene_count >= 40 && scene_count <= 60) matchScore += 10; // Feature film range
        else if (scene_count < 30) matchScore -= 10;
      }
      
      // Cap at 98%
      return {
        ...film,
        match_score: Math.min(98, matchScore),
      };
    }).sort((a, b) => b.match_score - a.match_score).slice(0, 5);
    
    // Calculate budget estimates
    const budgetMultiplier = BUDGET_MULTIPLIERS[genre.toLowerCase()] || BUDGET_MULTIPLIERS.drama;
    const baseBudget = scene_count > 0 
      ? (scene_count * 500000) // ~5L per scene average
      : (budgetMultiplier.min + budgetMultiplier.max) / 2;
    
    const estimatedBudget = Math.max(budgetMultiplier.min, Math.min(budgetMultiplier.max, baseBudget));
    
    // Box office estimates
    const boxMultiplier = BOX_OFFICE_MULTIPLIERS[genre.toLowerCase()] || BOX_OFFICE_MULTIPLIERS.drama;
    const estimatedBoxOffice = {
      min: Math.round(estimatedBudget * boxMultiplier.min),
      max: Math.round(estimatedBudget * boxMultiplier.max),
    };
    
    // Runtime estimates
    const runtimeRange = OPTIMAL_RUNTIMES[genre.toLowerCase()] || OPTIMAL_RUNTIMES.drama;
    const optimalRuntime = `${runtimeRange.min}-${runtimeRange.max} min`;
    
    // Target audience
    const targetAudience = TARGET_AUDIENCES[genre.toLowerCase()]?.[0] || 'Family';
    
    // Generate recommendations based on content analysis
    const recommendations: string[] = [];
    
    if (scriptLower.includes('song') || scriptLower.includes('dance')) {
      recommendations.push('Music can be a major driver of box office - consider playback singers carefully');
    }
    if (scriptLower.includes('family') || scriptLower.includes('parents')) {
      recommendations.push('Family-friendly content for wider reach');
    }
    if (scriptLower.includes('action') || scriptLower.includes('fight')) {
      recommendations.push('Action sequences require skilled stunt coordination');
    }
    if (scriptLower.includes('emotion') || scriptLower.includes('love')) {
      recommendations.push('Emotional drama elements resonate well with target audience');
    }
    if (scene_count > 50) {
      recommendations.push('Consider runtime - may need interval or intermission');
    }
    
    // Default recommendations
    if (recommendations.length < 3) {
      recommendations.push('Script has strong commercial potential');
      recommendations.push('Consider lead cast for market appeal');
      recommendations.push('Plan marketing strategy around key highlights');
    }
    
    const result = {
      estimates: {
        budget_range: `₹${(estimatedBudget / 10000000).toFixed(1)}-${(estimatedBudget * 1.5 / 10000000).toFixed(1)} Cr`,
        budget_min: estimatedBudget,
        budget_max: Math.round(estimatedBudget * 1.5),
        box_office_potential: `₹${(estimatedBoxOffice.min / 10000000).toFixed(0)}-${(estimatedBoxOffice.max / 10000000).toFixed(0)} Cr`,
        box_office_min: estimatedBoxOffice.min,
        box_office_max: estimatedBoxOffice.max,
        target_audience: targetAudience,
        optimal_runtime: optimalRuntime,
      },
      similar_films: analyzedFilms.map(f => ({
        title: f.title,
        year: f.year,
        match_score: f.match_score,
        box_office_cr: f.box_office / 10000000,
        budget_cr: f.budget / 10000000,
      })),
      recommendations: recommendations.slice(0, 5),
      analysis: {
        genre,
        estimated_scenes: scene_count || Math.floor(script_content.length / 2000),
        content_length: script_content.length,
        is_full_script: script_content.length > 5000,
      },
      isDemoMode: false,
    };
    
    // If no script content provided, return demo data
    if (!script_content || script_content.length < 100) {
      return NextResponse.json({
        estimates: {
          budget_range: '₹15-25 Cr',
          budget_min: 150000000,
          budget_max: 250000000,
          box_office_potential: '₹50-80 Cr',
          box_office_min: 500000000,
          box_office_max: 800000000,
          target_audience: 'Family',
          optimal_runtime: '150-165 min',
        },
        similar_films: [
          { title: 'Vikram Vedha', year: 2017, match_score: 87, box_office_cr: 65, budget_cr: 25 },
          { title: 'Thalapathi', year: 1991, match_score: 82, box_office_cr: 12, budget_cr: 8 },
          { title: 'Anbe Sivam', year: 2003, match_score: 78, box_office_cr: 8, budget_cr: 15 },
        ],
        recommendations: [
          'Consider family-friendly content for wider reach',
          'Music can be a major driver of box office',
          'Emotional drama elements resonate well with target audience',
          'Script has strong commercial potential',
          'Consider lead cast for market appeal',
        ],
        analysis: {
          genre: 'drama',
          estimated_scenes: 0,
          content_length: 0,
          is_full_script: false,
        },
        isDemoMode: true,
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Film comparison error:', error);
    
    // Return demo data on error
    return NextResponse.json({
      estimates: {
        budget_range: '₹15-25 Cr',
        box_office_potential: '₹50-80 Cr',
        target_audience: 'Family',
        optimal_runtime: '150-165 min',
      },
      similar_films: [
        { title: 'Vikram Vedha', match_score: 87 },
        { title: 'Thalapathi', match_score: 82 },
        { title: 'Anbe Sivam', match_score: 78 },
      ],
      recommendations: [
        'Consider family-friendly content for wider reach',
        'Music can be a major driver of box office',
        'Emotional drama elements resonate well with target audience',
      ],
      error: 'Analysis failed, showing demo data',
      isDemoMode: true,
    });
  }
}
