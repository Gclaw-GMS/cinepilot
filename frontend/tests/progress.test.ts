/**
 * Progress API Tests
 * Run with: npx jest tests/progress.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/progress/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/progress');
  
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

describe('GET /api/progress', () => {
  test('returns progress data with required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('phases');
    expect(Array.isArray(data.phases)).toBe(true);
  });

  test('phases have required fields when present', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    expect(data).toHaveProperty('isDemoMode');
    expect(typeof data.isDemoMode).toBe('boolean');
  });

  test('handles type parameter for different data views', async () => {
    const types = ['overview', 'timeline', 'schedule', 'budget', 'crew', 'all'];
    
    for (const type of types) {
      const req = createRequest({ method: 'GET', params: { type } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('isDemoMode');
    }
  });

  test('handles invalid type parameter gracefully', async () => {
    const req = createRequest({ method: 'GET', params: { type: 'invalid' } });
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Should return some valid response even with invalid type
    expect(data).toBeDefined();
  });

  test('progress values are numeric', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ 
      method: 'POST', 
      body: { action: 'generate' } 
    });
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  test('handles update action', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { action: 'update', phaseId: '1', progress: 50 } 
    });
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
  });

  test('handles invalid action gracefully', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { action: 'invalid_action' } 
    });
    const res = await POST(req);
    const data = await res.json();
    
    // Should still return valid response
    expect(data).toBeDefined();
  });

  test('handles empty body gracefully', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    const res = await POST(req);
    const data = await res.json();
    
    expect(data).toBeDefined();
  });
});

describe('Demo Data Validation', () => {
  test('demo data contains multiple phases', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.isDemoMode) {
      expect(data.phases.length).toBeGreaterThan(1);
    }
  });

  test('demo phases cover different progress levels', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.isDemoMode) {
      const progressValues = data.phases.map((p: { progress: number }) => p.progress);
      const uniqueProgress = new Set(progressValues);
      expect(uniqueProgress.size).toBeGreaterThan(1);
    }
  });

  test('demo phases have different statuses', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.isDemoMode) {
      const statuses = new Set(data.phases.map((p: { status: string }) => p.status));
      expect(statuses.size).toBeGreaterThan(1);
    }
  });
});
