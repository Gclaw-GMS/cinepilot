/**
 * Continuity API Tests
 * Run with: npx jest tests/continuity.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/continuity/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/continuity');
  
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

describe('GET /api/continuity', () => {
  it('returns continuity data with all required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    expect(res.ok).toBe(true);
    
    const data = await res.json();
    
    // Check required top-level fields
    expect(data).toHaveProperty('warnings');
    expect(data).toHaveProperty('summary');
  });

  it('returns array of warnings', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    expect(Array.isArray(data.warnings)).toBe(true);
  });

  it('warnings have required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.warnings.length > 0) {
      const warning = data.warnings[0];
      expect(warning).toHaveProperty('id');
      expect(warning).toHaveProperty('sceneId');
      expect(warning).toHaveProperty('warningType');
      expect(warning).toHaveProperty('description');
      expect(warning).toHaveProperty('severity');
      expect(warning).toHaveProperty('scene');
    }
  });

  it('warnings have valid severity values', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    data.warnings.forEach((warning: { severity: string }) => {
      expect(validSeverities).toContain(warning.severity);
    });
  });

  it('scene object has required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.warnings.length > 0) {
      const scene = data.warnings[0].scene;
      expect(scene).toHaveProperty('sceneNumber');
      expect(scene).toHaveProperty('headingRaw');
    }
  });

  it('summary has required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    expect(data.summary).toHaveProperty('total');
    expect(data.summary).toHaveProperty('continuityIssues');
    expect(data.summary).toHaveProperty('plotHoles');
    expect(data.summary).toHaveProperty('bySeverity');
  });

  it('summary counts are correct', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const { summary, warnings } = data;
    
    // Total should equal warnings array length
    expect(summary.total).toBe(warnings.length);
  });

  it('isDemoMode flag is present (_demo)', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    // Demo mode flag could be isDemoMode or _demo
    expect('isDemoMode' in data || '_demo' in data).toBe(true);
  });

  it('warningType values are valid', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const validTypes = ['continuity', 'plot_hole'];
    
    data.warnings.forEach((warning: { warningType: string }) => {
      expect(validTypes).toContain(warning.warningType);
    });
  });

  it('description is a non-empty string', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    data.warnings.forEach((warning: { description: string }) => {
      expect(typeof warning.description).toBe('string');
      expect(warning.description.length).toBeGreaterThan(0);
    });
  });

  it('sceneId is a string', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    data.warnings.forEach((warning: { sceneId: string }) => {
      expect(typeof warning.sceneId).toBe('string');
    });
  });

  it('handles scriptId query parameter', async () => {
    const req = createRequest({ method: 'GET', params: { scriptId: 'test-script' } });
    const res = await GET(req);
    expect(res.ok).toBe(true);
    
    const data = await res.json();
    expect(data).toHaveProperty('warnings');
    expect(data).toHaveProperty('summary');
  });

  it('handles invalid scriptId gracefully', async () => {
    const req = createRequest({ method: 'GET', params: { scriptId: 'invalid-id' } });
    const res = await GET(req);
    expect(res.ok).toBe(true);
    
    const data = await res.json();
    // Should return empty arrays or demo data
    expect(Array.isArray(data.warnings)).toBe(true);
  });

  it('bySeverity contains all severity levels', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const bySeverity = data.summary.bySeverity;
    expect(bySeverity).toHaveProperty('critical');
    expect(bySeverity).toHaveProperty('high');
    expect(bySeverity).toHaveProperty('medium');
    expect(bySeverity).toHaveProperty('low');
  });

  it('severity counts are numbers', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const bySeverity = data.summary.bySeverity;
    expect(typeof bySeverity.critical).toBe('number');
    expect(typeof bySeverity.high).toBe('number');
    expect(typeof bySeverity.medium).toBe('number');
    expect(typeof bySeverity.low).toBe('number');
  });
});

describe('POST /api/continuity', () => {
  it('generates continuity analysis with valid scriptId', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { scriptId: 'test-script' } 
    });
    const res = await POST(req);
    
    expect(res.ok).toBe(true);
    
    const data = await res.json();
    expect(data).toHaveProperty('warnings');
    expect(data).toHaveProperty('summary');
  });

  it('returns 400 when scriptId is missing', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    const res = await POST(req);
    
    expect(res.status).toBe(400);
  });

  it('handles empty body gracefully', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    const res = await POST(req);
    
    expect(res.status).toBe(400);
  });

  it('returns analysis with summary when successful', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { scriptId: 'demo-script' } 
    });
    const res = await POST(req);
    
    const data = await res.json();
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('total');
    expect(data.summary).toHaveProperty('continuityIssues');
    expect(data.summary).toHaveProperty('plotHoles');
  });
});
