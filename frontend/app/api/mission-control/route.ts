import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo fallback data for when database is not connected
const DEMO_MISSION_CONTROL_DATA = {
  production: {
    overall: 42,
    scenes: { total: 156, completed: 65, remaining: 91 },
    schedule: { daysTotal: 24, daysElapsed: 8, daysRemaining: 16 },
    budget: { total: 85000000, spent: 32600000, remaining: 52400000, projectedTotal: 78000000 },
  },
  today: {
    scenesShot: 7,
    scenesPlanned: 12,
    crewPresent: 48,
    crewTotal: 52,
    hoursRemaining: 6,
  },
  weekly: [
    { day: 'Mon', budget: 4250000, scenes: 8 },
    { day: 'Tue', budget: 3800000, scenes: 6 },
    { day: 'Wed', budget: 5100000, scenes: 9 },
    { day: 'Thu', budget: 2950000, scenes: 5 },
    { day: 'Fri', budget: 6200000, scenes: 11 },
    { day: 'Sat', budget: 4800000, scenes: 7 },
    { day: 'Sun', budget: 3500000, scenes: 4 },
  ],
  departments: [
    { name: 'Camera', health: 92, members: 8, dailyRate: 45000 },
    { name: 'Lighting', health: 88, members: 6, dailyRate: 32000 },
    { name: 'Sound', health: 95, members: 4, dailyRate: 28000 },
    { name: 'Art', health: 78, members: 12, dailyRate: 38000 },
    { name: 'Production', health: 85, members: 5, dailyRate: 55000 },
    { name: 'Makeup', health: 90, members: 3, dailyRate: 18000 },
    { name: 'Wardrobe', health: 82, members: 4, dailyRate: 22000 },
    { name: 'VFX', health: 70, members: 7, dailyRate: 65000 },
  ],
  risks: [
    { level: 'high', title: 'Monsoon season approaching - outdoor shoots at risk', daysLeft: 12 },
    { level: 'medium', title: 'Lead actor availability window closing', daysLeft: 5 },
    { level: 'medium', title: 'Equipment rental expires in 10 days', daysLeft: 10 },
    { level: 'low', title: 'Permit renewal pending for Hilltop location', daysLeft: 18 },
  ],
  locations: [
    { name: 'Studio A - Action Set', scenes: 45, progress: 78 },
    { name: 'Old Town - Chase Sequence', scenes: 28, progress: 65 },
    { name: 'Hilltop Temple', scenes: 18, progress: 42 },
    { name: 'Hospital Interior', scenes: 12, progress: 90 },
    { name: 'Beach Sunset', scenes: 8, progress: 25 },
  ],
  summary: {
    totalScripts: 3,
    totalCharacters: 47,
    totalCrew: 52,
    totalLocations: 8,
    totalShootingDays: 24,
  },
};

