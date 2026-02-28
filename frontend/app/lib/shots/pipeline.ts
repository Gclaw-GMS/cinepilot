/**
 * Shot Generation Pipeline
 * Handles AI-powered shot list generation based on scenes
 */

import prisma from '@/lib/db'

export type DirectorStyleKey = 
  | 'theatrical'
  | 'documentary'
  | 'commercial'
  | 'action'
  | 'romance'
  | 'thriller'

interface ShotType {
  name: string
  description: string
  cameraMovement: string
  lens: string
  duration: string
}

// Shot type templates
const SHOT_TYPES: Record<string, ShotType> = {
  wide: { name: 'Wide Shot', description: 'Establishes location and context', cameraMovement: 'Static', lens: '24mm', duration: '5-8s' },
  medium: { name: 'Medium Shot', description: 'Shows character from waist up', cameraMovement: 'Static or Slow Pan', lens: '50mm', duration: '3-5s' },
  closeup: { name: 'Close-Up', description: 'Focus on face or object detail', cameraMovement: 'Static', lens: '85mm', duration: '2-4s' },
  extreme_closeup: { name: 'Extreme Close-Up', description: 'Intimate detail shot', cameraMovement: 'Static', lens: '135mm', duration: '1-3s' },
  over_shoulder: { name: 'Over the Shoulder', description: 'Conversation shot', cameraMovement: 'Static', lens: '50mm', duration: '3-5s' },
  pov: { name: 'POV', description: 'Point of view shot', cameraMovement: ' handheld', lens: '35mm', duration: '2-4s' },
  tracking: { name: 'Tracking Shot', description: 'Camera follows action', cameraMovement: 'Dolly/Steadicam', lens: '35mm', duration: '5-10s' },
  static: { name: 'Static Shot', description: 'Fixed camera position', cameraMovement: 'None', lens: '50mm', duration: '3-6s' },
}

// Default shot breakdown per scene type
const SCENE_SHOT_BREAKDOWN: Record<string, string[]> = {
  dialogue: ['wide', 'medium', 'closeup', 'over_shoulder', 'medium', 'closeup'],
  action: ['wide', 'tracking', 'medium', 'tracking', 'closeup', 'wide'],
  intro: ['wide', 'medium', 'closeup'],
  outro: ['closeup', 'medium', 'wide'],
}

/**
 * Generate shots for a single scene
 */
export async function generateShotsForScene(
  sceneId: string,
  style: DirectorStyleKey = 'theatrical'
): Promise<any[]> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      sceneCharacters: { include: { character: true } }
    }
  })
  
  if (!scene) {
    throw new Error('Scene not found')
  }
  
  // Determine scene type based on content
  const sceneType = determineSceneType(scene)
  const shotTypes = SCENE_SHOT_BREAKDOWN[sceneType] || SCENE_SHOT_BREAKDOWN.dialogue
  
  const shots = []
  let shotIndex = 0
  
  for (const shotTypeKey of shotTypes) {
    const shotType = SHOT_TYPES[shotTypeKey] || SHOT_TYPES.medium
    
    // Generate shot description based on scene context
    const characters = scene.sceneCharacters.map(sc => sc.character.name)
    const description = generateShotDescription(scene, shotTypeKey, characters)
    
    const shot = await prisma.shot.create({
      data: {
        sceneId,
        shotIndex: shotIndex,
        beatIndex: 0,
        shotText: `${scene.sceneNumber}.${shotIndex + 1} - ${shotType.name}`,
        shotSize: shotTypeKey,
        cameraAngle: 'eye-level',
        cameraMovement: shotType.cameraMovement,
        lensType: shotType.lens,
        focalLengthMm: parseInt(shotType.lens.replace('mm', '')),
        durationEstSec: parseDuration(shotType.duration),
        importance: 3,
        isLocked: false,
        userEdited: false
      }
    })
    
    shots.push(shot)
    shotIndex++
  }
  
  return shots
}

/**
 * Generate shots for entire script
 */
export async function generateShotsForScript(
  scriptId: string,
  style: DirectorStyleKey = 'theatrical'
): Promise<{ total: number; shots: any[] }> {
  const scenes = await prisma.scene.findMany({
    where: { scriptId },
    orderBy: { sceneIndex: 'asc' }
  })
  
  const allShots = []
  
  for (const scene of scenes) {
    const sceneShots = await generateShotsForScene(scene.id, style)
    allShots.push(...sceneShots)
  }
  
  return {
    total: allShots.length,
    shots: allShots
  }
}

