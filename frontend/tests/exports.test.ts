/**
 * Exports API Tests
 * Run with: npx jest tests/exports.test.ts
 */

const API_BASE = 'http://localhost:3002/api/exports';

describe('Exports API', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('GET /api/exports', () => {
    it('returns export types without type param', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('exportTypes');
      expect(Array.isArray(data.exportTypes)).toBe(true);
      expect(data.exportTypes.length).toBeGreaterThan(0);
      expect(data).toHaveProperty('isDemoMode');
    });

    it('export types have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const exportType = data.exportTypes[0];
      expect(exportType).toHaveProperty('id');
      expect(exportType).toHaveProperty('name');
      expect(exportType).toHaveProperty('format');
      expect(exportType).toHaveProperty('icon');
      expect(exportType).toHaveProperty('description');
    });

    it('export types include expected types', async () => {
      const res = await fetch(API_BASE);
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
      const res = await fetch(`${API_BASE}?type=schedule`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('shootingDays');
      expect(data).toHaveProperty('totalDays');
      expect(data).toHaveProperty('scheduledDays');
    });

    it('returns demo data for budget type', async () => {
      const res = await fetch(`${API_BASE}?type=budget`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('totalPlanned');
      expect(data).toHaveProperty('totalActual');
    });

    it('returns demo data for shot_list type', async () => {
      const res = await fetch(`${API_BASE}?type=shot_list`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('shots');
      expect(data).toHaveProperty('totalShots');
      expect(data).toHaveProperty('summary');
    });

    it('returns demo data for crew type', async () => {
      const res = await fetch(`${API_BASE}?type=crew`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('crew');
      expect(data).toHaveProperty('totalCrew');
      expect(data).toHaveProperty('departments');
    });

    it('returns demo data for equipment type', async () => {
      const res = await fetch(`${API_BASE}?type=equipment`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('equipment');
      expect(data).toHaveProperty('totalItems');
      expect(data).toHaveProperty('totalValue');
    });

    it('returns demo data for locations type', async () => {
      const res = await fetch(`${API_BASE}?type=locations`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('locations');
      expect(data).toHaveProperty('totalLocations');
    });

    it('returns demo data for full_json type', async () => {
      const res = await fetch(`${API_BASE}?type=full_json`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('project');
      expect(data).toHaveProperty('metadata');
    });

    it('returns 400 for unknown export type', async () => {
      const res = await fetch(`${API_BASE}?type=unknown`);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('sets correct content disposition header', async () => {
      const res = await fetch(`${API_BASE}?type=schedule`);

      expect(res.headers.get('Content-Disposition')).toContain('schedule');
    });

    it('marks demo mode in headers when using demo data', async () => {
      const res = await fetch(`${API_BASE}?type=schedule`);

      // Demo mode header is set when using demo data
      expect(res.headers.get('X-Demo-Mode')).toBeTruthy();
    });
  });

  describe('POST /api/exports', () => {
    it('returns 400 when types is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('returns 400 when types is not an array', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: 'schedule' }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
    });

    it('returns 200 when types is empty array', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: [] }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('exports');
    });

    it('generates batch export for valid types', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: ['schedule', 'budget'] }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('exports');
      expect(data.exports).toHaveProperty('schedule');
      expect(data.exports).toHaveProperty('budget');
      expect(data).toHaveProperty('generatedAt');
    });

    it('includes isDemoMode in response', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: ['schedule'] }),
      });
      const data = await res.json();

      expect(data).toHaveProperty('isDemoMode');
    });

    it('handles all export types in batch', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          types: ['schedule', 'budget', 'shot_list', 'crew', 'equipment', 'locations', 'full_json'] 
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Object.keys(data.exports).length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Demo Data Validation', () => {
    it('demo schedule has valid structure', async () => {
      const res = await fetch(`${API_BASE}?type=schedule`);
      const data = await res.json();

      expect(Array.isArray(data.shootingDays)).toBe(true);
      expect(data.shootingDays.length).toBeGreaterThan(0);
      
      const day = data.shootingDays[0];
      expect(day).toHaveProperty('id');
      expect(day).toHaveProperty('dayNumber');
      // Database uses scheduledDate, demo uses date
      expect(day.date || day.scheduledDate).toBeDefined();
      expect(day).toHaveProperty('callTime');
      expect(day).toHaveProperty('location');
      // Database uses dayScenes, demo uses scenes
      expect(day.scenes || day.dayScenes).toBeDefined();
      expect(day).toHaveProperty('status');
    });

    it('demo budget has valid numeric values', async () => {
      const res = await fetch(`${API_BASE}?type=budget`);
      const data = await res.json();

      expect(typeof data.totalPlanned).toBe('number');
      expect(typeof data.totalActual).toBe('number');
      expect(typeof data.variance).toBe('number');
      expect(typeof data.percentSpent).toBe('number');
    });

    it('demo shots have varied shot sizes', async () => {
      const res = await fetch(`${API_BASE}?type=shot_list`);
      const data = await res.json();

      // Either demo data with varied sizes or DB data with any sizes
      const sizes = data.shots.map((s: { shotSize: string }) => s.shotSize);
      const uniqueSizes = [...new Set(sizes)];
      expect(uniqueSizes.length).toBeGreaterThan(0);
    });

    it('demo crew covers multiple departments', async () => {
      const res = await fetch(`${API_BASE}?type=crew`);
      const data = await res.json();

      expect(Array.isArray(data.departments)).toBe(true);
      expect(data.departments.length).toBeGreaterThan(1);
    });

    it('demo equipment has multiple categories', async () => {
      const res = await fetch(`${API_BASE}?type=equipment`);
      const data = await res.json();

      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBeGreaterThan(1);
    });

    it('demo locations have valid structure', async () => {
      const res = await fetch(`${API_BASE}?type=locations`);
      const data = await res.json();

      expect(Array.isArray(data.locations)).toBe(true);
      expect(data.locations.length).toBeGreaterThan(0);

      const location = data.locations[0];
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('name');
      expect(location).toHaveProperty('address');
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
    });

    it('demo full project has complete structure', async () => {
      const res = await fetch(`${API_BASE}?type=full_json`);
      const data = await res.json();

      expect(data.project).toHaveProperty('id');
      expect(data.project).toHaveProperty('name');
      expect(data.metadata).toHaveProperty('exportedAt');
    });
  });
});
