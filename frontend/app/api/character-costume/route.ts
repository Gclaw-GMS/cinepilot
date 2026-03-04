import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is unavailable
const DEMO_CHARACTERS = [
  {
    id: 'char-1',
    name: 'Arjun',
    age: 'Young Adult (20-35)',
    ageNumber: 28,
    gender: 'Male',
    role: 'protagonist',
    appearance: ['Tall', 'Athletic', 'Short Hair', 'Fair'],
    personality: ['Brave', 'Charismatic', 'Loyal'],
    costumeStyle: ['Action', 'Modern'],
    fabrics: ['Cotton', 'Leather'],
    colorPalette: ['#000000', '#FFFFFF', '#FF0000'],
    description: 'A fearless warrior from a small village who embarks on a journey to save his people from an ancient evil.',
    moodBoardImages: [] as string[],
    costumeNotes: 'Needs rugged look, leather jacket for action sequences',
    designer: 'Rajesh Kumar',
    estimatedBudget: 150000,
    status: 'in-progress'
  },
  {
    id: 'char-2',
    name: 'Priya',
    age: 'Young Adult (20-35)',
    ageNumber: 25,
    gender: 'Female',
    role: 'romantic',
    appearance: ['Slim', 'Long Hair', 'Fair', 'Curvy'],
    personality: ['Intelligent', 'Kind', 'Romantic'],
    costumeStyle: ['Traditional', 'Romantic'],
    fabrics: ['Silk', 'Kanjivaram', 'Georgette'],
    colorPalette: ['#FF00FF', '#FFD700', '#FFC0CB'],
    description: 'A classical dancer who becomes the love interest of Arjun. Her journey balances tradition and modernity.',
    moodBoardImages: [] as string[],
    costumeNotes: 'Traditional silk sarees for classical dance sequences',
    designer: 'Lakshmi',
    estimatedBudget: 200000,
    status: 'planning'
  },
  {
    id: 'char-3',
    name: 'Raghava',
    age: 'Adult (36-50)',
    ageNumber: 45,
    gender: 'Male',
    role: 'mentor',
    appearance: ['Tall', 'Slim', 'Short Hair', 'Bald'],
    personality: ['Wise', 'Serious', 'Mentor'],
    costumeStyle: ['Traditional', 'Formal'],
    fabrics: ['Cotton', 'Silk'],
    colorPalette: ['#FFFFFF', '#FFD700', '#4A4A4A'],
    description: 'The wise guru who guides Arjun on his journey. Has deep knowledge of ancient arts.',
    moodBoardImages: [] as string[],
    costumeNotes: 'Simple dhoti look with saffron robes',
    designer: 'Rajesh Kumar',
    estimatedBudget: 80000,
    status: 'completed'
  },
  {
    id: 'char-4',
    name: 'Vikram',
    age: 'Young Adult (20-35)',
    ageNumber: 30,
    gender: 'Male',
    role: 'antagonist',
    appearance: ['Tall', 'Muscular', 'Scarred', 'Tattooed'],
    personality: ['Cruel', 'Ambitious', 'Cynical'],
    costumeStyle: ['Action', 'Fantasy'],
    fabrics: ['Leather', 'Velvet'],
    colorPalette: ['#000000', '#FF0000', '#800080'],
    description: 'The main antagonist who seeks to control the ancient power that Arjun protects.',
    moodBoardImages: [] as string[],
    costumeNotes: 'Dark armor with red accents',
    designer: 'Rajesh Kumar',
    estimatedBudget: 180000,
    status: 'planning'
  }
];

interface CharacterCostume {
  id: string;
  name: string;
  age: string;
  ageNumber: number;
  gender: string;
  role: string;
  appearance: string[];
  personality: string[];
  costumeStyle: string[];
  fabrics: string[];
  colorPalette: string[];
  description: string;
  moodBoardImages: string[];
  costumeNotes: string;
  designer: string;
  estimatedBudget: number;
  status: string;
}

function calculateSummary(characters: CharacterCostume[]) {
  const byRole: Record<string, number> = {};
  const byAgeGroup: Record<string, number> = {};
  let totalBudget = 0;

  characters.forEach(char => {
    byRole[char.role] = (byRole[char.role] || 0) + 1;
    byAgeGroup[char.age] = (byAgeGroup[char.age] || 0) + 1;
    totalBudget += char.estimatedBudget || 0;
  });

  return {
    totalCharacters: characters.length,
    byRole,
    byAgeGroup,
    totalBudget
  };
}

