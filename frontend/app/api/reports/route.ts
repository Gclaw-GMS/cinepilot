import { NextRequest, NextResponse } from 'next/server';

const DEMO_REPORTS = [
  {
    id: 'production-summary',
    name: 'Production Summary',
    description: 'Overall project status with key metrics',
    icon: '📊',
    format: 'PDF',
    lastGenerated: new Date().toISOString(),
  },
  {
    id: 'daily-report',
    name: 'Daily Report',
    description: 'Daily progress breakdown with scenes shot',
    icon: '📅',
    format: 'PDF',
    lastGenerated: null,
  },
  {
    id: 'budget-report',
    name: 'Budget Report',
    description: 'Financial overview and spending analysis',
    icon: '💰',
    format: 'PDF',
    lastGenerated: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'schedule-report',
    name: 'Schedule Report',
    description: 'Timeline analysis and milestone tracking',
    icon: '🎬',
    format: 'PDF',
    lastGenerated: null,
  },
  {
    id: 'censor-prediction',
    name: 'CBFC Certificate Prediction',
    description: 'Content sensitivity analysis and rating prediction',
    icon: '🛡️',
    format: 'PDF',
    lastGenerated: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'crew-list',
    name: 'Crew List',
    description: 'Complete crew directory with contact details',
    icon: '👥',
    format: 'CSV',
    lastGenerated: new Date().toISOString(),
  },
  {
    id: 'equipment-list',
    name: 'Equipment List',
    description: 'All rented equipment with return dates',
    icon: '🎥',
    format: 'CSV',
    lastGenerated: new Date().toISOString(),
  },
  {
    id: 'shot-list',
    name: 'Shot List',
    description: 'Complete shot breakdown with technical details',
    icon: '🎞️',
    format: 'CSV',
    lastGenerated: null,
  },
  {
    id: 'vfx-report',
    name: 'VFX Report',
    description: 'Visual effects breakdown with shot counts and complexity analysis',
    icon: '✨',
    format: 'PDF',
    lastGenerated: null,
  },
  {
    id: 'location-report',
    name: 'Location Report',
    description: 'Shooting location details, permits, and logistics summary',
    icon: '📍',
    format: 'PDF',
    lastGenerated: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'dood-report',
    name: 'DOOD Report',
    description: 'Day Out of Days - actor availability and shooting schedule',
    icon: '📅',
    format: 'PDF',
    lastGenerated: null,
  },
];

const DEMO_PRODUCTION_DATA = {
  project_name: 'Kaadhal Enbadhu',
  total_scenes: 52,
  completed_scenes: 28,
  shooting_days: 12,
  remaining_days: 8,
  budget_spent: 4500000,
  budget_total: 8000000,
  crew_count: 35,
  cast_count: 12,
  locations: 8,
  start_date: '2026-02-01',
  end_date: '2026-03-15',
};

const DEMO_DAILY_STATS = [
  { date: '2026-02-14', scenes_shot: 5, pages: 3.2, budget_spent: 85000 },
  { date: '2026-02-13', scenes_shot: 4, pages: 2.8, budget_spent: 72000 },
  { date: '2026-02-12', scenes_shot: 6, pages: 4.1, budget_spent: 95000 },
  { date: '2026-02-11', scenes_shot: 3, pages: 2.0, budget_spent: 65000 },
  { date: '2026-02-10', scenes_shot: 5, pages: 3.5, budget_spent: 88000 },
];

