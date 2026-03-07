import { NextRequest, NextResponse } from 'next/server';

// Character Network Analysis API
// Analyzes character relationships and centrality from scenes

interface Scene {
  id?: string;
  sceneNumber?: string;
  sceneCharacters?: Array<{
    character?: {
      id?: string;
      name?: string;
    };
  }>;
}

interface Character {
  id?: string;
  name?: string;
  sceneCharacters?: Array<{
    character?: {
      id?: string;
      name?: string;
    };
  }>;
}

interface CharacterNetworkRequest {
  scenes?: Scene[];
  characters?: Character[];
}

// Calculate character centrality based on scene appearances
function calculateCentrality(scenes: Scene[]): Array<{
  label: string;
  scene_count: number;
  screen_time: number;
}> {
  const charCounts: Record<string, { count: number; scenes: Set<string> }> = {};
  
  for (const scene of scenes) {
    const chars = scene.sceneCharacters || [];
    for (const charEntry of chars) {
      const charName = charEntry.character?.name || 'Unknown';
      if (!charCounts[charName]) {
        charCounts[charName] = { count: 0, scenes: new Set() };
      }
      charCounts[charName].count++;
      if (scene.sceneNumber) {
        charCounts[charName].scenes.add(scene.sceneNumber);
      }
    }
  }
  
  // Convert to array and sort by scene count
  const centrality = Object.entries(charCounts)
    .map(([name, data]) => ({
      label: name,
      scene_count: data.count,
      screen_time: Math.round(data.count * 2.5), // Estimate ~2.5 min per scene
    }))
    .sort((a, b) => b.scene_count - a.scene_count);
  
  return centrality;
}

// Calculate character relationships (edges)
function calculateRelationships(scenes: Scene[]): Array<{
  from: string;
  to: string;
  shared_scenes: number;
}> {
  const relationships: Record<string, number> = {};
  
  for (const scene of scenes) {
    const chars = scene.sceneCharacters || [];
    const charNames = chars
      .map(c => c.character?.name)
      .filter((n): n is string => !!n);
    
    // Create pairs
    for (let i = 0; i < charNames.length; i++) {
      for (let j = i + 1; j < charNames.length; j++) {
        const key = [charNames[i], charNames[j]].sort().join('|||');
        relationships[key] = (relationships[key] || 0) + 1;
      }
    }
  }
  
  // Convert to array
  return Object.entries(relationships)
    .map(([key, count]) => {
      const [from, to] = key.split('|||');
      return { from, to, shared_scenes: count };
    })
    .sort((a, b) => b.shared_scenes - a.shared_scenes);
}

// Generate insights from network analysis
function generateInsights(centralChars: any[], relationships: any[], totalScenes: number): string[] {
  const insights: string[] = [];
  
  if (centralChars.length > 0) {
    insights.push(`${centralChars[0].label} is the most central character with ${centralChars[0].scene_count} scene appearances`);
  }
  
  if (relationships.length > 0) {
    const topRel = relationships[0];
    insights.push(`${topRel.from} and ${topRel.to} share the most scenes together (${topRel.shared_scenes})`);
  }
  
  // Check for孤立 characters (characters appearing alone)
  const coStars = new Set(relationships.flatMap(r => [r.from, r.to]));
  const soloChars = centralChars.filter(c => !coStars.has(c.label));
  if (soloChars.length > 0) {
    insights.push(`${soloChars.length} character(s) appear without co-stars - consider adding interaction scenes`);
  }
  
  // Calculate network density
  const totalChars = centralChars.length;
  const maxRelationships = (totalChars * (totalChars - 1)) / 2;
  const density = maxRelationships > 0 ? relationships.length / maxRelationships : 0;
  
  if (density < 0.3) {
    insights.push('Low character interaction density - script may benefit from more ensemble scenes');
  } else if (density > 0.7) {
    insights.push('High character interaction density - rich ensemble narrative detected');
  }
  
  return insights;
}