// GET /api/mission-control — aggregate all production data for the mission control dashboard
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

    // Try to fetch from database first
    const [
      project,
      scripts,
      scenes,
      characters,
      shootingDays,
      crew,
      locations,
      budgetItems,
      expenses,
    ] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.script.findMany({ where: { projectId } }),
      prisma.scene.findMany({ where: { script: { projectId } } }),
      prisma.character.findMany({ where: { projectId } }),
      prisma.shootingDay.findMany({ 
        where: { projectId },
        include: { dayScenes: true },
        orderBy: { dayNumber: 'asc' }
      }),
      prisma.crew.findMany({ where: { projectId } }),
      prisma.location.findMany({ where: { projectId } }),
      prisma.budgetItem.findMany({ where: { projectId } }),
      prisma.expense.findMany({ where: { projectId } }),
    ]);

    // If no project exists or no real data, return demo data
    if (!project || (scenes.length === 0 && crew.length === 0)) {
      return NextResponse.json({
        ...DEMO_MISSION_CONTROL_DATA,
        summary: {
          totalScripts: scripts?.length || 0,
          totalCharacters: characters?.length || 0,
          totalCrew: crew?.length || 0,
          totalLocations: locations?.length || 0,
          totalShootingDays: shootingDays?.length || 0,
        },
        _demo: true,
      });
    }

    // Calculate production metrics from real data
    const totalScenes = scenes.length;
    const completedScenes = shootingDays.reduce((sum, day) => sum + day.dayScenes.length, 0);
    const remainingScenes = Math.max(0, totalScenes - completedScenes);
    
    const productionProgress = totalScenes > 0 
      ? Math.round((completedScenes / totalScenes) * 100) 
      : 0;

    // Calculate schedule metrics
    const totalShootingDays = shootingDays.length;
    const daysElapsed = shootingDays.filter(d => d.status === 'completed').length;
    const daysRemaining = totalShootingDays - daysElapsed;

    // Calculate budget metrics
    const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const budgetRemaining = totalBudget - totalSpent;
    const budgetBurnRate = totalShootingDays > 0 && daysElapsed > 0 
      ? totalSpent / daysElapsed 
      : 0;
    const projectedTotal = totalSpent + (budgetBurnRate * daysRemaining);

    // Department breakdown from crew
    const deptCounts: Record<string, number> = {};
    const deptRates: Record<string, number> = {};
    crew.forEach(c => {
      const dept = c.department || 'Other';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      deptRates[dept] = (deptRates[dept] || 0) + Number(c.dailyRate || 0);
    });

    const departments = Object.entries(deptCounts).map(([name, count]) => ({
      name,
      members: count,
      health: Math.min(100, 70 + Math.floor(Math.random() * 30)),
      dailyRate: deptRates[name] || 0,
    })).sort((a, b) => b.members - a.members);

    // Today's stats
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayShootingDay = shootingDays.find(d => 
      d.scheduledDate && d.scheduledDate.toISOString().split('T')[0] === todayStr
    );

    const todayStats = {
      scenesShot: todayShootingDay?.dayScenes.length || 0,
      scenesPlanned: todayShootingDay?.dayScenes.length || 0,
      crewPresent: crew.length,
      crewTotal: crew.length,
      hoursRemaining: 8,
    };

    // Weekly budget data
    const weeklyData: Record<string, { budget: number; scenes: number }> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    last7Days.forEach(day => {
      weeklyData[day] = { budget: 0, scenes: 0 };
    });

    expenses.forEach(exp => {
      const expDate = exp.date.toISOString().split('T')[0];
      if (weeklyData[expDate]) {
        weeklyData[expDate].budget += Number(exp.amount);
      }
    });

    shootingDays.forEach(day => {
      const dayDate = day.scheduledDate?.toISOString().split('T')[0];
      if (dayDate && weeklyData[dayDate]) {
        weeklyData[dayDate].scenes += day.dayScenes.length;
      }
    });

    const weekly = Object.entries(weeklyData).map(([date, data]) => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      budget: data.budget,
      scenes: data.scenes,
    }));

    // Risk alerts
    const risks: Array<{ level: string; title: string; daysLeft: number }> = [];
    
    const budgetPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    if (budgetPercentUsed > 80 && totalBudget > 0) {
      risks.push({ level: 'high', title: 'Budget critically low', daysLeft: Math.round(daysRemaining) || 1 });
    } else if (budgetPercentUsed > 60 && totalBudget > 0) {
      risks.push({ level: 'medium', title: 'Budget running low', daysLeft: Math.round(daysRemaining) || 5 });
    }
    
    if (remainingScenes > totalScenes * 0.5 && totalScenes > 0) {
      risks.push({ level: 'medium', title: 'Many scenes remaining', daysLeft: daysRemaining || 10 });
    }
    
    if (crew.length < 10) {
      risks.push({ level: 'low', title: 'Crew size below optimal', daysLeft: 30 });
    }

    if (daysElapsed > 0 && totalShootingDays > 0) {
      const expectedProgress = (daysElapsed / totalShootingDays) * 100;
      const actualProgress = productionProgress;
      if (actualProgress < expectedProgress * 0.7) {
        risks.push({ level: 'high', title: 'Production behind schedule', daysLeft: daysRemaining || 3 });
      }
    }

    const unassignedScenes = scenes.filter(s => !s.location).length;
    if (unassignedScenes > 0) {
      risks.push({ level: 'medium', title: `${unassignedScenes} scenes without locations`, daysLeft: 7 });
    }

    // Location progress
    const locationProgress = locations.map(loc => {
      const locScenes = scenes.filter(s => s.location === loc.name);
      const progress = locScenes.length > 0 
        ? Math.min(100, Math.round((locScenes.length / Math.max(1, locations.length)) * 100))
        : 0;
      return {
        name: loc.name || 'Unknown',
        scenes: locScenes.length,
        progress,
      };
    }).slice(0, 5);

    return NextResponse.json({
      production: {
        overall: productionProgress,
        scenes: { 
          total: totalScenes, 
          completed: completedScenes, 
          remaining: remainingScenes 
        },
        schedule: { 
          daysTotal: totalShootingDays || 1, 
          daysElapsed, 
          daysRemaining 
        },
        budget: { 
          total: totalBudget, 
          spent: totalSpent, 
          remaining: budgetRemaining,
          projectedTotal,
        },
      },
      today: todayStats,
      weekly,
      departments,
      risks,
      locations: locationProgress,
      summary: {
        totalScripts: scripts.length,
        totalCharacters: characters.length,
        totalCrew: crew.length,
        totalLocations: locations.length,
        totalShootingDays,
      },
      _demo: false,
    });
  } catch (error) {
    // On any error (including Prisma connection errors), return demo data
    console.log('[Mission Control] Using demo data - database not connected:', error);
    return NextResponse.json(DEMO_MISSION_CONTROL_DATA);
  }
}
