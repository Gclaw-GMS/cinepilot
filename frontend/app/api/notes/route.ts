import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// Demo notes data for fallback - using string IDs consistently
const DEMO_NOTES = [
  { id: 'demo-1', projectId: DEFAULT_PROJECT_ID, content: '🎬 Scene 12 temple fight needs stunt coordinator approval - high priority', category: 'todo', author: 'Director', isPinned: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'demo-2', projectId: DEFAULT_PROJECT_ID, content: 'Vijay confirmed for lead role! First schedule starts March 15th 🎬', category: 'decision', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-3', projectId: DEFAULT_PROJECT_ID, content: 'Consider adding a flashback sequence in second act - mirrors the opening scene', category: 'idea', author: 'Writer', isPinned: false, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'demo-4', projectId: DEFAULT_PROJECT_ID, content: 'Night shoot at Marina Beach needs extra security + noise permits from local authorities', category: 'feedback', author: 'Line Producer', isPinned: false, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'demo-5', projectId: DEFAULT_PROJECT_ID, content: 'Budget review meeting scheduled for Monday 2PM - bring revised costume estimates', category: 'general', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 'demo-6', projectId: DEFAULT_PROJECT_ID, content: 'Need to finalize location contracts for Chennai Temple by end of week', category: 'todo', author: 'Production Manager', isPinned: false, createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 'demo-7', projectId: DEFAULT_PROJECT_ID, content: 'VFX supervisor suggested green screen for the transformation scene - cost effective', category: 'idea', author: 'VFX Lead', isPinned: false, createdAt: new Date(Date.now() - 518400000).toISOString(), updatedAt: new Date(Date.now() - 518400000).toISOString() },
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
    return NextResponse.json({ notes: filtered, isDemoMode: true }, { status: 200 })
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

    return NextResponse.json({ notes, isDemoMode: false }, { status: 200 })
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
    return NextResponse.json({ notes: filtered, isDemoMode: true }, { status: 200 })
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
        isDemoMode: true,
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

    return NextResponse.json({ ...newNote, isDemoMode: false }, { status: 201 })
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
        isDemoMode: true,
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

    return NextResponse.json({ ...updatedNote, isDemoMode: false })
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
    return NextResponse.json({ success: true, isDemoMode: true })
  }

  try {
    await prisma.$connect()

    await prisma.note.delete({
      where: { id },
    })

    await prisma.$disconnect()

    return NextResponse.json({ success: true, isDemoMode: false })
  } catch (error) {
    console.error('[DELETE /api/notes]', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
