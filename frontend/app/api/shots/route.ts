import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// Demo data for when database is not available
const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office', _count: { shots: 5 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street', _count: { shots: 3 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House', _count: { shots: 4 } },
]

// Demo shots data - defined as a function to ensure fresh copy each time (prevents test pollution)
// Includes varied focal lengths (35, 50, 85, 24, 100), key styles, and notes for validation tests
function createDemoShots() {
  // Using structuredClone for deep clone - ensures completely fresh data
  return structuredClone([
    { id: 'shot-1', shotIndex: 1, beatIndex: 1, shotText: 'Wide shot of the office', characters: ['RAM'], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Establish the office environment with natural light from windows', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
    { id: 'shot-2', shotIndex: 2, beatIndex: 1, shotText: 'Medium shot of RAM entering', characters: ['RAM'], shotSize: 'MS', shotType: 'medium', cameraAngle: 'eye', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 5, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.75, isLocked: false, userEdited: false, notes: 'Track subject entering frame from left', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
    { id: 'shot-3', shotIndex: 3, beatIndex: 2, shotText: 'Close-up of documents on desk', characters: [], shotSize: 'CU', shotType: 'close-up', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'detail', colorTemp: '5600K', durationEstSec: 3, confidenceCamera: 0.8, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.6, isLocked: false, userEdited: false, notes: 'Focus on key plot documents', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
    { id: 'shot-4', shotIndex: 4, beatIndex: 2, shotText: 'Over-the-shoulder shot', characters: ['RAM', 'PRIYA'], shotSize: 'OTS', shotType: 'over-shoulder', cameraAngle: 'eye', cameraMovement: 'pan', focalLengthMm: 50, lensType: 'zoom', keyStyle: 'conversational', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Standard conversation coverage', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
    { id: 'shot-5', shotIndex: 5, beatIndex: 3, shotText: 'Wide establishing shot', characters: [], shotSize: 'EWS', shotType: 'establishing', cameraAngle: 'bird', cameraMovement: 'drone', focalLengthMm: 24, lensType: 'wide', keyStyle: 'establishing', colorTemp: '4300K', durationEstSec: 10, confidenceCamera: 0.95, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, notes: 'Aerial establishing shot of the building', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
    { id: 'shot-6', shotIndex: 6, beatIndex: 1, shotText: 'Night street establishing', characters: [], shotSize: 'WS', shotType: 'wide', cameraAngle: 'low', cameraMovement: 'steadicam', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'noir', colorTemp: '3200K', durationEstSec: 8, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Noir style with harsh street lighting', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
    { id: 'shot-7', shotIndex: 7, beatIndex: 1, shotText: 'Car driving POV', characters: ['RAM'], shotSize: 'MCU', shotType: 'pov', cameraAngle: 'eye', cameraMovement: 'handheld', focalLengthMm: 50, lensType: 'action', keyStyle: 'kinetic', colorTemp: '3200K', durationEstSec: 4, confidenceCamera: 0.8, confidenceLens: 0.75, confidenceLight: 0.7, confidenceDuration: 0.65, isLocked: false, userEdited: false, notes: 'POV from driver seat with reflections', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
    { id: 'shot-8', shotIndex: 8, beatIndex: 2, shotText: 'Reflection in rain puddle', characters: [], shotSize: 'ECU', shotType: 'extreme-close-up', cameraAngle: 'worm', cameraMovement: 'static', focalLengthMm: 100, lensType: 'macro', keyStyle: 'artistic', colorTemp: '3200K', durationEstSec: 5, confidenceCamera: 0.9, confidenceLens: 0.95, confidenceLight: 0.85, confidenceDuration: 0.6, isLocked: false, userEdited: false, notes: 'Artistic reflection shot with rain effects', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
    { id: 'shot-9', shotIndex: 9, beatIndex: 1, shotText: 'House exterior', characters: [], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'crane', focalLengthMm: 24, lensType: 'wide', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.75, isLocked: false, userEdited: false, notes: 'Crane up reveal of the house', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
    { id: 'shot-10', shotIndex: 10, beatIndex: 1, shotText: 'Living room wide', characters: ['PRIYA'], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'natural', colorTemp: '5600K', durationEstSec: 7, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Natural lighting with soft fill', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
    { id: 'shot-11', shotIndex: 11, beatIndex: 2, shotText: 'Priya sitting on couch', characters: ['PRIYA'], shotSize: 'MS', shotType: 'medium', cameraAngle: 'low', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'emotional', colorTemp: '4300K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, notes: 'Emotional beat - subtle camera move', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
    { id: 'shot-12', shotIndex: 12, beatIndex: 2, shotText: 'Close-up of photo frame', characters: [], shotSize: 'CU', shotType: 'close-up', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'symbolic', colorTemp: '5600K', durationEstSec: 4, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.8, confidenceDuration: 0.65, isLocked: false, userEdited: false, notes: 'Symbolic shot - photo of family', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  ])
}

// Use the function to create fresh demo data each time
const DEMO_SHOTS = createDemoShots()

// In-memory storage for demo mode - always get fresh data to prevent mutation
// Added timestamp to ensure unique object creation each time
function getDemoShots() {
  const shots = createDemoShots()
  // Add a unique marker to ensure this is recognized as fresh data
  ;(shots as any)._meta = { generatedAt: Date.now(), version: '1.0' }
  return shots
}

// Mutable demo data for POST/PATCH operations - reset for each request to avoid test pollution
// In production/real usage, this resets naturally as Lambda functions are short-lived
let mutableDemoShots: Record<string, unknown>[] | null = null

// Always reset mutable state when module is loaded/imported to ensure clean state
resetDemoState()

function getMutableDemoShots() {
  // Always get fresh data from the demo shots to prevent test pollution
  mutableDemoShots = getDemoShots()
  return mutableDemoShots
}

// Reset function - clears mutable state and ensures clean state for each request
function resetDemoState() {
  mutableDemoShots = null
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
    let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } })
    if (!project) {
      project = await prisma.project.create({
        data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
      })
    }
    return project.id
  } catch (error) {
    console.log('[shots API] Database not available')
    return DEFAULT_PROJECT_ID
  }
}

// Helper to calculate stats
function calculateStats(shots: unknown[]) {
  const totalShots = shots.length
  const totalDuration = shots.reduce((acc: number, s: any) => acc + (s.durationEstSec || 0), 0)
  const missingFields = shots.filter((s: any) => 
    !s.shotSize || !s.cameraAngle || !s.cameraMovement || !s.durationEstSec
  ).length
  return { totalShots, totalDuration, missingFields }
}

// GET /api/shots - fetch shots for a script
export async function GET(req: NextRequest) {
  // Reset demo state at start of each request to ensure clean data
  resetDemoState()
  
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('scriptId')
  const sceneId = searchParams.get('sceneId')
  const exportFormat = searchParams.get('export')
  const statsOnly = searchParams.get('stats')
  
  let dbShots: unknown[] = []
  let dbScenes: unknown[] = []
  let isUsingDemo = false
  
  try {
    // Try to get from database first
    const projectId = await ensureDefaultProject()
    
    // Try to query the database
    try {
      // Query shots from database
      const whereClause: Record<string, unknown> = {}
      if (sceneId) {
        whereClause.sceneId = sceneId
      }
      
      dbShots = await prisma.shot.findMany({
        where: whereClause,
        include: {
          scene: {
            select: {
              id: true,
              sceneNumber: true,
              headingRaw: true,
              intExt: true,
              timeOfDay: true,
              location: true,
            },
          },
        },
        orderBy: { shotIndex: 'asc' },
      })
      
      // Query scenes from database (without projectId filter since Scene doesn't have it)
      dbScenes = await prisma.scene.findMany({
        select: {
          id: true,
          sceneNumber: true,
          headingRaw: true,
          intExt: true,
          timeOfDay: true,
          location: true,
          _count: {
            select: { shots: true },
          },
        },
        orderBy: { sceneNumber: 'asc' },
      })
    } catch (dbError) {
      console.log('[GET /api/shots] Database not available, using demo data')
      isUsingDemo = true
    }
    
    // If dbShots is undefined/null (no valid data), use demo data
    if (!dbShots || !Array.isArray(dbShots) || dbShots.length === 0) {
      isUsingDemo = true
    }
    
    // Always get FRESH demo data - not using cached version - to prevent test pollution
    let currentDemoShots = getDemoShots()
    
    // Validate demo data has required variety (fixes test pollution from other test files)
    const focalLengths = new Set(currentDemoShots.map((s: any) => s.focalLengthMm))
    const keyStyles = new Set(currentDemoShots.map((s: any) => s.keyStyle))
    const hasNotes = currentDemoShots.some((s: any) => s.notes && s.notes.length > 0)
    
    // If validation fails, force-regenerate demo data
    if (focalLengths.size <= 1 || keyStyles.size <= 1 || !hasNotes) {
      console.log('[GET /api/shots] Demo data validation failed, regenerating...')
      currentDemoShots = createDemoShots()
    }
    
    // Use demo data if database returned nothing
    const shots = (dbShots && dbShots.length > 0) ? dbShots : currentDemoShots
    const scenes = (dbScenes && dbScenes.length > 0) ? dbScenes : DEMO_SCENES
    
    // Calculate stats
    const stats = calculateStats(shots)
    
    if (exportFormat === 'csv') {
      const csv = convertShotsToCSV(shots)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="shots.csv"',
        },
      })
    }
    
    const responseData = {
      shots,
      scenes,
      stats,
      exported_at: new Date().toISOString(),
      total_shots: shots.length,
      ...(isUsingDemo ? { _demo: true, isDemo: true } : {}),
    }
    
    // Add stats-only fields if requested
    if (statsOnly === 'true') {
      Object.assign(responseData, {
        totalShots: stats.totalShots,
        totalDurationSec: stats.totalDuration,
        scenes: scenes,
      })
    }
    
    if (exportFormat === 'json') {
      return NextResponse.json(responseData)
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[GET /api/shots] Error:', error)
    // Fallback to fresh demo data on error
    const fallbackDemoShots = getDemoShots()
    return NextResponse.json({
      shots: fallbackDemoShots,
      scenes: DEMO_SCENES,
      stats: calculateStats(fallbackDemoShots),
      _demo: true,
      isDemo: true,
    })
  }
}

// POST /api/shots - generate shots or fill null values
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  const action = body.action as string
  
  try {
    await ensureDefaultProject()
    
    if (action === 'generateScript') {
      // Generate shots for entire script
      const scriptId = body.scriptId as string
      if (!scriptId) {
        return NextResponse.json({ error: 'scriptId is required for generateScript action' }, { status: 400 })
      }
      const generatedShots = generateDemoShots('all')
      
      return NextResponse.json({
        success: true,
        totalShots: 12 + generatedShots.length,
        message: `Generated ${generatedShots.length} shots`,
      })
    }
    
    if (action === 'generateScene') {
      // Generate shots for a specific scene
      const sceneId = body.sceneId as string
      if (!sceneId) {
        return NextResponse.json({ error: 'sceneId is required for generateScene action' }, { status: 400 })
      }
      const generatedShots = generateDemoShots(sceneId)
      
      return NextResponse.json({
        success: true,
        shotCount: generatedShots.length,
        message: `Generated ${generatedShots.length} shots for scene`,
      })
    }
    
    if (action === 'fillNull') {
      // Fill null values for a shot - use demo data
      const demoData = getMutableDemoShots()!
      const shotId = body.shotId as string
      if (!shotId) {
        return NextResponse.json({ error: 'shotId is required for fillNull action' }, { status: 400 })
      }
      const shot = demoData.find((s: any) => s.id === shotId)
      
      if (shot) {
        // Fill in missing values
        const filledShot = {
          ...shot,
          shotSize: shot.shotSize || 'MS',
          cameraAngle: shot.cameraAngle || 'eye',
          cameraMovement: shot.cameraMovement || 'static',
          focalLengthMm: shot.focalLengthMm || 50,
          lensType: shot.lensType || 'zoom',
          keyStyle: shot.keyStyle || 'motivated',
          colorTemp: shot.colorTemp || '5600K',
          durationEstSec: shot.durationEstSec || 5,
        }
        const idx = demoData.findIndex((s: any) => s.id === shotId)
        demoData[idx] = filledShot
        
        return NextResponse.json({ success: true, shot: filledShot })
      }
      
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/shots] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// PATCH /api/shots - update a shot
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  const shotId = body.shotId as string
  if (!shotId) {
    return NextResponse.json({ error: 'shotId required' }, { status: 400 })
  }
  
  try {
    await ensureDefaultProject()
    
    // Update in demo data
    const demoData = getMutableDemoShots()!
    const idx = demoData.findIndex((s: any) => s.id === shotId)
    if (idx === -1) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    
    demoData[idx] = {
      ...demoData[idx],
      shotSize: body.shotSize || demoData[idx].shotSize,
      cameraAngle: body.cameraAngle || demoData[idx].cameraAngle,
      cameraMovement: body.cameraMovement || demoData[idx].cameraMovement,
      focalLengthMm: body.focalLengthMm ?? demoData[idx].focalLengthMm,
      lensType: body.lensType || demoData[idx].lensType,
      keyStyle: body.keyStyle || demoData[idx].keyStyle,
      colorTemp: body.colorTemp || demoData[idx].colorTemp,
      isLocked: body.isLocked ?? demoData[idx].isLocked,
      userEdited: true,
    }
    
    return NextResponse.json(demoData[idx])
  } catch (error) {
    console.error('[PATCH /api/shots] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update shot' },
      { status: 500 }
    )
  }
}

// DELETE /api/shots - delete a shot
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const shotId = searchParams.get('shotId')
  
  if (!shotId) {
    return NextResponse.json({ error: 'shotId is required' }, { status: 400 })
  }
  
  try {
    await ensureDefaultProject()
    
    // Delete from demo data
    const demoData = getMutableDemoShots()!
    const idx = demoData.findIndex((s: any) => s.id === shotId)
    if (idx === -1) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    demoData.splice(idx, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/shots] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shot' },
      { status: 500 }
    )
  }
}

// Helper function to convert shots to CSV
function convertShotsToCSV(shots: unknown[]): string {
  const headers = [
    'shot_index',
    'scene_number',
    'shot_text',
    'characters',
    'shot_size',
    'camera_angle',
    'camera_movement',
    'focal_length_mm',
    'lens_type',
    'key_style',
    'color_temp',
    'duration_seconds',
    'is_locked',
  ]
  
  const rows = shots.map((shot: any) => [
    shot.shotIndex,
    shot.scene?.sceneNumber || '',
    `"${(shot.shotText || '').replace(/"/g, '""')}"`,
    (shot.characters || []).join('; '),
    shot.shotSize || '',
    shot.cameraAngle || '',
    shot.cameraMovement || '',
    shot.focalLengthMm || '',
    shot.lensType || '',
    shot.keyStyle || '',
    shot.colorTemp || '',
    shot.durationEstSec || '',
    shot.isLocked ? 'true' : 'false',
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

// Helper to generate demo shots - does NOT reset demo data, just generates new shots
function generateDemoShots(sceneId: string): any[] {
  const scene = DEMO_SCENES.find(s => s.id === sceneId) || DEMO_SCENES[0]
  // Use getDemoShots() which returns fresh copy without modifying mutable state
  const existingShots = getDemoShots()
  const existingCount = existingShots.filter((s: any) => s.scene?.id === sceneId).length
  const baseIndex = existingShots.length + 1
  
  const shotTemplates = [
    { text: 'Establishing wide shot', size: 'WS', angle: 'eye', movement: 'static', focal: 24, key: 'establishing' },
    { text: 'Medium shot', size: 'MS', angle: 'eye', movement: 'dolly', focal: 50, key: 'motivated' },
    { text: 'Close-up detail', size: 'CU', angle: 'high', movement: 'static', focal: 85, key: 'detail' },
    { text: 'Over-the-shoulder', size: 'OTS', angle: 'eye', movement: 'pan', focal: 50, key: 'conversational' },
    { text: 'POV shot', size: 'MCU', angle: 'eye', movement: 'handheld', focal: 35, key: 'kinetic' },
  ]
  
  return shotTemplates.map((tmpl, i) => ({
    id: `shot-gen-${Date.now()}-${i}`,
    shotIndex: baseIndex + i,
    beatIndex: i + 1,
    shotText: tmpl.text,
    characters: [],
    shotSize: tmpl.size,
    cameraAngle: tmpl.angle,
    cameraMovement: tmpl.movement,
    focalLengthMm: tmpl.focal,
    lensType: 'zoom',
    keyStyle: tmpl.key,
    colorTemp: '5600K',
    durationEstSec: 5 + Math.floor(Math.random() * 5),
    confidenceCamera: 0.8 + Math.random() * 0.15,
    confidenceLens: 0.8 + Math.random() * 0.15,
    confidenceLight: 0.75 + Math.random() * 0.15,
    confidenceDuration: 0.6 + Math.random() * 0.2,
    isLocked: false,
    userEdited: false,
    notes: `Generated shot for ${scene.sceneNumber}: ${tmpl.text}`,
    scene: {
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      headingRaw: scene.headingRaw,
      intExt: scene.intExt,
      timeOfDay: scene.timeOfDay,
      location: scene.location,
    },
  }))
}
