import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo data for when database is not connected
const DEMO_CREW = [
  { id: 'crew-1', name: 'Rajesh Kumar', role: 'Director', department: 'Direction', dailyRate: 150000 },
  { id: 'crew-2', name: 'Priya Venkatesh', role: 'Cinematographer', department: 'Camera', dailyRate: 100000 },
  { id: 'crew-3', name: 'Arvind Swamy', role: 'Producer', department: 'Production', dailyRate: 200000 },
  { id: 'crew-4', name: 'Soundar', role: 'Sound Engineer', department: 'Sound', dailyRate: 25000 },
  { id: 'crew-5', name: 'Kumar', role: 'Gaffer', department: 'Lighting', dailyRate: 20000 },
  { id: 'crew-6', name: 'Ravi', role: 'Art Director', department: 'Art', dailyRate: 40000 },
  { id: 'crew-7', name: 'Vijay', role: 'Production Manager', department: 'Production', dailyRate: 35000 },
  { id: 'crew-8', name: 'Anand', role: 'Focus Puller', department: 'Camera', dailyRate: 15000 },
  { id: 'crew-9', name: 'Suresh', role: 'Makeup Artist', department: 'Makeup', dailyRate: 18000 },
  { id: 'crew-10', name: 'Lakshmi', role: 'Costume Designer', department: 'Costume', dailyRate: 25000 },
]

const DEMO_SHOOTING_DAYS = [
  { id: 'sd-1', dayNumber: 1, scheduledDate: '2026-03-01', callTime: '06:00', locationName: 'Chennai Beach', locationAddress: 'Marina Beach, Chennai' },
  { id: 'sd-2', dayNumber: 2, scheduledDate: '2026-03-02', callTime: '05:30', locationName: 'Sea Shell Restaurant', locationAddress: 'Besant Nagar, Chennai' },
  { id: 'sd-3', dayNumber: 3, scheduledDate: '2026-03-03', callTime: '07:00', locationName: 'Arjun\'s Apartment', locationAddress: 'Adyar, Chennai' },
  { id: 'sd-4', dayNumber: 4, scheduledDate: '2026-03-04', callTime: '04:00', locationName: 'Kapaleeshwarar Temple', locationAddress: 'Mylapore, Chennai' },
  { id: 'sd-5', dayNumber: 5, scheduledDate: '2026-03-05', callTime: '06:00', locationName: 'General Hospital', locationAddress: 'T Nagar, Chennai' },
]

