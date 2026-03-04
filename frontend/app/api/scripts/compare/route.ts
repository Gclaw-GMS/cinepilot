import { NextRequest, NextResponse } from 'next/server';

interface SceneChange {
  sceneNumber: string;
  headingRaw: string;
  changeType: 'added' | 'removed' | 'modified';
  details?: string;
}

interface CharacterChange {
  name: string;
  changeType: 'added' | 'removed';
  scenes?: string[];
}

interface CompareResult {
  version1Title: string;
  version2Title: string;
  changes: {
    addedScenes: SceneChange[];
    removedScenes: SceneChange[];
    modifiedScenes: SceneChange[];
    addedCharacters: CharacterChange[];
    removedCharacters: CharacterChange[];
  };
  summary: {
    totalChanges: number;
    scenesAdded: number;
    scenesRemoved: number;
    scenesModified: number;
    charactersAdded: number;
    charactersRemoved: number;
  };
  sceneMapping: { old: string; new: string }[];
  details: string;
}

// Parse a script into structured data
function parseScript(content: string): { scenes: string[]; characters: Set<string>; sceneDetails: Map<string, string> } {
  const scenes: string[] = [];
  const characters = new Set<string>();
  const sceneDetails = new Map<string, string>();
  
  // Extract scene headings (INT./EXT.)
  const sceneRegex = /^(INT\.|EXT\.|INT\/EXT\.)[\s\S]*?(?=\n(?:INT\.|EXT\.|INT\/EXT\.)|$)/gim;
  let match;
  
  while ((match = sceneRegex.exec(content)) !== null) {
    const sceneText = match[0];
    const headingMatch = sceneText.match(/^(INT\.|EXT\.|INT\/EXT\.)\s*(.+?)\s*-\s*(.+)$/im);
    
    if (headingMatch) {
      const sceneNumber = scenes.length + 1;
      const heading = headingMatch[0].trim();
      scenes.push(heading);
      sceneDetails.set(heading, sceneText);
    }
  }
  
  // Extract character names (ALL CAPS before dialogue)
  const charRegex = /^[A-Z][A-Z\s]{1,20}(?=\s*\(|\s*$)/gm;
  const charMatches = content.match(charRegex) || [];
  
  // Filter out common false positives
  const excludePatterns = [
    'INT', 'EXT', 'TITLE', 'FADE', 'CUT', 'DISSOLVE', 'SUPER', 'CONTINUED',
    'THE', 'AND', 'BUT', 'FOR', 'WITH', 'THIS', 'THAT', 'FROM', 'INTO',
    'CONTINUE', 'MORE', 'LESS', 'LATER', 'EARLIER', 'NEXT', 'THEN',
    'FLASHBACK', 'MONTAGE', 'SEQUENCE', 'SHOT', 'CLOSE', 'WIDE', 'OVER'
  ];
  
  charMatches.forEach(char => {
    const cleaned = char.trim();
    if (!excludePatterns.includes(cleaned) && cleaned.length >= 2 && cleaned.length <= 25) {
      characters.add(cleaned.toUpperCase());
    }
  });
  
  return { scenes, characters, sceneDetails };
}

// Find matching scenes between two scripts using fuzzy matching
function matchScenes(scenes1: string[], scenes2: string[]): Map<string, string> {
  const mapping = new Map<string, string>();
  
  scenes2.forEach((scene2, idx2) => {
    const heading2 = scene2.split('\n')[0].toLowerCase();
    const loc2 = heading2.match(/(?:int|ext|int\/ext)\.?\s*(.+?)\s*-/i);
    const locStr2 = loc2 ? loc2[1].trim() : '';
    
    // Try to find matching scene in scenes1
    let bestMatch = -1;
    let bestScore = 0;
    
    scenes1.forEach((scene1, idx1) => {
      const heading1 = scene1.split('\n')[0].toLowerCase();
      const loc1 = heading1.match(/(?:int|ext|int\/ext)\.?\s*(.+?)\s*-/i);
      const locStr1 = loc1 ? loc1[1].trim() : '';
      
      // Calculate similarity score
      let score = 0;
      if (locStr1 === locStr2 && locStr1.length > 0) score += 10;
      if (heading1.includes(locStr2) || locStr2.includes(locStr1)) score += 5;
      if (idx1 === idx2) score += 2; // Same position bonus
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = idx1;
      }
    });
    
    if (bestMatch >= 0 && bestScore > 0) {
      mapping.set(scenes1[bestMatch], scene2);
    }
  });
  
  return mapping;
}

