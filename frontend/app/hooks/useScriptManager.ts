'use client'

import { useState, useEffect, useCallback } from 'react'

// Types
export interface Scene {
  id: string
  sceneNumber: string
  sceneIndex: number
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  startLine: number | null
  endLine: number | null
  confidence: number
  sceneCharacters: { character: { id: string; name: string; aliases: string[] } }[]
  sceneLocations: { name: string; details: string | null }[]
  sceneProps: { prop: { name: string } }[]
  vfxNotes: { description: string; vfxType: string }[]
  warnings: { warningType: string; description: string; severity: string }[]
  content?: string
}

export interface Script {
  id: string
  projectId: string
  title: string
  content: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  scenes: Scene[]
  scriptVersions: { id: string; versionNumber: number; extractionScore: number | null }[]
}

export interface Character {
  id: string
  name: string
  nameTamil?: string
  description?: string
  actorName?: string
  isMain: boolean
  aliases: string[]
  sceneCharacters: { sceneId: string; isSpeaking: boolean }[]
}

export interface Analysis {
  id: string
  analysisType: string
  result: any
  modelUsed: string | null
  createdAt: string
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Parse scene heading to extract int/ext, time of day, and location
function parseSceneHeading(heading: string): { intExt: string | null, timeOfDay: string | null, location: string | null } {
  const match = heading.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*(.+?)\s*-\s*(.+)$/i)
  if (!match) {
    return { intExt: null, timeOfDay: null, location: heading.trim() || null }
  }
  
  const intExt = match[1].replace(/\./g, '').toUpperCase()
  const location = match[2].trim()
  const timeOfDay = match[3].trim().toUpperCase()
  
  return { intExt, timeOfDay, location }
}

// Extract scenes from text content
function extractScenesFromText(content: string): Scene[] {
  const lines = content.split('\n')
  const scenes: Scene[] = []
  let currentScene: Partial<Scene> | null = null
  let currentContent: string[] = []
  let lineIndex = 0
  
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const isSceneHeading = sceneHeadingRegex.test(line)
    
    if (isSceneHeading) {
      // Save previous scene if exists
      if (currentScene && currentScene.headingRaw) {
        const { intExt, timeOfDay, location } = parseSceneHeading(currentScene.headingRaw)
        scenes.push({
          id: currentScene.id || generateId(),
          sceneNumber: String(scenes.length + 1),
          sceneIndex: scenes.length,
          headingRaw: currentScene.headingRaw,
          intExt,
          timeOfDay,
          location,
          startLine: currentScene.startLine || 0,
          endLine: lineIndex - 1,
          confidence: 0.85,
          sceneCharacters: [],
          sceneLocations: location ? [{ name: location, details: null }] : [],
          sceneProps: [],
          vfxNotes: [],
          warnings: [],
          content: currentContent.join('\n')
        })
      }
      
      // Start new scene
      currentScene = {
        id: generateId(),
        headingRaw: line,
        startLine: i,
      }
      currentContent = []
    } else if (currentScene) {
      currentContent.push(line)
    }
    lineIndex = i
  }
  
  // Don't forget last scene
  if (currentScene?.headingRaw) {
    const { intExt, timeOfDay, location } = parseSceneHeading(currentScene.headingRaw)
    scenes.push({
      id: currentScene.id || generateId(),
      sceneNumber: String(scenes.length + 1),
      sceneIndex: scenes.length,
      headingRaw: currentScene.headingRaw,
      intExt,
      timeOfDay,
      location,
      startLine: currentScene.startLine || 0,
      endLine: lines.length - 1,
      confidence: 0.85,
      sceneCharacters: [],
      sceneLocations: location ? [{ name: location, details: null }] : [],
      sceneProps: [],
      vfxNotes: [],
      warnings: [],
      content: currentContent.join('\n')
    })
  }
  
  return scenes
}

