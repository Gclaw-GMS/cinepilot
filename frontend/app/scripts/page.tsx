'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, Upload, FileText, Search, Filter, Download, Trash2, Eye, Play, CheckCircle, XCircle, Clock, Zap, RefreshCw, Keyboard, ChevronDown, Printer, Copy, Check, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import ScriptComparison from '@/components/ScriptComparison'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface ScriptData {
  id: string
  title: string
  fileSize: number | null
  mimeType: string | null
  version: number
  createdAt: string
  scenes: SceneData[]
  scriptVersions: { id: string; versionNumber: number; extractionScore: number | null }[]
  isDemo?: boolean
}

// Demo fallback data for scripts page
const DEMO_SCRIPT_DATA = {
  scripts: [
    {
      id: 'demo-script-1',
      title: 'Kaathal - The Core (Final Draft)',
      fileSize: null,
      mimeType: null,
      version: 3,
      createdAt: '2025-12-15T00:00:00.000Z',
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: '1',
          sceneIndex: 0,
          headingRaw: 'INT. COURTROOM - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'COURTROOM',
          startLine: 1,
          endLine: 10,
          confidence: 0.95,
          sceneCharacters: [
            { character: { id: 'char-1', name: 'JUDGE', aliases: [] } },
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'COURTROOM', details: 'A high court in Chennai' }],
          sceneProps: [],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-2',
          sceneNumber: '2',
          sceneIndex: 1,
          headingRaw: 'EXT. TEMPLE - NIGHT',
          intExt: 'EXT',
          timeOfDay: 'NIGHT',
          location: 'KAPALEESHWARAR TEMPLE',
          startLine: 11,
          endLine: 20,
          confidence: 0.92,
          sceneCharacters: [
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
          ],
          sceneLocations: [{ name: 'KAPALEESHWARAR TEMPLE', details: 'Mylapore, Chennai' }],
          sceneProps: [{ prop: { name: 'DIYA' } }],
          vfxNotes: [],
          warnings: [{ warningType: 'VFX', description: 'Night shooting requires permits', severity: 'medium' }],
        },
        {
          id: 'scene-3',
          sceneNumber: '3',
          sceneIndex: 2,
          headingRaw: "INT. RAVI'S HOUSE - DAY",
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: "RAVI'S HOUSE",
          startLine: 21,
          endLine: 30,
          confidence: 0.98,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
          ],
          sceneLocations: [{ name: "RAVI'S HOUSE", details: 'A modest apartment in Adyar' }],
          sceneProps: [{ prop: { name: 'PHOTOGRAPH' } }, { prop: { name: 'COFFEE CUP' } }],
          vfxNotes: [],
          warnings: [],
        },
      ],
      scriptVersions: [{ id: 'v1', versionNumber: 3, extractionScore: 0.94 }],
      isDemo: true,
    },
    {
      id: 'demo-script-2',
      title: 'Kaathal - Scene Extensions',
      fileSize: null,
      mimeType: null,
      version: 1,
      createdAt: '2026-01-05T00:00:00.000Z',
      scenes: [],
      scriptVersions: [{ id: 'v2', versionNumber: 1, extractionScore: 0.88 }],
      isDemo: true,
    },
  ] as ScriptData[],
  characters: [
    { id: 'char-1', name: 'JUDGE', aliases: [], roleHint: 'Honorable Judge', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }] },
    { id: 'char-2', name: 'RAVI', aliases: ['Ravi Kumar'], roleHint: 'Protagonist', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }, { sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-3', name: 'DIVYA', aliases: [], roleHint: 'Female Lead', sceneCharacters: [{ sceneId: 'scene-2', isSpeaking: true }] },
    { id: 'char-4', name: 'SARATH', aliases: [], roleHint: 'Antagonist', sceneCharacters: [{ sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-5', name: 'KANMANI', aliases: ['Kani'], roleHint: 'Comic Relief', sceneCharacters: [] },
  ] as CharacterData[],
  analyses: [
    {
      id: 'analysis-1',
      analysisType: 'breakdown_summary',
      result: {
        totalScenes: 3,
        intScenes: 2,
        extScenes: 1,
        dayScenes: 2,
        nightScenes: 1,
        locations: ['COURTROOM', 'KAPALEESHWARAR TEMPLE', "RAVI'S HOUSE"],
        characters: ['JUDGE', 'RAVI', 'DIVYA', 'SARATH'],
        props: ['DIYA', 'PHOTOGRAPH', 'COFFEE CUP'],
      },
      modelUsed: 'gpt-4',
      createdAt: '2025-12-20T00:00:00.000Z',
    },
  ] as AnalysisData[],
}

interface SceneData {
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
}

interface CharacterData {
  id: string
  name: string
  aliases: string[]
  roleHint: string | null
  sceneCharacters: { sceneId: string; isSpeaking: boolean }[]
}

interface AnalysisData {
  id: string
  analysisType: string
  result: any
  modelUsed: string | null
  createdAt: string
}

type ActiveTab = 'upload' | 'scenes' | 'characters' | 'quality' | 'warnings' | 'compare' | 'analytics'

export default function ScriptsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [scripts, setScripts] = useState<ScriptData[]>([])
  const [characters, setCharacters] = useState<CharacterData[]>([])
  const [analyses, setAnalyses] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds

  const [sceneFilter, setSceneFilter] = useState('')
  const [intExtFilter, setIntExtFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedScene, setSelectedScene] = useState<SceneData | null>(null)
  
  // Sort state
  const [sortBy, setSortBy] = useState<'sceneNumber' | 'location' | 'timeOfDay' | 'characters' | 'confidence'>('sceneNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Compute active filter count (includes sort as active filters)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (sceneFilter) count++
    if (intExtFilter !== 'all') count++
    if (sortBy !== 'sceneNumber' || sortOrder !== 'asc') count++
    return count
  }, [sceneFilter, intExtFilter, sortBy, sortOrder])

  // Clear all filters (including sort and search)
  const clearFilters = useCallback(() => {
    setSceneFilter('')
    setIntExtFilter('all')
    setSortBy('sceneNumber')
    setSortOrder('asc')
  }, [])
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => Promise<void>>()
  const handlePrintRef = useRef<() => void>()
  const handleExportMarkdownRef = useRef<() => void>(() => {})

  // Refs for keyboard shortcut accessibility
  const showFiltersRef = useRef(showFilters)
  const intExtFilterRef = useRef(intExtFilter)
  const sortByRef = useRef(sortBy)
  const sortOrderRef = useRef(sortOrder)
  const clearFiltersRef = useRef<() => void>(() => {})
  const activeFilterCountRef = useRef(0)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)

  // Sync refs with state
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    intExtFilterRef.current = intExtFilter
  }, [intExtFilter])

  useEffect(() => {
    sortByRef.current = sortBy
  }, [sortBy])

  useEffect(() => {
    sortOrderRef.current = sortOrder
  }, [sortOrder])

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  // Active script
  const activeScript = scripts[0]
  
  // Derived values (computed with useMemo to avoid hook dependency issues)
  const scenes = useMemo(() => activeScript?.scenes || [], [activeScript])
  const allVfx = useMemo(() => scenes.flatMap(s => s.vfxNotes.map(v => ({ ...v, sceneNumber: s.sceneNumber }))), [scenes])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      // Context-aware number keys
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key)
        
        // When filter panel is OPEN: number keys filter by intExt or sort
        if (showFiltersRef.current) {
          e.preventDefault()
          
          // Keys 1-3: Filter by Interior/Exterior (toggle)
          if (num >= 1 && num <= 3) {
            const intExtOptions = ['all', 'INT', 'EXT']
            const target = intExtOptions[num - 1]
            const current = intExtFilterRef.current
            
            // Toggle: if same filter selected, clear to 'all'
            setIntExtFilter(current === target ? 'all' : target)
            return
          }
          
          // Keys 4-8: Sort by options (Shift required)
          if (e.shiftKey && num >= 1 && num <= 5) {
            e.preventDefault()
            const sortOptions: Array<'sceneNumber' | 'location' | 'timeOfDay' | 'characters' | 'confidence'> = 
              ['sceneNumber', 'location', 'timeOfDay', 'characters', 'confidence']
            setSortBy(sortOptions[num - 1])
            return
          }
          
          // Key 0: Clear intExt filter
          if (num === 0) {
            e.preventDefault()
            setIntExtFilter('all')
            return
          }
          
          return
        }
        
        // When filter panel is CLOSED: number keys switch tabs
        e.preventDefault()
        const tabs: ActiveTab[] = ['upload', 'scenes', 'characters', 'quality', 'warnings', 'compare', 'analytics']
        if (num >= 1 && num <= tabs.length) {
          setActiveTab(tabs[num - 1])
        }
        return
      }
      
      // Shift+0 clears sort
      if (e.shiftKey && e.key === '0') {
        e.preventDefault()
        setSortBy('sceneNumber')
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          handleExportMarkdownRef.current?.()
          break
        case 'p':
          e.preventDefault()
          handlePrintRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'x':
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            e.preventDefault()
            clearFiltersRef.current()
          }
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowFilters(false)
          setSceneFilter('')
          setIntExtFilter('all')
          setSortBy('sceneNumber')
          setSortOrder('asc')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  // Click outside to close filter menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  const fetchData = useCallback(async () => {
    if (!loading) {
      setRefreshing(true)
    }
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      
      // Handle demo mode from API
      if (data.demoData) {
        setScripts(data.demoData.scripts || [])
        setCharacters(data.demoData.characters || [])
        setAnalyses(data.demoData.analyses || [])
        setIsDemoMode(true)
      } else if (data.scripts) {
        setScripts(data.scripts)
        setCharacters(data.characters || [])
        setAnalyses(data.analyses || [])
        setIsDemoMode(data.scripts.some((s: ScriptData) => s.isDemo))
      } else if (Array.isArray(data)) {
        setScripts(data)
      }
    } catch (e) {
      console.error('Fetch scripts error:', e)
      // Use demo fallback
      setScripts(DEMO_SCRIPT_DATA.scripts)
      setCharacters(DEMO_SCRIPT_DATA.characters)
      setAnalyses(DEMO_SCRIPT_DATA.analyses)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastUpdated(new Date())
    }
  }, [])
  
  // Store fetchData in ref for keyboard shortcuts
  fetchDataRef.current = fetchData

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const intervalId = setInterval(() => {
      setRefreshing(true)
      fetchData()
    }, autoRefreshInterval * 1000)
    
    return () => clearInterval(intervalId)
  }, [autoRefresh, autoRefreshInterval, fetchData])

  // Export functions
  const exportToCSV = () => {
    if (!activeScript) return
    setExporting(true)
    
    const rows = [['Scene', 'Type', 'Time', 'Location', 'Characters', 'Props', 'VFX Notes', 'Warnings']]
    filteredScenes.forEach(scene => {
      rows.push([
        scene.sceneNumber,
        scene.intExt || '',
        scene.timeOfDay || '',
        scene.location || '',
        scene.sceneCharacters.map(c => c.character.name).join('; '),
        scene.sceneProps.map(p => p.prop.name).join('; '),
        scene.vfxNotes.map(v => v.description).join('; '),
        scene.warnings.map(w => w.description).join('; ')
      ])
    })

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scripts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  const exportToJSON = () => {
    if (!activeScript) return
    setExporting(true)

    const exportData = {
      exportDate: new Date().toISOString(),
      script: {
        id: activeScript.id,
        title: activeScript.title,
        version: activeScript.version,
        createdAt: activeScript.createdAt,
      },
      filters: {
        intExt: intExtFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
        searchQuery: sceneFilter,
      },
      summary: {
        totalScenes: scenes.length,
        filteredScenes: filteredScenes.length,
        intScenes: scenes.filter(s => s.intExt === 'INT').length,
        extScenes: scenes.filter(s => s.intExt === 'EXT').length,
        dayScenes: scenes.filter(s => s.timeOfDay === 'DAY').length,
        nightScenes: scenes.filter(s => s.timeOfDay === 'NIGHT').length,
        totalCharacters: characters.length,
        totalWarnings: allWarnings.length,
        totalVfxNotes: allVfx.length,
      },
      scenes: filteredScenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        heading: scene.headingRaw,
        intExt: scene.intExt,
        timeOfDay: scene.timeOfDay,
        location: scene.location,
        confidence: scene.confidence,
        characters: scene.sceneCharacters.map(c => c.character.name),
        locations: scene.sceneLocations.map(l => ({ name: l.name, details: l.details })),
        props: scene.sceneProps.map(p => p.prop.name),
        vfxNotes: scene.vfxNotes,
        warnings: scene.warnings,
      })),
      characters: characters.map(c => ({
        name: c.name,
        aliases: c.aliases,
        roleHint: c.roleHint,
        scenesAppeared: c.sceneCharacters.length,
      })),
      warnings: allWarnings,
      vfxNotes: allVfx,
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scripts-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  // Markdown export function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleExportMarkdown = () => {
    if (!activeScript || scenes.length === 0) return

    // Compute filtered scenes inline (same logic as filteredScenes useMemo)
    let filtered = scenes.filter(s => {
      const matchesSearch = !sceneFilter ||
        s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
      const matchesIntExt = intExtFilter === 'all' || s.intExt === intExtFilter
      return matchesSearch && matchesIntExt
    })
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'sceneNumber':
          const numA = parseInt(a.sceneNumber.replace(/\D/g, '')) || 0
          const numB = parseInt(b.sceneNumber.replace(/\D/g, '')) || 0
          comparison = numA - numB
          break
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '')
          break
        case 'timeOfDay':
          comparison = (a.timeOfDay || '').localeCompare(b.timeOfDay || '')
          break
        case 'characters':
          comparison = a.sceneCharacters.length - b.sceneCharacters.length
          break
        case 'confidence':
          comparison = a.confidence - b.confidence
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    if (filtered.length === 0) return

    // Calculate summary stats
    const totalScenes = scenes.length
    const intScenes = scenes.filter(s => s.intExt === 'INT').length
    const extScenes = scenes.filter(s => s.intExt === 'EXT').length
    const dayScenes = scenes.filter(s => s.timeOfDay === 'DAY').length
    const nightScenes = scenes.filter(s => s.timeOfDay === 'NIGHT').length
    const totalCharacters = characters.length
    const totalLocations = new Set(scenes.map(s => s.location)).size
    const totalProps = new Set(scenes.flatMap(s => s.sceneProps.map(p => p.prop.name))).size
    const totalVfxNotes = allVfx.length
    const totalWarnings = allWarnings.length

    // Build Markdown content
    let markdown = `# ${activeScript.title}

*Generated by CinePilot on ${new Date().toISOString().split('T')[0]}*

## Script Overview

| Field | Value |
|-------|-------|
| Title | ${activeScript.title} |
| Version | ${activeScript.version} |
| Created | ${activeScript.createdAt.split('T')[0]} |
| Total Scenes | ${totalScenes} |
| Characters | ${totalCharacters} |
| Locations | ${totalLocations} |
| Props | ${totalProps} |
| VFX Notes | ${totalVfxNotes} |
| Warnings | ${totalWarnings} |

## Scene Summary

| Type | Count |
|------|-------|
| INT | ${intScenes} |
| EXT | ${extScenes} |
| DAY | ${dayScenes} |
| NIGHT | ${nightScenes} |

## Filters Applied

| Filter | Value |
|--------|-------|
| Type | ${intExtFilter === 'all' ? 'All' : intExtFilter} |
| Sort | ${sortBy} (${sortOrder}) |
| Search | ${sceneFilter || 'None'} |

## Scenes Detail

`

    filtered.forEach((scene, idx) => {
      const sceneChars = scene.sceneCharacters.map(c => c.character.name).join(', ')
      const sceneProps = scene.sceneProps.map(p => p.prop.name).join(', ')
      const sceneVfx = scene.vfxNotes.map(v => v.description).join('; ')
      const sceneWarnings = scene.warnings.map(w => w.description).join('; ')

      markdown += `### Scene ${scene.sceneNumber}: ${scene.headingRaw || 'Untitled'}

| Field | Value |
|-------|-------|
| Scene # | ${scene.sceneNumber} |
| Type | ${scene.intExt || '-'} |
| Time | ${scene.timeOfDay || '-'} |
| Location | ${scene.location || '-'} |
| Confidence | ${scene.confidence ? (scene.confidence * 100).toFixed(0) + '%' : '-'} |
| Characters | ${sceneChars || '-'} |
| Props | ${sceneProps || '-'} |
| VFX Notes | ${sceneVfx || '-'} |
| Warnings | ${sceneWarnings || '-'} |

`
    })

    // Characters section
    if (characters.length > 0) {
      markdown += `## Characters

| Name | Aliases | Role Hint | Scenes |
|------|---------|-----------|--------|
`
      characters.forEach(c => {
        markdown += `| ${c.name} | ${c.aliases?.join(', ') || '-'} | ${c.roleHint || '-'} | ${c.sceneCharacters.length} |\n`
      })
      markdown += '\n'
    }

    // VFX Notes section
    if (allVfx.length > 0) {
      markdown += `## VFX Notes

| Scene | Description | Type |
|-------|------------|------|
`
      allVfx.forEach(v => {
        markdown += `| ${v.sceneNumber} | ${v.description} | ${v.vfxType || '-'} |\n`
      })
      markdown += '\n'
    }

    // Warnings section
    if (allWarnings.length > 0) {
      markdown += `## Warnings

| Scene | Type | Description | Severity |
|-------|------|-------------|----------|
`
      allWarnings.forEach(w => {
        markdown += `| ${w.sceneNumber || '-'} | ${w.warningType || '-'} | ${w.description} | ${w.severity || '-'} |\n`
      })
    }

    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print functionality
  const handlePrint = useCallback(() => {
    if (!activeScript || scenes.length === 0) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Generate summary stats
    const intScenes = scenes.filter(s => s.intExt === 'INT').length
    const extScenes = scenes.filter(s => s.intExt === 'EXT').length
    const dayScenes = scenes.filter(s => s.timeOfDay === 'DAY').length
    const nightScenes = scenes.filter(s => s.timeOfDay === 'NIGHT').length
    const totalCharacters = new Set(scenes.flatMap(s => s.sceneCharacters.map(c => c.character.name))).size

    // Build filter info for print header
    const filterInfo = []
    if (intExtFilter !== 'all') filterInfo.push(`Filter: ${intExtFilter}`)
    if (sortBy !== 'sceneNumber' || sortOrder !== 'asc') filterInfo.push(`Sort: ${sortBy} (${sortOrder})`)
    if (sceneFilter) filterInfo.push(`Search: "${sceneFilter}"`)

    const statsHtml = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1a1a2e;">Script Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
          <div><strong>Total Scenes:</strong> ${scenes.length}</div>
          <div><strong>Filtered:</strong> ${filteredScenes.length}</div>
          <div><strong>INT:</strong> ${intScenes}</div>
          <div><strong>EXT:</strong> ${extScenes}</div>
          <div><strong>Characters:</strong> ${totalCharacters}</div>
          <div><strong>Day:</strong> ${dayScenes}</div>
          <div><strong>Night:</strong> ${nightScenes}</div>
          <div><strong>Locations:</strong> ${new Set(scenes.map(s => s.location)).size}</div>
          <div><strong>VFX Shots:</strong> ${allVfx.length}</div>
        </div>
        ${filterInfo.length > 0 ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          ${filterInfo.join(' | ')}
        </div>
        ` : ''}
      </div>
    `

    // Generate scenes table using filtered scenes
    const scenesHtml = filteredScenes.map(scene => {
      const characters = scene.sceneCharacters.map(c => c.character.name).join(', ')
      const props = scene.sceneProps.map(p => p.prop.name).join(', ')
      const vfx = scene.vfxNotes.map(v => v.description).join(', ')
      const warnings = scene.warnings.map(w => w.description).join(', ')
      
      const rowStyle = scene.sceneIndex % 2 === 0 ? 'background: #fff;' : 'background: #f9f9f9;'
      const warningColor = warnings ? 'color: #dc2626;' : ''
      
      return `
        <tr style="${rowStyle}">
          <td style="padding: 8px; border: 1px solid #ddd;">${scene.sceneNumber}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scene.intExt || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scene.timeOfDay || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scene.location || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${characters || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${props || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${vfx || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; ${warningColor}">${warnings || '-'}</td>
        </tr>
      `
    }).join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Script Report - ${activeScript.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #1a1a2e; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #374151; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
            @media print {
              body { padding: 0; }
              table { font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>${activeScript.title}</h1>
          <p class="subtitle">Version ${activeScript.version} | Exported: ${new Date().toLocaleDateString()}</p>
          ${statsHtml}
          <table>
            <thead>
              <tr>
                <th>Scene</th>
                <th>INT/EXT</th>
                <th>Time</th>
                <th>Location</th>
                <th>Characters</th>
                <th>Props</th>
                <th>VFX Notes</th>
                <th>Warnings</th>
              </tr>
            </thead>
            <tbody>
              ${scenesHtml}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update ref for keyboard shortcuts
  useEffect(() => {
    handlePrintRef.current = handlePrint;
  }, [handlePrint]);

  // Update ref for markdown export
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown;
  }, [handleExportMarkdown]);

  // Copy scene to clipboard
  const handleCopyScene = async (scene: SceneData) => {
    const text = `${scene.headingRaw}

Characters: ${scene.sceneCharacters.map(c => c.character.name).join(', ') || 'None'}
Locations: ${scene.sceneLocations.map(l => l.name).join(', ') || 'None'}
Props: ${scene.sceneProps.map(p => p.prop.name).join(', ') || 'None'}
VFX Notes: ${scene.vfxNotes.map(v => v.description).join(', ') || 'None'}
${scene.warnings.length > 0 ? `Warnings: ${scene.warnings.map(w => w.description).join(', ')}` : ''}`

    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(scene.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Copy script summary to clipboard
  const handleCopyScriptSummary = async () => {
    if (!activeScript) return

    const text = `${activeScript.title} (v${activeScript.version})

Total Scenes: ${scenes.length}
INT Scenes: ${scenes.filter(s => s.intExt === 'INT').length}
EXT Scenes: ${scenes.filter(s => s.intExt === 'EXT').length}
Day Scenes: ${scenes.filter(s => s.timeOfDay === 'DAY').length}
Night Scenes: ${scenes.filter(s => s.timeOfDay === 'NIGHT').length}
Total Characters: ${new Set(scenes.flatMap(s => s.sceneCharacters.map(c => c.character.name))).size}
Locations: ${new Set(scenes.map(s => s.location)).size}
VFX Notes: ${allVfx.length}
Warnings: ${allWarnings.length}`

    try {
      await navigator.clipboard.writeText(text)
      setCopiedId('summary')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const qualityAnalysis = analyses.find(a => a.analysisType === 'quality_score')
  const summaryAnalysis = analyses.find(a => a.analysisType === 'breakdown_summary')
  const allWarnings = scenes.flatMap(s => s.warnings.map(w => ({ ...w, sceneNumber: s.sceneNumber })))

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleFileUpload(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadProgress('Uploading script...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setUploadProgress('Processing script (extraction + AI analysis)...')
      const res = await fetch('/api/scripts', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setUploadProgress(`Done! ${data.sceneCount || 0} scenes detected.`)
      await fetchData()
      setActiveTab('scenes')
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const runQualityAnalysis = async () => {
    if (!activeScript) {
      setError('No script available to analyze')
      return
    }
    setRunningAnalysis(true)
    setAnalysisProgress('Running quality analysis...')
    setError(null)

    try {
      const res = await fetch('/api/scripts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: activeScript.id })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysisProgress('Quality analysis complete!')
      await fetchData()
      setActiveTab('quality')
    } catch (e: any) {
      setError(e.message || 'Quality analysis failed')
    } finally {
      setRunningAnalysis(false)
      setTimeout(() => setAnalysisProgress(''), 3000)
    }
  }

  const filteredScenes = useMemo(() => {
    let result = scenes.filter(s => {
      const matchesSearch = !sceneFilter ||
        s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
      const matchesIntExt = intExtFilter === 'all' || s.intExt === intExtFilter
      return matchesSearch && matchesIntExt
    })
    
    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'sceneNumber':
          // Natural sort for scene numbers (handles 1, 2, 10, 10a, etc.)
          const numA = parseInt(a.sceneNumber.replace(/\D/g, '')) || 0
          const numB = parseInt(b.sceneNumber.replace(/\D/g, '')) || 0
          comparison = numA - numB
          break
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '')
          break
        case 'timeOfDay':
          comparison = (a.timeOfDay || '').localeCompare(b.timeOfDay || '')
          break
        case 'characters':
          comparison = a.sceneCharacters.length - b.sceneCharacters.length
          break
        case 'confidence':
          comparison = a.confidence - b.confidence
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [scenes, sceneFilter, intExtFilter, sortBy, sortOrder])

  const tabs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'scenes', label: 'Scenes', count: scenes.length },
    { key: 'characters', label: 'Characters', count: characters.length },
    { key: 'quality', label: 'Quality' },
    { key: 'warnings', label: 'Warnings', count: allWarnings.length },
    { key: 'compare', label: 'Compare' },
    { key: 'analytics', label: 'Analytics' },
  ]

  // Analytics data for charts
  const analyticsData = useMemo(() => {
    // Scene distribution by INT/EXT
    const intExtData = [
      { name: 'INT', value: scenes.filter(s => s.intExt === 'INT').length, color: '#3b82f6' },
      { name: 'EXT', value: scenes.filter(s => s.intExt === 'EXT').length, color: '#f59e0b' },
      { name: 'INT/EXT', value: scenes.filter(s => s.intExt === 'INT/EXT').length, color: '#8b5cf6' },
    ].filter(d => d.value > 0)

    // Scene distribution by time of day
    const timeOfDayData = [
      { name: 'DAY', value: scenes.filter(s => s.timeOfDay === 'DAY').length, color: '#fbbf24' },
      { name: 'NIGHT', value: scenes.filter(s => s.timeOfDay === 'NIGHT').length, color: '#6366f1' },
      { name: 'DAWN', value: scenes.filter(s => s.timeOfDay === 'DAWN').length, color: '#f97316' },
      { name: 'DUSK', value: scenes.filter(s => s.timeOfDay === 'DUSK').length, color: '#ec4899' },
      { name: 'CONTINUOUS', value: scenes.filter(s => s.timeOfDay === 'CONTINUOUS').length, color: '#14b8a6' },
    ].filter(d => d.value > 0)

    // Scenes per location (top 8)
    const locationCounts: Record<string, number> = {}
    scenes.forEach(scene => {
      const loc = scene.location || 'Unknown'
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })
    const locationData = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Character frequency (top 10)
    const charCounts: Record<string, number> = {}
    scenes.forEach(scene => {
      scene.sceneCharacters.forEach(sc => {
        const charName = sc.character.name
        charCounts[charName] = (charCounts[charName] || 0) + 1
      })
    })
    const characterData = Object.entries(charCounts)
      .map(([name, appearances]) => ({ name, appearances }))
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 10)

    // Warning distribution by severity
    const warningSeverityData = [
      { name: 'High', value: allWarnings.filter(w => w.severity === 'high').length, color: '#ef4444' },
      { name: 'Medium', value: allWarnings.filter(w => w.severity === 'medium').length, color: '#f59e0b' },
      { name: 'Low', value: allWarnings.filter(w => w.severity === 'low').length, color: '#64748b' },
    ].filter(d => d.value > 0)

    // Confidence distribution
    const highConfidence = scenes.filter(s => (s.confidence || 0) >= 0.9).length
    const mediumConfidence = scenes.filter(s => (s.confidence || 0) >= 0.7 && (s.confidence || 0) < 0.9).length
    const lowConfidence = scenes.filter(s => (s.confidence || 0) < 0.7).length
    const confidenceData = [
      { name: 'High (90%+)', value: highConfidence, color: '#10b981' },
      { name: 'Medium (70-89%)', value: mediumConfidence, color: '#f59e0b' },
      { name: 'Low (<70%)', value: lowConfidence, color: '#ef4444' },
    ].filter(d => d.value > 0)

    return {
      intExtData,
      timeOfDayData,
      locationData,
      characterData,
      warningSeverityData,
      confidenceData,
      totalScenes: scenes.length,
      totalCharacters: Object.keys(charCounts).length,
      totalWarnings: allWarnings.length,
      avgConfidence: scenes.length > 0 
        ? Math.round(scenes.reduce((sum, s) => sum + (s.confidence || 0), 0) / scenes.length * 100) 
        : 0,
    }
  }, [scenes, allWarnings])

  const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1']

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading scripts...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-200">
            Demo mode active. Upload a script to analyze your own content.
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Script Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeScript
              ? `${activeScript.title} (v${activeScript.version}) — ${scenes.length} scenes`
              : 'Upload and analyze your screenplay'}
          </p>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && <span className="ml-2 text-emerald-400">Auto: {autoRefreshInterval}s</span>}
            </p>
          )}
        </div>
        {activeScript && (
          <div className="flex gap-2 items-center">
            <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded">
              Analyzed
            </span>
            {activeScript.scriptVersions[0]?.extractionScore && (
              <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                Quality: {activeScript.scriptVersions[0].extractionScore}/100
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { fetchData(); setLastUpdated(new Date()) }}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
              refreshing || autoRefresh 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title="Refresh (R)"
            disabled={refreshing || autoRefresh}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
              autoRefresh 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-transparent'
            }`}
            title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Auto</span>
          </button>
          {autoRefresh && (
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          )}
          {activeScript && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-2 bg-cinepilot-accent hover:bg-cinepilot-accent/80 text-gray-900 rounded-lg flex items-center gap-2 text-sm font-medium"
                title="Export (E)"
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">Export Markdown</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {activeScript && scenes.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
              title="Print script (P)"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          )}
          {/* Filter Toggle Button */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'
              }`}
              title="Filter (F)"
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Filter & Sort</span>
                    <span className="text-xs text-cyan-400 ml-2">(1-3 int/ext, Shift+1-5 sort, 0/X clear)</span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs px-2 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded transition-colors"
                    >
                      Clear ({activeFilterCount})
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Sort By <span className="text-emerald-400 normal-case">(Shift+1-5)</span></label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { key: 'sceneNumber', label: 'Scene #', shortcut: '1' },
                        { key: 'location', label: 'Location', shortcut: '2' },
                        { key: 'timeOfDay', label: 'Time', shortcut: '3' },
                        { key: 'characters', label: 'Chars', shortcut: '4' },
                        { key: 'confidence', label: 'Confidence', shortcut: '5' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setSortBy(opt.key as typeof sortBy)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            sortBy === opt.key
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          {opt.label} <span className="text-emerald-400 ml-1">(Shift+{opt.shortcut})</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                        sortBy !== 'sceneNumber' || sortOrder !== 'asc'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {sortOrder === 'asc' ? (
                        <>
                          <span>↑</span> <span>Ascending</span>
                        </>
                      ) : (
                        <>
                          <span>↓</span> <span>Descending</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-700" />
                  
                  {/* Interior/Exterior Filter */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Interior/Exterior <span className="text-cyan-400 normal-case">(1-3, 0 to clear)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'All', shortcut: '1' },
                        { key: 'INT', label: 'Interior', shortcut: '2' },
                        { key: 'EXT', label: 'Exterior', shortcut: '3' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setIntExtFilter(opt.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            intExtFilter === opt.key
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          {opt.label} <span className="text-cyan-400 ml-1">({opt.shortcut})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 text-sm">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.key
                ? 'bg-cinepilot-card text-cinepilot-accent border border-b-0 border-cinepilot-border'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Upload Script</h2>
            <label
              className={`block cursor-pointer ${dragActive ? 'scale-[1.01]' : ''} transition-transform`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                dragActive
                  ? 'border-cinepilot-accent bg-cinepilot-accent/10'
                  : 'border-gray-700 hover:border-cinepilot-accent'
              }`}>
                {uploading ? (
                  <div className="space-y-3">
                    <div className="w-8 h-8 border-2 border-cinepilot-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-gray-300">{uploadProgress}</div>
                    <div className="text-gray-500 text-xs">This may take a minute for AI analysis</div>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl mb-3 opacity-50">+</div>
                    <div className="text-gray-300 font-medium">Drop script here or click to upload</div>
                    <div className="text-gray-500 text-sm mt-2">PDF, DOCX, FDX, TXT supported (max 10MB)</div>
                    <div className="text-gray-600 text-xs mt-3">
                      AI will automatically extract text, detect scenes, characters, locations, props, VFX notes, and safety warnings.
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.fdx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <div className="mt-4 flex gap-2">
              {['PDF', 'DOCX', 'FDX', 'TXT'].map(fmt => (
                <span key={fmt} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">{fmt}</span>
              ))}
            </div>
          </div>

          {/* Summary Cards (if data exists) */}
          {summaryAnalysis?.result && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Breakdown Summary</h2>
                <button
                  onClick={handleCopyScriptSummary}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
                  title="Copy summary to clipboard"
                >
                  {copiedId === 'summary' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedId === 'summary' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Scenes" value={summaryAnalysis.result.total_scenes} />
                <StatCard label="Characters" value={summaryAnalysis.result.unique_characters} />
                <StatCard label="Locations" value={summaryAnalysis.result.unique_locations} />
                <StatCard label="VFX Shots" value={summaryAnalysis.result.vfx_count} />
                <StatCard label="Safety Warnings" value={summaryAnalysis.result.safety_warnings_count} />
                {summaryAnalysis.result.estimated_shoot_days && (
                  <StatCard label="Est. Shoot Days" value={summaryAnalysis.result.estimated_shoot_days} />
                )}
              </div>
              {summaryAnalysis.result.summary && (
                <p className="mt-4 text-sm text-gray-400">{summaryAnalysis.result.summary}</p>
              )}
              {summaryAnalysis.result.cultural_notes?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-blue-400 mb-2">Cultural Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {summaryAnalysis.result.cultural_notes.map((n: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scenes Tab */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search scenes... (/)"
              value={sceneFilter}
              onChange={e => setSceneFilter(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-cinepilot-accent focus:outline-none"
            />
            <select
              value={intExtFilter}
              onChange={e => setIntExtFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none"
            >
              <option value="all">All</option>
              <option value="INT">INT</option>
              <option value="EXT">EXT</option>
              <option value="INT/EXT">INT/EXT</option>
            </select>
          </div>

          {filteredScenes.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              {scenes.length === 0 ? 'No scenes yet. Upload a script first.' : 'No scenes match your filter.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScenes.map(scene => (
                <div
                  key={scene.id}
                  onClick={() => setSelectedScene(selectedScene?.id === scene.id ? null : scene)}
                  className={`bg-cinepilot-card border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedScene?.id === scene.id
                      ? 'border-cinepilot-accent'
                      : 'border-cinepilot-border hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">{scene.sceneNumber}</span>
                        {scene.intExt && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            scene.intExt === 'INT' ? 'bg-blue-900/40 text-blue-400' :
                            scene.intExt === 'EXT' ? 'bg-amber-900/40 text-amber-400' :
                            'bg-purple-900/40 text-purple-400'
                          }`}>{scene.intExt}</span>
                        )}
                        {scene.timeOfDay && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            scene.timeOfDay === 'NIGHT' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-yellow-900/40 text-yellow-400'
                          }`}>{scene.timeOfDay}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">{scene.headingRaw || scene.location || 'Untitled Scene'}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {scene.sceneCharacters.length > 0 && (
                        <span>{scene.sceneCharacters.length} chars</span>
                      )}
                      {scene.sceneProps.length > 0 && (
                        <span>{scene.sceneProps.length} props</span>
                      )}
                      {scene.startLine && scene.endLine && (
                        <span>L{scene.startLine}-{scene.endLine}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyScene(scene)
                        }}
                        className="ml-2 p-1.5 rounded hover:bg-gray-700 transition-colors"
                        title="Copy scene details"
                      >
                        {copiedId === scene.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded scene detail */}
                  {selectedScene?.id === scene.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                      {scene.sceneCharacters.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Characters</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneCharacters.map(sc => (
                              <span key={sc.character.id} className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                                {sc.character.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.sceneLocations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Locations</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneLocations.map((loc, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                                {loc.name}{loc.details ? ` (${loc.details})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.sceneProps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Props</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneProps.map(sp => (
                              <span key={sp.prop.name} className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 rounded">{sp.prop.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.vfxNotes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">VFX Notes</h4>
                          {scene.vfxNotes.map((v, i) => (
                            <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded ${v.vfxType === 'explicit' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{v.vfxType}</span>
                              {v.description}
                            </div>
                          ))}
                        </div>
                      )}
                      {scene.warnings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-red-400 mb-1.5">Warnings</h4>
                          {scene.warnings.map((w, i) => (
                            <div key={i} className="text-xs text-red-300 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                w.severity === 'high' ? 'bg-red-500' : w.severity === 'med' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                              {w.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          {characters.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No characters extracted yet. Upload a script first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map(char => (
                <div key={char.id} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-200">{char.name}</h3>
                      {char.roleHint && <span className="text-xs text-gray-500">{char.roleHint}</span>}
                    </div>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {char.sceneCharacters.length} scenes
                    </span>
                  </div>
                  {char.aliases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {char.aliases.map((alias, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded">{alias}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {/* Run Analysis Button */}
          {activeScript && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-200">AI Quality Analysis</h3>
                <p className="text-sm text-gray-500">Analyze screenplay structure, formatting, and dialogue quality</p>
              </div>
              <button
                onClick={runQualityAnalysis}
                disabled={runningAnalysis}
                className="px-4 py-2 bg-cinepilot-accent hover:bg-cinepilot-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {runningAnalysis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          )}
          {analysisProgress && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-green-400 text-sm">
              {analysisProgress}
            </div>
          )}
          {qualityAnalysis?.result ? (
            <>
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                <h2 className="font-semibold mb-4">Screenplay Quality Scores</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(qualityAnalysis.result.scores || {}).map(([key, val]) => (
                    <QualityGauge key={key} label={key} score={val as number} />
                  ))}
                </div>
              </div>
              {qualityAnalysis.result.notes?.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h3 className="font-medium mb-3 text-gray-300">Notes</h3>
                  <ul className="space-y-1.5">
                    {qualityAnalysis.result.notes.map((n: string, i: number) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-gray-600 mt-0.5">-</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {qualityAnalysis.result.quick_fixes?.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h3 className="font-medium mb-3 text-yellow-400">Quick Fixes</h3>
                  <ul className="space-y-1.5">
                    {qualityAnalysis.result.quick_fixes.map((f: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-300/80 flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">!</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center">
              {activeScript ? (
                <div className="space-y-2">
                  <p className="text-gray-400">No quality analysis yet.</p>
                  <p className="text-sm text-gray-500">Click "Run Analysis" above to analyze your screenplay.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">No script uploaded yet.</p>
                  <p className="text-sm text-gray-500">Upload a script first, then run quality analysis.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warnings Tab */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          {allWarnings.length === 0 && allVfx.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No warnings detected.
            </div>
          ) : (
            <>
              {allWarnings.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-red-400">Safety & Content Warnings</h2>
                  <div className="space-y-2">
                    {allWarnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          w.severity === 'high' ? 'bg-red-500' : w.severity === 'med' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">Scene {w.sceneNumber}</span>
                        <span className="text-sm text-gray-300 flex-1">{w.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          w.severity === 'high' ? 'bg-red-900/40 text-red-400' :
                          w.severity === 'med' ? 'bg-yellow-900/40 text-yellow-400' :
                          'bg-gray-800 text-gray-500'
                        }`}>{w.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {allVfx.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-purple-400">VFX Notes</h2>
                  <div className="space-y-2">
                    {allVfx.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          v.vfxType === 'explicit' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                        }`}>{v.vfxType}</span>
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">Scene {v.sceneNumber}</span>
                        <span className="text-sm text-gray-300 flex-1">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && <ScriptComparison />}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <FileText className="w-4 h-4" /> Total Scenes
              </div>
              <div className="text-2xl font-bold text-white">{analyticsData.totalScenes}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <CheckCircle className="w-4 h-4" /> Characters
              </div>
              <div className="text-2xl font-bold text-white">{analyticsData.totalCharacters}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <AlertCircle className="w-4 h-4" /> Warnings
              </div>
              <div className="text-2xl font-bold text-white">{analyticsData.totalWarnings}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Zap className="w-4 h-4" /> Avg Confidence
              </div>
              <div className="text-2xl font-bold text-white">{analyticsData.avgConfidence}%</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* INT/EXT Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-400" /> Scene Type (INT/EXT)
              </h3>
              {analyticsData.intExtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.intExtData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {analyticsData.intExtData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No scene data</div>
              )}
            </div>

            {/* Time of Day Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> Time of Day
              </h3>
              {analyticsData.timeOfDayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.timeOfDayData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {analyticsData.timeOfDayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No time data</div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Scenes per Location */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" /> Top Locations
              </h3>
              {analyticsData.locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={120} stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No location data</div>
              )}
            </div>

            {/* Character Appearances */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Character Appearances
              </h3>
              {analyticsData.characterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.characterData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar dataKey="appearances" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No character data</div>
              )}
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Warning Severity */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" /> Warnings by Severity
              </h3>
              {analyticsData.warningSeverityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.warningSeverityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {analyticsData.warningSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No warnings</div>
              )}
            </div>

            {/* Confidence Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" /> Confidence Distribution
              </h3>
              {analyticsData.confidenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {analyticsData.confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">No confidence data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filters Closed - Tab Switching */}
            <div className="mb-4">
              <p className="text-xs text-amber-400 mb-2 uppercase tracking-wider">When Filters Closed (1-7: Switch Tabs)</p>
              <div className="space-y-1 text-sm">
                {[
                  { key: '1', action: 'Upload tab' },
                  { key: '2', action: 'Scenes tab' },
                  { key: '3', action: 'Characters tab' },
                  { key: '4', action: 'Quality tab' },
                  { key: '5', action: 'Warnings tab' },
                  { key: '6', action: 'Compare tab' },
                  { key: '7', action: 'Analytics tab' },
                ].map(({ key, action }) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400">{action}</span>
                    <kbd className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filters Open - Filtering & Sorting */}
            <div className="mb-4">
              <p className="text-xs text-cyan-400 mb-2 uppercase tracking-wider">When Filters Open (1-3: Int/Ext, Shift+1-5: Sort, X: Clear)</p>
              <div className="space-y-1 text-sm">
                {[
                  { key: '1', action: 'Show All', color: 'text-cyan-400' },
                  { key: '2', action: 'Interior (INT)', color: 'text-cyan-400' },
                  { key: '3', action: 'Exterior (EXT)', color: 'text-cyan-400' },
                  { key: '0', action: 'Clear int/ext filter', color: 'text-cyan-400' },
                  { key: 'X', action: 'Clear all filters', color: 'text-amber-400' },
                  { key: 'Shift+1', action: 'Sort by Scene #', color: 'text-emerald-400' },
                  { key: 'Shift+2', action: 'Sort by Location', color: 'text-emerald-400' },
                  { key: 'Shift+3', action: 'Sort by Time', color: 'text-emerald-400' },
                  { key: 'Shift+4', action: 'Sort by Characters', color: 'text-emerald-400' },
                  { key: 'Shift+5', action: 'Sort by Confidence', color: 'text-emerald-400' },
                  { key: 'Shift+0', action: 'Clear sort', color: 'text-emerald-400' },
                ].map(({ key, action, color }) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <span className={`${color || 'text-gray-400'}`}>{action}</span>
                    <kbd className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            
            {/* General Shortcuts */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">General Shortcuts</p>
              <div className="space-y-1 text-sm">
                {[
                  { key: 'R', action: 'Refresh scripts' },
                  { key: 'A', action: 'Toggle auto-refresh', color: 'text-emerald-400' },
                  { key: 'E', action: 'Export menu' },
                  { key: 'M', action: 'Export Markdown' },
                  { key: 'P', action: 'Print script' },
                  { key: 'F', action: 'Toggle filters' },
                  { key: 'S', action: 'Toggle sort order' },
                  { key: 'X', action: 'Clear all filters', color: 'text-amber-400' },
                  { key: '/', action: 'Focus search' },
                  { key: '?', action: 'Show this help' },
                  { key: 'Esc', action: 'Close modal / Clear filters' },
                ].map(({ key, action, color }) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <span className={color || 'text-gray-400'}>{action}</span>
                    <kbd className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-cinepilot-accent">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function QualityGauge({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? 'text-green-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-orange-400' :
    'text-red-400'

  const bgColor =
    score >= 80 ? 'bg-green-400' :
    score >= 60 ? 'bg-yellow-400' :
    score >= 40 ? 'bg-orange-400' :
    'bg-red-400'

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
        <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-2 capitalize">{label.replace(/_/g, ' ')}</div>
    </div>
  )
}
