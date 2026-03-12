/**
 * DOOD (Day Out of Days) API Test Suite
 * Comprehensive tests for Day Out of Days feature
 */

const API_BASE = 'http://localhost:3002/api/dood';

describe('DOOD API', () => {
  describe('GET /api/dood', () => {
    test('returns report and stats in demo mode', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('report');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('isDemoMode');
    });

    test('report is an array', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(Array.isArray(data.report)).toBe(true);
    });

    test('report has required fields for each character', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        expect(char).toHaveProperty('characterId');
        expect(char).toHaveProperty('character');
        expect(char).toHaveProperty('actorName');
        expect(char).toHaveProperty('isMain');
        expect(char).toHaveProperty('total_days');
        expect(char).toHaveProperty('days');
        expect(char).toHaveProperty('percentage');
      }
    });

    test('isDemoMode is a boolean', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    test('days are valid day numbers (1-31)', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        for (const day of char.days) {
          expect(day).toBeGreaterThanOrEqual(1);
          expect(day).toBeLessThanOrEqual(31);
        }
      }
    });

    test('percentage calculation is correct', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        const expectedPercentage = Math.round((char.days.length / data.stats.totalShootingDays) * 100);
        expect(char.percentage).toBe(expectedPercentage);
      }
    });

    test('total_calls in stats equals sum of all days', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const totalDays = data.report.reduce((sum: number, char: { days: number[] }) => sum + char.days.length, 0);
      expect(data.stats.totalCalls).toBe(totalDays);
    });

    test('isMain is a boolean', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        expect(typeof char.isMain).toBe('boolean');
      }
    });

    test('supports projectId parameter', async () => {
      const res = await fetch(`${API_BASE}?projectId=test-project`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('report');
    });
  });

  describe('POST /api/dood', () => {
    test('generate action returns report', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', scriptId: 'demo-script' })
      });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('report');
      expect(data).toHaveProperty('message');
    });

    test('message is included in response', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', scriptId: 'demo-script' })
      });
      const data = await res.json();
      
      expect(typeof data.message).toBe('string');
    });

    test('returns valid response structure', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', scriptId: 'demo-script' })
      });
      const data = await res.json();
      
      expect(data).toHaveProperty('report');
      expect(data).toHaveProperty('stats');
      expect(Array.isArray(data.report)).toBe(true);
    });

    test('returns 400 for invalid action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid' })
      });
      
      expect(res.status).toBe(400);
    });

    test('handles empty body gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      expect(res.status).toBe(400);
    });

    test('supports projectId in body', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', scriptId: 'demo', projectId: 'test-project' })
      });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('report');
    });
  });

  describe('Demo Data Validation', () => {
    test('demo data contains multiple characters', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(data.report.length).toBeGreaterThan(5);
    });

    test('demo data has mix of main and supporting characters', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const mainChars = data.report.filter((c: { isMain: boolean }) => c.isMain);
      const supportingChars = data.report.filter((c: { isMain: boolean }) => !c.isMain);
      
      expect(mainChars.length).toBeGreaterThan(0);
      expect(supportingChars.length).toBeGreaterThan(0);
    });

    test('demo data has realistic shooting schedule', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      // Shooting days should be at least 10
      expect(data.stats.totalShootingDays).toBeGreaterThanOrEqual(10);
    });

    test('demo data has varied percentages', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const percentages = data.report.map((c: { percentage: number }) => c.percentage);
      const uniquePercentages = new Set(percentages);
      
      expect(uniquePercentages.size).toBeGreaterThan(3);
    });

    test('demo characters have Tamil names', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        expect(char).toHaveProperty('characterTamil');
        expect(char.characterTamil.length).toBeGreaterThan(0);
      }
    });

    test('demo characters have actor names', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        expect(char.actorName.length).toBeGreaterThan(0);
      }
    });

    test('days array is sorted', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        const sortedDays = [...char.days].sort((a, b) => a - b);
        expect(char.days).toEqual(sortedDays);
      }
    });

    test('total_days matches days array length', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      for (const char of data.report) {
        expect(char.total_days).toBe(char.days.length);
      }
    });
  });
});
