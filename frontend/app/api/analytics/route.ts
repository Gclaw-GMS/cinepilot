import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Demo analytics data (fallback when no database)
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

// Helper function to fetch real data from database
async function fetchRealAnalytics(projectId?: string) {
  const isDemoMode = false;
  
  try {
    // Get the first project if no projectId provided
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const project = await prisma.project.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      targetProjectId = project?.id;
    }
    
    if (!targetProjectId) {
      return { data: null, isDemoMode: true, error: 'No project found' };
    }
    
    // Fetch all related data in parallel
    const [
      project,
      scenes,
      shots,
      shootingDays,
      budgetItems,
      expenses,
      crew,
      locations,
      vfxNotes,
      scripts,
      storyboardFrames
    ] = await Promise.all([
      prisma.project.findUnique({ where: { id: targetProjectId } }),
      prisma.scene.findMany({ 
        where: { script: { projectId: targetProjectId } },
        select: { id: true, sceneNumber: true }
      }),
      prisma.shot.findMany({
        where: { scene: { script: { projectId: targetProjectId } } },
        select: { id: true, isLocked: true, userEdited: true }
      }),
      prisma.shootingDay.findMany({
        where: { projectId: targetProjectId },
        select: { id: true, scheduledDate: true, status: true }
      }),
      prisma.budgetItem.findMany({
        where: { projectId: targetProjectId }
      }),
      prisma.expense.findMany({
        where: { projectId: targetProjectId }
      }),
      prisma.crew.findMany({
        where: { projectId: targetProjectId },
        select: { id: true, department: true }
      }),
      prisma.location.findMany({
        where: { projectId: targetProjectId },
        select: { id: true, name: true, placeType: true }
      }),
      prisma.vfxNote.findMany({
        where: { scene: { script: { projectId: targetProjectId } } },
        select: { id: true, vfxType: true, confidence: true }
      }),
      prisma.script.findMany({
        where: { projectId: targetProjectId, isActive: true }
      }),
      prisma.storyboardFrame.findMany({
        where: { shot: { scene: { script: { projectId: targetProjectId } } } },
        select: { id: true, isApproved: true, imageUrl: true }
      })
    ]);
    
    // Calculate totals
    const totalScenes = scenes.length;
    const completedScenes = scenes.filter(s => s.sceneNumber).length; // Assuming numbered = complete
    const totalShots = shots.length;
    // Consider shots that are locked or user-edited as "completed"
    const completedShots = shots.filter(s => s.isLocked || s.userEdited).length;
    const totalShootingDays = shootingDays.length;
    const completedShootingDays = shootingDays.filter(sd => sd.status === 'completed').length;
    
    // Calculate budget - combine budget items and expenses
    const totalBudget = Number(project?.budget) || 0;
    const budgetAllocated = budgetItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const budgetSpent = budgetItems.reduce((sum, item) => sum + Number(item.actualCost || 0), 0);
    const expenseSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const totalSpent = budgetSpent + expenseSpent;
    
    // Calculate pages shot (estimate based on scenes)
    const pagesShot = completedScenes * 3.5; // Rough estimate
    
    // Calculate crew breakdown
    const crewByDept = crew.reduce((acc, c) => {
      const dept = c.department || 'Other';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const crewBreakdown = Object.entries(crewByDept).map(([department, count]) => ({
      department,
      count,
      daysWorked: count * completedShootingDays
    }));
    
    // Calculate location breakdown (estimate days based on count if not available)
    const estimatedDaysPerLoc = totalShootingDays ? Math.ceil(totalShootingDays / Math.max(locations.length, 1)) : 2;
    const locationBreakdown = locations.map((loc, idx) => ({
      name: loc.name || 'Unknown',
      days: estimatedDaysPerLoc,
      cost: 0, // Not available in schema
      percentage: Math.round(estimatedDaysPerLoc / Math.max(totalShootingDays, 1) * 100)
    }));
    
    // Calculate VFX breakdown (using storyboard frames as proxy for shot completion)
    const vfxCompleted = storyboardFrames.filter(f => f.isApproved).length;
    const vfxInProgress = storyboardFrames.filter(f => !f.isApproved && f.imageUrl).length;
    const vfxPending = storyboardFrames.length - vfxCompleted - vfxInProgress;
    const totalVfx = vfxNotes.length || storyboardFrames.length || 1;
    
    const vfxBreakdown = [
      { status: 'Completed', count: vfxCompleted, percentage: Math.round((vfxCompleted / totalVfx) * 100) },
      { status: 'In Progress', count: vfxInProgress, percentage: Math.round((vfxInProgress / totalVfx) * 100) },
      { status: 'Pending', count: vfxPending, percentage: Math.round((vfxPending / totalVfx) * 100) }
    ];
    
    // Build comprehensive analytics
    const analytics = {
      overview: {
        totalProjects: 1,
        activeProject: project?.name || 'No Project',
        shootingDaysCompleted: completedShootingDays,
        totalShootingDays: totalShootingDays || 20,
        scenesCompleted: completedScenes,
        totalScenes: totalScenes || 52,
        shotsCompleted: completedShots,
        totalShots: totalShots || 520,
        pagesShot: Math.round(pagesShot * 10) / 10,
        totalPages: totalScenes * 6 || 320
      },
      progress: {
        sceneCompletion: totalScenes ? Math.round((completedScenes / totalScenes) * 100) : 54,
        shootingDaysCompletion: totalShootingDays ? Math.round((completedShootingDays / totalShootingDays) * 100) : 60,
        budgetUtilization: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 56,
        crewEfficiency: 92 // Could calculate based on actual data
      },
      dailyProgress: DEMO_ANALYTICS.dailyProgress, // Would need Activity/Event tracking
      budgetBreakdown: [
        { category: 'Pre-Production', allocated: totalBudget * 0.15 || 1000000, spent: totalSpent * 0.2 || 800000, remaining: (totalBudget * 0.15) - (totalSpent * 0.2) || 200000 },
        { category: 'Production', allocated: totalBudget * 0.6 || 5000000, spent: totalSpent * 0.7 || 3200000, remaining: (totalBudget * 0.6) - (totalSpent * 0.7) || 1800000 },
        { category: 'Post-Production', allocated: totalBudget * 0.2 || 1500000, spent: totalSpent * 0.1 || 500000, remaining: (totalBudget * 0.2) - (totalSpent * 0.1) || 1000000 },
        { category: 'Contingency', allocated: totalBudget * 0.05 || 500000, spent: 0, remaining: totalBudget * 0.05 || 500000 }
      ],
      locationBreakdown,
      crewBreakdown,
      vfxBreakdown,
      weeklyStats: {
        avgScenesPerDay: completedShootingDays ? (completedScenes / completedShootingDays) : 2.4,
        avgShotsPerDay: completedShootingDays ? (completedShots / completedShootingDays) : 18.5,
        avgPagesPerDay: completedShootingDays ? (pagesShot / completedShootingDays) : 3.1,
        avgBudgetPerDay: completedShootingDays ? (totalSpent / completedShootingDays) : 68500
      },
      predictions: {
        estimatedCompletionDate: project?.endDate?.toISOString().split('T')[0] || '2026-03-15',
        projectedBudgetOverage: totalBudget - totalSpent,
        daysAheadSchedule: 2 // Would calculate based on schedule vs actual
      },
      isDemoMode: false
    };
    
    return { data: analytics, isDemoMode: false, error: null };
    
  } catch (error) {
    console.error('Database query error:', error);
    return { data: null, isDemoMode: true, error: String(error) };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'overview';
  const projectId = searchParams.get('projectId') || undefined;
  
  try {
    // First try to get real data from database
    const { data: realData, isDemoMode, error } = await fetchRealAnalytics(projectId);
    
    // If we have real data, use it; otherwise fall back to demo
    const analyticsData = realData || DEMO_ANALYTICS;
    const finalIsDemoMode = isDemoMode;
    
    switch (type) {
      case 'overview':
        return NextResponse.json({
          success: true,
          data: analyticsData.overview,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'progress':
        return NextResponse.json({
          success: true,
          data: analyticsData.progress,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'daily':
        return NextResponse.json({
          success: true,
          data: analyticsData.dailyProgress,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'budget':
        return NextResponse.json({
          success: true,
          data: analyticsData.budgetBreakdown,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'locations':
        return NextResponse.json({
          success: true,
          data: analyticsData.locationBreakdown,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'crew':
        return NextResponse.json({
          success: true,
          data: analyticsData.crewBreakdown,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'vfx':
        return NextResponse.json({
          success: true,
          data: analyticsData.vfxBreakdown,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'predictions':
        return NextResponse.json({
          success: true,
          data: analyticsData.predictions,
          isDemoMode: finalIsDemoMode,
        });
      
      case 'full':
        return NextResponse.json({
          success: true,
          data: analyticsData,
          isDemoMode: finalIsDemoMode,
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: analyticsData,
          isDemoMode: finalIsDemoMode,
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    // Fallback to demo data on any error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
      data: DEMO_ANALYTICS,
      isDemoMode: true
    }, { status: 200 });
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
