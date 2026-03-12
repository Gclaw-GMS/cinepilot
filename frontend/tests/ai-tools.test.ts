/**
 * AI Tools API Test Suite
 * Tests all endpoints for the AI Tools feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/ai-tools/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/ai-tools');
  
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

describe('AI Tools API', () => {
  describe('GET /api/ai-tools', () => {
    it('returns list of AI tools', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('tools');
      expect(Array.isArray(data.tools)).toBe(true);
    });

    it('returns categories', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('tools have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.tools.length > 0) {
        const tool = data.tools[0];
        expect(tool).toHaveProperty('id');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('desc');
        expect(tool).toHaveProperty('icon');
        expect(tool).toHaveProperty('color');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('endpoint');
      }
    });

    it('has multiple tools', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.tools.length).toBeGreaterThan(5);
    });

    it('has varied categories', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.categories.length).toBeGreaterThan(1);
    });

    it('can get specific tool by id', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'script-analyzer' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.tool).toHaveProperty('id');
      expect(data.tool.id).toBe('script-analyzer');
    });

    it('returns error for invalid tool id', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'non-existent-tool' } });
      const res = await GET(req);
      
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('tool has valid category', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const validCategories = ['Script', 'Finance', 'Production', 'Planning', 'Management', 'Marketing', 'Quality', 'Post-Production'];
      
      data.tools.forEach((tool: any) => {
        expect(validCategories).toContain(tool.category);
      });
    });

    it('tool has valid color', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const validColors = ['indigo', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'blue', 'purple', 'green', 'red', 'orange', 'yellow', 'pink', 'gray'];
      
      data.tools.forEach((tool: any) => {
        expect(validColors).toContain(tool.color);
      });
    });

    it('tool has valid endpoint', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.tools.forEach((tool: any) => {
        expect(tool.endpoint).toMatch(/^\/api\//);
      });
    });
  });

  describe('GET /api/ai-tools with action=analyze', () => {
    it('performs analysis on tool', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'script-analyzer', action: 'analyze' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('tool');
      expect(data).toHaveProperty('analysis');
    });

    it('analysis has timestamp', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'budget-forecast', action: 'analyze' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.analysis).toHaveProperty('timestamp');
      expect(new Date(data.analysis.timestamp)).toBeInstanceOf(Date);
    });

    it('analysis has source endpoint', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'shot-suggest', action: 'analyze' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.analysis).toHaveProperty('source');
      expect(data.analysis.source).toMatch(/^\/api\//);
    });

    it('handles analysis error gracefully', async () => {
      const req = createRequest({ method: 'GET', params: { id: 'non-existent-tool', action: 'analyze' } });
      const res = await GET(req);
      
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/ai-tools', () => {
    it('runs AI analysis with toolId', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          toolId: 'script-analyzer',
          prompt: 'Analyze this script',
          context: { scenes: 50 }
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('timestamp');
    });

    it('returns analysis result with insights', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          toolId: 'budget-forecast',
          prompt: 'Forecast budget'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.result).toHaveProperty('insights');
      expect(Array.isArray(data.result.insights)).toBe(true);
    });

    it('returns analysis result with recommendations', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          toolId: 'schedule-optimizer',
          prompt: 'Optimize schedule'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(data.result).toHaveProperty('recommendations');
      expect(Array.isArray(data.result.recommendations)).toBe(true);
    });

    it('returns confidence score', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          toolId: 'risk-detector',
          prompt: 'Detect risks'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(data.result).toHaveProperty('confidence');
      expect(typeof data.result.confidence).toBe('number');
    });

    it('returns error for invalid toolId', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          toolId: 'non-existent-tool',
          prompt: 'Test'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('handles missing toolId', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          prompt: 'Test without toolId'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
    });

    it('handles empty body', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
    });
  });

  describe('Demo Data Validation', () => {
    it('has Script Intelligence tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'script-analyzer');
      expect(hasTool).toBe(true);
    });

    it('has Budget Forecast tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'budget-forecast');
      expect(hasTool).toBe(true);
    });

    it('has Shot Recommender tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'shot-suggest');
      expect(hasTool).toBe(true);
    });

    it('has Schedule Optimizer tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'schedule-optimizer');
      expect(hasTool).toBe(true);
    });

    it('has Risk Detector tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'risk-detector');
      expect(hasTool).toBe(true);
    });

    it('has VFX Breakdown tool', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasTool = data.tools.some((t: any) => t.id === 'vfx-breakdown');
      expect(hasTool).toBe(true);
    });

    it('tools have meaningful descriptions', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.tools.forEach((tool: any) => {
        expect(tool.desc.length).toBeGreaterThan(10);
      });
    });

    it('covers multiple production categories', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      // Should have tools from different domains
      const categories = new Set(data.tools.map((t: any) => t.category));
      expect(categories.size).toBeGreaterThanOrEqual(4);
    });
  });
});