const DEMO_CALL_SHEETS = [
  {
    id: 'cs-1',
    projectId: DEFAULT_PROJECT_ID,
    shootingDayId: 'sd-1',
    title: 'Day 1 - Chennai Beach',
    date: '2026-03-01',
    content: {
      callTime: '06:00',
      wrapTime: '19:00',
      location: 'Marina Beach, Chennai',
      locationAddress: 'Marina Beach, Chennai - 600004',
      scenes: ['1', '2', '3'],
      weather: '☀️ Sunny, 28°C',
      weatherIcon: 'sunny',
      temperature: 28,
      humidity: 65,
      crewCalls: [
        { name: 'Rajesh Kumar', role: 'Director', department: 'Direction', callTime: '05:00' },
        { name: 'Priya Venkatesh', role: 'Cinematographer', department: 'Camera', callTime: '05:00' },
        { name: 'Soundar', role: 'Sound Engineer', department: 'Sound', callTime: '05:30' },
        { name: 'Kumar', role: 'Gaffer', department: 'Lighting', callTime: '05:00' },
        { name: 'Ajith Kumar', role: 'Lead Actor', department: 'Cast', callTime: '06:00' },
        { name: 'Sai Pallavi', role: 'Lead Actress', department: 'Cast', callTime: '06:00' },
      ],
    },
    notes: '🅿️ Parking available atteri side. Tide schedule: Low at 8:30 AM, High at 2:30 PM. Pack up equipment before tide comes in.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cs-2',
    projectId: DEFAULT_PROJECT_ID,
    shootingDayId: 'sd-2',
    title: 'Day 2 - Restaurant',
    date: '2026-03-02',
    content: {
      callTime: '05:30',
      wrapTime: '23:00',
      location: 'Sea Shell Restaurant',
      locationAddress: 'No. 1/2, 3rd Avenue, Besant Nagar, Chennai',
      scenes: ['4', '5', '6'],
      weather: '🌙 Night Shoot',
      weatherIcon: 'night',
      crewCalls: [
        { name: 'Rajesh Kumar', role: 'Director', department: 'Direction', callTime: '04:30' },
        { name: 'Priya Venkatesh', role: 'Cinematographer', department: 'Camera', callTime: '04:30' },
        { name: 'Soundar', role: 'Sound Engineer', department: 'Sound', callTime: '05:00' },
        { name: 'Yogi Babu', role: 'Comedian', department: 'Cast', callTime: '06:00' },
      ],
    },
    notes: 'Night shoot. Restaurant closes at 11 PM. Generator backup arranged. Security guard on site.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cs-3',
    projectId: DEFAULT_PROJECT_ID,
    shootingDayId: 'sd-3',
    title: 'Day 3 - Apartment',
    date: '2026-03-03',
    content: {
      callTime: '07:00',
      wrapTime: '20:00',
      location: 'Arjun\'s Apartment',
      locationAddress: 'Floor 5, Green Heights, Adyar, Chennai',
      scenes: ['7', '8'],
      weather: '☀️ Indoor',
      weatherIcon: 'indoor',
      crewCalls: [
        { name: 'Rajesh Kumar', role: 'Director', department: 'Direction', callTime: '06:00' },
        { name: 'Ajith Kumar', role: 'Lead Actor', department: 'Cast', callTime: '07:00' },
      ],
    },
    notes: 'Residential area - maintain noise levels. Lift timing: 6 AM - 10 PM. Equipment to be carried via service elevator.',
    createdAt: new Date().toISOString(),
  },
]

// In-memory store for demo mode
let demoCallSheetsStore: Array<{
  id: string
  projectId: string
  shootingDayId: string | null
  title: string
  date: string
  content: CallSheetContent | null
  notes: string
  createdAt: string
}> = [...DEMO_CALL_SHEETS]
let demoCrewStore = [...DEMO_CREW]
let demoShootingDaysStore = [...DEMO_SHOOTING_DAYS]

type CallSheetContent = {
  callTime?: string
  wrapTime?: string
  location?: string
  locationAddress?: string
  scenes?: string[]
  weather?: string
  weatherIcon?: string
  temperature?: number
  humidity?: number
  crewCalls?: Array<{
    name: string
    role: string
    department?: string
    callTime?: string
  }>
}

async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

async function ensureDefaultProject(): Promise<string> {
  try {
    let user = await prisma.user.findFirst({ where: { id: 'default-user' } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'default-user',
          email: 'dev@cinepilot.ai',
          passwordHash: 'none',
          name: 'Dev User',
        },
      })
    }
    let project = await prisma.project.findFirst({ where: { userId: user.id } })
    if (!project) {
      project = await prisma.project.create({
        data: { name: 'Default Project', userId: user.id },
      })
    }
    return project.id
  } catch {
    return DEFAULT_PROJECT_ID
  }
}

