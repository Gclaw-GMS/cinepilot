import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (would be database in production)
const characters: Map<string, any[]> = new Map()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function calculateSummary(projectCharacters: any[]) {
  const byRole: Record<string, number> = {}
  const byAgeGroup: Record<string, number> = {}
  let totalBudget = 0

  projectCharacters.forEach(char => {
    byRole[char.role] = (byRole[char.role] || 0) + 1
    byAgeGroup[char.age] = (byAgeGroup[char.age] || 0) + 1
    totalBudget += char.estimatedBudget || 0
  })

  return {
    totalCharacters: projectCharacters.length,
    byRole,
    byAgeGroup,
    totalBudget
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId') || 'demo-project'

  try {
    const projectCharacters = characters.get(projectId) || []
    
    // Add demo data if empty
    if (projectCharacters.length === 0) {
      const demoCharacters = [
        {
          id: generateId(),
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
          moodBoardImages: [],
          costumeNotes: 'Needs rugged look, leather jacket for action sequences',
          designer: 'Rajesh Kumar',
          estimatedBudget: 150000,
          status: 'in-progress'
        },
        {
          id: generateId(),
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
          moodBoardImages: [],
          costumeNotes: 'Traditional silk sarees for classical dance sequences',
          designer: 'Lakshmi',
          estimatedBudget: 200000,
          status: 'planning'
        },
        {
          id: generateId(),
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
          moodBoardImages: [],
          costumeNotes: 'Simple dhoti look with saffron robes',
          designer: 'Rajesh Kumar',
          estimatedBudget: 80000,
          status: 'completed'
        },
        {
          id: generateId(),
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
          moodBoardImages: [],
          costumeNotes: 'Dark armor with red accents',
          designer: 'Rajesh Kumar',
          estimatedBudget: 180000,
          status: 'planning'
        }
      ]
      
      characters.set(projectId, demoCharacters)
      return NextResponse.json({
        characters: demoCharacters,
        summary: calculateSummary(demoCharacters)
      })
    }

    return NextResponse.json({
      characters: projectCharacters,
      summary: calculateSummary(projectCharacters)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId = 'demo-project', name, age, gender, role, appearance, personality, costumeStyle, fabrics, colorPalette, description, costumeNotes, designer, estimatedBudget } = body

    if (!name) {
      return NextResponse.json({ error: 'Character name is required' }, { status: 400 })
    }

    const projectCharacters = characters.get(projectId) || []
    
    const newCharacter = {
      id: generateId(),
      name,
      age: age || 'Adult (36-50)',
      ageNumber: body.ageNumber || 30,
      gender: gender || 'Male',
      role: role || 'supporting',
      appearance: appearance || [],
      personality: personality || [],
      costumeStyle: costumeStyle || [],
      fabrics: fabrics || [],
      colorPalette: colorPalette || [],
      description: description || '',
      moodBoardImages: body.moodBoardImages || [],
      costumeNotes: costumeNotes || '',
      designer: designer || '',
      estimatedBudget: estimatedBudget || 0,
      status: body.status || 'planning',
      createdAt: new Date().toISOString()
    }

    projectCharacters.push(newCharacter)
    characters.set(projectId, projectCharacters)

    return NextResponse.json({
      character: newCharacter,
      summary: calculateSummary(projectCharacters)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { projectId = 'demo-project' } = body

    if (!id) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    const projectCharacters = characters.get(projectId) || []
    const index = projectCharacters.findIndex((c: any) => c.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    projectCharacters[index] = {
      ...projectCharacters[index],
      ...body,
      id, // Preserve original ID
      updatedAt: new Date().toISOString()
    }

    characters.set(projectId, projectCharacters)

    return NextResponse.json({
      character: projectCharacters[index],
      summary: calculateSummary(projectCharacters)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const projectId = searchParams.get('projectId') || 'demo-project'

    if (!id) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    const projectCharacters = characters.get(projectId) || []
    const filtered = projectCharacters.filter((c: any) => c.id !== id)

    if (filtered.length === projectCharacters.length) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    characters.set(projectId, filtered)

    return NextResponse.json({
      success: true,
      summary: calculateSummary(filtered)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
  }
}
