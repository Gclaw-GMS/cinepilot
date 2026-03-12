/**
 * Analytics API Tests
 * Run with: npx jest tests/analytics.test.ts
 */

const API_BASE = 'http://localhost:3002/api/analytics';

describe('Analytics API', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('GET /api/analytics', () => {
    test('returns analytics data with all required sections', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('overview');
      expect(data).toHaveProperty('recent_activities');
      expect(data).toHaveProperty('upcoming_shoots');
      expect(data).toHaveProperty('budget_breakdown');
      expect(data).toHaveProperty('schedule_progress');
      expect(data).toHaveProperty('isDemoMode');
    });

    test('overview has required fields', async () => {
      const res = await fetch(API_BASE);
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

    test('overview values are numeric', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(typeof data.overview.total_scenes).toBe('number');
      expect(typeof data.overview.completed_scenes).toBe('number');
      expect(typeof data.overview.budget_total).toBe('number');
      expect(typeof data.overview.budget_spent).toBe('number');
    });

    test('has recent_activities array', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(Array.isArray(data.recent_activities)).toBe(true);
      expect(data.recent_activities.length).toBeGreaterThan(0);
    });

    test('recent activities have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const activity = data.recent_activities[0];
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('user');
      expect(activity).toHaveProperty('timestamp');
    });

    test('has upcoming_shoots array', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(Array.isArray(data.upcoming_shoots)).toBe(true);
    });

    test('upcoming shoots have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.upcoming_shoots.length > 0) {
        const shoot = data.upcoming_shoots[0];
        expect(shoot).toHaveProperty('date');
        expect(shoot).toHaveProperty('scenes');
        expect(shoot).toHaveProperty('location');
        expect(shoot).toHaveProperty('call_time');
      }
    });

    test('has budget_breakdown array', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(Array.isArray(data.budget_breakdown)).toBe(true);
      expect(data.budget_breakdown.length).toBeGreaterThan(0);
    });

    test('budget breakdown items have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const breakdown = data.budget_breakdown[0];
      expect(breakdown).toHaveProperty('category');
      expect(breakdown).toHaveProperty('allocated');
      expect(breakdown).toHaveProperty('spent');
    });

    test('has schedule_progress array', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(Array.isArray(data.schedule_progress)).toBe(true);
      expect(data.schedule_progress.length).toBeGreaterThan(0);
    });

    test('schedule progress items have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const progress = data.schedule_progress[0];
      expect(progress).toHaveProperty('day');
      expect(progress).toHaveProperty('scenes');
      expect(progress).toHaveProperty('status');
    });

    test('isDemoMode is a boolean', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(typeof data.isDemoMode).toBe('boolean');
    });
  });

  describe('GET /api/analytics with type=metrics', () => {
    test('returns metrics data when type=metrics', async () => {
      const res = await fetch(`${API_BASE}?type=metrics`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('timeline');
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('predictions');
      expect(data).toHaveProperty('department_stats');
      expect(data).toHaveProperty('isDemoMode');
    });

    test('timeline has required fields', async () => {
      const res = await fetch(`${API_BASE}?type=metrics`);
      const data = await res.json();

      expect(data.timeline).toHaveProperty('overall_progress');
      expect(data.timeline).toHaveProperty('days_remaining');
      expect(data.timeline).toHaveProperty('scenes_remaining');
      expect(data.timeline).toHaveProperty('budget_utilization');
    });

    test('performance has required fields', async () => {
      const res = await fetch(`${API_BASE}?type=metrics`);
      const data = await res.json();

      expect(data.performance).toHaveProperty('avg_scenes_per_day');
      expect(data.performance).toHaveProperty('avg_shots_per_scene');
      expect(data.performance).toHaveProperty('budget_burn_rate');
      expect(data.performance).toHaveProperty('efficiency_score');
    });

    test('predictions has required fields', async () => {
      const res = await fetch(`${API_BASE}?type=metrics`);
      const data = await res.json();

      expect(data.predictions).toHaveProperty('projected_completion');
      expect(data.predictions).toHaveProperty('risk_level');
    });

    test('department_stats is an array with required fields', async () => {
      const res = await fetch(`${API_BASE}?type=metrics`);
      const data = await res.json();

      expect(Array.isArray(data.department_stats)).toBe(true);
      expect(data.department_stats.length).toBeGreaterThan(0);

      const dept = data.department_stats[0];
      expect(dept).toHaveProperty('name');
      expect(dept).toHaveProperty('efficiency');
      expect(dept).toHaveProperty('utilization');
    });
  });

  describe('Error handling', () => {
    test('handles invalid type gracefully', async () => {
      const res = await fetch(`${API_BASE}?type=invalid`);
      const data = await res.json();

      // Should still return valid data even with invalid type
      expect(res.status).toBe(200);
    });
  });
});
