import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_PROJECT_ID = 'default-project'

// Demo data for when database is not available
const DEMO_SCENES = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office', _count: { shots: 5 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street', _count: { shots: 3 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House', _count: { shots: 4 } },
]

const DEMO_SHOTS: Record<string, unknown>[] = [
  { id: 'shot-1', shotIndex: 1, beatIndex: 1, shotText: 'Wide shot of the office', characters: ['RAM'], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-2', shotIndex: 2, beatIndex: 1, shotText: 'Medium shot of RAM entering', characters: ['RAM'], shotSize: 'MS', cameraAngle: 'eye', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 5, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.75, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-3', shotIndex: 3, beatIndex: 2, shotText: 'Close-up of documents on desk', characters: [], shotSize: 'CU', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'detail', colorTemp: '5600K', durationEstSec: 3, confidenceCamera: 0.8, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.6, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-4', shotIndex: 4, beatIndex: 2, shotText: 'Over-the-shoulder shot', characters: ['RAM', 'PRIYA'], shotSize: 'OTS', cameraAngle: 'eye', cameraMovement: 'pan', focalLengthMm: 50, lensType: 'zoom', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-5', shotIndex: 5, beatIndex: 3, shotText: 'Wide establishing shot', characters: [], shotSize: 'EWS', cameraAngle: 'bird', cameraMovement: 'drone', focalLengthMm: 24, lensType: 'wide', keyStyle: 'establishing', colorTemp: '4300K', durationEstSec: 10, confidenceCamera: 0.95, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-6', shotIndex: 6, beatIndex: 1, shotText: 'Night street establishing', characters: [], shotSize: 'WS', cameraAngle: 'low', cameraMovement: 'steadicam', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'noir', colorTemp: '3200K', durationEstSec: 8, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-7', shotIndex: 7, beatIndex: 1, shotText: 'Car driving POV', characters: ['RAM'], shotSize: 'MCU', cameraAngle: 'eye', cameraMovement: 'handheld', focalLengthMm: 50, lensType: 'action', keyStyle: 'kinetic', colorTemp: '3200K', durationEstSec: 4, confidenceCamera: 0.8, confidenceLens: 0.75, confidenceLight: 0.7, confidenceDuration: 0.65, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-8', shotIndex: 8, beatIndex: 2, shotText: 'Reflection in rain puddle', characters: [], shotSize: 'ECU', cameraAngle: 'worm', cameraMovement: 'static', focalLengthMm: 100, lensType: 'macro', keyStyle: 'artistic', colorTemp: '3200K', durationEstSec: 5, confidenceCamera: 0.9, confidenceLens: 0.95, confidenceLight: 0.85, confidenceDuration: 0.6, isLocked: false, userEdited: false, scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-9', shotIndex: 9, beatIndex: 1, shotText: 'House exterior', characters: [], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'crane', focalLengthMm: 24, lensType: 'wide', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.75, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-10', shotIndex: 10, beatIndex: 1, shotText: 'Living room wide', characters: ['PRIYA'], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'natural', colorTemp: '5600K', durationEstSec: 7, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-11', shotIndex: 11, beatIndex: 2, shotText: 'Priya sitting on couch', characters: ['PRIYA'], shotSize: 'MS', cameraAngle: 'low', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'emotional', colorTemp: '4300K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-12', shotIndex: 12, beatIndex: 2, shotText: 'Close-up of photo frame', characters: [], shotSize: 'CU', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'detail', colorTemp: '5600K', durationEstSec: 4, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.8, confidenceDuration: 0.65, isLocked: false, userEdited: false, scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
]

// In-memory storage for demo mode
let demoShots = [...DEMO_SHOTS]

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
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('scriptId')
  const exportFormat = searchParams.get('export')
  
  try {
    // Try to get from database first
    const projectId = await ensureDefaultProject()
    
    // Skip database query - mock mode always returns demo data
    // (Prisma schema doesn't include Shot model)
    try {
      // Attempt a simple query to check if DB is fully configured
      await prisma.$connect()
      // If we had a Shot model, we'd query it here
    } catch (dbError) {
      console.log('[GET /api/shots] Database not available, using demo data')
    }
    
    // Always return demo data for now
    const stats = calculateStats(demoShots)
    
    if (exportFormat === 'csv') {
      const csv = convertShotsToCSV(demoShots)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="shots.csv"',
        },
      })
    }
    
    if (exportFormat === 'json') {
      return NextResponse.json({
        shots: demoShots,
        scenes: DEMO_SCENES,
        stats,
      })
    }
    
    return NextResponse.json({
      shots: demoShots,
      scenes: DEMO_SCENES,
      stats,
    })
  } catch (error) {
    console.error('[GET /api/shots] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shots' },
      { status: 500 }
    )
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
      const generatedShots = generateDemoShots('all')
      demoShots = [...demoShots, ...generatedShots]
      
      return NextResponse.json({
        success: true,
        totalShots: demoShots.length,
        message: `Generated ${generatedShots.length} shots`,
      })
    }
    
    if (action === 'generateScene') {
      // Generate shots for a specific scene
      const sceneId = body.sceneId as string
      const generatedShots = generateDemoShots(sceneId)
      demoShots = [...demoShots, ...generatedShots]
      
      return NextResponse.json({
        success: true,
        shotCount: generatedShots.length,
        message: `Generated ${generatedShots.length} shots for scene`,
      })
    }
    
    if (action === 'fillNull') {
      // Fill null values for a shot
      const shotId = body.shotId as string
      const shot = demoShots.find((s: any) => s.id === shotId)
      
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
        const idx = demoShots.findIndex((s: any) => s.id === shotId)
        demoShots[idx] = filledShot
        
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
    return NextResponse.json({ error: 'shotId is required' }, { status: 400 })
  }
  
  try {
    await ensureDefaultProject()
    
    // Update in demo data
    const idx = demoShots.findIndex((s: any) => s.id === shotId)
    if (idx === -1) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    
    demoShots[idx] = {
      ...demoShots[idx],
      shotSize: body.shotSize || demoShots[idx].shotSize,
      cameraAngle: body.cameraAngle || demoShots[idx].cameraAngle,
      cameraMovement: body.cameraMovement || demoShots[idx].cameraMovement,
      focalLengthMm: body.focalLengthMm ?? demoShots[idx].focalLengthMm,
      lensType: body.lensType || demoShots[idx].lensType,
      keyStyle: body.keyStyle || demoShots[idx].keyStyle,
      colorTemp: body.colorTemp || demoShots[idx].colorTemp,
      isLocked: body.isLocked ?? demoShots[idx].isLocked,
      userEdited: true,
    }
    
    return NextResponse.json(demoShots[idx])
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
    const idx = demoShots.findIndex((s: any) => s.id === shotId)
    if (idx === -1) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    demoShots.splice(idx, 1)
    
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
    'Shot #',
    'Scene',
    'Shot Text',
    'Characters',
    'Size',
    'Angle',
    'Movement',
    'Focal Length',
    'Lens',
    'Key Style',
    'Color Temp',
    'Duration (sec)',
    'Locked',
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
    shot.isLocked ? 'Yes' : 'No',
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

// Helper to generate demo shots
function generateDemoShots(sceneId: string): any[] {
  const scene = DEMO_SCENES.find(s => s.id === sceneId) || DEMO_SCENES[0]
  const existingCount = demoShots.filter((s: any) => s.scene?.id === sceneId).length
  const baseIndex = demoShots.length + 1
  
  const shotTemplates = [
    { text: 'Establishing wide shot', size: 'WS', angle: 'eye', movement: 'static' },
    { text: 'Medium shot', size: 'MS', angle: 'eye', movement: 'dolly' },
    { text: 'Close-up detail', size: 'CU', angle: 'high', movement: 'static' },
    { text: 'Over-the-shoulder', size: 'OTS', angle: 'eye', movement: 'pan' },
    { text: 'POV shot', size: 'MCU', angle: 'eye', movement: 'handheld' },
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
    focalLengthMm: 50,
    lensType: 'zoom',
    keyStyle: 'motivated',
    colorTemp: '5600K',
    durationEstSec: 5 + Math.floor(Math.random() * 5),
    confidenceCamera: 0.8 + Math.random() * 0.15,
    confidenceLens: 0.8 + Math.random() * 0.15,
    confidenceLight: 0.75 + Math.random() * 0.15,
    confidenceDuration: 0.6 + Math.random() * 0.2,
    isLocked: false,
    userEdited: false,
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
