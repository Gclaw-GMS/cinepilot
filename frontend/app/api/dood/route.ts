import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_DOOD = {
  report: [
    { characterId: '1', character: 'Arjun', characterTamil: 'அர்ஜுன்', actorName: 'Ajith Kumar', isMain: true, total_days: 15, days: [1,2,3,5,6,7,9,10,11,12,14,15,16,18,20], percentage: 75 },
    { characterId: '2', character: 'Priya', characterTamil: 'பிரியா', actorName: 'Sai Pallavi', isMain: true, total_days: 12, days: [1,2,4,5,6,8,9,10,12,13,14,15], percentage: 60 },
    { characterId: '3', character: 'Mahendra', characterTamil: 'மகேந்திரா', actorName: 'Vijay Sethupathi', isMain: true, total_days: 8, days: [3,7,11,15,16,17,18,19], percentage: 40 },
    { characterId: '4', character: 'Sathya', characterTamil: 'சத்யா', actorName: 'Nivin Pauly', isMain: false, total_days: 10, days: [1,4,5,9,10,14,15,16,20,21], percentage: 50 },
    { characterId: '5', character: 'Divya', characterTamil: 'திவ்யா', actorName: 'Aishwarya Rajesh', isMain: false, total_days: 6, days: [2,3,8,12,13,19], percentage: 30 },
    { characterId: '6', character: 'Raghav', characterTamil: 'ராகவ்', actorName: 'Karthi', isMain: true, total_days: 14, days: [1,2,3,4,5,6,7,9,10,11,12,14,15,16], percentage: 70 },
    { characterId: '7', character: 'Meera', characterTamil: 'மீரா', actorName: 'Nithya Menen', isMain: false, total_days: 9, days: [2,4,5,8,9,10,13,14,18], percentage: 45 },
    { characterId: '8', character: 'Vikram', characterTamil: 'விக்னேஷ்', actorName: 'Vijay', isMain: true, total_days: 11, days: [1,3,5,7,9,11,13,15,17,19,20], percentage: 55 },
  ],
  stats: {
    totalCharacters: 8,
    totalShootingDays: 20,
    totalCalls: 85,
    avgDaysPerActor: 10.6,
  },
  isDemoMode: true,
};

// GET /api/dood — get Day Out of Days report
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  try {
    // Test database connection
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
    // Return demo data when database is not connected
    return NextResponse.json(DEMO_DOOD);
  } finally {
    await prisma.$disconnect().catch(() => {});
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
