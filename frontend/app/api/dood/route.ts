import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// GET /api/dood — get Day Out of Days report
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

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

    // Sort by total days descending
    report.sort((a, b) => b.total_days - a.total_days);

    // Calculate stats
    const totalCalls = report.reduce((sum, r) => sum + r.total_days, 0);
    const avgDaysPerActor = report.length > 0 
      ? Math.round((totalCalls / report.length) * 10) / 10 
      : 0;

    return NextResponse.json({
      report,
      stats: {
        totalCharacters: report.length,
        totalShootingDays,
        totalCalls,
        avgDaysPerActor,
      },
    });
  } catch (error) {
    console.error('[GET /api/dood]', error);
    return NextResponse.json({ error: 'Failed to fetch DOOD report' }, { status: 500 });
  }
}

// POST /api/dood — generate DOOD from schedule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId = DEFAULT_PROJECT_ID } = body;

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
    console.error('[POST /api/dood]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
