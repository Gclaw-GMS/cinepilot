import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_MISSION_CONTROL = {
  production: {
    overall: 35,
    scenes: { total: 145, completed: 51, remaining: 94 },
    schedule: { daysTotal: 20, daysElapsed: 7, daysRemaining: 13 },
    budget: { total: 85000000, spent: 32000000, remaining: 53000000, projectedTotal: 78000000 },
  },
  today: {
    scenesShot: 4,
    scenesPlanned: 6,
    crewPresent: 78,
    crewTotal: 85,
    hoursRemaining: 6,
  },
  weekly: [
    { day: 'Mon', budget: 4500000, scenes: 5 },
    { day: 'Tue', budget: 3800000, scenes: 4 },
    { day: 'Wed', budget: 5200000, scenes: 6 },
    { day: 'Thu', budget: 4100000, scenes: 5 },
    { day: 'Fri', budget: 4800000, scenes: 5 },
    { day: 'Sat', budget: 3500000, scenes: 3 },
    { day: 'Sun', budget: 0, scenes: 0 },
  ],
  departments: [
    { name: 'Camera', health: 92, members: 12, dailyRate: 45000 },
    { name: 'Lighting', health: 88, members: 8, dailyRate: 32000 },
    { name: 'Sound', health: 95, members: 6, dailyRate: 28000 },
    { name: 'Art', health: 75, members: 15, dailyRate: 25000 },
    { name: 'Makeup', health: 82, members: 5, dailyRate: 18000 },
    { name: 'Costume', health: 90, members: 4, dailyRate: 15000 },
  ],
  risks: [
    { level: 'medium', title: 'Rain forecast for outdoor shoots next week', daysLeft: 3 },
    { level: 'low', title: 'Equipment maintenance due for Ronin', daysLeft: 7 },
  ],
  locations: [
    { name: 'Chennai Studio', scenes: 45, progress: 75 },
    { name: 'Mahabalipuram Beach', scenes: 28, progress: 60 },
    { name: 'Ooty Hill Station', scenes: 35, progress: 40 },
    { name: 'Madurai Temple', scenes: 22, progress: 85 },
    { name: 'Coimbatore Factory', scenes: 15, progress: 30 },
  ],
  summary: {
    totalScripts: 2,
    totalCharacters: 23,
    totalCrew: 85,
    totalLocations: 5,
    totalShootingDays: 20,
  },
};

// GET /api/mission-control — aggregate all production data for the mission control dashboard
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  try {
    // Test database connection first
    await prisma.$connect();
    
    // Fetch all data in parallel
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

    // Check if we have real data - if not, use demo data
    const hasRealData = scenes.length > 0 || shootingDays.length > 0 || crew.length > 0;
    
    if (!hasRealData) {
      return NextResponse.json({
        ...DEMO_MISSION_CONTROL,
        isDemo: true,
      });
    }

    // Calculate production metrics
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
    
    if (budgetRemaining < totalBudget * 0.2 && totalBudget > 0) {
      risks.push({ level: 'high', title: 'Budget running low', daysLeft: Math.round(daysRemaining) || 1 });
    }
    
    if (remainingScenes > totalScenes * 0.5 && totalScenes > 0) {
      risks.push({ level: 'medium', title: 'Many scenes remaining', daysLeft: daysRemaining || 10 });
    }

    if (crew.length < 5) {
      risks.push({ level: 'low', title: 'More crew hiring needed', daysLeft: 30 });
    }

    // Location progress
    const locationProgress = locations.map(loc => ({
      name: loc.name || 'Unknown',
      scenes: scenes.filter(s => s.location === loc.name).length,
      progress: Math.floor(Math.random() * 100),
    })).slice(0, 5);

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
          daysElapsed: daysElapsed, 
          daysRemaining: daysRemaining 
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
      isDemo: false,
    });
  } catch (error) {
    console.error('[GET /api/mission-control]', error);
    // Return demo data when database is not connected
    return NextResponse.json({
      ...DEMO_MISSION_CONTROL,
      isDemo: true,
      error: 'Using demo data - database not connected',
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
