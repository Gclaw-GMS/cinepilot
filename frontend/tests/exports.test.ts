/**
 * Exports API Tests
 * Run with: npx jest tests/exports.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { GET, POST } from '@/app/api/exports/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/exports');
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const init: RequestInit = {
    method: options.method || 'GET',
  };
  
  if (options.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, init);
}

describe('Exports API', () => {
  describe('GET /api/exports', () => {
    it('returns export types without type param', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('exportTypes');
      expect(Array.isArray(data.exportTypes)).toBe(true);
      expect(data.exportTypes.length).toBeGreaterThan(0);
      expect(data).toHaveProperty('isDemoMode');
    });

    it('export types have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const exportType = data.exportTypes[0];
      expect(exportType).toHaveProperty('id');
      expect(exportType).toHaveProperty('name');
      expect(exportType).toHaveProperty('format');
      expect(exportType).toHaveProperty('icon');
      expect(exportType).toHaveProperty('description');
    });

    it('export types include expected types', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const ids = data.exportTypes.map((t: { id: string }) => t.id);
      expect(ids).toContain('schedule');
      expect(ids).toContain('budget');
      expect(ids).toContain('shot_list');
      expect(ids).toContain('crew');
      expect(ids).toContain('equipment');
      expect(ids).toContain('locations');
      expect(ids).toContain('full_json');
    });

    it('returns demo data for schedule type', async () => {
      const req = createRequest({ params: { type: 'schedule' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('shootingDays');
      expect(data).toHaveProperty('totalDays');
      expect(data).toHaveProperty('scheduledDays');
    });

    it('returns demo data for budget type', async () => {
      const req = createRequest({ params: { type: 'budget' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('totalPlanned');
      expect(data).toHaveProperty('totalActual');
    });

    it('returns demo data for shot_list type', async () => {
      const req = createRequest({ params: { type: 'shot_list' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('shots');
      expect(data).toHaveProperty('totalShots');
      expect(data).toHaveProperty('summary');
    });

    it('returns demo data for crew type', async () => {
      const req = createRequest({ params: { type: 'crew' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('crew');
      expect(data).toHaveProperty('totalCrew');
      expect(data).toHaveProperty('departments');
    });

    it('returns demo data for equipment type', async () => {
      const req = createRequest({ params: { type: 'equipment' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('equipment');
      expect(data).toHaveProperty('totalItems');
      expect(data).toHaveProperty('totalValue');
    });

    it('returns demo data for locations type', async () => {
      const req = createRequest({ params: { type: 'locations' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('locations');
      expect(data).toHaveProperty('totalLocations');
    });

    it('returns demo data for full_json type', async () => {
      const req = createRequest({ params: { type: 'full_json' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('project');
      expect(data.project).toHaveProperty('id');
      expect(data).toHaveProperty('metadata');
    });

    it('returns error for unknown type', async () => {
      const req = createRequest({ params: { type: 'unknown' } });
      const res = await GET(req);

      expect(res.status).toBe(400);
    });

    it('sets correct content-disposition header for schedule', async () => {
      const req = createRequest({ params: { type: 'schedule' } });
      const res = await GET(req);

      expect(res.headers.get('Content-Disposition')).toContain('schedule_demo.json');
    });

    it('sets correct content-disposition header for crew', async () => {
      const req = createRequest({ params: { type: 'crew' } });
      const res = await GET(req);

      expect(res.headers.get('Content-Disposition')).toContain('crew_demo.json');
    });

    it('marks demo mode in headers', async () => {
      const req = createRequest({ params: { type: 'schedule' } });
      const res = await GET(req);

      expect(res.headers.get('X-Demo-Mode')).toBe('true');
    });
  });

  describe('POST /api/exports', () => {
    it('returns export types when no types specified', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('returns error when types is not an array', async () => {
      const req = createRequest({
        method: 'POST',
        body: { types: 'not-an-array' }
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('exports single type successfully', async () => {
      const req = createRequest({
        method: 'POST',
        body: { types: ['schedule'] }
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('exports');
      expect(data.exports).toHaveProperty('schedule');
      expect(data).toHaveProperty('generatedAt');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('exports multiple types successfully', async () => {
      const req = createRequest({
        method: 'POST',
        body: { types: ['schedule', 'budget', 'crew'] }
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.exports).toHaveProperty('schedule');
      expect(data.exports).toHaveProperty('budget');
      expect(data.exports).toHaveProperty('crew');
    });

    it('exports all major types successfully', async () => {
      const req = createRequest({
        method: 'POST',
        body: { types: ['schedule', 'budget', 'shot_list', 'crew', 'equipment', 'locations', 'full_json'] }
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.exports).toHaveProperty('schedule');
      expect(data.exports).toHaveProperty('budget');
      expect(data.exports).toHaveProperty('shot_list');
      expect(data.exports).toHaveProperty('crew');
      expect(data.exports).toHaveProperty('equipment');
      expect(data.exports).toHaveProperty('locations');
      expect(data.exports).toHaveProperty('full_project');
    });

    it('handles callsheet as alias for budget', async () => {
      const req = createRequest({
        method: 'POST',
        body: { types: ['callsheet'] }
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.exports).toHaveProperty('budget');
    });
  });

  describe('Demo Data Validation', () => {
    it('demo schedule has correct structure', async () => {
      const req = createRequest({ params: { type: 'schedule' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.shootingDays)).toBe(true);
      expect(data.shootingDays.length).toBeGreaterThan(0);
      const day = data.shootingDays[0];
      expect(day).toHaveProperty('id');
      expect(day).toHaveProperty('dayNumber');
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('callTime');
      expect(day).toHaveProperty('wrapTime');
      expect(day).toHaveProperty('location');
    });

    it('demo budget has correct structure', async () => {
      const req = createRequest({ params: { type: 'budget' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      const item = data.items[0];
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('item');
      expect(item).toHaveProperty('planned');
      expect(item).toHaveProperty('actual');
      expect(data).toHaveProperty('totalPlanned');
      expect(data).toHaveProperty('totalActual');
      expect(data).toHaveProperty('variance');
      expect(data).toHaveProperty('percentSpent');
    });

    it('demo shot_list has correct structure', async () => {
      const req = createRequest({ params: { type: 'shot_list' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.shots)).toBe(true);
      expect(data.shots.length).toBeGreaterThan(0);
      const shot = data.shots[0];
      expect(shot).toHaveProperty('sceneNumber');
      expect(shot).toHaveProperty('shotIndex');
      expect(shot).toHaveProperty('shotText');
      expect(shot).toHaveProperty('shotSize');
      expect(shot).toHaveProperty('cameraAngle');
      expect(data).toHaveProperty('summary');
    });

    it('demo crew has correct structure', async () => {
      const req = createRequest({ params: { type: 'crew' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.crew)).toBe(true);
      expect(data.crew.length).toBeGreaterThan(0);
      const member = data.crew[0];
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('department');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('phone');
      expect(member).toHaveProperty('dailyRate');
      expect(data).toHaveProperty('departments');
      expect(Array.isArray(data.departments)).toBe(true);
      expect(data).toHaveProperty('totalDailyRate');
    });

    it('demo crew covers multiple departments', async () => {
      const req = createRequest({ params: { type: 'crew' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.departments)).toBe(true);
      expect(data.departments.length).toBeGreaterThan(1);
    });

    it('demo equipment has multiple categories', async () => {
      const req = createRequest({ params: { type: 'equipment' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBeGreaterThan(1);
    });

    it('demo locations have valid structure', async () => {
      const req = createRequest({ params: { type: 'locations' } });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.locations)).toBe(true);
      expect(data.locations.length).toBeGreaterThan(0);
      const loc = data.locations[0];
      expect(loc).toHaveProperty('name');
      expect(loc).toHaveProperty('type');
      expect(loc).toHaveProperty('address');
      expect(loc).toHaveProperty('status');
    });

    it('demo full project has complete structure', async () => {
      const req = createRequest({ params: { type: 'full_json' } });
      const res = await GET(req);
      const data = await res.json();

      expect(data.project).toHaveProperty('id');
      expect(data.project).toHaveProperty('name');
      expect(data.project).toHaveProperty('scripts');
      expect(data.project).toHaveProperty('characters');
      expect(data.project).toHaveProperty('crew');
      expect(data.project).toHaveProperty('locations');
    });
  });
});
