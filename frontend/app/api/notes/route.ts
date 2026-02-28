import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo notes data
const DEMO_NOTES = [
  { id: 1, projectId: DEFAULT_PROJECT_ID, content: 'Remember to get location permits for Temple shoot', category: 'todo', author: 'Director', isPinned: true, createdAt: new Date().toISOString() },
  { id: 2, projectId: DEFAULT_PROJECT_ID, content: 'Vijay confirmed for lead role! 🎬', category: 'decision', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, projectId: DEFAULT_PROJECT_ID, content: 'Consider adding a flashback sequence in second act', category: 'idea', author: 'Writer', isPinned: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, projectId: DEFAULT_PROJECT_ID, content: 'Night shoot at Marina Beach needs extra security', category: 'feedback', author: 'Line Producer', isPinned: false, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 5, projectId: DEFAULT_PROJECT_ID, content: 'Budget meeting scheduled for Monday 2PM', category: 'general', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 345600000).toISOString() },
];

// In-memory store for demo mode
let notesStore = [...DEMO_NOTES];

// GET /api/notes - Get all notes for a project
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const category = req.nextUrl.searchParams.get('category');

  let filtered = notesStore.filter(n => n.projectId === projectId);
  if (category && category !== 'all') {
    filtered = filtered.filter(n => n.category === category);
  }

  // Sort by pinned first, then by date
  filtered.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(filtered);
}

// POST /api/notes - Create a new note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category = 'general', author = 'User', projectId = DEFAULT_PROJECT_ID, isPinned = false } = body;

    // Validate required fields
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const newNote = {
      id: Date.now(),
      projectId,
      content: content.trim(),
      category,
      author,
      isPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notesStore.unshift(newNote);
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notes]', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// PUT /api/notes - Update a note
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, content, category, author, isPinned } = body;

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const noteIndex = notesStore.findIndex(n => n.id === id);
    if (noteIndex < 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const updatedNote = {
      ...notesStore[noteIndex],
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(author !== undefined && { author }),
      ...(isPinned !== undefined && { isPinned }),
      updatedAt: new Date().toISOString(),
    };

    notesStore[noteIndex] = updatedNote;
    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('[PUT /api/notes]', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  const noteIndex = notesStore.findIndex(n => n.id === Number(id));
  if (noteIndex < 0) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  notesStore.splice(noteIndex, 1);
  return NextResponse.json({ success: true });
}
