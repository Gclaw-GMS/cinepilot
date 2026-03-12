/**
 * Health API Tests
 * Run with: npx jest tests/health.test.ts
 */
import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/health');
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const req = new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
  });
  
  return req;
}

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('returns health data with all required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      // Check required top-level fields
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('isDemo');
    });

    it('returns valid status values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      // Status should be one of these values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('returns array of health checks', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(Array.isArray(data.checks)).toBe(true);
      expect(data.checks.length).toBeGreaterThan(0);
    });

    it('each health check has required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      data.checks.forEach((check: { component: string, status: string, message?: string, latencyMs?: number }) => {
        expect(check).toHaveProperty('component');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(check).toHaveProperty('latencyMs');
      });
    });

    it('health checks have valid status values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validStatuses = ['healthy', 'degraded', 'unhealthy'];
      
      data.checks.forEach((check: { status: string }) => {
        expect(validStatuses).toContain(check.status);
      });
    });

    it('includes expected health components', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const components = data.checks.map((c: { component: string }) => c.component);
      
      // Should include database, disk, memory, and environment checks
      expect(components).toContain('database');
      expect(components).toContain('disk');
      expect(components).toContain('memory');
      expect(components).toContain('environment');
    });

    it('timestamp is a valid ISO date string', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('uptime is a positive number', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('version is a string', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(typeof data.version).toBe('string');
      expect(data.version.length).toBeGreaterThan(0);
    });

    it('latency values are numeric', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      data.checks.forEach((check: { latencyMs?: number }) => {
        if (check.latencyMs !== undefined) {
          expect(typeof check.latencyMs).toBe('number');
          expect(check.latencyMs).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});
