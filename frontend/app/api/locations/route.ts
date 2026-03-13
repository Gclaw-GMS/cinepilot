import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scoutLocations, getCandidatesForScene } from '@/lib/locations/scouter';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not available
const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Chennai Street', locationIntents: [{ id: 'intent-1', keywords: ['street', 'urban', 'night'], terrainType: 'urban', _count: { candidates: 3 } }] },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Kapaleeshwarar Temple', locationIntents: [{ id: 'intent-2', keywords: ['temple', 'heritage', 'night'], terrainType: 'heritage', _count: { candidates: 2 } }] },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. RESTAURANT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tamil Restaurant', locationIntents: [{ id: 'intent-3', keywords: ['restaurant', 'indoor', 'traditional'], terrainType: 'indoor', _count: { candidates: 4 } }] },
  { id: 'scene-4', sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNSET', intExt: 'EXT', timeOfDay: 'SUNSET', location: 'Marina Beach', locationIntents: [{ id: 'intent-4', keywords: ['beach', 'sunset', 'coastal'], terrainType: 'coastal', _count: { candidates: 2 } }] },
  { id: 'scene-5', sceneNumber: '8', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Corporate Office', locationIntents: [{ id: 'intent-5', keywords: ['office', 'corporate', 'modern'], terrainType: 'indoor', _count: { candidates: 3 } }] },
  { id: 'scene-6', sceneNumber: '12', headingRaw: 'EXT. HILL STATION - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Ooty', locationIntents: [{ id: 'intent-6', keywords: ['hill station', 'nature', 'morning'], terrainType: 'mountain', _count: { candidates: 2 } }] },
]

const DEMO_CANDIDATES = [
  { id: 'cand-1', name: 'Marina Beach Promenade', latitude: '13.0500', longitude: '80.2824', placeType: 'beach', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: [], explanation: 'Wide open space perfect for night shoots with excellent crowd control options.' },
  { id: 'cand-2', name: "Edward Elliot's Beach", latitude: '13.0333', longitude: '80.2833', placeType: 'beach', scoreTotal: 78, scoreAccess: 75, scoreLocality: 82, riskFlags: ['Tourist crowd'], explanation: 'Less crowded than Marina but limited parking. Good for early morning.' },
  { id: 'cand-3', name: 'Besant Nagar Beach', latitude: '12.9989', longitude: '80.2678', placeType: 'beach', scoreTotal: 72, scoreAccess: 70, scoreLocality: 75, riskFlags: ['Weekend crowd'], explanation: 'More local feel, good for village sequences.' },
  { id: 'cand-4', name: 'Kapaleeshwarar Temple', latitude: '13.0365', longitude: '80.2555', placeType: 'temple', scoreTotal: 92, scoreAccess: 85, scoreLocality: 95, riskFlags: ['Worship hours'], explanation: 'Authentic heritage location with traditional architecture.' },
  { id: 'cand-5', name: 'Santhome Cathedral', latitude: '13.0315', longitude: '80.2615', placeType: 'temple', scoreTotal: 88, scoreAccess: 80, scoreLocality: 85, riskFlags: [], explanation: 'Beautiful colonial architecture, good alternative for religious scenes.' },
  { id: 'cand-6', name: 'Hotel Saravana Bhavan', latitude: '13.0380', longitude: '80.2620', placeType: 'restaurant', scoreTotal: 95, scoreAccess: 92, scoreLocality: 90, riskFlags: ['Meal hours'], explanation: 'Authentic vegetarian South Indian restaurant, good for indoor scenes.' },
  { id: 'cand-7', name: 'Express Avenue Mall', latitude: '13.0550', longitude: '80.2530', placeType: 'restaurant', scoreTotal: 82, scoreAccess: 88, scoreLocality: 75, riskFlags: ['Weekend crowd'], explanation: 'Modern restaurant space available for filming.' },
]

function getDemoScenes() {
  return DEMO_SCENES
}

function getDemoCandidates(sceneId: string) {
  // Return different candidates based on scene
  const sceneIndex = DEMO_SCENES.findIndex(s => s.id === sceneId)
  if (sceneIndex >= 0 && sceneIndex < 4) {
    return DEMO_CANDIDATES.slice(sceneIndex * 2, sceneIndex * 2 + 2)
  }
  return DEMO_CANDIDATES.slice(0, 2)
}

// GET /api/locations — get scenes with location intents and candidates
// GET /api/locations?stats=true — get stats for dashboard
export async function GET(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get('sceneId');
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

    if (sceneId) {
      const intent = await getCandidatesForScene(sceneId);
      return NextResponse.json({ intent });
    }

    // First get script IDs for this project, then query scenes
    const scripts = await prisma.script.findMany({
      where: { projectId },
      select: { id: true },
    });
    const scriptIds = scripts.map(s => s.id);

    // If no scripts found in database, fall back to demo data
    if (scriptIds.length === 0) {
      const demoScenes = DEMO_SCENES.map(s => ({
        sceneNumber: s.sceneNumber,
        headingRaw: s.headingRaw,
        location: s.location,
        candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
      }));
      
      if (statsOnly) {
        return NextResponse.json({
          scenes: demoScenes,
          _demo: true,
          isDemoMode: true,
        });
      }
      return NextResponse.json({ 
        scenes: DEMO_SCENES,
        _demo: true,
        isDemoMode: true,
      });
    }

    const scenes = await prisma.scene.findMany({
      where: { scriptId: { in: scriptIds } },
      select: {
        id: true,
        sceneNumber: true,
        headingRaw: true,
        intExt: true,
        timeOfDay: true,
        location: true,
        locationIntents: {
          select: {
            id: true,
            keywords: true,
            terrainType: true,
            _count: { select: { candidates: true } },
          },
        },
      },
      orderBy: { sceneIndex: 'asc' },
    });

    // If no scenes with location intents, return demo data
    if (scenes.length === 0) {
      if (statsOnly) {
        return NextResponse.json({
          scenes: DEMO_SCENES.map(s => ({
            sceneNumber: s.sceneNumber,
            headingRaw: s.headingRaw,
            location: s.location,
            candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
          })),
          _demo: true,
          isDemoMode: true,
        });
      }
      return NextResponse.json({ 
        scenes: DEMO_SCENES,
        _demo: true,
        isDemoMode: true,
      });
    }

    // For stats-only requests (dashboard), return flat format
    if (statsOnly) {
      return NextResponse.json({
        scenes: scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.headingRaw,
          location: s.location,
          candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
        })),
        _demo: false,
        isDemoMode: false,
      });
    }

    return NextResponse.json({ scenes, _demo: false, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/locations] Database not available, using demo data:', error);
    // Use demo data when database is not available
    if (sceneId) {
      return NextResponse.json({ 
        intent: { 
          id: 'demo-intent', 
          sceneId, 
          keywords: ['demo', 'location'], 
          terrainType: 'urban',
          candidates: getDemoCandidates(sceneId)
        },
        _demo: true,
        isDemoMode: true,
      });
    }
    
    const demoScenes = DEMO_SCENES.map(s => ({
      sceneNumber: s.sceneNumber,
      headingRaw: s.headingRaw,
      location: s.location,
      candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
    }));
    
    return NextResponse.json({ 
      scenes: DEMO_SCENES,
      _demo: true,
      isDemoMode: true,
    });
  }
}

// POST /api/locations — scout locations for a scene
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sceneId, region } = body;

    if (action === 'scout' && sceneId) {
      const result = await scoutLocations(sceneId, region);
      return NextResponse.json({
        message: `Found ${result.candidates.length} candidates from ${result.total} results`,
        ...result,
      });
    }

    // Demo mode: return mock scout results
    if (action === 'scout' && sceneId && process.env.NODE_ENV !== 'production') {
      // Return demo candidates for the scene
      const demoCandidates = getDemoCandidates(sceneId);
      return NextResponse.json({
        message: `Found ${demoCandidates.length} candidates (demo mode)`,
        candidates: demoCandidates,
        total: demoCandidates.length,
        _demo: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing sceneId' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/locations]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