const DEMO_BUDGET_BREAKDOWN = {
  pre_production: { spent: 800000, total: 1000000 },
  production: { spent: 3200000, total: 5000000 },
  post_production: { spent: 500000, total: 1500000 },
  contingency: { spent: 0, total: 500000 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('id');
  const action = searchParams.get('action');

  // Return list of available reports
  if (!reportId) {
    return NextResponse.json({
      reports: DEMO_REPORTS,
      isDemoMode: true,
    });
  }

  // Generate specific report data
  if (action === 'generate') {
    switch (reportId) {
      case 'production-summary':
        return NextResponse.json({
          success: true,
          report: DEMO_PRODUCTION_DATA,
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'daily-report':
        return NextResponse.json({
          success: true,
          report: {
            ...DEMO_PRODUCTION_DATA,
            daily_stats: DEMO_DAILY_STATS,
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'budget-report':
        return NextResponse.json({
          success: true,
          report: {
            ...DEMO_PRODUCTION_DATA,
            budget_breakdown: DEMO_BUDGET_BREAKDOWN,
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'schedule-report':
        return NextResponse.json({
          success: true,
          report: {
            ...DEMO_PRODUCTION_DATA,
            schedule_timeline: {
              start_date: DEMO_PRODUCTION_DATA.start_date,
              end_date: DEMO_PRODUCTION_DATA.end_date,
              total_days: 43,
              elapsed_days: 12,
              upcoming_milestones: [
                { name: 'Scene 30 Complete', date: '2026-02-18' },
                { name: 'Location Change', date: '2026-02-20' },
                { name: 'Mid-production Review', date: '2026-02-25' },
              ],
            },
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'vfx-report':
        return NextResponse.json({
          success: true,
          report: {
            project_name: DEMO_PRODUCTION_DATA.project_name,
            total_vfx_shots: 156,
            completed_shots: 89,
            pending_shots: 67,
            breakdown_by_type: [
              { type: 'CGI Character', count: 24, complexity: 'High', avg_render_hours: 48 },
              { type: 'Environment Extension', count: 45, complexity: 'Medium', avg_render_hours: 12 },
              { type: 'Matte Painting', count: 18, complexity: 'High', avg_render_hours: 24 },
              { type: 'Wire Removal', count: 32, complexity: 'Low', avg_render_hours: 2 },
              { type: 'Green Screen Comp', count: 28, complexity: 'Medium', avg_render_hours: 8 },
              { type: 'Particle Effects', count: 9, complexity: 'High', avg_render_hours: 36 },
            ],
            budget_allocation: {
              allocated: 2500000,
              spent: 1450000,
              remaining: 1050000,
            },
            vendor_info: [
              { name: 'Redrooster Studios', shots: 67, status: 'In Progress' },
              { name: 'Makuta VFX', shots: 52, status: 'In Progress' },
              { name: 'In-house', shots: 37, status: 'Completed' },
            ],
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'location-report':
        return NextResponse.json({
          success: true,
          report: {
            project_name: DEMO_PRODUCTION_DATA.project_name,
            total_locations: 8,
            completed_shoots: 5,
            upcoming_shoots: 3,
            locations: [
              { name: 'AVM Studios', type: 'Studio', days_shot: 4, permit_status: 'Approved', cost_per_day: 50000 },
              { name: 'Mahabalipuram Beach', type: 'Outdoor', days_shot: 2, permit_status: 'Approved', cost_per_day: 25000 },
              { name: 'Chennai Railway Station', type: 'Public', days_shot: 1, permit_status: 'Approved', cost_per_day: 15000 },
              { name: 'T Nagar Street', type: 'Public', days_shot: 0, permit_status: 'Pending', cost_per_day: 10000 },
              { name: 'Marina Beach', type: 'Outdoor', days_shot: 0, permit_status: 'Approved', cost_per_day: 30000 },
            ],
            total_location_cost: 650000,
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      case 'dood-report':
        return NextResponse.json({
          success: true,
          report: {
            project_name: DEMO_PRODUCTION_DATA.project_name,
            total_shooting_days: 20,
            characters: [
              { name: 'Arjun', actor: 'Ajith Kumar', total_days: 15, days: [1,2,3,5,6,7,9,10,11,12,14,15,16,18,20], percentage: 75 },
              { name: 'Priya', actor: 'Sai Pallavi', total_days: 12, days: [1,2,4,5,6,8,9,10,12,13,14,15], percentage: 60 },
              { name: 'Mahendra', actor: 'Vijay Sethupathi', total_days: 8, days: [3,7,11,15,16,17,18,19], percentage: 40 },
              { name: 'Sathya', actor: 'Nivin Pauly', total_days: 10, days: [1,4,5,9,10,14,15,16,20,21], percentage: 50 },
              { name: 'Divya', actor: 'Aishwarya Rajesh', total_days: 6, days: [2,3,8,12,13,19], percentage: 30 },
            ],
            total_calls: 51,
            avg_days_per_actor: 10.2,
          },
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });

      default:
        return NextResponse.json({
          success: true,
          report: DEMO_PRODUCTION_DATA,
          generated_at: new Date().toISOString(),
          isDemoMode: true,
        });
    }
  }

  return NextResponse.json({
    error: 'Invalid request',
  }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // In a real implementation, this would generate and store the report
    // For demo, we just return success
    return NextResponse.json({
      success: true,
      message: `Report ${reportId} generated successfully`,
      generated_at: new Date().toISOString(),
      isDemoMode: true,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to generate report',
    }, { status: 500 });
  }
}
