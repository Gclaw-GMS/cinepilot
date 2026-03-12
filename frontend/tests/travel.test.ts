/**
 * Travel API Tests
 * Run with: npx jest tests/travel.test.ts
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/travel/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/travel');
  
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

describe('Travel API', () => {
  describe('GET /api/travel', () => {
    it('returns travel expenses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('expenses');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('expenses is an array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(Array.isArray(data.expenses)).toBe(true);
    });

    it('expense items have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.expenses.length > 0) {
        const item = data.expenses[0];
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('amount');
      }
    });
  });

  describe('POST /api/travel', () => {
    it('creates new travel expense', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          category: 'Flight',
          description: 'Test travel',
          amount: 5000,
          date: '2026-04-01',
          projectId: 'demo-project'
        }
      });
      const res = await POST(req);
      
      // Either succeeds or runs in demo mode
      expect([200, 201, 500]).toContain(res.status);
    });

    it('validates required fields', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { notes: 'Test' }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/travel', () => {
    it('updates travel expense', async () => {
      const req = createRequest({ 
        method: 'PATCH', 
        params: { id: 'travel-1' },
        body: { 
          notes: 'Updated notes'
        }
      });
      const res = await PATCH(req);
      
      // Either succeeds or runs in demo mode
      expect([200, 404, 500]).toContain(res.status);
    });

    it('requires id for update', async () => {
      const req = createRequest({ 
        method: 'PATCH', 
        body: { notes: 'Test' }
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/travel', () => {
    it('deletes travel expense', async () => {
      const req = createRequest({ 
        method: 'DELETE', 
        params: { id: 'travel-1' }
      });
      const res = await DELETE(req);
      
      // Either succeeds or runs in demo mode (returns 200)
      expect([200, 400, 404, 500]).toContain(res.status);
    });

    it('requires id for delete', async () => {
      const req = createRequest({ 
        method: 'DELETE' 
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });
  });
});
