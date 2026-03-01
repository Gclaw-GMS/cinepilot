import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// In-memory storage for demo mode
interface TimelineEvent {
  id: string
  title: string
  description: string
  type: 'shoot' | 'pre-production' | 'post-production' | 'milestone' | 'review'
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  startDate: string
  endDate: string
  projectId: string
  location?: string
  scenes?: number
  budget?: number
  notes?: string
}

const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    title: 'Script Finalization',
    description: 'Finalize script with director inputs',
    type: 'pre-production',
    status: 'completed',
    startDate: '2026-01-01',
    endDate: '2026-01-15',
    projectId: DEFAULT_PROJECT_ID,
    notes: 'Script locked for production'
  },
  {
    id: '2',
    title: 'Casting Complete',
    description: 'Finalize all lead and supporting cast',
    type: 'pre-production',
    status: 'completed',
    startDate: '2026-01-10',
    endDate: '2026-01-25',
    projectId: DEFAULT_PROJECT_ID,
    notes: 'All major roles confirmed'
  },
  {
    id: '3',
    title: 'Location Scout',
    description: 'Scout and finalize all shooting locations',
    type: 'pre-production',
    status: 'completed',
    startDate: '2026-01-15',
    endDate: '2026-02-01',
    projectId: DEFAULT_PROJECT_ID,
    location: 'Chennai, Ooty, Madurai',
    scenes: 45
  },
  {
    id: '4',
    title: 'Pre-Production Shoot',
    description: 'BTS, promos, and promotional material',
    type: 'pre-production',
    status: 'in-progress',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    projectId: DEFAULT_PROJECT_ID,
    budget: 5000000
  },
  {
    id: '5',
    title: 'Day 1-5: Chennai Schedule',
    description: 'Temple and beach sequences',
    type: 'shoot',
    status: 'in-progress',
    startDate: '2026-03-15',
    endDate: '2026-03-19',
    projectId: DEFAULT_PROJECT_ID,
    location: 'Chennai',
    scenes: 21,
    budget: 15000000
  },
  {
    id: '6',
    title: 'Day 6-10: Ooty Schedule',
    description: 'Hill station songs and romantic sequences',
    type: 'shoot',
    status: 'pending',
    startDate: '2026-03-20',
    endDate: '2026-03-25',
    projectId: DEFAULT_PROJECT_ID,
    location: 'Ooty',
    scenes: 18,
    budget: 12000000
  },
  {
    id: '7',
    title: 'Day 11-15: Madurai Schedule',
    description: 'Festival sequences and climax',
    type: 'shoot',
    status: 'pending',
    startDate: '2026-03-26',
    endDate: '2026-03-31',
    projectId: DEFAULT_PROJECT_ID,
    location: 'Madurai',
    scenes: 25,
    budget: 18000000
  },
  {
    id: '8',
    title: 'Principal Photography Wrap',
    description: 'Complete all principal photography',
    type: 'milestone',
    status: 'pending',
    startDate: '2026-03-31',
    endDate: '2026-03-31',
    projectId: DEFAULT_PROJECT_ID,
    notes: 'Target wrap date'
  },
  {
    id: '9',
    title: 'Post-Production Start',
    description: 'Begin editing, VFX, and sound work',
    type: 'post-production',
    status: 'pending',
    startDate: '2026-04-01',
    endDate: '2026-04-15',
    projectId: DEFAULT_PROJECT_ID,
    budget: 25000000
  },
  {
    id: '10',
    title: 'VFX Completion',
    description: 'Complete all VFX shots',
    type: 'post-production',
    status: 'pending',
    startDate: '2026-04-15',
    endDate: '2026-05-15',
    projectId: DEFAULT_PROJECT_ID,
    budget: 15000000,
    scenes: 90
  },
  {
    id: '11',
    title: 'DI and Color Grading',
    description: 'Digital Intermediate and color grading',
    type: 'post-production',
    status: 'pending',
    startDate: '2026-05-10',
    endDate: '2026-05-25',
    projectId: DEFAULT_PROJECT_ID,
    budget: 5000000
  },
  {
    id: '12',
    title: 'Music and Dubbing',
    description: 'Background score and dubbing',
    type: 'post-production',
    status: 'pending',
    startDate: '2026-04-20',
    endDate: '2026-05-30',
    projectId: DEFAULT_PROJECT_ID,
    budget: 8000000
  },
  {
    id: '13',
    title: 'Censor Application',
    description: 'Apply for CBFC certification',
    type: 'review',
    status: 'pending',
    startDate: '2026-05-26',
    endDate: '2026-05-30',
    projectId: DEFAULT_PROJECT_ID
  },
  {
    id: '14',
    title: 'Release Preview',
    description: 'Screening for producers and distributors',
    type: 'review',
    status: 'pending',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    projectId: DEFAULT_PROJECT_ID,
    budget: 2000000
  },
  {
    id: '15',
    title: 'Theatrical Release',
    description: 'Worldwide theatrical release',
    type: 'milestone',
    status: 'pending',
    startDate: '2026-06-15',
    endDate: '2026-06-15',
    projectId: DEFAULT_PROJECT_ID,
    notes: 'Target release date'
  }
]

