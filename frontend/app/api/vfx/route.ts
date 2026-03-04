import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runTextTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

// =============================================================================
// VFX Detection Patterns - Deterministic keyword-based detection
// =============================================================================

interface VfxMatch {
  type: string;
  description: string;
  confidence: number;
}

const VFX_PATTERNS: { pattern: RegExp; type: string; description: (match: string) => string; confidence: number }[] = [
  // Time of day keywords (only specific ones need VFX)
  { pattern: /sunset|sunrise|dawn|dusk|golden hour/i, type: 'beauty', description: (m) => `Sky/lighting enhancement for "${m}"`, confidence: 0.75 },
  
  // Weather - specific effects
  { pattern: /\brain\b|\bstorm\b|\blightning\b|\bthunder\b/i, type: 'weather', description: (m) => `Weather VFX for "${m}"`, confidence: 0.85 },
  { pattern: /\bsnow\b|\bblizzard\b|\bblizz\b/i, type: 'weather', description: (m) => `Winter effects for "${m}"`, confidence: 0.85 },
  { pattern: /\bfog\b|\bmist\b/i, type: 'weather', description: (m) => `Atmospheric effects for "${m}"`, confidence: 0.75 },
  
  // Crowd & Large scale
  { pattern: /\bcrowd\b|\bfestival\b|\bmob\b|\bextras\b/i, type: 'crowd', description: (m) => `Crowd simulation needed for "${m}"`, confidence: 0.85 },
  
  // Fire/Light effects - dangerous stuff
  { pattern: /\bexplosion\b|\bexplod\b|\bblaze\b/i, type: 'destruction', description: (m) => `Fire/blast VFX for "${m}"`, confidence: 0.9 },
  { pattern: /\bfireworks\b|\bdiya\b/i, type: 'lighting', description: (m) => `Lighting enhancement for "${m}"`, confidence: 0.8 },
  
  // Fantasy/Supernatural - clear VFX keywords
  { pattern: /\bghost\b|\bspirit\b|\bsupernatural\b|\bhaunt\b|\bmagic\b|\bwitch\b|\bwizard\b/i, type: 'fantasy', description: (m) => `Supernatural/fantasy VFX for "${m}"`, confidence: 0.95 },
  { pattern: /\bdream sequence\b|\bvision\b|\billusion\b/i, type: 'fantasy', description: (m) => `Dream sequence VFX for "${m}"`, confidence: 0.9 },
  { pattern: /\bfloating\b|\blevitat\b|\bflying\b|\bhover\b/i, type: 'fantasy', description: (m) => `Gravity-defying VFX for "${m}"`, confidence: 0.85 },
  
  // Action/Stunts - vehicle specific
  { pattern: /\bcar crash\b|\bchase\b|\bdrift\b/i, type: 'action', description: (m) => `Vehicle VFX for "${m}"`, confidence: 0.88 },
  { pattern: /\bstunt\b|\bcombat\b|\bbattle\b/i, type: 'action', description: (m) => `Action enhancement VFX for "${m}"`, confidence: 0.75 },
  
  // Composites
  { pattern: /\bgreen screen\b|\bchroma key\b|\bblue screen\b/i, type: 'composite', description: (m) => `Composite/VFX for "${m}"`, confidence: 0.9 },
  { pattern: /\bset extension\b/i, type: 'composite', description: (m) => `Set extension for "${m}"`, confidence: 0.85 },
  
  // Time effects
  { pattern: /\bflashback\b|\bflash forward\b|\btime lapse\b|\bslow motion\b/i, type: 'time', description: (m) => `Time manipulation VFX for "${m}"`, confidence: 0.8 },
  
  // Creature/Makeup - specific terms
  { pattern: /\bmonster\b|\bcreature\b|\balien\b|\bbeast\b|\btransformation\b/i, type: 'prosthetic', description: (m) => `Creature enhancement for "${m}"`, confidence: 0.9 },
  { pattern: /\bdigital aging\b|\bde-?ag/i, type: 'prosthetic', description: (m) => `Digital aging for "${m}"`, confidence: 0.85 },
  
  // Animals
  { pattern: /\btiger\b|\blion\b|\belephant\b/i, type: 'animals', description: (m) => `Animal VFX/animation for "${m}"`, confidence: 0.8 },
  
  // Water
  { pattern: /\bocean\b|\bsea\b|\bwave\b|\bflood\b|\bunderwater\b/i, type: 'water', description: (m) => `Water simulation for "${m}"`, confidence: 0.85 },
  
  // Reflections/Mirrors
  { pattern: /\bmirror\b|\breflection\b/i, type: 'beauty', description: (m) => `Reflection VFX for "${m}"`, confidence: 0.75 },
];

