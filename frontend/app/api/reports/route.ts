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
