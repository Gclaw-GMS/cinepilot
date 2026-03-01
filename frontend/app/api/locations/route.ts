import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_SCENES = [
  { id: 'demo-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - SUNRISE', intExt: 'EXT', timeOfDay: 'DAY', location: 'Marina Beach', locationIntents: [{ id: 'i1', keywords: ['beach', 'sunrise', 'ocean'], terrainType: 'coastal', _count: { candidates: 4 } }] },
  { id: 'demo-2', sceneNumber: '5', headingRaw: 'INT. TRADITIONAL HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tamil House', locationIntents: [{ id: 'i2', keywords: ['house', 'traditional', 'family'], terrainType: 'residential', _count: { candidates: 3 } }] },
  { id: 'demo-3', sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Kapaleeshwarar Temple', locationIntents: [{ id: 'i3', keywords: ['temple', 'festival', 'crowd'], terrainType: 'religious', _count: { candidates: 2 } }] },
  { id: 'demo-4', sceneNumber: '18', headingRaw: 'EXT. FOREST ROAD - DUSK', intExt: 'EXT', timeOfDay: 'DUSK', location: 'Kodaikanal Highway', locationIntents: [{ id: 'i4', keywords: ['forest', 'road', 'dusk'], terrainType: 'forest', _count: { candidates: 3 } }] },
  { id: 'demo-5', sceneNumber: '25', headingRaw: 'INT. MODERN OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tech Park', locationIntents: [{ id: 'i5', keywords: ['office', 'corporate', 'modern'], terrainType: 'commercial', _count: { candidates: 2 } }] },
  { id: 'demo-6', sceneNumber: '31', headingRaw: 'EXT. CITY MARKET - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'T Nagar', locationIntents: [{ id: 'i6', keywords: ['market', 'bustling', 'street'], terrainType: 'urban', _count: { candidates: 4 } }] },
  { id: 'demo-7', sceneNumber: '38', headingRaw: 'EXT. VILLAGE POND - EVENING', intExt: 'EXT', timeOfDay: 'EVENING', location: 'Rural Village', locationIntents: [{ id: 'i7', keywords: ['village', 'pond', 'rural'], terrainType: 'village', _count: { candidates: 3 } }] },
  { id: 'demo-8', sceneNumber: '45', headingRaw: 'INT. STUDIO SET - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Film Studio', locationIntents: [{ id: 'i8', keywords: ['studio', 'set', 'controlled'], terrainType: 'studio', _count: { candidates: 3 } }] },
]

const DEMO_CANDIDATES = [
  { id: 'c1', intentId: 'i1', name: 'Marina Beach', latitude: '13.0500', longitude: '80.2827', placeType: 'beach', scoreTotal: 95, scoreWater: 98, scoreGreen: 20, scoreAccess: 98, scoreLocality: 92, scoreFlat: 95, riskFlags: ['crowd'], explanation: 'Iconic Chennai beach, perfect for sunrise shots with golden hour lighting', distanceKm: 0 },
  { id: 'c2', intentId: 'i1', name: 'Covelong Beach', latitude: '12.7927', longitude: '80.2504', placeType: 'beach', scoreTotal: 88, scoreWater: 90, scoreGreen: 30, scoreAccess: 85, scoreLocality: 90, scoreFlat: 92, riskFlags: [], explanation: 'Less crowded alternative, clean shoreline for dialogue scenes', distanceKm: 35 },
  { id: 'c3', intentId: 'i1', name: 'Mahabalipuram Shore Temple', latitude: '12.6263', longitude: '80.1948', placeType: 'heritage', scoreTotal: 92, scoreWater: 85, scoreGreen: 25, scoreAccess: 80, scoreLocality: 88, scoreFlat: 90, riskFlags: ['tourists'], explanation: 'Ancient temple backdrop, requires early morning permits', distanceKm: 50 },
  { id: 'c4', intentId: 'i1', name: 'Thiruvanmiyur Beach', latitude: '12.9833', longitude: '80.2667', placeType: 'beach', scoreTotal: 78, scoreWater: 75, scoreGreen: 15, scoreAccess: 90, scoreLocality: 75, scoreFlat: 88, riskFlags: [], explanation: 'Local beach with fishing community, authentic atmosphere', distanceKm: 8 },
  { id: 'c5', intentId: 'i2', name: 'Heritage Villa', latitude: '13.0750', longitude: '80.2200', placeType: 'house', scoreTotal: 91, scoreWater: 0, scoreGreen: 60, scoreAccess: 88, scoreLocality: 94, scoreFlat: 85, riskFlags: [], explanation: 'Traditional Tamil architecture with courtyard' },
  { id: 'c6', intentId: 'i2', name: 'Chennai Rural Home', latitude: '12.9500', longitude: '80.1500', placeType: 'house', scoreTotal: 85, scoreWater: 0, scoreGreen: 70, scoreAccess: 75, scoreLocality: 92, scoreFlat: 80, riskFlags: [], explanation: 'Authentic village house, good natural light' },
  { id: 'c7', intentId: 'i2', name: 'Film Set House', latitude: '13.0600', longitude: '80.2300', placeType: 'set', scoreTotal: 98, scoreWater: 0, scoreGreen: 40, scoreAccess: 95, scoreLocality: 85, scoreFlat: 98, riskFlags: [], explanation: 'Professional set with full lighting rigging access' },
]

// Helper to check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

// GET /api/locations — get scenes with location intents and candidates
// GET /api/locations?stats=true — get stats for dashboard
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const sceneId = req.nextUrl.searchParams.get('sceneId');
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true';

  const isDbConnected = await checkDbConnection()

  if (!isDbConnected) {
    // Return demo data
    if (sceneId) {
      const intentCandidates = DEMO_CANDIDATES.filter(c => c.intentId === sceneId || c.intentId === `i${sceneId.slice(-1)}`)
      return NextResponse.json({ 
        intent: { id: sceneId, candidates: intentCandidates },
        isDemoMode: true 
      })
    }

    if (statsOnly) {
      return NextResponse.json({
        scenes: DEMO_SCENES.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.headingRaw,
          location: s.location,
          candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
        })),
        isDemoMode: true,
      })
    }

    return NextResponse.json({ 
      scenes: DEMO_SCENES,
      isDemoMode: true 
    })
  }

  try {
    if (sceneId) {
      const { getCandidatesForScene } = await import('@/lib/locations/scouter')
      const intent = await getCandidatesForScene(sceneId);
      return NextResponse.json({ intent, isDemoMode: false });
    }

    const scenes = await prisma.scene.findMany({
      where: { script: { projectId } },
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

    // For stats-only requests (dashboard), return flat format
    if (statsOnly) {
      return NextResponse.json({
        scenes: scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          headingRaw: s.headingRaw,
          location: s.location,
          candidates: s.locationIntents.reduce((sum, intent) => sum + intent._count.candidates, 0),
        })),
        isDemoMode: false,
      });
    }

    return NextResponse.json({ scenes, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/locations]', error);
    // Fallback to demo data on error
    return NextResponse.json({ 
      scenes: DEMO_SCENES,
      isDemoMode: true 
    });
  }
}

// POST /api/locations — scout locations for a scene
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sceneId, region } = body;

    const isDbConnected = await checkDbConnection()

    if (action === 'scout' && sceneId) {
      if (!isDbConnected) {
        // Return demo scouting results
        const demoResults = DEMO_CANDIDATES.slice(0, 3).map(c => ({
          ...c,
          travelTimeMin: Math.round((c.distanceKm || 0) * 3),
        }))
        return NextResponse.json({
          message: `Found ${demoResults.length} candidates (Demo Mode)`,
          candidates: demoResults,
          total: demoResults.length,
          isDemoMode: true,
        });
      }

      const { scoutLocations } = await import('@/lib/locations/scouter')
      const result = await scoutLocations(sceneId, region);
      return NextResponse.json({
        message: `Found ${result.candidates.length} candidates from ${result.total} results`,
        ...result,
        isDemoMode: false,
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing sceneId' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/locations]', error);
    // Return demo results on error
    return NextResponse.json({
      message: 'Found 3 candidates (Demo Mode)',
      candidates: DEMO_CANDIDATES.slice(0, 3),
      total: 3,
      isDemoMode: true,
    });
  }
}
