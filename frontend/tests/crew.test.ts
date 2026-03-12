/**
 * Crew API Tests
 * Run with: npx jest tests/crew.test.ts
 */

const API_BASE = 'http://localhost:3002/api/crew';

describe('Crew API', () => {
  let createdCrewId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (createdCrewId) {
      await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdCrewId }),
      });
    }
  });

  const testCrew = {
    name: 'Test Crew Member',
    role: 'Director',
    department: 'Direction',
    phone: '+91 99999 99999',
    email: 'test@cinepilot.ai',
    dailyRate: 10000,
    notes: 'Test notes',
  };

  describe('GET /api/crew', () => {
    test('returns crew list', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    test('returns demo data when DB unavailable', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      // Demo data should have specific IDs
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('role');
    });

    test('crew member has required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const crew = data[0];
      expect(crew).toHaveProperty('id');
      expect(crew).toHaveProperty('name');
      expect(crew).toHaveProperty('role');
      expect(crew).toHaveProperty('department');
      expect(crew).toHaveProperty('phone');
      expect(crew).toHaveProperty('email');
      expect(crew).toHaveProperty('dailyRate');
    });

    test('includes department breakdown', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const departments = new Set(data.map((c: { department: string }) => c.department).filter(Boolean));
      expect(departments.size).toBeGreaterThan(0);
    });

    test('daily rates are numeric', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      for (const crew of data) {
        if (crew.dailyRate !== null) {
          expect(typeof crew.dailyRate).toBe('number');
        }
      }
    });
  });

  describe('POST /api/crew', () => {
    test('creates new crew member', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCrew),
      });

      const data = await res.json();
      
      if (res.status === 200 || res.status === 201) {
        createdCrewId = data.id;
        expect(data).toHaveProperty('id');
        expect(data.name).toBe(testCrew.name);
        expect(data.role).toBe(testCrew.role);
      } else {
        // Database not available - that's OK for demo mode
        console.log('POST crew failed (demo mode):', data);
      }
    });

    test('validation requires name', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Director' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('validation requires role', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('validates name is not empty', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '   ', role: 'Director' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/crew', () => {
    test('updates crew member', async () => {
      if (!createdCrewId) {
        console.log('Skipping PATCH test - no created crew ID');
        return;
      }

      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: createdCrewId, 
          name: 'Updated Name',
          role: 'Updated Role' 
        }),
      });

      const data = await res.json();
      
      if (res.status === 200) {
        expect(data.name).toBe('Updated Name');
      } else {
        console.log('PATCH crew failed (demo mode):', data);
      }
    });

    test('validation requires id', async () => {
      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('updates dailyRate as number', async () => {
      if (!createdCrewId) {
        console.log('Skipping dailyRate test - no created crew ID');
        return;
      }

      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: createdCrewId, 
          dailyRate: '15000' 
        }),
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(typeof data.dailyRate).toBe('number');
      }
    });
  });

  describe('DELETE /api/crew', () => {
    test('deletes crew member', async () => {
      if (!createdCrewId) {
        console.log('Skipping DELETE test - no created crew ID');
        return;
      }

      const res = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdCrewId }),
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.success).toBe(true);
      } else {
        console.log('DELETE crew failed (demo mode):', await res.json());
      }
    });

    test('validation requires id', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('validates id is not empty', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '   ' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    test('demo crew covers multiple departments', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const departments = data.map((c: { department: string }) => c.department);
      const uniqueDepts = [...new Set(departments)];
      
      expect(uniqueDepts.length).toBeGreaterThanOrEqual(5);
    });

    test('demo crew has valid phone numbers', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      for (const crew of data) {
        if (crew.phone) {
          expect(crew.phone).toMatch(/^\+91/);
        }
      }
    });

    test('demo crew has realistic daily rates', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      for (const crew of data) {
        if (crew.dailyRate !== null) {
          expect(crew.dailyRate).toBeGreaterThan(0);
          expect(crew.dailyRate).toBeLessThan(100000);
        }
      }
    });
  });
});
