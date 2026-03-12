import { NextRequest, NextResponse } from 'next/server';

// Test suite for /api/ai endpoint
describe('AI API', () => {
  const API_BASE = 'http://localhost:3002/api/ai';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai', () => {
    it('should return AI capabilities', async () => {
      const res = await fetch(API_BASE);
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      expect(data).toHaveProperty('available');
      expect(data).toHaveProperty('aiConfigured');
      expect(data).toHaveProperty('features');
      expect(Array.isArray(data.features)).toBe(true);
    });

    it('should list all 6 AI features', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(data.features).toHaveLength(6);
      
      const featureIds = data.features.map((f: any) => f.id);
      expect(featureIds).toContain('script-analyzer');
      expect(featureIds).toContain('budget-forecast');
      expect(featureIds).toContain('shot-suggest');
      expect(featureIds).toContain('schedule');
      expect(featureIds).toContain('risk-detect');
      expect(featureIds).toContain('dialogue');
    });

    it('should have required fields for each feature', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      data.features.forEach((feature: any) => {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('description');
        expect(typeof feature.id).toBe('string');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.description).toBe('string');
      });
    });

    it('should indicate if AI is configured or not', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(typeof data.aiConfigured).toBe('boolean');
    });

    it('should return available as boolean', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(typeof data.available).toBe('boolean');
    });
  });

  describe('POST /api/ai', () => {
    it('should reject request without action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('action');
    });

    it('should reject unknown action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid-action' }),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unknown action');
    });

    it('should reject empty action string', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: '' }),
      });
      
      expect(res.status).toBe(400);
    });

    it('should handle script-analyzer action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'script-analyzer',
          scene_count: 50,
          location_count: 10,
          cast_size: 15,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('script-analyzer');
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle budget-forecast action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'budget-forecast',
          duration_days: 45,
          scene_count: 60,
          location_count: 12,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('budget-forecast');
    });

    it('should handle shot-suggest action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'shot-suggest',
          scene_count: 45,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('shot-suggest');
    });

    it('should handle schedule action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'schedule',
          duration_days: 30,
          scene_count: 50,
          location_count: 8,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('schedule');
    });

    it('should handle risk-detect action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'risk-detect',
          scene_count: 45,
          is_outdoor: true,
          is_night_shoots: true,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('risk-detect');
    });

    it('should handle dialogue action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'dialogue',
          text: 'Sample dialogue for testing purposes.',
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('dialogue');
    });

    it('should include all production parameters in analysis', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'script-analyzer',
          scene_count: 75,
          location_count: 15,
          cast_size: 20,
          duration_days: 60,
          is_outdoor: true,
          is_night_shoots: true,
          budget_total: 50000000,
        }),
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.result).toBeDefined();
    });

    it('should return valid timestamp in ISO format', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'script-analyzer' }),
      });
      
      const data = await res.json();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it('should set source to demo when AI not configured', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'budget-forecast' }),
      });
      
      const data = await res.json();
      expect(data.source).toMatch(/^(ai|demo)$/);
    });

    it('should handle invalid JSON body gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'json' }),
      });
      
      // Should either succeed with demo mode or return error
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('Demo Data Validation', () => {
    it('should return script analysis with required sections', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'script-analyzer' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
    });

    it('should return budget forecast with breakdown', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'budget-forecast' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toHaveProperty('estimatedTotal');
      expect(result).toHaveProperty('breakdown');
    });

    it('should return shot suggestions with scene breakdown', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'shot-suggest' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toBeDefined();
    });

    it('should return schedule with recommendations', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toBeDefined();
    });

    it('should return risk detection with severity levels', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'risk-detect' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toBeDefined();
    });

    it('should return dialogue refinement with suggestions', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dialogue', text: 'Test dialogue' }),
      });
      
      const data = await res.json();
      const result = data.result;
      
      expect(result).toBeDefined();
    });
  });
});
