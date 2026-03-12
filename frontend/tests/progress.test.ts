import { describe, test, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3002/api/progress';

describe('Progress API', () => {
  describe('GET /api/progress', () => {
    test('returns progress data with required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('phases');
      expect(Array.isArray(data.phases)).toBe(true);
    });

    test('phases have required fields when present', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.phases && data.phases.length > 0) {
        const phase = data.phases[0];
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('progress');
        expect(phase).toHaveProperty('status');
      }
    });

    test('returns isDemoMode flag', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(data).toHaveProperty('isDemoMode');
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    test('handles type parameter for different data views', async () => {
      const types = ['overview', 'timeline', 'schedule', 'budget', 'crew', 'all'];
      
      for (const type of types) {
        const res = await fetch(`${API_BASE}?type=${type}`);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data).toHaveProperty('isDemoMode');
      }
    });

    test('handles invalid type parameter gracefully', async () => {
      const res = await fetch(`${API_BASE}?type=invalid`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      // Should return some valid response even with invalid type
      expect(data).toBeDefined();
    });

    test('progress values are numeric', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.phases && data.phases.length > 0) {
        data.phases.forEach((phase: { progress: unknown }) => {
          expect(typeof phase.progress).toBe('number');
          expect(phase.progress).toBeGreaterThanOrEqual(0);
          expect(phase.progress).toBeLessThanOrEqual(100);
        });
      }
    });

    test('status values are valid', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const validStatuses = ['not_started', 'in_progress', 'completed', 'on_hold'];
      
      if (data.phases && data.phases.length > 0) {
        data.phases.forEach((phase: { status: string }) => {
          expect(validStatuses).toContain(phase.status);
        });
      }
    });
  });

  describe('POST /api/progress', () => {
    test('returns success for generate action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('success');
    });

    test('handles update action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', phaseId: '1', progress: 50 }),
      });
      
      const data = await res.json();
      expect(res.status).toBe(200);
    });

    test('handles invalid action gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid_action' }),
      });
      
      const data = await res.json();
      // Should still return valid response
      expect(data).toBeDefined();
    });

    test('handles empty body gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const data = await res.json();
      expect(data).toBeDefined();
    });
  });

  describe('Demo Data Validation', () => {
    test('demo data contains multiple phases', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode) {
        expect(data.phases.length).toBeGreaterThan(1);
      }
    });

    test('demo phases cover different progress levels', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode) {
        const progressValues = data.phases.map((p: { progress: number }) => p.progress);
        const uniqueProgress = new Set(progressValues);
        expect(uniqueProgress.size).toBeGreaterThan(1);
      }
    });

    test('demo phases have different statuses', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode) {
        const statuses = new Set(data.phases.map((p: { status: string }) => p.status));
        expect(statuses.size).toBeGreaterThan(1);
      }
    });
  });
});
