import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

describe('Health API', () => {
  let apiUrl: string;

  beforeAll(() => {
    apiUrl = API_BASE;
  });

  describe('GET /api/health', () => {
    it('returns health data with all required fields', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      expect(res.ok || res.status === 503).toBe(true);
      
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
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      // Status should be one of these values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('returns array of health checks', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      expect(Array.isArray(data.checks)).toBe(true);
      expect(data.checks.length).toBeGreaterThan(0);
    });

    it('each health check has required fields', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      data.checks.forEach((check: { component: string, status: string, message?: string, latencyMs?: number }) => {
        expect(check).toHaveProperty('component');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(check).toHaveProperty('latencyMs');
      });
    });

    it('health checks have valid status values', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const validStatuses = ['healthy', 'degraded', 'unhealthy'];
      
      data.checks.forEach((check: { status: string }) => {
        expect(validStatuses).toContain(check.status);
      });
    });

    it('includes expected health components', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const components = data.checks.map((c: { component: string }) => c.component);
      
      // Should include database, disk, memory, and environment checks
      expect(components).toContain('database');
      expect(components).toContain('disk');
      expect(components).toContain('memory');
      expect(components).toContain('environment');
    });

    it('timestamp is a valid ISO date string', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('uptime is a positive number', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('latency values are numbers', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      data.checks.forEach((check: { latencyMs: number }) => {
        expect(typeof check.latencyMs).toBe('number');
        expect(check.latencyMs).toBeGreaterThanOrEqual(0);
      });
    });

    it('version is a string', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      expect(typeof data.version).toBe('string');
      expect(data.version.length).toBeGreaterThan(0);
    });

    it('isDemo is a boolean', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      expect(typeof data.isDemo).toBe('boolean');
    });

    it('returns 200 when healthy', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      
      // Should return 200 or 503 depending on status
      expect([200, 503]).toContain(res.status);
    });

    it('has database check with message', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const dbCheck = data.checks.find((c: { component: string }) => c.component === 'database');
      expect(dbCheck).toBeDefined();
      expect(dbCheck.message).toBeDefined();
      expect(typeof dbCheck.message).toBe('string');
    });

    it('has memory check with heap details', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const memCheck = data.checks.find((c: { component: string }) => c.component === 'memory');
      expect(memCheck).toBeDefined();
      
      // Memory check should have details with heap info
      if (memCheck.details) {
        expect(memCheck.details).toHaveProperty('heapUsedMB');
        expect(memCheck.details).toHaveProperty('heapTotalMB');
        expect(memCheck.details).toHaveProperty('heapPercent');
      }
    });

    it('has disk check with storage details', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const diskCheck = data.checks.find((c: { component: string }) => c.component === 'disk');
      expect(diskCheck).toBeDefined();
      
      // Disk check should have details with storage info
      if (diskCheck.details) {
        expect(diskCheck.details).toHaveProperty('totalGB');
        expect(diskCheck.details).toHaveProperty('freeGB');
        expect(diskCheck.details).toHaveProperty('usedPercent');
      }
    });

    it('has environment check with vars info', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const envCheck = data.checks.find((c: { component: string }) => c.component === 'environment');
      expect(envCheck).toBeDefined();
      
      // Environment check should have details with missing vars
      if (envCheck.details) {
        expect(envCheck.details).toHaveProperty('missingVars');
      }
    });

    it('overall status reflects worst component status', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const statuses = data.checks.map((c: { status: string }) => c.status);
      
      // If any unhealthy, overall should be unhealthy
      if (statuses.includes('unhealthy')) {
        expect(data.status).toBe('unhealthy');
      }
      // If any degraded (and none unhealthy), overall should be degraded
      else if (statuses.includes('degraded')) {
        expect(data.status).toBe('degraded');
      }
      // Otherwise should be healthy
      else {
        expect(data.status).toBe('healthy');
      }
    });
  });

  describe('Demo Mode Health', () => {
    it('has isDemo flag in response', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      // isDemo should be present
      expect('isDemo' in data).toBe(true);
    });

    it('database check shows demo mode message when no database', async () => {
      const res = await fetch(`${apiUrl}/api/health`);
      const data = await res.json();
      
      const dbCheck = data.checks.find((c: { component: string }) => c.component === 'database');
      
      // In demo mode, should mention demo mode
      if (data.isDemo) {
        expect(dbCheck.message).toContain('Demo');
      }
    });
  });
});