// Compare two scripts and return detailed differences
function compareScripts(version1: string, version2: string, title1: string = 'Version 1', title2: string = 'Version 2'): CompareResult {
  const parsed1 = parseScript(version1);
  const parsed2 = parseScript(version2);
  
  const addedScenes: SceneChange[] = [];
  const removedScenes: SceneChange[] = [];
  const modifiedScenes: SceneChange[] = [];
  
  // Find removed scenes (in v1 but not in v2)
  parsed1.scenes.forEach(scene1 => {
    const heading1 = scene1.split('\n')[0];
    let found = false;
    
    parsed2.scenes.forEach(scene2 => {
      const heading2 = scene2.split('\n')[0];
      if (heading1.toLowerCase() === heading2.toLowerCase()) {
        found = true;
        // Check if scene content was modified
        const content1 = parsed1.sceneDetails.get(scene1) || '';
        const content2 = parsed2.sceneDetails.get(scene2) || '';
        if (content1 !== content2 && content1.length > 0 && content2.length > 0) {
          // Simple check: significantly different lengths indicate modifications
          const lenDiff = Math.abs(content1.length - content2.length);
          const avgLen = (content1.length + content2.length) / 2;
          if (lenDiff / avgLen > 0.2) {
            modifiedScenes.push({
              sceneNumber: heading1.match(/\d+/)?.[0] || '?',
              headingRaw: heading1,
              changeType: 'modified',
              details: `Content changed significantly (${content1.length} → ${content2.length} chars)`
            });
          }
        }
      }
    });
    
    if (!found) {
      removedScenes.push({
        sceneNumber: heading1.match(/\d+/)?.[0] || '?',
        headingRaw: heading1,
        changeType: 'removed'
      });
    }
  });
  
  // Find added scenes (in v2 but not in v1)
  parsed2.scenes.forEach(scene2 => {
    const heading2 = scene2.split('\n')[0];
    let found = false;
    
    parsed1.scenes.forEach(scene1 => {
      const heading1 = scene1.split('\n')[0];
      if (heading1.toLowerCase() === heading2.toLowerCase()) {
        found = true;
      }
    });
    
    if (!found) {
      addedScenes.push({
        sceneNumber: heading2.match(/\d+/)?.[0] || '?',
        headingRaw: heading2,
        changeType: 'added'
      });
    }
  });
  
  // Compare characters
  const allChars = new Set([...parsed1.characters, ...parsed2.characters]);
  const addedCharacters: CharacterChange[] = [];
  const removedCharacters: CharacterChange[] = [];
  
  allChars.forEach(char => {
    const inV1 = parsed1.characters.has(char);
    const inV2 = parsed2.characters.has(char);
    
    if (inV2 && !inV1) {
      addedCharacters.push({ name: char, changeType: 'added' });
    } else if (inV1 && !inV2) {
      removedCharacters.push({ name: char, changeType: 'removed' });
    }
  });
  
  // Build scene mapping for display
  const sceneMapping: { old: string; new: string }[] = [];
  const mapping = matchScenes(parsed1.scenes, parsed2.scenes);
  mapping.forEach((newScene, oldScene) => {
    sceneMapping.push({
      old: oldScene.split('\n')[0].substring(0, 60),
      new: newScene.split('\n')[0].substring(0, 60)
    });
  });
  
  // Generate summary text
  const totalChanges = addedScenes.length + removedScenes.length + modifiedScenes.length + addedCharacters.length + removedCharacters.length;
  let details = '';
  
  if (totalChanges === 0) {
    details = 'No significant changes detected between versions.';
  } else {
    const parts: string[] = [];
    if (addedScenes.length > 0) parts.push(`${addedScenes.length} scene(s) added`);
    if (removedScenes.length > 0) parts.push(`${removedScenes.length} scene(s) removed`);
    if (modifiedScenes.length > 0) parts.push(`${modifiedScenes.length} scene(s) modified`);
    if (addedCharacters.length > 0) parts.push(`${addedCharacters.length} character(s) added`);
    if (removedCharacters.length > 0) parts.push(`${removedCharacters.length} character(s) removed`);
    details = parts.join(', ') + '.';
  }
  
  return {
    version1Title: title1,
    version2Title: title2,
    changes: {
      addedScenes,
      removedScenes,
      modifiedScenes,
      addedCharacters,
      removedCharacters
    },
    summary: {
      totalChanges,
      scenesAdded: addedScenes.length,
      scenesRemoved: removedScenes.length,
      scenesModified: modifiedScenes.length,
      charactersAdded: addedCharacters.length,
      charactersRemoved: removedCharacters.length
    },
    sceneMapping,
    details
  };
}

// POST /api/scripts/compare — Compare two script versions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { version1, version2, title1, title2 } = body;
    
    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'Both version1 and version2 are required' },
        { status: 400 }
      );
    }
    
    // Perform comparison
    const result = compareScripts(
      version1, 
      version2, 
      title1 || 'Version 1', 
      title2 || 'Version 2'
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/scripts/compare]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/scripts/compare — Health check / info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/scripts/compare',
    method: 'POST',
    description: 'Compare two script versions to detect changes',
    parameters: {
      version1: 'Script content (text) for first version',
      version2: 'Script content (text) for second version',
      title1: 'Optional title for version 1',
      title2: 'Optional title for version 2'
    },
    returns: {
      changes: 'Detailed breakdown of added/removed/modified scenes and characters',
      summary: 'Quick stats on total changes',
      sceneMapping: 'Mapping between matching scenes'
    }
  });
}