export async function POST(req: NextRequest) {
  try {
    const body: CharacterNetworkRequest = await req.json();
    const scenes = body.scenes || [];
    const characters = body.characters || [];
    
    // Use provided characters or extract from scenes
    const allCharacters = characters.length > 0 
      ? characters 
      : scenes.flatMap(s => s.sceneCharacters || []);
    
    // Calculate centrality (most important characters)
    const centralCharacters = calculateCentrality(scenes);
    
    // Calculate relationships
    const relationships = calculateRelationships(scenes);
    
    // Generate insights
    const insights = generateInsights(centralCharacters, relationships, scenes.length);
    
    // Build network structure for visualization
    const nodes = centralCharacters.map((char, idx) => ({
      id: char.label.toLowerCase().replace(/\s+/g, '-'),
      label: char.label,
      size: Math.max(10, Math.min(50, char.scene_count * 3)),
      color: idx < 3 ? '#8b5cf6' : '#6b7280', // Purple for top 3
    }));
    
    const edges = relationships.slice(0, 20).map(rel => ({
      from: rel.from.toLowerCase().replace(/\s+/g, '-'),
      to: rel.to.toLowerCase().replace(/\s+/g, '-'),
      from_label: rel.from,
      to_label: rel.to,
      shared_scenes: rel.shared_scenes,
      width: Math.max(1, Math.min(5, rel.shared_scenes)),
    }));
    
    return NextResponse.json({
      central_characters: centralCharacters.slice(0, 10),
      total_relationships: relationships.length,
      network: {
        nodes,
        edges,
      },
      insights,
      summary: {
        total_characters: centralCharacters.length,
        total_scenes: scenes.length,
        network_density: relationships.length > 0 
          ? (relationships.length / Math.max(1, (centralCharacters.length * (centralCharacters.length - 1)) / 2)).toFixed(2)
          : 0,
      },
    });
  } catch (error) {
    console.error('Character network analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze character network' },
      { status: 500 }
    );
  }
}

// Demo endpoint for testing without data
export async function GET() {
  // Return demo data for preview
  const demoScenes = [
    { sceneNumber: '1', sceneCharacters: [{ character: { name: 'ARJUN' } }, { character: { name: 'PRIYA' } }] },
    { sceneNumber: '2', sceneCharacters: [{ character: { name: 'ARJUN' } }, { character: { name: 'RAHUL' } }] },
    { sceneNumber: '3', sceneCharacters: [{ character: { name: 'PRIYA' } }, { character: { name: 'RAHUL' } }] },
    { sceneNumber: '4', sceneCharacters: [{ character: { name: 'ARJUN' } }] },
    { sceneNumber: '5', sceneCharacters: [{ character: { name: 'PRIYA' } }, { character: { name: 'ARJUN' } }, { character: { name: 'MOTHER' } }] },
  ];
  
  const centralCharacters = calculateCentrality(demoScenes);
  const relationships = calculateRelationships(demoScenes);
  const insights = generateInsights(centralCharacters, relationships, demoScenes.length);
  
  const nodes = centralCharacters.map((char, idx) => ({
    id: char.label.toLowerCase().replace(/\s+/g, '-'),
    label: char.label,
    size: Math.max(10, Math.min(50, char.scene_count * 3)),
    color: idx < 3 ? '#8b5cf6' : '#6b7280',
  }));
  
  const edges = relationships.slice(0, 10).map(rel => ({
    from: rel.from.toLowerCase().replace(/\s+/g, '-'),
    to: rel.to.toLowerCase().replace(/\s+/g, '-'),
    from_label: rel.from,
    to_label: rel.to,
    shared_scenes: rel.shared_scenes,
    width: Math.max(1, Math.min(5, rel.shared_scenes)),
  }));
  
  return NextResponse.json({
    central_characters: centralCharacters.slice(0, 10),
    total_relationships: relationships.length,
    network: {
      nodes,
      edges,
    },
    insights,
    demo: true,
  });
}