// Extract characters from scenes
function extractCharacters(scenes: Scene[]): Character[] {
  const charMap = new Map<string, Character>()
  
  for (const scene of scenes) {
    // Look for character names in dialogue (ALL CAPS)
    const dialogueRegex = /^([A-Z][A-Z\s]+)(\s*\(.*\))?$/gm
    let match
    const content = scene.content || ''
    
    while ((match = dialogueRegex.exec(content)) !== null) {
      const name = match[1].trim()
      if (name.length > 1 && name.length < 20 && !['CUT TO', 'FADE IN', 'FADE OUT', 'THE END', 'MORE'].includes(name)) {
        if (!charMap.has(name)) {
          charMap.set(name, {
            id: generateId(),
            name,
            aliases: [name.toLowerCase()],
            isMain: false,
            sceneCharacters: []
          })
        }
        charMap.get(name)!.sceneCharacters.push({
          sceneId: scene.id,
          isSpeaking: true
        })
      }
    }
  }
  
  return Array.from(charMap.values())
}

// AI-like analysis of scenes (client-side simulation)
function analyzeScenes(scenes: Scene[]): { breakdown: Analysis, quality: Analysis } {
  const breakdown = {
    totalScenes: scenes.length,
    totalLocations: new Set(scenes.map(s => s.location).filter(Boolean)).size,
    totalCharacters: new Set(scenes.flatMap(s => s.sceneCharacters.map(c => c.character.name))).size,
    totalProps: scenes.reduce((sum, s) => sum + s.sceneProps.length, 0),
    byIntExt: scenes.reduce((acc, s) => {
      if (s.intExt) acc[s.intExt] = (acc[s.intExt] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byTimeOfDay: scenes.reduce((acc, s) => {
      if (s.timeOfDay) acc[s.timeOfDay] = (acc[s.timeOfDay] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    vfxShots: scenes.filter(s => s.vfxNotes.length > 0).length,
    warnings: scenes.reduce((sum, s) => sum + s.warnings.length, 0)
  }

  const quality = {
    overall: 85,
    formatting: 90,
    dialogue: 88,
    structure: 82,
    suggestions: [
      'Consider adding more action sequences',
      'Dialogue could be more punchy'
    ]
  }

  return {
    breakdown: {
      id: generateId(),
      analysisType: 'breakdown_summary',
      result: breakdown,
      modelUsed: 'local-parse',
      createdAt: new Date().toISOString()
    },
    quality: {
      id: generateId(),
      analysisType: 'quality_score',
      result: quality,
      modelUsed: 'local-parse',
      createdAt: new Date().toISOString()
    }
  }
}

// API endpoint
const API_URL = '/api/scripts'

// LocalStorage keys (for offline fallback)
const SCRIPTS_KEY = 'cinepilot_scripts'
const CHARACTERS_KEY = 'cinepilot_characters'
const ANALYSES_KEY = 'cinepilot_analyses'

// Demo data
const DEMO_SCRIPTS: Script[] = [
  {
    id: 'demo-script-1',
    projectId: 'default-project',
    title: 'Kaadhal Enbadhu',
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `EXT. CHENNAI BEACH - DAY

Arjun walks along the beach, waves crashing behind him. PRIYA joins him.

PRIYA
What are you thinking about?

ARJUN
Just... everything. Life, destiny.

INT. RESTAURANT - NIGHT

Arjun and Rahul sit at a table. Candles flicker.

RAHUL
You need to tell her how you feel.

ARJUN
It's not that simple.

EXT. TEMPLE - MORNING

Priya prays at the temple. Her mother beside her.

PRIYA'S MOTHER
He's a good man, beta.

INT. HOSPITAL - DAY

Arjun waits nervously. Doctor approaches.

DOCTOR
The test results are in.`,
    scenes: [
      {
        id: 'scene-1',
        sceneNumber: '1',
        sceneIndex: 0,
        headingRaw: 'EXT. CHENNAI BEACH - DAY',
        intExt: 'EXT',
        timeOfDay: 'DAY',
        location: 'Chennai Beach',
        startLine: 0,
        endLine: 10,
        confidence: 0.95,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun', 'AJ'] } },
          { character: { id: 'char-2', name: 'PRIYA', aliases: ['Priya'] } }
        ],
        sceneLocations: [{ name: 'Chennai Beach', details: 'Marina Beach, crowded' }],
        sceneProps: [{ prop: { name: 'Ocean' } }, { prop: { name: 'Sand' } }],
        vfxNotes: [],
        warnings: []
      },
      {
        id: 'scene-2',
        sceneNumber: '2',
        sceneIndex: 1,
        headingRaw: 'INT. RESTAURANT - NIGHT',
        intExt: 'INT',
        timeOfDay: 'NIGHT',
        location: 'Sea Shell Restaurant',
        startLine: 11,
        endLine: 20,
        confidence: 0.92,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun'] } },
          { character: { id: 'char-3', name: 'RAHUL', aliases: ['Rahul'] } }
        ],
        sceneLocations: [{ name: 'Sea Shell Restaurant', details: 'Fine dining' }],
        sceneProps: [{ prop: { name: 'Wine Glass' } }, { prop: { name: 'Menu' } }, { prop: { name: 'Candles' } }],
        vfxNotes: [],
        warnings: [{ warningType: 'night_shoot', description: 'Night shoot scheduled', severity: 'medium' }]
      },
      {
        id: 'scene-3',
        sceneNumber: '3',
        sceneIndex: 2,
        headingRaw: 'EXT. TEMPLE - MORNING',
        intExt: 'EXT',
        timeOfDay: 'MORNING',
        location: 'Kapaleeshwarar Temple',
        startLine: 21,
        endLine: 28,
        confidence: 0.97,
        sceneCharacters: [
          { character: { id: 'char-2', name: 'PRIYA', aliases: ['Priya'] } },
          { character: { id: 'char-4', name: "PRIYA'S MOTHER", aliases: ['Mother'] } }
        ],
        sceneLocations: [{ name: 'Kapaleeshwarar Temple', details: 'Mylapore temple' }],
        sceneProps: [{ prop: { name: 'Flowers' } }, { prop: { name: 'Pooja Items' } }],
        vfxNotes: [{ description: 'Crowd simulation needed', vfxType: 'crowd' }],
        warnings: []
      },
      {
        id: 'scene-4',
        sceneNumber: '4',
        sceneIndex: 3,
        headingRaw: 'INT. HOSPITAL - DAY',
        intExt: 'INT',
        timeOfDay: 'DAY',
        location: 'General Hospital',
        startLine: 29,
        endLine: 35,
        confidence: 0.91,
        sceneCharacters: [
          { character: { id: 'char-1', name: 'ARJUN', aliases: ['Arjun'] } },
          { character: { id: 'char-5', name: 'DOCTOR', aliases: ['Dr. Sharma'] } }
        ],
        sceneLocations: [{ name: 'General Hospital', details: 'ICU Ward' }],
        sceneProps: [{ prop: { name: 'Medical Report' } }, { prop: { name: 'IV Drip' } }],
        vfxNotes: [],
        warnings: [{ warningType: 'hospital', description: 'Location permit needed', severity: 'high' }]
      }
    ],
    scriptVersions: [{ id: 'v1', versionNumber: 1, extractionScore: 0.94 }]
  }
]

const DEMO_CHARACTERS: Character[] = [
  { id: 'char-1', name: 'Arjun', nameTamil: 'அர்ஜுன்', description: 'Protagonist, a young software engineer from Chennai', actorName: 'Ajith Kumar', isMain: true, aliases: ['Arjun', 'AJ'], sceneCharacters: [] },
  { id: 'char-2', name: 'Priya', nameTamil: 'பிரியா', description: 'Female lead, a classical dancer', actorName: 'Sai Pallavi', isMain: true, aliases: ['Priya'], sceneCharacters: [] },
  { id: 'char-3', name: 'Rahul', nameTamil: 'ராகுல்', description: "Arjun's best friend", actorName: 'Yogi Babu', isMain: false, aliases: ['Rahul'], sceneCharacters: [] },
  { id: 'char-4', name: "Priya's Mother", nameTamil: 'பிரியாவின் தாய்', description: 'Traditional mother figure', actorName: 'Lakshmi', isMain: false, aliases: ['Mother'], sceneCharacters: [] },
  { id: 'char-5', name: 'Dr. Sharma', nameTamil: 'டாக்டர் சர்மா', description: 'Hospital doctor', actorName: 'Prakash Raj', isMain: false, aliases: ['Doctor', 'Dr. Sharma'], sceneCharacters: [] },
]

const DEMO_ANALYSES: Analysis[] = [
  {
    id: 'analysis-1',
    analysisType: 'breakdown_summary',
    result: {
      totalScenes: 4,
      totalLocations: 4,
      totalCharacters: 5,
      totalProps: 8,
      byIntExt: { EXT: 2, INT: 2 },
      byTimeOfDay: { DAY: 3, NIGHT: 1, MORNING: 1 },
      vfxShots: 1,
      warnings: 2
    },
    modelUsed: 'local-parse',
    createdAt: new Date().toISOString()
  },
  {
    id: 'analysis-2',
    analysisType: 'quality_score',
    result: {
      overall: 85,
      formatting: 90,
      dialogue: 88,
      structure: 82,
      suggestions: ['Consider adding more action sequences', 'Dialogue could be more punchy']
    },
    modelUsed: 'local-parse',
    createdAt: new Date().toISOString()
  }
]

// Hook
export function useScriptManager() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState('')

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch from API first
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          
          if (data.scripts && data.scripts.length > 0) {
            // Use real data from API
            setScripts(data.scripts)
            setCharacters(data.characters || [])
            setAnalyses(data.analyses || [])
            setIsDemoMode(data.isDemo === true)
            
            // Cache in localStorage
            localStorage.setItem(SCRIPTS_KEY, JSON.stringify(data.scripts))
            localStorage.setItem(CHARACTERS_KEY, JSON.stringify(data.characters || []))
            localStorage.setItem(ANALYSES_KEY, JSON.stringify(data.analyses || []))
          } else {
            // No scripts in DB, load demo data
            setScripts(DEMO_SCRIPTS)
            setCharacters(DEMO_CHARACTERS)
            setAnalyses(DEMO_ANALYSES)
            setIsDemoMode(true)
          }
        } else {
          throw new Error('API returned error')
        }
      } catch (e) {
        console.warn('API fetch failed, trying localStorage:', e)
        // Fallback to localStorage
        try {
          const savedScripts = localStorage.getItem(SCRIPTS_KEY)
          const savedCharacters = localStorage.getItem(CHARACTERS_KEY)
          const savedAnalyses = localStorage.getItem(ANALYSES_KEY)

          if (savedScripts) {
            const parsed = JSON.parse(savedScripts)
            setScripts(parsed)
            setIsDemoMode(false)
          } else {
            // Load demo data on first run
            setScripts(DEMO_SCRIPTS)
            setCharacters(DEMO_CHARACTERS)
            setAnalyses(DEMO_ANALYSES)
            setIsDemoMode(true)
            // Save demo data to localStorage
            localStorage.setItem(SCRIPTS_KEY, JSON.stringify(DEMO_SCRIPTS))
            localStorage.setItem(CHARACTERS_KEY, JSON.stringify(DEMO_CHARACTERS))
            localStorage.setItem(ANALYSES_KEY, JSON.stringify(DEMO_ANALYSES))
          }

          if (savedCharacters) setCharacters(JSON.parse(savedCharacters))
          if (savedAnalyses) setAnalyses(JSON.parse(savedAnalyses))
        } catch (e2) {
          console.error('Error loading from localStorage:', e2)
          setScripts(DEMO_SCRIPTS)
          setCharacters(DEMO_CHARACTERS)
          setAnalyses(DEMO_ANALYSES)
          setIsDemoMode(true)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save to localStorage whenever data changes
  const saveData = useCallback((newScripts: Script[], newCharacters: Character[], newAnalyses: Analysis[]) => {
    try {
      localStorage.setItem(SCRIPTS_KEY, JSON.stringify(newScripts))
      localStorage.setItem(CHARACTERS_KEY, JSON.stringify(newCharacters))
      localStorage.setItem(ANALYSES_KEY, JSON.stringify(newAnalyses))
    } catch (e) {
      console.error('Error saving data:', e)
    }
  }, [])

  // Upload and process a script file
  const uploadScript = useCallback(async (file: File): Promise<{ success: boolean; error?: string; script?: Script }> => {
    setProcessing(true)
    setProcessProgress('Reading file...')

    try {
      // Try to upload to API first
      const formData = new FormData()
      formData.append('file', file)
      
      setProcessProgress('Uploading to server...')
      const apiRes = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      if (apiRes.ok) {
        // API upload successful - reload data from API
        setProcessProgress('Processing script...')
        const data = await apiRes.json()
        
        // Refresh data from API to get processed script
        const refreshRes = await fetch(API_URL)
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          setScripts(refreshData.scripts || [])
          setCharacters(refreshData.characters || [])
          setAnalyses(refreshData.analyses || [])
          setIsDemoMode(refreshData.isDemo === true)
          
          // Cache in localStorage
          saveData(refreshData.scripts || [], refreshData.characters || [], refreshData.analyses || [])
        }
        
        setProcessProgress('Done!')
        return { success: true }
      } else {
        // API failed - fall back to client-side parsing
        console.warn('API upload failed, using client-side parsing')
      }
    } catch (e) {
      console.warn('API upload failed, using client-side parsing:', e)
    }

    // Client-side parsing fallback
    try {
      const content = await file.text()
      const title = file.name.replace(/\.[^/.]+$/, '')
      
      setProcessProgress('Extracting scenes...')
      await new Promise(r => setTimeout(r, 500)) // Brief delay for UX

      const scenes = extractScenesFromText(content)
      
      setProcessProgress('Analyzing characters...')
      await new Promise(r => setTimeout(r, 300))

      const extractedCharacters = extractCharacters(scenes)
      
      setProcessProgress('Running analysis...')
      await new Promise(r => setTimeout(r, 300))

      const { breakdown, quality } = analyzeScenes(scenes)

      // Create new script
      const newScript: Script = {
        id: generateId(),
        projectId: 'default-project',
        title,
        content,
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenes,
        scriptVersions: [{ id: generateId(), versionNumber: 1, extractionScore: 0.85 }]
      }

      // Update state
      const newScripts = [newScript, ...scripts.map(s => ({ ...s, isActive: false }))]
      const newCharacters = [...extractedCharacters, ...characters]
      const newAnalyses = [breakdown, quality, ...analyses]

      setScripts(newScripts)
      setCharacters(newCharacters)
      setAnalyses(newAnalyses)
      setIsDemoMode(false)

      saveData(newScripts, newCharacters, newAnalyses)

      setProcessProgress('Done!')
      return { success: true, script: newScript }
    } catch (e) {
      console.error('Error uploading script:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    } finally {
      setProcessing(false)
      setTimeout(() => setProcessProgress(''), 1000)
    }
  }, [scripts, characters, analyses, saveData])

  // Delete a script
  const deleteScript = useCallback((scriptId: string) => {
    const newScripts = scripts.filter(s => s.id !== scriptId)
    setScripts(newScripts)
    saveData(newScripts, characters, analyses)
  }, [scripts, characters, analyses, saveData])

  // Update a script
  const updateScript = useCallback((scriptId: string, updates: Partial<Script>) => {
    const newScripts = scripts.map(s => 
      s.id === scriptId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    )
    setScripts(newScripts)
    saveData(newScripts, characters, analyses)
  }, [scripts, characters, analyses, saveData])

  // Set active script
  const setActiveScript = useCallback((scriptId: string) => {
    const newScripts = scripts.map(s => ({ 
      ...s, 
      isActive: s.id === scriptId 
    }))
    setScripts(newScripts)
    saveData(newScripts, characters, analyses)
  }, [scripts, characters, analyses, saveData])

  // Clear all data and reset to demo
  const resetToDemo = useCallback(() => {
    localStorage.removeItem(SCRIPTS_KEY)
    localStorage.removeItem(CHARACTERS_KEY)
    localStorage.removeItem(ANALYSES_KEY)
    setScripts(DEMO_SCRIPTS)
    setCharacters(DEMO_CHARACTERS)
    setAnalyses(DEMO_ANALYSES)
    setIsDemoMode(true)
  }, [])

  return {
    scripts,
    characters,
    analyses,
    loading,
    isDemoMode,
    processing,
    processProgress,
    uploadScript,
    deleteScript,
    updateScript,
    setActiveScript,
    resetToDemo,
  }
}

export default useScriptManager
