import redis from './index';

// -----------------------------------------------------------------------------
// Key Namespace Patterns
// Consistent key structure across all features.
// Pattern: cinepilot:{feature}:{entity}:{id}
// -----------------------------------------------------------------------------

export const CACHE_KEYS = {
  // N16 — Script Parsing
  scriptHash:        (scriptId: string) => `cinepilot:script:hash:${scriptId}`,
  sceneBreakdown:    (sceneId: string)  => `cinepilot:script:breakdown:${sceneId}`,
  entityExtraction:  (sceneId: string)  => `cinepilot:script:entities:${sceneId}`,
  qualityScore:      (scriptId: string) => `cinepilot:script:quality:${scriptId}`,

  // N15 — Shot Hub
  beatSegmentation:  (sceneId: string)  => `cinepilot:shots:beats:${sceneId}`,
  shotGeneration:    (sceneId: string)  => `cinepilot:shots:generated:${sceneId}`,

  // N13 — Location Scouter
  locationSearch:    (intentId: string) => `cinepilot:location:search:${intentId}`,
  osmQuery:          (hash: string)     => `cinepilot:location:osm:${hash}`,
  travelMatrix:      (hash: string)     => `cinepilot:location:travel:${hash}`,
  reverseGeocode:    (hash: string)     => `cinepilot:location:geocode:${hash}`,

  // N14 — Schedule Engine
  weatherForecast:   (lat: string, lng: string, date: string) =>
    `cinepilot:schedule:weather:${lat}:${lng}:${date}`,
  scheduleProgress:  (jobId: string)    => `cinepilot:schedule:progress:${jobId}`,

  // N17 — Budget Engine
  budgetSnapshot:    (projectId: string, version: number) =>
    `cinepilot:budget:snapshot:${projectId}:${version}`,

  // N18 — Storyboard
  storyboardJob:     (jobId: string)    => `cinepilot:storyboard:job:${jobId}`,

  // N19 — Censor Board
  censorFlags:       (analysisId: string) => `cinepilot:censor:flags:${analysisId}`,

  // General
  aiResponse:        (hash: string)     => `cinepilot:ai:response:${hash}`,
  rateLimit:         (key: string)      => `cinepilot:ratelimit:${key}`,
  session:           (sessionId: string) => `cinepilot:session:${sessionId}`,
} as const;

// Default TTLs in seconds
export const CACHE_TTL = {
  short:    60 * 5,       // 5 minutes
  medium:   60 * 30,      // 30 minutes
  long:     60 * 60 * 4,  // 4 hours
  day:      60 * 60 * 24, // 24 hours
  weather:  60 * 60 * 3,  // 3 hours (weather data)
  osm:      60 * 60 * 24 * 7, // 7 days (OSM data changes infrequently)
  ai:       60 * 60 * 2,  // 2 hours (AI response cache)
} as const;

// -----------------------------------------------------------------------------
// Cache Helpers
// -----------------------------------------------------------------------------

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.medium
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failure should not break the app
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Non-critical
  }
}

export async function cacheInvalidateKey(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

/**
 * Get-or-set pattern: returns cached value if exists, otherwise
 * calls the factory, caches the result, and returns it.
 */
export async function cacheFetch<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.medium
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await factory();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

// -----------------------------------------------------------------------------
// Progress Tracking (for background jobs)
// Uses Redis hash for atomic field updates.
// -----------------------------------------------------------------------------

export interface JobProgress {
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  completed: number;
  message?: string;
  error?: string;
}

export async function setJobProgress(
  jobKey: string,
  progress: Partial<JobProgress>
): Promise<void> {
  try {
    const fields = Object.entries(progress)
      .filter(([, v]) => v !== undefined)
      .flatMap(([k, v]) => [k, String(v)]);
    if (fields.length > 0) {
      await redis.hset(jobKey, ...fields);
      await redis.expire(jobKey, CACHE_TTL.long);
    }
  } catch {
    // Non-critical
  }
}

export async function getJobProgress(jobKey: string): Promise<JobProgress | null> {
  try {
    const data = await redis.hgetall(jobKey);
    if (!data || Object.keys(data).length === 0) return null;
    return {
      status: (data.status as JobProgress['status']) || 'queued',
      progress: Number(data.progress) || 0,
      total: Number(data.total) || 0,
      completed: Number(data.completed) || 0,
      message: data.message,
      error: data.error,
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Rate Limiting (sliding window)
// -----------------------------------------------------------------------------

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const rateKey = CACHE_KEYS.rateLimit(key);
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(rateKey, 0, windowStart);
  pipeline.zadd(rateKey, now, `${now}`);
  pipeline.zcard(rateKey);
  pipeline.expire(rateKey, windowSeconds);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) || 0;

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetIn: windowSeconds,
  };
}
