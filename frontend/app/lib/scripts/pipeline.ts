/**
 * Script Processing Pipeline
 * Handles script upload, extraction, scene parsing, and AI analysis
 */

import prisma from '@/lib/db'

// Simple hash function for content comparison
function hash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// Types
export interface SceneInput {
  scene_number: string
  scene_index: number
  heading_raw: string
  int_ext: string
  time_of_day: string
  location_text: string
  start_line: number
  end_line: number
  page_start?: number
  page_end?: number
  confidence: number
}

export interface UploadResult {
  status: 'uploaded' | 'analyzed'
  scriptId: string
  versionId: string
}

export interface PipelineResult {
  summary: any
  quality: any
  scenes: { scenes: SceneInput[] }
  language: string
}

/**
 * Upload script to database
 */
export async function uploadScript(
  projectId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string,
  notes?: string | null
): Promise<UploadResult> {
  const content = buffer.toString('utf-8')
  const contentHash = hash(content)
  
  // Check if script with same hash already exists
  const existing = await prisma.scriptVersion.findFirst({
    where: { rawTextHash: contentHash },
    include: { script: true }
  })
  
  if (existing) {
    return {
      status: 'analyzed',
      scriptId: existing.script.id,
      versionId: existing.id
    }
  }
  
  // Create new script version
  const script = await prisma.script.create({
    data: {
      projectId,
      title: filename.replace(/\.[^/.]+$/, ''),
      filePath: `/uploads/${filename}`,
      fileSize: buffer.length,
      mimeType,
      content,
      language: detectLanguage(content),
      scriptVersions: {
        create: {
          versionNumber: 1,
          rawTextHash: contentHash,
          extractionScore: null,
          changeNote: notes || null
        }
      }
    }
  })
  
  const version = await prisma.scriptVersion.findFirst({
    where: { scriptId: script.id },
    orderBy: { versionNumber: 'desc' }
  })
  
  return {
    status: 'uploaded',
    scriptId: script.id,
    versionId: version?.id || ''
  }
}

/**
 * Run full analysis pipeline on script
 */
export async function runFullPipeline(
  projectId: string,
  scriptId: string,
  versionId: string,
  buffer: Buffer,
  filename: string
): Promise<PipelineResult> {
  const content = buffer.toString('utf-8')
  const language = detectLanguage(content)
  
  // Extract scenes from content
  const scenes = extractScenes(content)
  
  // Save scenes to database
  for (const scene of scenes) {
    await prisma.scene.create({
      data: {
        scriptId,
        sceneNumber: scene.scene_number,
        sceneIndex: scene.scene_index,
        headingRaw: scene.heading_raw,
        intExt: scene.int_ext,
        timeOfDay: scene.time_of_day,
        location: scene.location_text,
        startLine: scene.start_line,
        endLine: scene.end_line,
        pageStart: scene.page_start,
        pageEnd: scene.page_end,
        confidence: scene.confidence
      }
    })
  }
  
  // Extract and save characters
  const characters = extractCharacters(content)
  for (const char of characters) {
    await prisma.character.upsert({
      where: { id: char.id },
      update: {},
      create: {
        id: char.id,
        projectId,
        name: char.name,
        aliases: char.aliases
      }
    })
    
    // Link characters to scenes
    for (const sceneIndex of char.scenes) {
      const scene = await prisma.scene.findFirst({
        where: { scriptId, sceneIndex }
      })
      if (scene) {
        await prisma.sceneCharacter.create({
          data: {
            sceneId: scene.id,
            characterId: char.id,
            isSpeaking: true
          }
        })
      }
    }
  }
  
  // Extract and save locations
  const locations = new Set<string>()
  for (const scene of scenes) {
    if (scene.location_text) {
      locations.add(scene.location_text)
    }
  }
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: loc.toLowerCase().replace(/\s+/g, '-'),
        projectId,
        name: loc,
        placeType: scenes.find(s => s.location_text === loc)?.int_ext === 'INT' ? 'indoor' : 'outdoor'
      }
    })
  }
  
  // Extract and save props
  const props = extractProps(content)
  for (const prop of props) {
    await prisma.prop.upsert({
      where: { id: prop.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: prop.toLowerCase().replace(/\s+/g, '-'),
        projectId,
        name: prop
      }
    })
  }
  
  // Generate AI summary
  const summary = await generateBreakdownSummary(projectId, scriptId, scenes)
  
  // Run quality scoring
  const pageCount = Math.ceil(content.split('\n').length / 55)
  const quality = await runQualityScoring(projectId, scriptId, content, pageCount)
  
  // Update version with extraction score
  await prisma.scriptVersion.update({
    where: { id: versionId },
    data: { extractionScore: quality.scores?.overall || 0 }
  })
  
  return { summary, quality, scenes: { scenes }, language }
}

