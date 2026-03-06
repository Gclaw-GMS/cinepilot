import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Demo analytics data
const DEMO_ANALYTICS = {
  overview: {
    totalProjects: 1,
    activeProject: 'Kaadhal Enbadhu',
    shootingDaysCompleted: 12,
    totalShootingDays: 20,
    scenesCompleted: 28,
    totalScenes: 52,
    shotsCompleted: 342,
    totalShots: 520,
    pagesShot: 186.5,
    totalPages: 320,
  },
  progress: {
    sceneCompletion: 54, // percentage
    shootingDaysCompletion: 60,
    budgetUtilization: 56,
    crewEfficiency: 92,
  },
  dailyProgress: [
    { date: '2026-03-04', scenes: 3, shots: 24, pages: 4.2, budget: 85000 },
    { date: '2026-03-03', scenes: 2, shots: 24, pages: 3.8, budget: 72000 },
    { date: '2026-03-02', scenes: 2, shots: 14, pages: 2.5, budget: 65000 },
    { date: '2026-03-01', scenes: 2, shots: 23, pages: 3.1, budget: 55000 },
    { date: '2026-02-28', scenes: 3, shots: 28, pages: 4.5, budget: 88000 },
    { date: '2026-02-27', scenes: 2, shots: 18, pages: 2.9, budget: 62000 },
    { date: '2026-02-26', scenes: 1, shots: 12, pages: 1.8, budget: 45000 },
  ],
  budgetBreakdown: [
    { category: 'Pre-Production', allocated: 1000000, spent: 800000, remaining: 200000 },
    { category: 'Production', allocated: 5000000, spent: 3200000, remaining: 1800000 },
    { category: 'Post-Production', allocated: 1500000, spent: 500000, remaining: 1000000 },
    { category: 'Contingency', allocated: 500000, spent: 0, remaining: 500000 },
  ],
  locationBreakdown: [
    { name: 'AVM Studios', days: 4, cost: 200000, percentage: 30 },
    { name: 'Mahabalipuram Beach', days: 2, cost: 50000, percentage: 15 },
    { name: 'Chennai Railway Station', days: 1, cost: 15000, percentage: 8 },
    { name: 'Ram Studios', days: 3, cost: 135000, percentage: 25 },
    { name: 'Other Locations', days: 2, cost: 100000, percentage: 22 },
  ],
  crewBreakdown: [
    { department: 'Camera', count: 12, daysWorked: 156 },
    { department: 'Lighting', count: 10, daysWorked: 142 },
    { department: 'Sound', count: 6, daysWorked: 98 },
    { department: 'Art', count: 8, daysWorked: 112 },
    { department: 'Makeup', count: 5, daysWorked: 72 },
    { department: 'Wardrobe', count: 4, daysWorked: 68 },
  ],
  vfxBreakdown: [
    { status: 'Completed', count: 89, percentage: 57 },
    { status: 'In Progress', count: 45, percentage: 29 },
    { status: 'Pending', count: 22, percentage: 14 },
  ],
  weeklyStats: {
    avgScenesPerDay: 2.4,
    avgShotsPerDay: 18.5,
    avgPagesPerDay: 3.1,
    avgBudgetPerDay: 68500,
  },
  predictions: {
    estimatedCompletionDate: '2026-03-15',
    projectedBudgetOverage: -250000,
    daysAheadSchedule: 2,
  },
  isDemoMode: true,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'overview';
  
  try {
    switch (type) {
      case 'overview':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.overview,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'progress':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.progress,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'daily':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.dailyProgress,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'budget':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.budgetBreakdown,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'locations':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.locationBreakdown,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'crew':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.crewBreakdown,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'vfx':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.vfxBreakdown,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'predictions':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS.predictions,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      case 'full':
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: DEMO_ANALYTICS,
          isDemoMode: DEMO_ANALYTICS.isDemoMode,
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, dateRange, filters } = body;
    
    // In a real implementation, this would query the database
    // and generate custom analytics based on filters
    
    return NextResponse.json({
      success: true,
      message: 'Custom analytics generated',
      data: DEMO_ANALYTICS,
      isDemoMode: true,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate analytics',
    }, { status: 500 });
  }
}
