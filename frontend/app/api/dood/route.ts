import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is unavailable
const DEMO_DOOD_REPORT = [
  { characterId: 'char-1', character: 'Arjun', characterTamil: 'அருஜ்', actorName: 'Ajith Kumar', isMain: true, total_days: 28, days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], percentage: 100 },
  { characterId: 'char-2', character: 'Priya', characterTamil: 'பிரியா', actorName: 'Sai Pallavi', isMain: true, total_days: 24, days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28], percentage: 86 },
  { characterId: 'char-3', character: 'Raghava Guru', characterTamil: 'ரகவா குரு', actorName: 'Vijay Sethupathi', isMain: false, total_days: 18, days: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 22, 23, 27, 28], percentage: 64 },
  { characterId: 'char-4', character: 'Vikram', characterTamil: 'விக்னேஷ்', actorName: ' Fahadh Faasil', isMain: false, total_days: 15, days: [3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 20, 21, 25, 26], percentage: 54 },
  { characterId: 'char-5', character: 'Maya', characterTamil: 'மாயா', actorName: 'Nithya Menen', isMain: false, total_days: 12, days: [2, 3, 4, 5, 9, 10, 11, 12, 16, 17, 18, 19], percentage: 43 },
  { characterId: 'char-6', character: 'SP Nathan', characterTamil: 'எஸ்.பி. நாதன்', actorName: 'Sanjay Dutt', isMain: false, total_days: 8, days: [1, 2, 6, 7, 8, 13, 14, 15], percentage: 29 },
  { characterId: 'char-7', character: 'Lakshmi', characterTamil: 'லக்ஷ்மி', actorName: 'Lakshmi Menon', isMain: false, total_days: 6, days: [5, 6, 7, 12, 13, 14], percentage: 21 },
  { characterId: 'char-8', character: 'Young Arjun', characterTamil: 'சிறிய அருஜ்', actorName: 'New Actor', isMain: false, total_days: 4, days: [20, 21, 22, 23], percentage: 14 },
];

const DEMO_STATS = {
  totalCharacters: 8,
  totalShootingDays: 28,
  totalCalls: 115,
  avgDaysPerActor: 14.4,
};