// GET /api/call-sheets - Get all call sheets
export async function GET(req: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  if (!dbConnected) {
    // Return demo data
    return NextResponse.json({
      callSheets: demoCallSheetsStore,
      crew: demoCrewStore,
      shootingDays: demoShootingDaysStore,
      isDemoMode: true,
    })
  }

  try {
    const projectId = await ensureDefaultProject()
    
    // Get call sheets
    const callSheets = await prisma.callSheet.findMany({
      where: { projectId },
      include: { shootingDay: true },
      orderBy: { date: 'desc' },
    })
    
    // Get crew
    const crew = await prisma.crew.findMany({
      where: { projectId },
      orderBy: { role: 'asc' },
    })
    
    // Get shooting days
    const shootingDays = await prisma.shootingDay.findMany({
      where: { projectId },
      orderBy: { dayNumber: 'asc' },
    })
    
    return NextResponse.json({
      callSheets: callSheets.map(cs => ({
        ...cs,
        date: cs.date.toISOString().split('T')[0],
        createdAt: cs.createdAt.toISOString(),
      })),
      crew: crew.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        department: c.department,
        dailyRate: c.dailyRate ? Number(c.dailyRate) : 0,
      })),
      shootingDays: shootingDays.map(sd => ({
        id: sd.id,
        dayNumber: sd.dayNumber,
        scheduledDate: sd.scheduledDate?.toISOString().split('T')[0],
        callTime: sd.callTime,
      })),
      isDemoMode: false,
    })
  } catch (error) {
    console.error('[GET /api/call-sheets]', error)
    // Return demo data on error
    return NextResponse.json({
      callSheets: demoCallSheetsStore,
      crew: demoCrewStore,
      shootingDays: demoShootingDaysStore,
      isDemoMode: true,
    })
  }
}

