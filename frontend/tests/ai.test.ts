/**
 * AI API Tests
 * Run with: npx jest tests/ai.test.ts
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/ai/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/ai');
  
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

describe('AI API', () => {
  describe('GET /api/ai', () => {
    it('should return AI capabilities', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('available');
      expect(data).toHaveProperty('aiConfigured');
      expect(data).toHaveProperty('features');
      expect(Array.isArray(data.features)).toBe(true);
    });

    it('should list all 6 AI features', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.features).toHaveLength(6);
      
      const featureIds = data.features.map((f: { id: string }) => f.id);
      expect(featureIds).toContain('script-analyzer');
      expect(featureIds).toContain('budget-forecast');
      expect(featureIds).toContain('shot-suggest');
      expect(featureIds).toContain('schedule');
      expect(featureIds).toContain('risk-detect');
      expect(featureIds).toContain('dialogue');
    });

    it('should have required fields for each feature', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      data.features.forEach((feature: { id: string, name: string, description: string }) => {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('description');
        expect(typeof feature.id).toBe('string');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.description).toBe('string');
      });
    });

    it('should indicate if AI is configured or not', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      // aiConfigured may be string 'true'/'false' or boolean depending on configuration
      if (data.aiConfigured !== undefined) {
        expect(typeof data.aiConfigured === 'boolean' || typeof data.aiConfigured === 'string').toBe(true);
      }
    });

    it('should return available as boolean', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(typeof data.available).toBe('boolean');
    });
  });

  describe('POST /api/ai', () => {
    it('should reject request without action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: {} 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('action');
    });

    it('should reject unknown action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { action: 'invalid-action' } 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown action');
    });

    it('should reject empty action string', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { action: '' } 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    it('should handle script-analyzer action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'script-analyzer',
          scene_count: 50,
          location_count: 10,
          cast_size: 15,
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('script-analyzer');
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle budget-forecast action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'budget-forecast',
          duration_days: 45,
          scene_count: 60,
          location_count: 12,
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('budget-forecast');
    });

    it('should handle shot-suggest action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'shot-suggest',
          scene_count: 45,
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('shot-suggest');
    });

    it('should handle schedule action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'schedule',
          total_scenes: 100,
          estimated_days: 30,
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('schedule');
    });

    it('should handle risk-detect action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'risk-detect',
          weather_dependent: true,
          night_shoots: 5,
          outdoor_shoots: 10,
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('risk-detect');
    });

    it('should handle dialogue action', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { 
          action: 'dialogue',
          scene_type: 'emotional',
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('dialogue');
    });
  });
});
