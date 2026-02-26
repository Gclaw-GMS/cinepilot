import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/redis/cache';
import { runTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';
import { LocationKeywordsSchema, type LocationKeywordsResult } from '@/lib/ai/schemas';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// Script-Aware Location Scouter
// Scene → Intent → Candidate Search (Overpass API) → Scoring → Shortlist
// =============================================================================

const DEFAULT_REGION = { name: 'Chennai', lat: 13.0827, lng: 80.2707, radiusKm: 30 };

// Scene heading keywords that hint at location types
const LOCATION_HINTS: Record<string, string[]> = {
  'temple': ['place_of_worship', 'hindu_temple'],
  'church': ['place_of_worship', 'christian'],
  'mosque': ['place_of_worship', 'muslim'],
  'beach': ['beach', 'coastline'],
  'lake': ['water', 'lake', 'reservoir'],
  'river': ['waterway', 'river'],
  'hospital': ['hospital', 'clinic'],
  'school': ['school', 'college'],
  'police': ['police'],
  'market': ['marketplace', 'shop'],
  'restaurant': ['restaurant', 'cafe'],
  'hotel': ['hotel'],
  'airport': ['aerodrome'],
  'station': ['station', 'railway'],
  'road': ['highway', 'road'],
  'park': ['park', 'garden'],
  'farm': ['farmland', 'farm'],
  'forest': ['forest', 'wood'],
  'mountain': ['peak', 'hill'],
  'office': ['office', 'commercial'],
  'apartment': ['apartments', 'residential'],
  'house': ['house', 'residential'],
};

// -----------------------------------------------------------------------------
// Stage 1: Extract Location Intent from Scene
// -----------------------------------------------------------------------------

export async function extractLocationIntent(sceneId: string): Promise<LocationKeywordsResult> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { script: { select: { content: true } } },
  });

  if (!scene) throw new Error('Scene not found');

  const scriptLines = scene.script?.content?.split('\n') || [];
  const sceneText = scriptLines
    .slice(Math.max(0, (scene.startLine || 1) - 1), scene.endLine || scriptLines.length)
    .join('\n');

  const cacheKey = `location_intent:${sceneId}`;
  const cached = await cacheGet<LocationKeywordsResult>(cacheKey);
  if (cached) return cached;

  let result: LocationKeywordsResult;
  try {
    result = await runTask<LocationKeywordsResult>(
      'location.keywordExtraction',
      { sceneText: sceneText || scene.headingRaw || 'Unknown scene' },
      PROMPTS.locationScouter.keywordExtraction.system,
      PROMPTS.locationScouter.keywordExtraction.user,
      LocationKeywordsSchema,
      { maxTokens: 1024 }
    );
  } catch {
    const heading = (scene.headingRaw || scene.location || '').toLowerCase();
    const keywords: string[] = [];
    for (const [hint, tags] of Object.entries(LOCATION_HINTS)) {
      if (heading.includes(hint)) keywords.push(...tags);
    }
    if (keywords.length === 0) keywords.push('amenity');

    result = {
      keywords: keywords.length > 0 ? keywords : ['general'],
      terrain_type: scene.intExt === 'EXT' ? 'outdoor' : 'indoor',
      time_of_day: scene.timeOfDay || undefined,
    };
  }

  await cacheSet(cacheKey, result, CACHE_TTL.ai);
  return result;
}

// -----------------------------------------------------------------------------
// Stage 2: Save Intent + Stage 3: Search Candidates via Overpass API
// -----------------------------------------------------------------------------

export async function scoutLocations(
  sceneId: string,
  regionOverride?: { lat: number; lng: number; radiusKm: number }
) {
  const intent = await extractLocationIntent(sceneId);
  const region = regionOverride || DEFAULT_REGION;

  const existingIntent = await prisma.locationIntent.findFirst({ where: { sceneId } });
  const intentRecord = existingIntent || await prisma.locationIntent.create({
    data: {
      sceneId,
      keywords: intent.keywords,
      terrainType: intent.terrain_type || null,
      requiredFeatures: intent.required_features || [],
      avoidFeatures: intent.avoid_features || [],
      timeOfDay: intent.time_of_day || null,
    },
  });

  const cacheKey = `overpass:${region.lat}:${region.lng}:${region.radiusKm}:${intent.keywords.join(',')}`;
  let osmResults = await cacheGet<any[]>(cacheKey);

  if (!osmResults) {
    osmResults = await queryOverpass(region.lat, region.lng, region.radiusKm, intent.keywords);
    if (osmResults.length > 0) {
      await cacheSet(cacheKey, osmResults, 86400 * 7);
    }
  }

  const scored = scoreAndRank(osmResults, intent, region);
  const top20 = scored.slice(0, 20);

  await prisma.candidate.deleteMany({ where: { intentId: intentRecord.id } });

  for (const candidate of top20) {
    await prisma.candidate.create({
      data: {
        intentId: intentRecord.id,
        name: candidate.name || null,
        latitude: new Decimal(candidate.lat),
        longitude: new Decimal(candidate.lng),
        osmId: candidate.osmId || null,
        placeType: candidate.placeType || null,
        scoreTotal: candidate.scoreTotal,
        scoreAccess: candidate.scoreAccess,
        scoreLocality: candidate.scoreLocality,
        riskFlags: candidate.riskFlags,
        explanation: candidate.explanation || null,
      },
    });
  }

  return {
    intent: intentRecord,
    candidates: top20,
    total: osmResults.length,
  };
}