// POST /api/call-sheets - Create or generate call sheet
export async function POST(req: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  try {
    const body = await req.json()
    const { action, shootingDayId, date, title, content, notes } = body
    
    // Demo mode
    if (!dbConnected) {
      if (action === 'generate' && shootingDayId) {
        const shootingDay = demoShootingDaysStore.find(sd => sd.id === shootingDayId)
        if (!shootingDay) {
          return NextResponse.json({ error: 'Shooting day not found' }, { status: 404 })
        }
        
        const newCallSheet = {
          id: `cs-${Date.now()}`,
          projectId: DEFAULT_PROJECT_ID,
          shootingDayId,
          title: title || `Day ${shootingDay.dayNumber} - ${shootingDay.locationName}`,
          date: shootingDay.scheduledDate || date || new Date().toISOString().split('T')[0],
          content: {
            callTime: shootingDay.callTime || '06:00',
            wrapTime: '19:00',
            location: shootingDay.locationName,
            locationAddress: shootingDay.locationAddress,
            scenes: [],
            weather: '☀️ Sunny',
            crewCalls: demoCrewStore.slice(0, 4).map(c => ({
              name: c.name,
              role: c.role,
              department: c.department,
              callTime: shootingDay.callTime || '06:00',
            })),
          } as CallSheetContent,
          notes: notes || '',
          createdAt: new Date().toISOString(),
        }
        
        demoCallSheetsStore.unshift(newCallSheet)
        return NextResponse.json({ ...newCallSheet, isDemoMode: true })
      }
      
      // Create new empty call sheet
      const newCallSheet = {
        id: `cs-${Date.now()}`,
        projectId: DEFAULT_PROJECT_ID,
        shootingDayId: shootingDayId || null,
        title: title || 'New Call Sheet',
        date: date || new Date().toISOString().split('T')[0],
        content: content || {},
        notes: notes || '',
        createdAt: new Date().toISOString(),
      }
      
      demoCallSheetsStore.unshift(newCallSheet)
      return NextResponse.json({ ...newCallSheet, isDemoMode: true })
    }
    
    // Database mode
    const projectId = await ensureDefaultProject()
    
    if (action === 'generate' && shootingDayId) {
      const shootingDay = await prisma.shootingDay.findFirst({
        where: { id: shootingDayId, projectId },
        include: {
          dayScenes: {
            include: {
              scene: {
                select: {
                  sceneNumber: true,
                  location: true,
                  headingRaw: true,
                  intExt: true,
                  timeOfDay: true,
                },
              },
            },
            orderBy: { orderNumber: 'asc' },
          },
          location: true,
        },
      })

      if (!shootingDay) {
        return NextResponse.json({ error: 'Shooting day not found' }, { status: 404 })
      }

      const crew = await prisma.crew.findMany({
        where: { projectId },
        orderBy: { role: 'asc' },
      })

      const scenes = shootingDay.dayScenes.map((ds) => String(ds.scene.sceneNumber ?? ''))
      const crewCalls = crew.map((c) => ({
        name: c.name,
        role: c.role,
        department: c.department ?? undefined,
        callTime: shootingDay.callTime ?? '06:00',
      }))

      const contentJson: CallSheetContent = {
        callTime: shootingDay.callTime ?? '06:00',
        wrapTime: undefined,
        location: shootingDay.location?.name ?? 'TBD',
        locationAddress: shootingDay.location?.address ?? undefined,
        scenes,
        crewCalls,
        weather: undefined,
      }

      const sheetDate = shootingDay.scheduledDate
        ? new Date(shootingDay.scheduledDate)
        : new Date()

      const callSheet = await prisma.callSheet.create({
        data: {
          projectId,
          shootingDayId: shootingDay.id,
          title: title ?? `Day ${shootingDay.dayNumber} Call Sheet`,
          date: sheetDate,
          content: contentJson as object,
          notes: shootingDay.notes ?? undefined,
        },
        include: { shootingDay: true },
      })

      return NextResponse.json({
        ...callSheet,
        date: callSheet.date.toISOString().split('T')[0],
        createdAt: callSheet.createdAt.toISOString(),
      })
    }

    const dateVal = date ?? new Date().toISOString().split('T')[0]
    const parsedDate = typeof dateVal === 'string' ? new Date(dateVal) : new Date(dateVal)

    const callSheet = await prisma.callSheet.create({
      data: {
        projectId,
        shootingDayId: shootingDayId ?? undefined,
        title: typeof title === 'string' ? title : undefined,
        date: parsedDate,
        content: content != null ? (typeof content === 'object' ? content : {}) : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
      },
      include: { shootingDay: true },
    })

    return NextResponse.json({
      ...callSheet,
      date: callSheet.date.toISOString().split('T')[0],
      createdAt: callSheet.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[POST /api/call-sheets]', error)
    return NextResponse.json({ error: 'Failed to create call sheet' }, { status: 500 })
  }
}

// PATCH /api/call-sheets - Update call sheet
export async function PATCH(req: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  try {
    const body = await req.json()
    const { id, title, date, content, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Demo mode
    if (!dbConnected) {
      const idx = demoCallSheetsStore.findIndex(cs => cs.id === id)
      if (idx === -1) {
        return NextResponse.json({ error: 'Call sheet not found' }, { status: 404 })
      }
      
      const updated = {
        ...demoCallSheetsStore[idx],
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date }),
        ...(content !== undefined && { content }),
        ...(notes !== undefined && { notes }),
      }
      
      demoCallSheetsStore[idx] = updated
      return NextResponse.json({ ...updated, isDemoMode: true })
    }
    
    // Database mode
    const updateData: Record<string, unknown> = {}
    if (title) updateData.title = title
    if (date) updateData.date = new Date(date)
    if (content) updateData.content = content
    if (notes !== undefined) updateData.notes = notes

    const callSheet = await prisma.callSheet.update({
      where: { id },
      data: updateData,
      include: { shootingDay: true },
    })

    return NextResponse.json({
      ...callSheet,
      date: callSheet.date.toISOString().split('T')[0],
      createdAt: callSheet.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[PATCH /api/call-sheets]', error)
    return NextResponse.json({ error: 'Failed to update call sheet' }, { status: 500 })
  }
}

// DELETE /api/call-sheets - Delete call sheet
export async function DELETE(req: NextRequest) {
  const dbConnected = await checkDbConnection()
  
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Demo mode
    if (!dbConnected) {
      const idx = demoCallSheetsStore.findIndex(cs => cs.id === id)
      if (idx === -1) {
        return NextResponse.json({ error: 'Call sheet not found' }, { status: 404 })
      }
      demoCallSheetsStore.splice(idx, 1)
      return NextResponse.json({ success: true, isDemoMode: true })
    }
    
    // Database mode
    await prisma.callSheet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/call-sheets]', error)
    return NextResponse.json({ error: 'Failed to delete call sheet' }, { status: 500 })
  }
}
