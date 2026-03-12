import { describe, it, expect } from '@jest/globals';

const API_BASE = process.env.API_URL || 'http://localhost:3002';

describe('Reports API', () => {
  const headers = { 'Content-Type': 'application/json' };

  describe('GET /api/reports', () => {
    it('returns report in demo mode', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemoMode).toBe(true);
    });

    it('returns success true', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('returns generatedAt timestamp', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data).toHaveProperty('generatedAt');
      expect(new Date(data.generatedAt)).toBeInstanceOf(Date);
    });

    it('returns production data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('production');
      expect(data.data.production).toHaveProperty('totalScenes');
      expect(data.data.production).toHaveProperty('totalCharacters');
      expect(data.data.production).toHaveProperty('totalLocations');
      expect(data.data.production).toHaveProperty('shootingDays');
      expect(data.data.production).toHaveProperty('budget');
      expect(data.data.production).toHaveProperty('spent');
      expect(data.data.production).toHaveProperty('vfxShots');
      expect(data.data.production).toHaveProperty('totalShots');
    });

    it('returns schedule data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('schedule');
      expect(data.data.schedule).toHaveProperty('completedDays');
      expect(data.data.schedule).toHaveProperty('totalDays');
      expect(data.data.schedule).toHaveProperty('scenesShot');
      expect(data.data.schedule).toHaveProperty('dailyProgress');
    });

    it('returns crew data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('crew');
      expect(data.data.crew).toHaveProperty('totalMembers');
      expect(data.data.crew).toHaveProperty('departments');
      expect(data.data.crew).toHaveProperty('totalDailyRate');
      expect(data.data.crew).toHaveProperty('departmentBreakdown');
    });

    it('returns censor data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('censor');
      expect(data.data.censor).toHaveProperty('certificate');
      expect(data.data.censor).toHaveProperty('score');
      expect(data.data.censor).toHaveProperty('issues');
      expect(data.data.censor).toHaveProperty('flags');
    });

    it('returns budget data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('budget');
      expect(data.data.budget).toHaveProperty('categories');
      expect(data.data.budget).toHaveProperty('variance');
      expect(data.data.budget).toHaveProperty('projectedTotal');
    });

    it('returns vfx data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('vfx');
      expect(data.data.vfx).toHaveProperty('totalShots');
      expect(data.data.vfx).toHaveProperty('completed');
      expect(data.data.vfx).toHaveProperty('pending');
      expect(data.data.vfx).toHaveProperty('complexityBreakdown');
    });

    it('returns locations data', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data).toHaveProperty('locations');
      expect(data.data.locations).toHaveProperty('total');
      expect(data.data.locations).toHaveProperty('indoor');
      expect(data.data.locations).toHaveProperty('outdoor');
      expect(data.data.locations).toHaveProperty('byType');
    });

    it('returns dataSources', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data).toHaveProperty('dataSources');
      expect(data.dataSources).toHaveProperty('scripts');
      expect(data.dataSources).toHaveProperty('characters');
      expect(data.dataSources).toHaveProperty('locations');
      expect(data.dataSources).toHaveProperty('shootingDays');
      expect(data.dataSources).toHaveProperty('crew');
      expect(data.dataSources).toHaveProperty('censor');
      expect(data.dataSources).toHaveProperty('expenses');
    });

    it('accepts projectId parameter', async () => {
      const res = await fetch(`${API_BASE}/api/reports?projectId=test-project`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('accepts type parameter', async () => {
      const res = await fetch(`${API_BASE}/api/reports?type=summary`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/reports', () => {
    it('generates report with generate action', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Report generated successfully');
    });

    it('accepts projectId in body', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', projectId: 'custom-project' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('accepts reportType in body', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', reportType: 'detailed' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('returns 400 for invalid action', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'invalid' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });

    it('returns 400 for missing action', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('returns 500 for invalid JSON', async () => {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      expect(res.status).toBe(500);
    });
  });

  describe('Demo Data Validation', () => {
    it('has valid production numbers', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.production.totalScenes).toBeGreaterThan(0);
      expect(data.data.production.budget).toBeGreaterThan(0);
      expect(data.data.production.spent).toBeGreaterThan(0);
    });

    it('has valid schedule with daily progress', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.schedule.dailyProgress.length).toBeGreaterThan(0);
      const day = data.data.schedule.dailyProgress[0];
      expect(day).toHaveProperty('day');
      expect(day).toHaveProperty('scenes');
      expect(day).toHaveProperty('budget');
    });

    it('has valid crew department breakdown', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.crew.departmentBreakdown.length).toBeGreaterThan(0);
      const dept = data.data.crew.departmentBreakdown[0];
      expect(dept).toHaveProperty('name');
      expect(dept).toHaveProperty('count');
      expect(dept).toHaveProperty('dailyRate');
    });

    it('has valid budget categories', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.budget.categories.length).toBeGreaterThan(0);
      const cat = data.data.budget.categories[0];
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('budget');
      expect(cat).toHaveProperty('spent');
    });

    it('has valid censor certificate', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      const validCerts = ['U', 'UA', 'UA 13+', 'A', 'A 18+'];
      expect(validCerts).toContain(data.data.censor.certificate);
    });

    it('has valid censor flags', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.censor.flags.length).toBeGreaterThan(0);
      const flag = data.data.censor.flags[0];
      expect(flag).toHaveProperty('category');
      expect(flag).toHaveProperty('count');
    });

    it('has valid vfx complexity breakdown', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.vfx.complexityBreakdown.length).toBeGreaterThan(0);
      const level = data.data.vfx.complexityBreakdown[0];
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('count');
    });

    it('has valid locations by type', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(data.data.locations.byType.length).toBeGreaterThan(0);
      const type = data.data.locations.byType[0];
      expect(type).toHaveProperty('type');
      expect(type).toHaveProperty('count');
    });

    it('has valid budget variance', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      expect(typeof data.data.budget.variance).toBe('number');
    });

    it('has realistic demo data for Tamil film production', async () => {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      
      // Tamil film production characteristics
      expect(data.data.production.totalScenes).toBeGreaterThanOrEqual(100);
      expect(data.data.crew.totalMembers).toBeGreaterThan(50);
      expect(data.data.production.budget).toBeGreaterThan(50000000); // 5+ Crores INR
      expect(data.data.vfx.totalShots).toBeGreaterThan(0);
    });
  });
});