// Demo events storage
const demoEvents: Map<string, TimelineEvent[]> = new Map()
demoEvents.set(DEFAULT_PROJECT_ID, [...DEMO_TIMELINE_EVENTS])

// GET /api/timeline - Get timeline events
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  try {
    await prisma.$connect()
    
    const where: Record<string, unknown> = { projectId }
    if (type && type !== 'all') where.type = type
    if (status && status !== 'all') where.status = status

    const events = await prisma.timelineEvent?.findMany({
      where,
      orderBy: { startDate: 'asc' },
    })

    if (events) {
      const formatted = events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        type: e.type,
        status: e.status,
        startDate: e.startDate.toISOString().split('T')[0],
        endDate: e.endDate.toISOString().split('T')[0],
        projectId: e.projectId,
        location: e.location || undefined,
        scenes: e.scenes || undefined,
        budget: e.budget ? Number(e.budget) : undefined,
        notes: e.notes || undefined,
      }))
      return NextResponse.json({ events: formatted })
    }
  } catch {
    // Fall back to demo data
  } finally {
    await prisma.$disconnect()
  }

  // Return demo data
  let events = demoEvents.get(projectId) || DEMO_TIMELINE_EVENTS
  
  if (type && type !== 'all') {
    events = events.filter(e => e.type === type)
  }
  if (status && status !== 'all') {
    events = events.filter(e => e.status === status)
  }

  return NextResponse.json({ events, isDemoMode: true })
}

// POST /api/timeline - Create timeline event
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { 
    title, description, type, status, startDate, endDate, 
    projectId = DEFAULT_PROJECT_ID, location, scenes, budget, notes 
  } = body

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ 
      error: 'Title, startDate, and endDate are required' 
    }, { status: 400 })
  }

  const newEvent: TimelineEvent = {
    id: `event-${Date.now()}`,
    title,
    description: description || '',
    type: type || 'milestone',
    status: status || 'pending',
    startDate,
    endDate,
    projectId,
    location,
    scenes,
    budget,
    notes,
  }

  try {
    await prisma.$connect()
    
    const created = await prisma.timelineEvent.create({
      data: {
        title,
        description: description || '',
        type: type || 'milestone',
        status: status || 'pending',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId,
        location,
        scenes: scenes || 0,
        budget: budget || 0,
        notes,
      },
    })

    return NextResponse.json({
      event: {
        id: created.id,
        title: created.title,
        description: created.description || '',
        type: created.type,
        status: created.status,
        startDate: created.startDate.toISOString().split('T')[0],
        endDate: created.endDate.toISOString().split('T')[0],
        projectId: created.projectId,
        location: created.location || undefined,
        scenes: created.scenes || undefined,
        budget: created.budget ? Number(created.budget) : undefined,
        notes: created.notes || undefined,
      }
    })
  } catch {
    // Save to demo storage
    const events = demoEvents.get(projectId) || []
    events.push(newEvent)
    demoEvents.set(projectId, events)
    return NextResponse.json({ event: newEvent, isDemoMode: true })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/timeline - Update timeline event
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { 
    id, title, description, type, status, startDate, endDate, 
    projectId = DEFAULT_PROJECT_ID, location, scenes, budget, notes 
  } = body

  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
  }

  try {
    await prisma.$connect()
    
    const updated = await prisma.timelineEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location }),
        ...(scenes !== undefined && { scenes }),
        ...(budget !== undefined && { budget }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json({
      event: {
        id: updated.id,
        title: updated.title,
        description: updated.description || '',
        type: updated.type,
        status: updated.status,
        startDate: updated.startDate.toISOString().split('T')[0],
        endDate: updated.endDate.toISOString().split('T')[0],
        projectId: updated.projectId,
        location: updated.location || undefined,
        scenes: updated.scenes || undefined,
        budget: updated.budget ? Number(updated.budget) : undefined,
        notes: updated.notes || undefined,
      }
    })
  } catch {
    // Update demo storage
    const events = demoEvents.get(projectId) || []
    const index = events.findIndex(e => e.id === id)
    
    if (index !== -1) {
      events[index] = {
        ...events[index],
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(location !== undefined && { location }),
        ...(scenes !== undefined && { scenes }),
        ...(budget !== undefined && { budget }),
        ...(notes !== undefined && { notes }),
      }
      demoEvents.set(projectId, events)
      return NextResponse.json({ event: events[index], isDemoMode: true })
    }

    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/timeline - Delete timeline event
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const projectId = searchParams.get('projectId') || DEFAULT_PROJECT_ID

  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
  }

  try {
    await prisma.$connect()
    await prisma.timelineEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    // Delete from demo storage
    const events = demoEvents.get(projectId) || []
    const filtered = events.filter(e => e.id !== id)
    demoEvents.set(projectId, filtered)
    return NextResponse.json({ success: true, isDemoMode: true })
  } finally {
    await prisma.$disconnect()
  }
}
