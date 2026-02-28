import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// Demo notes data for fallback
const DEMO_NOTES = [
  { id: 'demo-1', projectId: DEFAULT_PROJECT_ID, content: 'Remember to get location permits for Temple shoot', category: 'todo', author: 'Director', isPinned: true, createdAt: new Date().toISOString() },
  { id: 'demo-2', projectId: DEFAULT_PROJECT_ID, content: 'Vijay confirmed for lead role! 🎬', category: 'decision', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-3', projectId: DEFAULT_PROJECT_ID, content: 'Consider adding a flashback sequence in second act', category: 'idea', author: 'Writer', isPinned: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'demo-4', projectId: DEFAULT_PROJECT_ID, content: 'Night shoot at Marina Beach needs extra security', category: 'feedback', author: 'Line Producer', isPinned: false, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'demo-5', projectId: DEFAULT_PROJECT_ID, content: 'Budget meeting scheduled for Monday 2PM', category: 'general', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 345600000).toISOString() },
]

// Helper function to check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

// GET /api/notes - Get all notes for a project
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID
  const category = req.nextUrl.searchParams.get('category')

  const isDbConnected = await checkDbConnection()

  if (!isDbConnected) {
    // Return demo data if database is not connected
    let filtered = DEMO_NOTES.filter(n => n.projectId === projectId)
    if (category && category !== 'all') {
      filtered = filtered.filter(n => n.category === category)
    }
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return NextResponse.json(filtered, { status: 200 })
  }

  try {
    await prisma.$connect()

    const where: any = { projectId }
    if (category && category !== 'all') {
      where.category = category
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    await prisma.$disconnect()

    return NextResponse.json(notes, { status: 200 })
  } catch (error) {
    console.error('[GET /api/notes] Database error:', error)
    
    // Fallback to demo data on error
    let filtered = DEMO_NOTES.filter(n => n.projectId === projectId)
    if (category && category !== 'all') {
      filtered = filtered.filter(n => n.category === category)
    }
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return NextResponse.json(filtered, { status: 200 })
  }
}

// POST /api/notes - Create a new note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, category = 'general', author = 'User', projectId = DEFAULT_PROJECT_ID, isPinned = false } = body

    // Validate required fields
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const isDbConnected = await checkDbConnection()

    if (!isDbConnected) {
      // Return demo note for demo mode
      const newNote = {
        id: `demo-${Date.now()}`,
        projectId,
        content: content.trim(),
        category,
        author,
        isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(newNote, { status: 201 })
    }

    await prisma.$connect()

    const newNote = await prisma.note.create({
      data: {
        projectId,
        content: content.trim(),
        category,
        author,
        isPinned,
      },
    })

    await prisma.$disconnect()

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('[POST /api/notes]', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

// PUT /api/notes - Update a note
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, content, category, author, isPinned } = body

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const isDbConnected = await checkDbConnection()

    if (!isDbConnected) {
      // Demo mode update - just return success
      const updatedNote = {
        id,
        projectId: DEFAULT_PROJECT_ID,
        content: content || 'Demo note',
        category: category || 'general',
        author: author || 'User',
        isPinned: isPinned || false,
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(updatedNote)
    }

    await prisma.$connect()

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (author !== undefined) updateData.author = author
    if (isPinned !== undefined) updateData.isPinned = isPinned

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
    })

    await prisma.$disconnect()

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('[PUT /api/notes]', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
  }

  const isDbConnected = await checkDbConnection()

  if (!isDbConnected) {
    // Demo mode - just return success
    return NextResponse.json({ success: true })
  }

  try {
    await prisma.$connect()

    await prisma.note.delete({
      where: { id },
    })

    await prisma.$disconnect()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/notes]', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
