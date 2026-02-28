import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/mission-control — aggregate all production data for the mission control dashboard
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

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
      health: Math.min(100, 70 + Math.floor(Math.random() * 30)), // Placeholder health calculation
      dailyRate: deptRates[name] || 0,
    })).sort((a, b) => b.members - a.members);

    // Today's stats (based on current day)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayShootingDay = shootingDays.find(d => 
      d.scheduledDate && d.scheduledDate.toISOString().split('T')[0] === todayStr
    );

    const todayStats = {
      scenesShot: todayShootingDay?.dayScenes.length || 0,
      scenesPlanned: todayShootingDay?.dayScenes.length || 0,
      crewPresent: crew.length, // Simplified - assume all crew present
      crewTotal: crew.length,
      hoursRemaining: 8, // Default working hours
    };

    // Weekly budget data (last 7 days)
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

    // Risk alerts - calculated from actual production data
    const risks: Array<{ level: string; title: string; daysLeft: number }> = [];
    
    // Budget risk
    const budgetPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    if (budgetPercentUsed > 80 && totalBudget > 0) {
      risks.push({ level: 'high', title: 'Budget critically low', daysLeft: Math.round(daysRemaining) || 1 });
    } else if (budgetPercentUsed > 60 && totalBudget > 0) {
      risks.push({ level: 'medium', title: 'Budget running low', daysLeft: Math.round(daysRemaining) || 5 });
    }
    
    // Schedule risk
    if (remainingScenes > totalScenes * 0.5 && totalScenes > 0) {
      risks.push({ level: 'medium', title: 'Many scenes remaining', daysLeft: daysRemaining || 10 });
    }
    
    // Crew risk
    if (crew.length < 10) {
      risks.push({ level: 'low', title: 'Crew size below optimal', daysLeft: 30 });
    }

    // Shooting day progress risk
    if (daysElapsed > 0 && totalShootingDays > 0) {
      const expectedProgress = (daysElapsed / totalShootingDays) * 100;
      const actualProgress = productionProgress;
      if (actualProgress < expectedProgress * 0.7) {
        risks.push({ level: 'high', title: 'Production behind schedule', daysLeft: daysRemaining || 3 });
      }
    }

    // Location risk - check if all locations are assigned
    const unassignedScenes = scenes.filter(s => !s.location).length;
    if (unassignedScenes > 0) {
      risks.push({ level: 'medium', title: `${unassignedScenes} scenes without locations`, daysLeft: 7 });
    }

    // Location progress - use actual data where available
    const locationProgress = locations.map(loc => {
      const locScenes = scenes.filter(s => s.location === loc.name);
      // Calculate progress based on scene count at location vs total scenes
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
    });
  } catch (error) {
    console.error('[GET /api/mission-control]', error);
    return NextResponse.json({ 
      error: 'Failed to fetch mission control data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
