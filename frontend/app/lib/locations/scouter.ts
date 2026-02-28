import { prisma } from '@/lib/db';

interface LocationCandidate {
  id: string;
  name: string | null;
  latitude: string;
  longitude: string;
  placeType: string | null;
  scoreTotal: number;
  scoreAccess: number | null;
  scoreLocality: number | null;
  riskFlags: string[];
  explanation: string | null;
}

interface ScoutResult {
  candidates: LocationCandidate[];
  total: number;
  source: string;
}

// Demo data for location scouting when no API is configured
const DEMO_CANDIDATES: Record<string, LocationCandidate[]> = {
  'default': [
    { id: 'c1', name: 'Anna Nagar Studios', latitude: '13.0827', longitude: '80.2750', placeType: 'studio', scoreTotal: 92, scoreAccess: 95, scoreLocality: 90, riskFlags: [], explanation: 'Professional studio with excellent infrastructure' },
    { id: 'c2', name: 'Mahabalipuram Beach', latitude: '12.6263', longitude: '80.1948', placeType: 'beach', scoreTotal: 88, scoreAccess: 85, scoreLocality: 92, riskFlags: ['crowd'], explanation: 'Iconic beach location, best during weekdays' },
    { id: 'c3', name: 'Powder Tower', latitude: '13.0830', longitude: '80.2700', placeType: 'heritage', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: ['tourists'], explanation: 'Historic location requiring permits' },
    { id: 'c4', name: 'Vadapalani Temple', latitude: '13.0516', longitude: '80.2149', placeType: 'temple', scoreTotal: 78, scoreAccess: 75, scoreLocality: 85, riskFlags: ['religious'], explanation: 'Sacred temple, restricted shooting hours' },
  ],
  'beach': [
    { id: 'b1', name: 'Mahabalipuram Shore Temple', latitude: '12.6263', longitude: '80.1948', placeType: 'beach', scoreTotal: 95, scoreAccess: 90, scoreLocality: 95, riskFlags: ['tourists'], explanation: 'Iconic beach with ancient temple backdrop' },
    { id: 'b2', name: 'Covelong Beach', latitude: '12.7927', longitude: '80.2504', placeType: 'beach', scoreTotal: 82, scoreAccess: 88, scoreLocality: 78, riskFlags: [], explanation: 'Clean beach, good for early morning shoots' },
    { id: 'b3', name: 'Kovalam Beach', latitude: '12.7869', longitude: '80.2544', placeType: 'beach', scoreTotal: 75, scoreAccess: 80, scoreLocality: 72, riskFlags: [], explanation: 'Secluded beach, requires local permission' },
  ],
  'forest': [
    { id: 'f1', name: 'Kodaikanal Forest', latitude: '10.2381', longitude: '77.4892', placeType: 'forest', scoreTotal: 90, scoreAccess: 65, scoreLocality: 95, riskFlags: ['remote', 'weather'], explanation: 'Lush forest, best during summer months' },
    { id: 'f2', name: 'Anamalai Tiger Reserve', latitude: '10.4955', longitude: '76.9894', placeType: 'forest', scoreTotal: 85, scoreAccess: 55, scoreLocality: 90, riskFlags: ['wildlife', 'permits'], explanation: 'Wildlife sanctuary, special permits required' },
  ],
  'urban': [
    { id: 'u1', name: 'T Nagar', latitude: '13.0418', longitude: '80.2344', placeType: 'urban', scoreTotal: 88, scoreAccess: 92, scoreLocality: 85, riskFlags: ['crowd', 'traffic'], explanation: 'Bustling commercial area, night shoots recommended' },
    { id: 'u2', name: 'George Town', latitude: '13.0881', longitude: '80.2914', placeType: 'urban', scoreTotal: 82, scoreAccess: 80, scoreLocality: 88, riskFlags: ['crowd'], explanation: 'Historic market area, authentic local flavor' },
    { id: 'u3', name: 'Marina Beach Road', latitude: '13.0500', longitude: '80.2827', placeType: 'urban', scoreTotal: 78, scoreAccess: 85, scoreLocality: 75, riskFlags: ['crowd'], explanation: 'Scenic coastal road, sunrise shoots ideal' },
  ],
  'village': [
    { id: 'v1', name: 'Chennai Rural Village', latitude: '12.9500', longitude: '80.1500', placeType: 'village', scoreTotal: 88, scoreAccess: 75, scoreLocality: 95, riskFlags: [], explanation: 'Traditional village with authentic architecture' },
    { id: 'v2', name: 'Kanchipuram Village', latitude: '12.8348', longitude: '79.7030', placeType: 'village', scoreTotal: 85, scoreAccess: 70, scoreLocality: 92, riskFlags: [], explanation: 'Temple city with rich cultural heritage' },
  ],
  'studio': [
    { id: 's1', name: 'AVM Studios', latitude: '13.0520', longitude: '80.1890', placeType: 'studio', scoreTotal: 98, scoreAccess: 95, scoreLocality: 90, riskFlags: [], explanation: 'Legendary studio with full production facilities' },
    { id: 's2', name: 'Vadivelu Studios', latitude: '13.0730', longitude: '80.2650', placeType: 'studio', scoreTotal: 88, scoreAccess: 92, scoreLocality: 85, riskFlags: [], explanation: 'Modern studio with advanced lighting equipment' },
    { id: 's3', name: 'Sun Studios', latitude: '13.0810', longitude: '80.2780', placeType: 'studio', scoreTotal: 85, scoreAccess: 90, scoreLocality: 82, riskFlags: [], explanation: 'Well-equipped studio, popular for song sequences' },
  ],
  'interior': [
    { id: 'i1', name: 'Heritage Hotel - Chennai', latitude: '13.0750', longitude: '80.2600', placeType: 'hotel', scoreTotal: 90, scoreAccess: 95, scoreLocality: 88, riskFlags: [], explanation: 'Luxury hotel with period interiors' },
    { id: 'i2', name: 'Kollywood House', latitude: '13.0500', longitude: '80.2200', placeType: 'apartment', scoreTotal: 82, scoreAccess: 88, scoreLocality: 78, riskFlags: [], explanation: 'Fully furnished production house' },
  ],
};