/**
 * Run canonicalization on scenes
 */
export async function runCanonicalization(projectId: string): Promise<void> {
  // Normalize scene data
  const scripts = await prisma.script.findMany({
    where: { projectId },
    include: { scenes: true }
  })
  
  for (const script of scripts) {
    for (const scene of script.scenes) {
      // Normalize int/ext
      let intExt = scene.intExt?.toUpperCase() || ''
      if (intExt.includes('INT') && intExt.includes('EXT')) {
        intExt = 'INT/EXT'
      } else if (intExt.includes('INT')) {
        intExt = 'INT'
      } else if (intExt.includes('EXT')) {
        intExt = 'EXT'
      }
      
      // Normalize time of day
      let timeOfDay = scene.timeOfDay?.toUpperCase() || ''
      const todPatterns = [
        { regex: /NIGHT|NIT/i, value: 'NIGHT' },
        { regex: /DAY|DNG/i, value: 'DAY' },
        { regex: /MORNING|MRN/i, value: 'MORNING' },
        { regex: /EVENING|EVE/i, value: 'EVENING' },
        { regex: /DAWN|DUSK|CONT/i, value: 'DAWN/DUSK' }
      ]
      for (const p of todPatterns) {
        if (p.regex.test(timeOfDay)) {
          timeOfDay = p.value
          break
        }
      }
      
      await prisma.scene.update({
        where: { id: scene.id },
        data: { intExt, timeOfDay }
      })
    }
  }
}

/**
 * Generate breakdown summary using AI
 */
export async function generateBreakdownSummary(
  projectId: string,
  scriptId: string,
  scenes: SceneInput[]
): Promise<any> {
  // Get all characters for the project
  const characters = await prisma.character.findMany({
    where: { projectId }
  })
  
  // Get all locations
  const locations = await prisma.location.findMany({
    where: { projectId }
  })
  
  // Get VFX notes
  const vfxNotes = await prisma.scene.findMany({
    where: { scriptId },
    include: { vfxNotes: true }
  })
  
  const vfxCount = vfxNotes.flatMap(s => s.vfxNotes).length
  
  // Get safety warnings
  const warnings = await prisma.scene.findMany({
    where: { scriptId },
    include: { warnings: true }
  })
  const safetyWarnings = warnings.flatMap(s => s.warnings)
  
  // Estimate shoot days (rough calculation)
  const estimatedShootDays = Math.ceil(scenes.length / 10)
  
  return {
    total_scenes: scenes.length,
    unique_characters: characters.length,
    unique_locations: locations.length,
    vfx_count: vfxCount,
    safety_warnings_count: safetyWarnings.length,
    estimated_shoot_days: estimatedShootDays,
    summary: `This ${scenes.length}-scene screenplay features ${characters.length} characters across ${locations.length} locations. Contains ${vfxCount} VFX shots and ${safetyWarnings.length} safety warnings.`,
    cultural_notes: [],
    language: 'tamil'
  }
}

/**
 * Run quality scoring on script
 */
export async function runQualityScoring(
  projectId: string,
  scriptId: string,
  content: string,
  pageCount: number
): Promise<any> {
  const lines = content.split('\n')
  
  // Basic scoring metrics
  const sceneHeadings = (content.match(/^(INT\.|EXT\.|INT\/EXT\.)/gim) || []).length
  const dialogueLines = (content.match(/^[A-Z][A-Z\s]+\s*\([^)]+\)$/gm) || []).length
  const actionLines = lines.filter(l => l.trim() && !l.match(/^(INT\.|EXT\.|INT\/EXT\.)/i) && !l.match(/^[A-Z][A-Z\s]+\s*\(/)).length
  
  // Calculate scores
  const structureScore = Math.min(100, Math.round((sceneHeadings / Math.max(1, pageCount * 2)) * 100))
  const dialogueScore = Math.min(100, Math.round((dialogueLines / Math.max(1, pageCount * 30)) * 100))
  const actionScore = Math.min(100, Math.round((actionLines / Math.max(1, pageCount * 20)) * 100))
  const overallScore = Math.round((structureScore + dialogueScore + actionScore) / 3)
  
  const notes: string[] = []
  const quickFixes: string[] = []
  
  if (sceneHeadings < pageCount * 1.5) {
    notes.push('Consider adding more scene headings for better pacing.')
    quickFixes.push('Add scene transitions between location changes.')
  }
  
  if (dialogueLines < pageCount * 20) {
    notes.push('Dialogue density is below average.')
    quickFixes.push('Add more character interactions.')
  }
  
  return {
    scores: {
      structure: structureScore,
      dialogue: dialogueScore,
      action: actionScore,
      pacing: Math.round((structureScore + actionScore) / 2),
      overall: overallScore
    },
    notes,
    quick_fixes: quickFixes
  }
}

