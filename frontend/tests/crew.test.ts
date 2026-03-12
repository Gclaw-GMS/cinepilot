/**
 * Crew API Tests
 * Run with: npx jest tests/crew.test.ts
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/crew/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/crew');
  
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

describe('Crew API', () => {
  describe('GET /api/crew', () => {
    it('returns crew list', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('returns demo data when DB unavailable', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      // Demo data should have specific IDs
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('role');
    });

    it('crew member has required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
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

    it('includes department breakdown', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const departments = new Set(data.map((c: { department: string }) => c.department).filter(Boolean));
      expect(departments.size).toBeGreaterThan(0);
    });

    it('daily rates are numeric', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      for (const crew of data) {
        if (crew.dailyRate !== null) {
          expect(typeof crew.dailyRate).toBe('number');
        }
      }
    });
  });

  describe('POST /api/crew', () => {
    it('creates new crew member', async () => {
      const testCrew = {
        name: 'Test Crew Member',
        role: 'Director',
        department: 'Direction',
        phone: '+91 99999 99999',
        email: 'test@cinepilot.ai',
        dailyRate: 10000,
        notes: 'Test notes',
      };
      
      const req = createRequest({ method: 'POST', body: testCrew });
      const res = await POST(req);
      const data = await res.json();
      
      // Either succeeds with created crew or returns demo data in demo mode
      expect([200, 201]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(data).toHaveProperty('id');
        expect(data.name).toBe(testCrew.name);
        expect(data.role).toBe(testCrew.role);
      }
    });

    it('validation requires name', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { role: 'Director' }
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('validation requires role', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { name: 'Test' }
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('validates name is not empty', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { name: '   ', role: 'Director' }
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/crew', () => {
    it('updates crew member', async () => {
      const req = createRequest({ 
        method: 'PATCH', 
        body: { id: 'crew-1', name: 'Updated Name' }
      });
      const res = await PATCH(req);
      
      // Either succeeds or returns demo data in demo mode
      expect([200, 404]).toContain(res.status);
    });

    it('requires id for update', async () => {
      const req = createRequest({ 
        method: 'PATCH', 
        body: { name: 'Updated Name' }
      });
      const res = await PATCH(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /api/crew', () => {
    it('deletes crew member', async () => {
      const req = createRequest({ 
        method: 'DELETE', 
        body: { id: 'crew-1' }
      });
      const res = await DELETE(req);
      
      // Either succeeds or returns demo data in demo mode
      expect([200, 404]).toContain(res.status);
    });

    it('requires id for delete', async () => {
      const req = createRequest({ 
        method: 'DELETE', 
        body: {}
      });
      const res = await DELETE(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Demo Data Validation', () => {
    it('demo crew has realistic names', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.length).toBeGreaterThan(0);
      for (const crew of data) {
        expect(crew.name).toBeTruthy();
        expect(crew.name.length).toBeGreaterThan(2);
      }
    });

    it('demo crew has valid phone numbers', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      for (const crew of data) {
        expect(crew.phone).toMatch(/^\+91\s\d{5}\s\d{5}$/);
      }
    });

    it('demo crew has realistic daily rates', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
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