// Determine location type from scene data
function getLocationTypeFromScene(scene: { headingRaw?: string | null; location?: string | null; intExt?: string | null }): string {
  const text = `${scene.headingRaw || ''} ${scene.location || ''} ${scene.intExt || ''}`.toLowerCase();
  
  if (text.includes('beach') || text.includes('sea') || text.includes('ocean')) return 'beach';
  if (text.includes('forest') || text.includes('jungle') || text.includes('tree')) return 'forest';
  if (text.includes('city') || text.includes('street') || text.includes('market') || text.includes('road')) return 'urban';
  if (text.includes('village') || text.includes('town') || text.includes('hamlet')) return 'village';
  if (text.includes('studio') || text.includes('set')) return 'studio';
  if (text.includes('int') || text.includes('room') || text.includes('house') || text.includes('hotel')) return 'interior';
  
  return 'default';
}

// Scout locations for a given scene
export async function scoutLocations(sceneId: string, region?: string): Promise<ScoutResult> {
  try {
    // Get the scene from database
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        locationIntents: true,
      },
    });

    // Determine location type
    const locationType = scene ? getLocationTypeFromScene(scene) : 'default';

    // Get candidates for this location type
    let candidates = DEMO_CANDIDATES[locationType] || DEMO_CANDIDATES['default'];

    // If region is specified, filter candidates (simulated)
    if (region) {
      candidates = candidates.slice(0, 3);
    }

    // Get or create a location intent for this scene
    let intentId: string;
    if (scene?.locationIntents && scene.locationIntents.length > 0) {
      intentId = scene.locationIntents[0].id;
    } else {
      // Create a new location intent
      const newIntent = await prisma.locationIntent.create({
        data: {
          sceneId: sceneId,
          keywords: [scene?.location || 'general'],
          terrainType: locationType,
        },
      });
      intentId = newIntent.id;
    }

    // Add candidates to database via the existing Candidate model
    for (const candidate of candidates) {
      try {
        await prisma.candidate.upsert({
          where: { id: candidate.id },
          create: {
            id: candidate.id,
            intentId: intentId,
            name: candidate.name,
            latitude: candidate.latitude as unknown as Decimal,
            longitude: candidate.longitude as unknown as Decimal,
            placeType: candidate.placeType,
            scoreTotal: candidate.scoreTotal,
            scoreAccess: candidate.scoreAccess,
            scoreLocality: candidate.scoreLocality,
            riskFlags: candidate.riskFlags,
            explanation: candidate.explanation,
          },
          update: {
            name: candidate.name,
            latitude: candidate.latitude as unknown as Decimal,
            longitude: candidate.longitude as unknown as Decimal,
            placeType: candidate.placeType,
            scoreTotal: candidate.scoreTotal,
            scoreAccess: candidate.scoreAccess,
            scoreLocality: candidate.scoreLocality,
            riskFlags: candidate.riskFlags,
            explanation: candidate.explanation,
          },
        });
      } catch (e) {
        console.warn('Failed to upsert candidate:', e);
      }
    }

    return {
      candidates,
      total: candidates.length,
      source: 'demo',
    };
  } catch (error) {
    console.error('[scoutLocations]', error);
    // Return demo data on error
    return {
      candidates: DEMO_CANDIDATES['default'],
      total: DEMO_CANDIDATES['default'].length,
      source: 'demo',
    };
  }
}

// Get existing candidates for a scene
export async function getCandidatesForScene(sceneId: string) {
  try {
    // First try to get via location intents
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        locationIntents: {
          include: {
            candidates: {
              orderBy: { scoreTotal: 'desc' },
            },
          },
        },
      },
    });

    if (scene?.locationIntents && scene.locationIntents.length > 0) {
      const intent = scene.locationIntents[0];
      return {
        sceneId,
        intentId: intent.id,
        candidates: intent.candidates.map(c => ({
          id: c.id,
          name: c.name,
          latitude: String(c.latitude),
          longitude: String(c.longitude),
          placeType: c.placeType,
          scoreTotal: c.scoreTotal,
          scoreAccess: c.scoreAccess,
          scoreLocality: c.scoreLocality,
          riskFlags: c.riskFlags,
          explanation: c.explanation,
        })),
      };
    }

    // If no candidates in DB, run scout to generate them
    const result = await scoutLocations(sceneId);
    return {
      sceneId,
      candidates: result.candidates,
    };
  } catch (error) {
    console.error('[getCandidatesForScene]', error);
    // Return demo data on error
    return {
      sceneId,
      candidates: DEMO_CANDIDATES['default'],
    };
  }
}

// Get scenes that need location scouting
export async function getScenesNeedingScouting(projectId: string) {
  try {
    const scenes = await prisma.scene.findMany({
      where: {
        script: { projectId },
      },
      include: {
        locationIntents: {
          include: {
            _count: { select: { candidates: true } },
          },
        },
      },
      orderBy: { sceneIndex: 'asc' },
    });

    // Filter to scenes without candidates
    const needsScouting = scenes.filter(
      (scene) => scene.locationIntents.length === 0 || 
      scene.locationIntents.every((intent) => intent._count.candidates === 0)
    );

    return needsScouting;
  } catch (error) {
    console.error('[getScenesNeedingScouting]', error);
    return [];
  }
}

// Helper type for Decimal
type Decimal = number;
