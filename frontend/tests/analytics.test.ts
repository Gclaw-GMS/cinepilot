/**
 * Analytics API Tests
 * Run with: npx jest tests/analytics.test.ts
 */
import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/analytics/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/analytics');
  
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

describe('Analytics API', () => {
  describe('GET /api/analytics', () => {
    it('returns analytics data with all required sections', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('overview');
      expect(data).toHaveProperty('recent_activities');
      expect(data).toHaveProperty('upcoming_shoots');
      expect(data).toHaveProperty('budget_breakdown');
      expect(data).toHaveProperty('schedule_progress');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('overview has required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(data.overview).toHaveProperty('total_scenes');
      expect(data.overview).toHaveProperty('completed_scenes');
      expect(data.overview).toHaveProperty('total_locations');
      expect(data.overview).toHaveProperty('total_characters');
      expect(data.overview).toHaveProperty('shooting_days_completed');
      expect(data.overview).toHaveProperty('shooting_days_total');
      expect(data.overview).toHaveProperty('budget_total');
      expect(data.overview).toHaveProperty('budget_spent');
      expect(data.overview).toHaveProperty('budget_remaining');
      expect(data.overview).toHaveProperty('crew_members');
      expect(data.overview).toHaveProperty('total_shots');
      expect(data.overview).toHaveProperty('completed_shots');
      expect(data.overview).toHaveProperty('vfx_shots');
      expect(data.overview).toHaveProperty('completed_vfx');
    });

    it('overview values are numeric', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(typeof data.overview.total_scenes).toBe('number');
      expect(typeof data.overview.completed_scenes).toBe('number');
      expect(typeof data.overview.budget_total).toBe('number');
      expect(typeof data.overview.budget_spent).toBe('number');
    });

    it('has recent_activities array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.recent_activities)).toBe(true);
      expect(data.recent_activities.length).toBeGreaterThan(0);
    });

    it('recent activities have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const activity = data.recent_activities[0];
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('user');
      expect(activity).toHaveProperty('timestamp');
    });

    it('has upcoming_shoots array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.upcoming_shoots)).toBe(true);
    });

    it('upcoming shoots have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      if (data.upcoming_shoots.length > 0) {
        const shoot = data.upcoming_shoots[0];
        expect(shoot).toHaveProperty('date');
        expect(shoot).toHaveProperty('scenes');
        expect(shoot).toHaveProperty('location');
        expect(shoot).toHaveProperty('call_time');
      }
    });

    it('has budget_breakdown array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.budget_breakdown)).toBe(true);
    });

    it('budget breakdown has required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      if (data.budget_breakdown.length > 0) {
        const item = data.budget_breakdown[0];
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('allocated');
        expect(item).toHaveProperty('spent');
      }
    });

    it('has schedule_progress array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(Array.isArray(data.schedule_progress)).toBe(true);
    });

    it('isDemoMode is boolean', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(typeof data.isDemoMode).toBe('boolean');
    });
  });

  describe('GET /api/analytics - Demo Data Validation', () => {
    it('demo overview has realistic Tamil film production values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(data.overview.total_scenes).toBeGreaterThan(100);
      expect(data.overview.budget_total).toBeGreaterThan(50000000);
      expect(data.overview.crew_members).toBeGreaterThan(50);
    });

    it('demo recent activities have realistic types', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const validTypes = ['scene_shot', 'schedule_updated', 'budget_approved', 'location_added', 'crew_assigned'];
      for (const activity of data.recent_activities) {
        expect(validTypes).toContain(activity.type);
      }
    });

    it('demo budget breakdown covers production categories', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      const categories = data.budget_breakdown.map((b: { category: string }) => b.category);
      expect(categories).toContain('Production');
      expect(categories).toContain('Post-Production');
    });
  });
});
