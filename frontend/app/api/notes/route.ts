import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// In-memory storage for demo mode
const demoNotes: Map<string, Note[]> = new Map()

interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isPinned?: boolean
  createdBy?: string
}

const DEMO_NOTES: Note[] = [
  { 
    id: '1', 
    title: 'Day 1 Shoot - Factory Sequence', 
    content: 'Key points:\n- 200 extras confirmed\n- Safety officer on set\n- Backup generator arranged\n- Weather contingency: indoor warehouse shots', 
    category: 'production', 
    tags: ['shoot', 'action', 'extras'], 
    createdAt: '2024-02-10T10:00:00Z', 
    updatedAt: '2024-02-12T14:30:00Z',
    isPinned: true
  },
  { 
    id: '2', 
    title: 'Camera Equipment Backup List', 
    content: 'Primary: ARRI Alexa Mini LF\nBackup: RED Komodo\nLenses: Cooke S7/i Full Frame Plus\nStabilizer: DJI Ronin RS3 Pro', 
    category: 'technical', 
    tags: ['camera', 'equipment', 'backup'], 
    createdAt: '2024-02-08T09:00:00Z', 
    updatedAt: '2024-02-08T09:00:00Z' 
  },
  { 
    id: '3', 
    title: 'Location Change - Song Sequence', 
    content: 'Original: Marina Beach\nChanged to: EVP Studios (Indoor)\nReason: Weather forecast shows rain\nBudget impact: +₹2L for studio rental', 
    category: 'logistics', 
    tags: ['location', 'weather', 'budget'], 
    createdAt: '2024-02-05T16:00:00Z', 
    updatedAt: '2024-02-06T11:00:00Z' 
  },
  { 
    id: '4', 
    title: 'Actor Schedule Conflict', 
    content: 'Ajith sir has a clash with another project on Feb 20th.\nNeed to reschedule temple shoot to Feb 18th or 19th.\nDiscuss with director and producer.', 
    category: 'production', 
    tags: ['schedule', 'cast', 'urgent'], 
    createdAt: '2024-02-03T08:00:00Z', 
    updatedAt: '2024-02-04T10:00:00Z',
    isPinned: true
  },
  { 
    id: '5', 
    title: 'VFX Shot Requirements', 
    content: 'Scene 12: Explosion - 45 frames\nScene 23: Glow effect - 30 frames\nScene 31: Blood removal - 15 frames\nTotal VFX shots: 90 frames estimated', 
    category: 'creative', 
    tags: ['vfx', 'shots', 'planning'], 
    createdAt: '2024-01-28T14:00:00Z', 
    updatedAt: '2024-01-30T09:00:00Z' 
  },
  { 
    id: '6', 
    title: 'Catering Budget Allocation', 
    content: 'Per day: ₹50,000\nTotal shoot days: 20\nBuffer (10%): ₹1,00,000\nTotal budget: ₹11,00,000', 
    category: 'budget', 
    tags: ['catering', 'budget', 'expenses'], 
    createdAt: '2024-01-25T11:00:00Z', 
    updatedAt: '2024-01-25T11:00:00Z' 
  },
]

// Initialize demo data
demoNotes.set(DEFAULT_PROJECT_ID, [...DEMO_NOTES])

// GET /api/notes - Get all notes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID

  try {
    // Try database first
    await prisma.$connect()
    
    const where: Record<string, unknown> = { projectId }
    if (category && category !== 'all') where.category = category

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
    })

    // Format response
    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags as string[],
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      isPinned: note.isPinned,
      createdBy: note.createdBy || undefined,
    }))

    return NextResponse.json({ notes: formattedNotes })
  } catch {
    // Fall back to demo data
    const notes = demoNotes.get(projectId) || DEMO_NOTES
    let filtered = notes
    
    if (category && category !== 'all') {
      filtered = notes.filter(n => n.category === category)
    }

    return NextResponse.json({ notes: filtered, isDemoMode: true })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/notes - Create a new note
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, content, category, tags, isPinned, projectId = DEFAULT_PROJECT_ID } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const newNote: Note = {
    id: `note-${Date.now()}`,
    title,
    content: content || '',
    category: category || 'general',
    tags: tags || [],
    createdAt: now,
    updatedAt: now,
    isPinned: isPinned || false,
  }

  try {
    await prisma.$connect()
    
    const created = await prisma.note.create({
      data: {
        title,
        content: content || '',
        category: category || 'general',
        tags: tags || [],
        isPinned: isPinned || false,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      note: {
        id: created.id,
        title: created.title,
        content: created.content,
        category: created.category,
        tags: created.tags as string[],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        isPinned: created.isPinned,
      }
    })
  } catch {
    // Save to demo storage
    const notes = demoNotes.get(projectId) || []
    notes.push(newNote)
    demoNotes.set(projectId, notes)
    
    return NextResponse.json({ note: newNote, isDemoMode: true })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/notes - Update a note
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, title, content, category, tags, isPinned, projectId = DEFAULT_PROJECT_ID } = body

  if (!id) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
  }

  try {
    await prisma.$connect()
    
    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isPinned !== undefined && { isPinned }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      note: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        category: updated.category,
        tags: updated.tags as string[],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        isPinned: updated.isPinned,
      }
    })
  } catch {
    // Update demo storage
    const notes = demoNotes.get(projectId) || []
    const index = notes.findIndex(n => n.id === id)
    
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isPinned !== undefined && { isPinned }),
        updatedAt: new Date().toISOString(),
      }
      demoNotes.set(projectId, notes)
      return NextResponse.json({ note: notes[index], isDemoMode: true })
    }

    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID

  if (!id) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
  }

  try {
    await prisma.$connect()
    
    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch {
    // Delete from demo storage
    const notes = demoNotes.get(projectId) || []
    const filtered = notes.filter(n => n.id !== id)
    demoNotes.set(projectId, filtered)
    
    return NextResponse.json({ success: true, isDemoMode: true })
  } finally {
    await prisma.$disconnect()
  }
}
