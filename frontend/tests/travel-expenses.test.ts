/**
 * Travel Expenses API Test Suite
 * Tests all endpoints for the Travel Expenses feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/travel-expenses/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/travel-expenses');
  
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

describe('Travel Expenses API', () => {
  describe('GET /api/travel-expenses', () => {
    it('returns array of expenses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('expenses have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.length > 0) {
        const expense = data[0];
        expect(expense).toHaveProperty('id');
        expect(expense).toHaveProperty('projectId');
        expect(expense).toHaveProperty('category');
        expect(expense).toHaveProperty('description');
        expect(expense).toHaveProperty('amount');
        expect(expense).toHaveProperty('date');
        expect(expense).toHaveProperty('status');
      }
    });

    it('filters by projectId', async () => {
      const req = createRequest({ method: 'GET', params: { projectId: 'demo-project' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('filters by category', async () => {
      const req = createRequest({ method: 'GET', params: { category: 'flight' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      data.forEach((expense: any) => {
        expect(expense.category).toBe('flight');
      });
    });

    it('filters by status', async () => {
      const req = createRequest({ method: 'GET', params: { status: 'pending' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      data.forEach((expense: any) => {
        expect(expense.status).toBe('pending');
      });
    });

    it('returns summary when action=summary', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'summary' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('totals');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('summary has totals', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'summary' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.totals).toHaveProperty('totalSpent');
      expect(data.totals).toHaveProperty('pendingAmount');
      expect(data.totals).toHaveProperty('approvedAmount');
      expect(data.totals).toHaveProperty('reimbursedAmount');
    });

    it('handles invalid category filter', async () => {
      const req = createRequest({ method: 'GET', params: { category: 'invalid-category' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/travel-expenses', () => {
    it('creates new expense', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'create',
          projectId: 'demo-project',
          category: 'flight',
          description: 'Test flight',
          amount: 5000,
          date: '2026-04-01',
          status: 'pending'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.description).toBe('Test flight');
    });

    it('updates existing expense', async () => {
      // First create an expense
      const createReq = createRequest({
        method: 'POST',
        body: {
          action: 'create',
          category: 'taxi',
          description: 'To be updated',
          amount: 100
        }
      });
      const createRes = await POST(createReq);
      const created = await createRes.json();
      
      // Now update it
      const updateReq = createRequest({
        method: 'POST',
        body: {
          action: 'update',
          id: created.id,
          amount: 200,
          status: 'approved'
        }
      });
      const updateRes = await POST(updateReq);
      const updated = await updateRes.json();
      
      expect(updateRes.status).toBe(200);
      expect(updated.amount).toBe(200);
      expect(updated.status).toBe('approved');
    });

    it('deletes expense', async () => {
      // First create an expense
      const createReq = createRequest({
        method: 'POST',
        body: {
          action: 'create',
          category: 'taxi',
          description: 'To be deleted',
          amount: 100
        }
      });
      const createRes = await POST(createReq);
      const created = await createRes.json();
      
      // Now delete it
      const deleteReq = createRequest({
        method: 'POST',
        body: {
          action: 'delete',
          id: created.id
        }
      });
      const deleteRes = await POST(deleteReq);
      const deleted = await deleteRes.json();
      
      expect(deleteRes.status).toBe(200);
      expect(deleted.success).toBe(true);
    });

    it('returns error for invalid update', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'update',
          id: 'non-existent-id',
          amount: 100
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('returns error for invalid delete', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'delete',
          id: 'non-existent-id'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
    });

    it('resets demo data', async () => {
      const req = createRequest({
        method: 'POST',
        body: { action: 'reset' }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns error for invalid action', async () => {
      const req = createRequest({
        method: 'POST',
        body: { action: 'invalid' }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('handles empty body', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    it('has multiple expense categories', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const categories = new Set(data.map((e: any) => e.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('has flight expenses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasFlight = data.some((e: any) => e.category === 'flight');
      expect(hasFlight).toBe(true);
    });

    it('has hotel expenses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasHotel = data.some((e: any) => e.category === 'hotel');
      expect(hasHotel).toBe(true);
    });

    it('has multiple status types', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const statuses = new Set(data.map((e: any) => e.status));
      expect(statuses.size).toBeGreaterThan(1);
    });

    it('has realistic amounts', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((expense: any) => {
        expect(expense.amount).toBeGreaterThan(0);
      });
    });

    it('has Tamil film industry context', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      // Check for known Tamil film industry vendors/locations
      const hasIndustryContext = data.some((e: any) => 
        e.vendor === 'Taj Coromandel' || 
        e.vendor === 'IndiGo' ||
        e.vendor === 'Air India' ||
        e.fromLocation === 'Chennai' ||
        e.toLocation === 'Chennai'
      );
      expect(hasIndustryContext).toBe(true);
    });

    it('expenses have person names for cast/crew', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      // Some expenses should have personName
      const hasPersonName = data.some((e: any) => e.personName);
      expect(hasPersonName).toBe(true);
    });

    it('has valid date format', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((expense: any) => {
        expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});