/**
 * Update a shot
 */
export async function updateShot(
  shotId: string,
  data: {
    shotType?: string
    description?: string
    cameraAngle?: string
    cameraMovement?: string
    lens?: string
    estimatedDuration?: number
    notes?: string
    status?: string
  }
) {
  return prisma.shot.update({
    where: { id: shotId },
    data
  })
}

/**
 * Fill in missing shot fields with AI suggestions
 */
export async function fillShotFields(shotId: string): Promise<any> {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { scene: true }
  })
  
  if (!shot) {
    throw new Error('Shot not found')
  }
  
  // Generate AI suggestions based on shot type and scene context
  const suggestions = generateShotSuggestions(shot)
  
  // Update with suggestions if fields are empty
  const updates: any = {}
  if (!shot.lensType && suggestions.lens) updates.lensType = suggestions.lens
  if (!shot.focalLengthMm && suggestions.lens) updates.focalLengthMm = parseInt(suggestions.lens.replace('mm', ''))
  if (!shot.cameraAngle && suggestions.cameraAngle) updates.cameraAngle = suggestions.cameraAngle
  if (!shot.cameraMovement && suggestions.cameraMovement) updates.cameraMovement = suggestions.cameraMovement
  
  if (Object.keys(updates).length > 0) {
    return prisma.shot.update({
      where: { id: shotId },
      data: updates
    })
  }
  
  return shot
}

// Helper functions

function determineSceneType(scene: any): string {
  const heading = (scene.headingRaw || '').toLowerCase()
  const hasCharacters = scene.sceneCharacters?.length > 0
  
  if (heading.includes('action') || heading.includes('fight') || heading.includes('chase')) {
    return 'action'
  }
  if (heading.includes('intro') || heading.includes('establish')) {
    return 'intro'
  }
  if (heading.includes('outro') || heading.includes('end')) {
    return 'outro'
  }
  if (hasCharacters) {
    return 'dialogue'
  }
  
  return 'dialogue'
}

function generateShotDescription(scene: any, shotTypeKey: string, characters: string[]): string {
  const location = scene.location || 'location'
  const timeOfDay = scene.timeOfDay || 'day'
  
  const descriptions: Record<string, string> = {
    wide: `${location} - ${timeOfDay}. Establishing shot showing the full environment.`,
    medium: `${characters.join(', ') || 'Character(s)'} in ${location}. Standard coverage.`,
    closeup: `${characters[0] || 'Character'} reaction. Emotional beat.`,
    extreme_closeup: `Detail shot. Focus on ${characters[0] || 'subject'}'s expression.`,
    over_shoulder: `Over the shoulder shot. ${characters.join(' and ')} in conversation.`,
    pov: `Point of view - ${characters[0] || 'Subject'}'s perspective.`,
    tracking: `Tracking ${characters[0] || 'subject'} through ${location}.`,
    static: `Static observation of ${location}.`
  }
  
  return descriptions[shotTypeKey] || descriptions.medium
}

function generateShotSuggestions(shot: any): any {
  const shotType = shot.shotTypeDetail || shot.shotType?.toLowerCase() || ''
  
  const suggestions: Record<string, any> = {
    wide: { lens: '24mm', cameraAngle: 'high', cameraMovement: 'static' },
    medium: { lens: '50mm', cameraAngle: 'eye-level', cameraMovement: 'slow pan' },
    closeup: { lens: '85mm', cameraAngle: 'eye-level', cameraMovement: 'static' },
    extreme_closeup: { lens: '135mm', cameraAngle: 'eye-level', cameraMovement: 'static' },
    over_shoulder: { lens: '50mm', cameraAngle: 'eye-level', cameraMovement: 'static' },
    pov: { lens: '35mm', cameraAngle: 'eye-level', cameraMovement: 'handheld' },
    tracking: { lens: '35mm', cameraAngle: 'ground-level', cameraMovement: 'dolly' },
    static: { lens: '50mm', cameraAngle: 'eye-level', cameraMovement: 'none' }
  }
  
  // Find matching suggestion
  for (const [key, value] of Object.entries(suggestions)) {
    if (shotType.includes(key)) {
      return value
    }
  }
  
  return suggestions.medium
}

function parseDuration(duration: string): number {
  // Parse "5-8s" or "3-5s" format
  const match = duration.match(/(\d+)-(\d+)s/)
  if (match) {
    return (parseInt(match[1]) + parseInt(match[2])) / 2
  }
  const single = duration.match(/(\d+)s/)
  return single ? parseInt(single[1]) : 3
}