// GET /api/dood — get Day Out of Days report
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const filterMain = req.nextUrl.searchParams.get('isMain');
  const minDays = req.nextUrl.searchParams.get('minDays');
  const maxDays = req.nextUrl.searchParams.get('maxDays');
  const sortBy = req.nextUrl.searchParams.get('sortBy') || 'total_days';
  const sortOrder = req.nextUrl.searchParams.get('sortOrder') || 'desc';

  try {
    // Try database first
    await prisma.$connect();

    // Get all shooting days for the project
    const shootingDays = await prisma.shootingDay.findMany({
      where: { projectId },
      include: {
        dayScenes: {
          include: {
            scene: {
              include: {
                sceneCharacters: {
                  include: {
                    character: {
                      select: {
                        id: true,
                        name: true,
                        nameTamil: true,
                        actorName: true,
                        isMain: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { dayNumber: 'asc' },
    });

    // Get all characters for the project
    const characters = await prisma.character.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        nameTamil: true,
        actorName: true,
        isMain: true,
      },
    });

    // Calculate DOOD for each character
    const characterDayMap: Record<string, number[]> = {};
    
    // Initialize all characters
    characters.forEach((char) => {
      characterDayMap[char.id] = [];
    });

    // Map characters to shooting days
    shootingDays.forEach((day) => {
      day.dayScenes.forEach((dayScene) => {
        dayScene.scene.sceneCharacters.forEach((sc) => {
          if (sc.character && characterDayMap[sc.character.id]) {
            if (!characterDayMap[sc.character.id].includes(day.dayNumber)) {
              characterDayMap[sc.character.id].push(day.dayNumber);
            }
          }
        });
      });
    });

    // Build the DOOD report
    const totalShootingDays = shootingDays.length;
    const report = characters.map((char) => {
      const days = characterDayMap[char.id] || [];
      days.sort((a, b) => a - b);
      return {
        characterId: char.id,
        character: char.name,
        characterTamil: char.nameTamil || char.name,
        actorName: char.actorName,
        isMain: char.isMain,
        total_days: days.length,
        days,
        percentage: totalShootingDays > 0 
          ? Math.round((days.length / totalShootingDays) * 100) 
          : 0,
      };
    });

    // Apply filters
    let filteredReport = report.filter(r => {
      // Filter by isMain
      if (filterMain !== null && filterMain !== undefined) {
        const isMainFilter = filterMain === 'true';
        if (r.isMain !== isMainFilter) return false;
      }
      // Filter by minDays
      if (minDays !== null && minDays !== undefined) {
        const min = parseInt(minDays);
        if (r.total_days < min) return false;
      }
      // Filter by maxDays
      if (maxDays !== null && maxDays !== undefined) {
        const max = parseInt(maxDays);
        if (r.total_days > max) return false;
      }
      return true;
    });

    // Sort results
    filteredReport.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'character':
          comparison = a.character.localeCompare(b.character);
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
        case 'total_days':
        default:
          comparison = a.total_days - b.total_days;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Calculate stats
    const totalCalls = report.reduce((sum, r) => sum + r.total_days, 0);
    const avgDaysPerActor = report.length > 0 
      ? Math.round((totalCalls / report.length) * 10) / 10 
      : 0;

    // If no characters found in database, fall back to demo data
    if (characters.length === 0) {
      console.log('[GET /api/dood] No characters in database, using demo data');
      
      // Apply filters to demo data as well
      let filteredDemo = DEMO_DOOD_REPORT.filter(r => {
        if (filterMain !== null && filterMain !== undefined) {
          const isMainFilter = filterMain === 'true';
          if (r.isMain !== isMainFilter) return false;
        }
        if (minDays !== null && minDays !== undefined) {
          const min = parseInt(minDays);
          if (r.total_days < min) return false;
        }
        if (maxDays !== null && maxDays !== undefined) {
          const max = parseInt(maxDays);
          if (r.total_days > max) return false;
        }
        return true;
      });
      
      filteredDemo.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'character':
            comparison = a.character.localeCompare(b.character);
            break;
          case 'percentage':
            comparison = a.percentage - b.percentage;
            break;
          case 'total_days':
          default:
            comparison = a.total_days - b.total_days;
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      return NextResponse.json({
        report: filteredDemo,
        stats: {
          ...DEMO_STATS,
          filteredCount: filteredDemo.length,
        },
        isDemoMode: true,
        filters: {
          isMain: filterMain,
          minDays: minDays ? parseInt(minDays) : null,
          maxDays: maxDays ? parseInt(maxDays) : null,
          sortBy,
          sortOrder,
        },
      });
    }

    return NextResponse.json({
      report: filteredReport,
      stats: {
        totalCharacters: report.length,
        filteredCount: filteredReport.length,
        totalShootingDays,
        totalCalls,
        avgDaysPerActor,
      },
      filters: {
        isMain: filterMain,
        minDays: minDays ? parseInt(minDays) : null,
        maxDays: maxDays ? parseInt(maxDays) : null,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.log('[GET /api/dood] Using demo data - database not connected');
    
    // Apply filters to demo data even in error case
    let filteredDemo = DEMO_DOOD_REPORT.filter(r => {
      if (filterMain !== null && filterMain !== undefined) {
        const isMainFilter = filterMain === 'true';
        if (r.isMain !== isMainFilter) return false;
      }
      if (minDays !== null && minDays !== undefined) {
        const min = parseInt(minDays);
        if (r.total_days < min) return false;
      }
      if (maxDays !== null && maxDays !== undefined) {
        const max = parseInt(maxDays);
        if (r.total_days > max) return false;
      }
      return true;
    });
    
    filteredDemo.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'character':
          comparison = a.character.localeCompare(b.character);
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
        case 'total_days':
        default:
          comparison = a.total_days - b.total_days;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Return demo data when database is not connected
    return NextResponse.json({
      report: filteredDemo,
      stats: {
        ...DEMO_STATS,
        filteredCount: filteredDemo.length,
      },
      isDemoMode: true,
      filters: {
        isMain: filterMain,
        minDays: minDays ? parseInt(minDays) : null,
        maxDays: maxDays ? parseInt(maxDays) : null,
        sortBy,
        sortOrder,
      },
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// POST /api/dood — generate DOOD from schedule
export async function POST(req: NextRequest) {
  let action: string | undefined;
  let projectId = DEFAULT_PROJECT_ID;
  
  // Parse body once outside try block to avoid consumption issues
  try {
    const body = await req.json();
    action = body.action;
    projectId = body.projectId || DEFAULT_PROJECT_ID;
  } catch {
    // Body parsing failed, will handle in main try
  }

  try {
    if (action === 'generate') {
      // Get shooting days and characters
      const shootingDays = await prisma.shootingDay.findMany({
        where: { projectId },
        include: {
          dayScenes: {
            include: {
              scene: {
                include: {
                  sceneCharacters: true,
                },
              },
            },
          },
        },
        orderBy: { dayNumber: 'asc' },
      });

      const characters = await prisma.character.findMany({
        where: { projectId },
      });

      // Generate DOOD data
      const characterDayMap: Record<string, number[]> = {};
      
      characters.forEach((char) => {
        characterDayMap[char.id] = [];
      });

      shootingDays.forEach((day) => {
        day.dayScenes.forEach((dayScene) => {
          dayScene.scene.sceneCharacters.forEach((sc) => {
            if (characterDayMap[sc.characterId]) {
              if (!characterDayMap[sc.characterId].includes(day.dayNumber)) {
                characterDayMap[sc.characterId].push(day.dayNumber);
              }
            }
          });
        });
      });

      const totalDays = shootingDays.length;
      const generatedReport = characters.map((char) => ({
        characterId: char.id,
        character: char.name,
        characterTamil: char.nameTamil || char.name,
        actorName: char.actorName,
        isMain: char.isMain,
        total_days: (characterDayMap[char.id] || []).length,
        days: (characterDayMap[char.id] || []).sort((a, b) => a - b),
      }));

      return NextResponse.json({
        message: `DOOD generated for ${characters.length} characters across ${totalDays} shooting days`,
        report: generatedReport,
        stats: {
          totalCharacters: characters.length,
          totalShootingDays: totalDays,
          totalCalls: generatedReport.reduce((s, r) => s + r.total_days, 0),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.log('[POST /api/dood] Using demo data - database not connected');
    
    // Demo mode fallback - return demo report
    // Note: We don't re-parse req.json() since body was already consumed in try block
    // Use the action variable from the outer scope
    if (action === 'generate') {
      return NextResponse.json({
        message: 'DOOD generated from demo data (8 characters across 28 shooting days)',
        report: DEMO_DOOD_REPORT,
        stats: DEMO_STATS,
        isDemoMode: true,
      });
    }
    
    return NextResponse.json({ 
      error: 'Database not connected',
      isDemoMode: true,
      report: DEMO_DOOD_REPORT,
      stats: DEMO_STATS,
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