function detectVfxInText(text: string): VfxMatch[] {
  const matches: VfxMatch[] = [];
  const seen = new Set<string>();
  
  for (const rule of VFX_PATTERNS) {
    // Use match() instead of matchAll() to avoid global regex requirement
    const regexMatches = text.match(rule.pattern);
    if (regexMatches) {
      // Match returns first match or array of matches
      const allMatches = text.match(new RegExp(rule.pattern, 'gi')) || [];
      for (const match of allMatches) {
        const key = `${rule.type}-${match.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            type: rule.type,
            description: rule.description(match),
            confidence: rule.confidence,
          });
        }
      }
    }
  }
  
  return matches;
}

// Helper function to analyze scenes for VFX without AI
function analyzeScenesForVfx(scenes: Array<{ id: string; sceneNumber: string; headingRaw: string | null; description: string | null }>): { notes: VfxMatch[]; sceneMap: Map<string, VfxMatch[]> } {
  const notes: VfxMatch[] = [];
  const sceneMap = new Map<string, VfxMatch[]>();
  
  for (const scene of scenes) {
    const sceneText = `${scene.headingRaw || ''} ${scene.description || ''}`;
    const vfxMatches = detectVfxInText(sceneText);
    
    if (vfxMatches.length > 0) {
      sceneMap.set(scene.sceneNumber, vfxMatches);
      notes.push(...vfxMatches);
    }
  }
  
  return { notes, sceneMap };
}

// Demo data for when database is not connected
const DEMO_VFX_DATA = {
  vfxNotes: [
    { id: 'v1', sceneId: 's1', description: 'Massive crowd simulation for festival sequence - 500+ digital extras required', vfxType: 'crowd', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v2', sceneId: 's1', description: 'Dynamic lighting effects for diyas and fireworks', vfxType: 'lighting', confidence: 0.85, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v3', sceneId: 's3', description: 'Car chase with vehicle replacements and plate matching', vfxType: 'action', confidence: 0.88, scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'v4', sceneId: 's4', description: 'Dream sequence with surreal floating elements and morphing', vfxType: 'fantasy', confidence: 0.95, scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'v5', sceneId: 's5', description: 'Green screen composite for romantic song sequence', vfxType: 'composite', confidence: 0.78, scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY', sceneIndex: 37 } },
    { id: 'v6', sceneId: 's6', description: 'Explosion with fire and debris simulation', vfxType: 'destruction', confidence: 0.91, scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
    { id: 'v7', sceneId: 's7', description: 'Sky replacement for mood enhancement', vfxType: 'beauty', confidence: 0.65, scene: { sceneNumber: '52', headingRaw: 'EXT. CITY ROOFTOP - DAY', sceneIndex: 51 } },
    { id: 'v8', sceneId: 's8', description: 'Creature makeup enhancement and digital aging', vfxType: 'prosthetic', confidence: 0.89, scene: { sceneNumber: '58', headingRaw: 'INT. LABORATORY - DAY', sceneIndex: 57 } },
  ],
  vfxWarnings: [
    { id: 'w1', sceneId: 's3', warningType: 'vfx', description: 'High-budget car chase sequence may exceed VFX allocation', severity: 'high', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'w2', sceneId: 's4', warningType: 'vfx', description: 'Complex fantasy sequence requires extended render time', severity: 'medium', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'w3', sceneId: 's6', warningType: 'vfx', description: 'Explosion sequence needs stunt coordination', severity: 'low', scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
  ],
  props: [
    { id: 'p1', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT' }, prop: { name: 'Fireworks', description: 'CG pyrotechnics for festival celebration' } },
    { id: 'p2', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY' }, prop: { name: 'Stunt Car', description: 'Digital vehicle for dangerous stunts' } },
    { id: 'p3', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY' }, prop: { name: 'Floating Rocks', description: 'CG environment elements' } },
    { id: 'p4', scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY' }, prop: { name: 'Mountain Background', description: 'Digital matte painting' } },
  ],
};

// Helper to check if database is available
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get('scriptId');
  if (!scriptId) {
    return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
  }

  // Check database connection
  const isDbConnected = await checkDbConnection();
  
  if (!isDbConnected) {
    // Return demo data when database is unavailable
    const summary = {
      totalScenes: 6,
      totalNotes: DEMO_VFX_DATA.vfxNotes.length,
      totalWarnings: DEMO_VFX_DATA.vfxWarnings.length,
      complexityBreakdown: { simple: 1, moderate: 2, complex: 5 },
    };
    
    return NextResponse.json({
      ...DEMO_VFX_DATA,
      summary,
      isDemoMode: true,
    });
  }

  // Database is available - use real data
  try {
    // First check if there are any stored VFX notes for existing scenes
    const allScenes = await prisma.scene.findMany({
      where: { scriptId },
      select: { id: true, sceneNumber: true },
    });
    
    const sceneIds = new Set(allScenes.map(s => s.id));
    
    let vfxNotes = await prisma.vfxNote.findMany({
      where: { scene: { scriptId } },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true, sceneIndex: true } },
      },
      orderBy: { scene: { sceneIndex: 'asc' } },
    });

    // Filter to only include notes for scenes that actually exist in this script
    // Demo data has scene IDs like 's1', 's2' - filter those out
    const validVfxNotes = vfxNotes.filter(n => sceneIds.has(n.sceneId));
    
    // If we only have demo notes, clear them so we can run deterministic detection
    if (validVfxNotes.length === 0 && vfxNotes.length > 0) {
      console.log(`[GET /api/vfx] Found ${vfxNotes.length} VFX notes but none match script scenes. Running deterministic detection.`);
      vfxNotes = [];
    } else {
      vfxNotes = validVfxNotes;
    }
    
    // If no valid stored notes, run deterministic detection on the fly
    if (vfxNotes.length === 0) {
      const scenes = await prisma.scene.findMany({
        where: { scriptId },
        orderBy: { sceneIndex: 'asc' },
      });
      
      // Use analyzeScenesForVfx which returns sceneMap for proper assignment
      const { notes: detectedNotes, sceneMap } = analyzeScenesForVfx(scenes.map(s => ({
        id: s.id,
        sceneNumber: s.sceneNumber,
        headingRaw: s.headingRaw,
        description: s.description,
      })));
      
      // Format notes for response with proper scene info - use sceneMap for matching
      const allNotesWithScenes: typeof vfxNotes = [];
      
      // Iterate through scenes to build properly assigned notes
      for (const scene of scenes) {
        const sceneNotes = sceneMap.get(scene.sceneNumber) || [];
        for (const note of sceneNotes) {
          allNotesWithScenes.push({
            id: `detected-${allNotesWithScenes.length}`,
            sceneId: scene.id,
            description: note.description,
            vfxType: note.type,
            confidence: note.confidence,
            scene: { 
              sceneNumber: scene.sceneNumber, 
              headingRaw: scene.headingRaw, 
              sceneIndex: scene.sceneIndex 
            },
          } as typeof vfxNotes[number]);
        }
      }
      
      vfxNotes = allNotesWithScenes;
    }
    
    const vfxWarnings = await prisma.warning.findMany({
      where: {
        scene: { scriptId },
        warningType: 'vfx',
      },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true, sceneIndex: true } },
      },
      orderBy: { scene: { sceneIndex: 'asc' } },
    });

    const vfxProps = await prisma.sceneProp.findMany({
      where: {
        scene: { scriptId },
        prop: { category: 'vfx' },
      },
      include: {
        scene: { select: { sceneNumber: true, headingRaw: true } },
        prop: { select: { name: true, description: true } },
      },
    });

    const scenesWithVfx = new Set([
      ...vfxNotes.map((n) => n.scene.sceneNumber),
      ...vfxWarnings.map((w) => w.scene.sceneNumber),
      ...vfxProps.map((p) => p.scene.sceneNumber),
    ]);

    const complexityBreakdown = { simple: 0, moderate: 0, complex: 0 };
    for (const note of vfxNotes) {
      if (note.confidence >= 0.8) complexityBreakdown.complex++;
      else if (note.confidence >= 0.5) complexityBreakdown.moderate++;
      else complexityBreakdown.simple++;
    }

    return NextResponse.json({
      vfxNotes,
      vfxWarnings,
      props: vfxProps,
      summary: {
        totalScenes: scenesWithVfx.size,
        totalNotes: vfxNotes.length,
        totalWarnings: vfxWarnings.length,
        complexityBreakdown,
      },
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/vfx]', error);
    
    // Fallback to demo data on error
    const summary = {
      totalScenes: 6,
      totalNotes: DEMO_VFX_DATA.vfxNotes.length,
      totalWarnings: DEMO_VFX_DATA.vfxWarnings.length,
      complexityBreakdown: { simple: 1, moderate: 2, complex: 5 },
    };
    
    return NextResponse.json({
      ...DEMO_VFX_DATA,
      summary,
      isDemoMode: true,
      error: 'Using demo data due to database error',
    });
  }
}

export async function POST(req: NextRequest) {
  // Check database connection first
  const isDbConnected = await checkDbConnection();
  
  if (!isDbConnected) {
    // Return demo response when database is unavailable
    return NextResponse.json({
      notes: DEMO_VFX_DATA.vfxNotes,
      warnings: DEMO_VFX_DATA.vfxWarnings,
      summary: {
        scenesAnalyzed: 45,
        vfxNotesCreated: DEMO_VFX_DATA.vfxNotes.length,
        warningsCreated: DEMO_VFX_DATA.vfxWarnings.length,
      },
      message: 'VFX analysis complete (Demo Mode)',
      isDemoMode: true,
    });
  }

  // Database is available
  try {
    const { scriptId } = await req.json();
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
    }

    const scenes = await prisma.scene.findMany({
      where: { scriptId },
      orderBy: { sceneIndex: 'asc' },
    });

    if (scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes found for this script' }, { status: 404 });
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { content: true },
    });

    const fullText = script?.content || '';
    const lines = fullText.split('\n');
    const createdNotes: unknown[] = [];
    const createdWarnings: unknown[] = [];

    for (const scene of scenes) {
      const sceneText =
        scene.startLine && scene.endLine
          ? lines.slice(Math.max(0, scene.startLine - 1), scene.endLine).join('\n')
          : scene.description || scene.headingRaw || '';

      if (!sceneText.trim()) continue;

      // Try AI-based extraction first
      let vfxEntities: Array<{
        description: string;
        type: string;
        confidence: number;
      }> = [];
      
      try {
        const result = await runTextTask(
          'script.entityExtraction',
          {
            sceneText,
            sceneNumber: scene.sceneNumber,
            knownCharacters: '',
          },
          PROMPTS.scriptParsing.entityExtraction.system,
          PROMPTS.scriptParsing.entityExtraction.user,
          { responseFormat: { type: 'json_object' }, maxTokens: 4096 },
        );

        const parsed = JSON.parse(result);
        vfxEntities = parsed.vfx || [];
      } catch (aiError) {
        console.warn(`[POST /api/vfx] AI extraction failed for scene ${scene.sceneNumber}, using deterministic detection`);
        
        // Fallback to deterministic detection
        const deterministicResults = detectVfxInText(sceneText);
        vfxEntities = deterministicResults.map(v => ({
          description: v.description,
          type: v.type,
          confidence: v.confidence,
        }));
      }

      for (const vfx of vfxEntities) {
        const note = await prisma.vfxNote.create({
          data: {
            sceneId: scene.id,
            description: vfx.description,
            vfxType: vfx.type || 'implied',
            confidence: vfx.confidence || 0,
          },
        });
        createdNotes.push(note);

        if (vfx.confidence >= 0.7) {
          const warning = await prisma.warning.create({
            data: {
              sceneId: scene.id,
              warningType: 'vfx',
              severity: vfx.confidence >= 0.9 ? 'high' : 'medium',
              description: `VFX required: ${vfx.description} (${vfx.type})`,
            },
          });
          createdWarnings.push(warning);
        }
      }
    }

    return NextResponse.json({
      notes: createdNotes,
      warnings: createdWarnings,
      summary: {
        scenesAnalyzed: scenes.length,
        vfxNotesCreated: createdNotes.length,
        warningsCreated: createdWarnings.length,
      },
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[POST /api/vfx]', error);
    
    // Fallback to demo response on error
    return NextResponse.json({
      notes: DEMO_VFX_DATA.vfxNotes,
      warnings: DEMO_VFX_DATA.vfxWarnings,
      summary: {
        scenesAnalyzed: 45,
        vfxNotesCreated: DEMO_VFX_DATA.vfxNotes.length,
        warningsCreated: DEMO_VFX_DATA.vfxWarnings.length,
      },
      message: 'VFX analysis complete (Demo Mode - fallback)',
      isDemoMode: true,
    });
  }
}
