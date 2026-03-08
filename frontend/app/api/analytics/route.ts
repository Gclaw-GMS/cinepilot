import { NextRequest, NextResponse } from 'next/server';

// Demo analytics data
const DEMO_DASHBOARD = {
  overview: {
    total_scenes: 145,
    completed_scenes: 68,
    total_locations: 12,
    total_characters: 28,
    shooting_days_completed: 12,
    shooting_days_total: 25,
    budget_total: 85000000,
    budget_spent: 42350000,
    budget_remaining: 42650000,
    crew_members: 87,
    total_shots: 892,
    completed_shots: 412,
    vfx_shots: 38,
    completed_vfx: 12,
  },
  recent_activities: [
    { type: 'scene_shot', user: 'Director', scene: 46, timestamp: '2026-03-07T10:30:00Z' },
    { type: 'schedule_updated', user: 'AD', timestamp: '2026-03-07T09:00:00Z' },
    { type: 'budget_approved', user: 'Producer', amount: 5000000, timestamp: '2026-03-06T15:00:00Z' },
    { type: 'location_added', user: 'Location Manager', location: 'ECR Beach', timestamp: '2026-03-06T11:00:00Z' },
    { type: 'crew_assigned', user: 'Production Head', crew: 'Camera Operator', timestamp: '2026-03-05T14:00:00Z' },
  ],
  upcoming_shoots: [
    { date: '2026-03-08', scenes: [47, 48, 49], location: 'Studio A', call_time: '06:00' },
    { date: '2026-03-09', scenes: [50, 51, 52], location: 'Ram Studios', call_time: '05:30' },
    { date: '2026-03-10', scenes: [53, 54], location: 'Outdoor - Ooty', call_time: '04:00' },
  ],
  budget_breakdown: [
    { category: 'Pre-Production', allocated: 8000000, spent: 7200000 },
    { category: 'Production', allocated: 45000000, spent: 28500000 },
    { category: 'Post-Production', allocated: 15000000, spent: 4200000 },
    { category: 'Marketing', allocated: 17000000, spent: 2450000 },
  ],
  schedule_progress: [
    { day: 1, scenes: 4, status: 'completed' },
    { day: 2, scenes: 6, status: 'completed' },
    { day: 3, scenes: 5, status: 'completed' },
    { day: 4, scenes: 7, status: 'completed' },
    { day: 5, scenes: 4, status: 'completed' },
    { day: 6, scenes: 8, status: 'completed' },
    { day: 7, scenes: 6, status: 'completed' },
    { day: 8, scenes: 5, status: 'completed' },
    { day: 9, scenes: 7, status: 'completed' },
    { day: 10, scenes: 6, status: 'completed' },
    { day: 11, scenes: 4, status: 'completed' },
    { day: 12, scenes: 6, status: 'completed' },
    { day: 13, scenes: 0, status: 'scheduled' },
    { day: 14, scenes: 0, status: 'scheduled' },
    { day: 15, scenes: 0, status: 'scheduled' },
  ],
};

const DEMO_METRICS = {
  timeline: {
    overall_progress: 48,
    days_remaining: 13,
    scenes_remaining: 77,
    budget_utilization: 49.8,
  },
  performance: {
    avg_scenes_per_day: 5.7,
    avg_shots_per_scene: 6.2,
    budget_burn_rate: 3529167,
    efficiency_score: 87,
  },
  predictions: {
    projected_completion: '2026-04-15',
    projected_budget_overrun: 2500000,
    risk_level: 'medium',
  },
  department_stats: [
    { name: 'Camera', efficiency: 92, utilization: 88 },
    { name: 'Lighting', efficiency: 85, utilization: 75 },
    { name: 'Sound', efficiency: 94, utilization: 82 },
    { name: 'Art', efficiency: 78, utilization: 70 },
    { name: 'VFX', efficiency: 65, utilization: 45 },
  ],
};

// GET /api/analytics - Get project analytics dashboard
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');

  // Return demo data (production-ready with comprehensive metrics)
  if (type === 'metrics') {
    return NextResponse.json({
      ...DEMO_METRICS,
      isDemoMode: true,
    });
  }

  return NextResponse.json({
    ...DEMO_DASHBOARD,
    isDemoMode: true,
  });
}