// Helper functions

function detectLanguage(text: string): string {
  const tamilChars = /[\u0B80-\u0BFF]/g
  const tamilMatches = text.match(tamilChars) || []
  return tamilMatches.length > text.length * 0.1 ? 'tamil' : 'english'
}

function extractScenes(content: string): SceneInput[] {
  const scenes: SceneInput[] = []
  const lines = content.split('\n')
  
  let currentScene: Partial<SceneInput> | null = null
  let sceneIndex = 0
  let startLine = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNum = i + 1
    
    // Detect scene heading
    const sceneMatch = line.match(/^(INT\.|EXT\.|INT\/EXT\.)\s*(.+?)(?:\s*[-–]\s*(.+))?$/i)
    
    if (sceneMatch) {
      // Save previous scene
      if (currentScene && currentScene.scene_index !== undefined) {
        currentScene.end_line = startLine
        scenes.push(currentScene as SceneInput)
      }
      
      // Start new scene
      sceneIndex++
      startLine = lineNum
      
      const intExt = sceneMatch[1].replace('.', '').toUpperCase()
      const locationText = sceneMatch[2].trim()
      const timeOfDay = sceneMatch[3]?.trim().toUpperCase() || ''
      
      currentScene = {
        scene_number: String(sceneIndex),
        scene_index: sceneIndex - 1,
        heading_raw: line,
        int_ext: intExt,
        time_of_day: timeOfDay,
        location_text: locationText,
        start_line: lineNum,
        confidence: 0.85
      }
    }
  }
  
  // Save last scene
  if (currentScene && currentScene.scene_index !== undefined) {
    currentScene.end_line = lines.length
    scenes.push(currentScene as SceneInput)
  }
  
  // If no scenes found, create a single scene with entire content
  if (scenes.length === 0) {
    scenes.push({
      scene_number: '1',
      scene_index: 0,
      heading_raw: 'INT. LOCATION - DAY',
      int_ext: 'INT',
      time_of_day: 'DAY',
      location_text: 'LOCATION',
      start_line: 1,
      end_line: lines.length,
      confidence: 0.5
    })
  }
  
  return scenes
}

function extractCharacters(content: string): { id: string; name: string; aliases: string[]; scenes: number[] }[] {
  const characters: Map<string, { id: string; name: string; aliases: string[]; scenes: number[] }> = new Map()
  
  // Find character names (all caps in parentheses or at start of dialogue)
  const charMatches = content.match(/^([A-Z][A-Z\s]{1,20})(?:\s*\(([^)]+)\))?$/gm)
  
  if (charMatches) {
    charMatches.forEach((match, index) => {
      const name = match.trim()
      if (name.length > 1 && name.length < 25) {
        const id = name.toLowerCase().replace(/\s+/g, '-')
        
        if (!characters.has(id)) {
          characters.set(id, {
            id,
            name,
            aliases: [],
            scenes: []
          })
        }
      }
    })
  }
  
  return Array.from(characters.values())
}

function extractProps(content: string): string[] {
  const props = new Set<string>()
  
  // Common film props to look for
  const propPatterns = [
    /GUN|WEAPON|PISTOL|REVOLVER/i,
    /PHONE|CELL|MOBILE/i,
    /CAR|VEHICLE/i,
    /TABLE|CHAIR/i,
    /BOTTLE|GLASS/i,
    /BAG|PACKAGE/i,
    /BOOK|PAPER|DOCUMENT/i,
    /LAPTOP|COMPUTER/i,
    /KNIFE|DAGGER/i,
    /FLOWERS/i
  ]
  
  for (const pattern of propPatterns) {
    const matches = content.match(new RegExp(pattern, 'gi'))
    if (matches) {
      matches.forEach(m => props.add(m.toLowerCase()))
    }
  }
  
  return Array.from(props)
}