// GET /api/character-costume - Get all characters with costume details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID;

  try {
    // Try database first
    await prisma.$connect();
    
    const characters = await prisma.character.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    // Transform database characters to costume format
    // Map the basic character data to the extended costume format
    const formattedCharacters: CharacterCostume[] = characters.map(char => ({
      id: char.id,
      name: char.name,
      age: char.roleHint || 'Adult (36-50)', // Use roleHint as age hint
      ageNumber: 30,
      gender: char.isMain ? 'Male' : 'Unknown',
      role: char.isMain ? 'protagonist' : 'supporting',
      appearance: [],
      personality: [],
      costumeStyle: [],
      fabrics: [],
      colorPalette: [],
      description: char.description || '',
      moodBoardImages: [],
      costumeNotes: '',
      designer: char.actorName || '',
      estimatedBudget: 0,
      status: 'planning'
    }));

    // If we have characters from DB with meaningful data, return them
    // Otherwise fall back to demo data
    const hasMeaningfulData = formattedCharacters.some(char => 
      char.appearance?.length > 0 || 
      char.personality?.length > 0 || 
      char.costumeStyle?.length > 0 ||
      char.description
    );
    
    if (formattedCharacters.length > 0 && hasMeaningfulData) {
      return NextResponse.json({
        characters: formattedCharacters,
        summary: calculateSummary(formattedCharacters),
        isDemoMode: false
      });
    }
    
    // No meaningful characters in DB, return demo data
    return NextResponse.json({
      characters: DEMO_CHARACTERS,
      summary: calculateSummary(DEMO_CHARACTERS),
      isDemoMode: true
    });
  } catch (error) {
    console.log('[GET /api/character-costume] Using demo data - database not connected');
    
    // Return demo data when database is not connected
    return NextResponse.json({
      characters: DEMO_CHARACTERS,
      summary: calculateSummary(DEMO_CHARACTERS),
      isDemoMode: true
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// POST /api/character-costume - Create a new character with costume details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId = DEFAULT_PROJECT_ID, 
      name, 
      age, 
      ageNumber, 
      gender, 
      role, 
      appearance, 
      personality, 
      costumeStyle, 
      fabrics, 
      colorPalette, 
      description, 
      costumeNotes, 
      designer, 
      estimatedBudget,
      status 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Character name is required' }, { status: 400 });
    }

    // Try database first
    try {
      await prisma.$connect();
      
      // Create basic character in database
      const character = await prisma.character.create({
        data: {
          projectId,
          name,
          description: description || null,
          roleHint: role || null,
          actorName: designer || null,
          isMain: role === 'protagonist'
        }
      });

      return NextResponse.json({
        character: {
          id: character.id,
          name: character.name,
          age: age || '',
          ageNumber: ageNumber || 25,
          gender: gender || 'Male',
          role: role || 'supporting',
          appearance: appearance || [],
          personality: personality || [],
          costumeStyle: costumeStyle || [],
          fabrics: fabrics || [],
          colorPalette: colorPalette || [],
          description: character.description || '',
          moodBoardImages: [],
          costumeNotes: costumeNotes || '',
          designer: designer || '',
          estimatedBudget: estimatedBudget || 0,
          status: status || 'planning'
        },
        isDemoMode: false
      });
    } catch (dbError) {
      // Fallback to demo mode
      console.log('[POST /api/character-costume] Using demo mode - database not connected');
      
      // Return success but indicate demo mode
      return NextResponse.json({ 
        success: true, 
        isDemoMode: true,
        message: 'Demo mode - character not persisted to database' 
      });
    }
  } catch (error) {
    console.error('[POST /api/character-costume]', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// PUT /api/character-costume - Update a character
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
    }

    const { 
      name, 
      description,
      role,
      designer,
      // Costume-specific fields (stored in memory only in demo mode)
      age,
      ageNumber,
      gender,
      appearance,
      personality,
      costumeStyle,
      fabrics,
      colorPalette,
      costumeNotes,
      estimatedBudget,
      status
    } = body;

    // Try database first
    try {
      await prisma.$connect();
      
      const character = await prisma.character.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(role && { roleHint: role }),
          ...(designer !== undefined && { actorName: designer }),
          ...(role !== undefined && { isMain: role === 'protagonist' })
        }
      });

      return NextResponse.json({
        character: {
          id: character.id,
          name: character.name,
          age: age || '',
          ageNumber: ageNumber || 25,
          gender: gender || 'Male',
          role: role || 'supporting',
          appearance: appearance || [],
          personality: personality || [],
          costumeStyle: costumeStyle || [],
          fabrics: fabrics || [],
          colorPalette: colorPalette || [],
          description: character.description || '',
          moodBoardImages: [],
          costumeNotes: costumeNotes || '',
          designer: designer || '',
          estimatedBudget: estimatedBudget || 0,
          status: status || 'planning'
        },
        isDemoMode: false
      });
    } catch (dbError) {
      // Fallback to demo mode
      return NextResponse.json({ 
        success: true, 
        isDemoMode: true,
        message: 'Demo mode - character not updated in database' 
      });
    }
  } catch (error) {
    console.error('[PUT /api/character-costume]', error);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// DELETE /api/character-costume - Delete a character
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
    }

    // Try database first
    try {
      await prisma.$connect();
      await prisma.character.delete({ where: { id } });
      return NextResponse.json({ success: true, isDemoMode: false });
    } catch (dbError) {
      // Fallback to demo mode
      return NextResponse.json({ 
        success: true, 
        isDemoMode: true,
        message: 'Demo mode - character not deleted from database' 
      });
    }
  } catch (error) {
    console.error('[DELETE /api/character-costume]', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