// -----------------------------------------------------------------------------
// Overpass API Query
// -----------------------------------------------------------------------------

async function queryOverpass(
  lat: number,
  lng: number,
  radiusKm: number,
  keywords: string[]
): Promise<any[]> {
  const radiusM = radiusKm * 1000;
  const filters = keywords.map(k => {
    const entries = Object.entries(LOCATION_HINTS).find(([, tags]) => tags.includes(k));
    if (k === 'water' || k === 'lake') return `node["natural"="water"](around:${radiusM},${lat},${lng});`;
    if (k === 'beach') return `node["natural"="beach"](around:${radiusM},${lat},${lng});`;
    if (k === 'park') return `node["leisure"="park"](around:${radiusM},${lat},${lng});`;
    if (k === 'place_of_worship') return `node["amenity"="place_of_worship"](around:${radiusM},${lat},${lng});`;
    if (k === 'hospital') return `node["amenity"="hospital"](around:${radiusM},${lat},${lng});`;
    if (k === 'school') return `node["amenity"="school"](around:${radiusM},${lat},${lng});`;
    if (k === 'restaurant') return `node["amenity"="restaurant"](around:${radiusM},${lat},${lng});`;
    if (k === 'hotel') return `node["tourism"="hotel"](around:${radiusM},${lat},${lng});`;
    if (k === 'marketplace') return `node["shop"](around:${radiusM},${lat},${lng});`;
    if (k === 'residential') return `way["building"="residential"](around:${radiusM},${lat},${lng});`;
    if (k === 'highway' || k === 'road') return `way["highway"~"tertiary|secondary|residential"](around:${radiusM},${lat},${lng});`;
    return `node["amenity"="${k}"](around:${radiusM},${lat},${lng});`;
  });

  const query = `[out:json][timeout:25];(${filters.join('')});out center 50;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data.elements || []).map((el: any) => ({
      osmId: `${el.type}/${el.id}`,
      name: el.tags?.name || el.tags?.['name:en'] || null,
      lat: el.center?.lat || el.lat,
      lng: el.center?.lon || el.lon,
      placeType: el.tags?.amenity || el.tags?.natural || el.tags?.leisure || el.tags?.tourism || 'unknown',
      tags: el.tags || {},
    })).filter((el: any) => el.lat && el.lng);
  } catch (err) {
    console.warn('[Overpass API] Query failed:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------

interface ScoredCandidate {
  osmId: string | null;
  name: string | null;
  lat: number;
  lng: number;
  placeType: string | null;
  scoreTotal: number;
  scoreAccess: number;
  scoreLocality: number;
  riskFlags: string[];
  explanation: string | null;
}

function scoreAndRank(
  candidates: any[],
  intent: LocationKeywordsResult,
  region: { lat: number; lng: number; radiusKm: number }
): ScoredCandidate[] {
  return candidates
    .map((c: any) => {
      const dist = haversine(region.lat, region.lng, c.lat, c.lng);
      const accessScore = Math.max(0, 100 - (dist / region.radiusKm) * 100);
      const localityScore = c.tags?.building ? 70 : c.tags?.['addr:street'] ? 60 : 40;
      const keywordMatch = intent.keywords.some(k =>
        (c.placeType || '').includes(k) || (c.name || '').toLowerCase().includes(k)
      ) ? 30 : 0;
      const total = (accessScore * 0.3) + (localityScore * 0.2) + (keywordMatch) + 20;

      const riskFlags: string[] = [];
      if (dist > region.radiusKm * 0.8) riskFlags.push('far_from_base');
      if (c.tags?.access === 'private') riskFlags.push('private_access');

      return {
        osmId: c.osmId,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        placeType: c.placeType,
        scoreTotal: Math.round(total),
        scoreAccess: Math.round(accessScore),
        scoreLocality: Math.round(localityScore),
        riskFlags,
        explanation: c.name
          ? `${c.name} — ${c.placeType || 'location'}, ${dist.toFixed(1)}km from base`
          : `${c.placeType || 'location'} at ${dist.toFixed(1)}km from base`,
      };
    })
    .sort((a: ScoredCandidate, b: ScoredCandidate) => b.scoreTotal - a.scoreTotal);
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// -----------------------------------------------------------------------------
// Get Candidates for a Scene
// -----------------------------------------------------------------------------

export async function getCandidatesForScene(sceneId: string) {
  const intent = await prisma.locationIntent.findFirst({
    where: { sceneId },
    include: {
      candidates: {
        orderBy: { scoreTotal: 'desc' },
        take: 20,
      },
    },
  });

  return intent;
}
