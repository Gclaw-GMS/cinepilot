'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Lock, Unlock, Loader2, Save, Download, HelpCircle, X, ChevronDown, Printer, BarChart3, PieChart as PieChartIcon, TrendingUp, Camera, Timer, Filter, Clock, RefreshCw } from 'lucide-react'
import { Skeleton, StatsCardSkeleton, ShotRowSkeleton, SceneListSkeleton } from '@/components/ui/Skeleton'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ShotData {
  id: string
  shotIndex: number
  beatIndex: number
  shotText: string
  characters: string[]
  shotSize: string | null
  cameraAngle: string | null
  cameraMovement: string | null
  focalLengthMm: number | null
  lensType: string | null
  keyStyle: string | null
  colorTemp: string | null
  durationEstSec: number | null
  confidenceCamera: number | null
  confidenceLens: number | null
  confidenceLight: number | null
  confidenceDuration: number | null
  isLocked: boolean
  userEdited: boolean
  scene: {
    id: string
    sceneNumber: string
    headingRaw: string | null
    intExt: string | null
    timeOfDay: string | null
    location: string | null
  }
}

interface SceneInfo {
  id: string
  sceneNumber: string
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  _count: { shots: number }
}

const STYLE_PRESETS = [
  { key: 'maniRatnam', label: 'Mani Ratnam', desc: 'Elegant, motivated movement, longer takes, warm palette' },
  { key: 'vetrimaaran', label: 'Vetrimaaran', desc: 'Grounded realism, handheld, documentary feel' },
  { key: 'lokeshKanagaraj', label: 'Lokesh Kanagaraj', desc: 'Stylized, kinetic camera, fast action grammar' },
  { key: 'custom', label: 'Custom', desc: 'Define your own style' },
] as const

const SHOT_SIZES = ['ECU', 'CU', 'MCU', 'MS', 'MWS', 'WS', 'VWS', 'EWS']
const ANGLES = ['high', 'low', 'eye', 'dutch', 'bird', 'worm']
const MOVEMENTS = ['static', 'pan', 'tilt', 'dolly', 'track', 'crane', 'handheld', 'steadicam', 'drone']
const LENSES = [16, 24, 35, 50, 85, 100, 135, 200]

// Demo data fallback for when database is not connected
const DEMO_SHOTS: ShotData[] = [
  { id: 'demo-1', shotIndex: 1, beatIndex: 1, shotText: 'Close-up of ARJUN looking at the photograph', characters: ['Arjun'], shotSize: 'CU', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'motivated', colorTemp: 'warm', durationEstSec: 4, confidenceCamera: 0.95, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, scene: { id: 's1', sceneNumber: '1', headingRaw: 'INT. ARJUN HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Arjun House' } },
  { id: 'demo-2', shotIndex: 2, beatIndex: 2, shotText: 'Wide shot of the crowded market', characters: [], shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'steadicam', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'documentary', colorTemp: 'neutral', durationEstSec: 8, confidenceCamera: 0.88, confidenceLens: 0.82, confidenceLight: 0.9, confidenceDuration: 0.75, isLocked: false, userEdited: false, scene: { id: 's2', sceneNumber: '2', headingRaw: 'EXT. MARKET - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Market' } },
  { id: 'demo-3', shotIndex: 3, beatIndex: 1, shotText: 'Medium shot of PRIYA entering the temple', characters: ['Priya'], shotSize: 'MS', cameraAngle: 'low', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'classical', colorTemp: 'warm', durationEstSec: 6, confidenceCamera: 0.92, confidenceLens: 0.88, confidenceLight: 0.8, confidenceDuration: 0.85, isLocked: false, userEdited: false, scene: { id: 's3', sceneNumber: '3', headingRaw: 'EXT. TEMPLE - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Temple' } },
  { id: 'demo-4', shotIndex: 4, beatIndex: 2, shotText: 'Over-the-shoulder of ARJUN talking to MAHENDRA', characters: ['Arjun', 'Mahendra'], shotSize: 'OTS', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 75, lensType: 'prime', keyStyle: 'conversational', colorTemp: 'neutral', durationEstSec: 12, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.88, confidenceDuration: 0.7, isLocked: false, userEdited: false, scene: { id: 's4', sceneNumber: '4', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'demo-5', shotIndex: 5, beatIndex: 1, shotText: 'Extreme close-up of eyes filling with tears', characters: ['Priya'], shotSize: 'ECU', cameraAngle: 'close', cameraMovement: 'static', focalLengthMm: 100, lensType: 'macro', keyStyle: 'emotional', colorTemp: 'cool', durationEstSec: 3, confidenceCamera: 0.97, confidenceLens: 0.95, confidenceLight: 0.92, confidenceDuration: 0.9, isLocked: false, userEdited: false, scene: { id: 's5', sceneNumber: '5', headingRaw: 'INT. BEDROOM - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Bedroom' } },
  { id: 'demo-6', shotIndex: 6, beatIndex: 2, shotText: 'Tracking shot following SATHYA through the forest', characters: ['Sathya'], shotSize: 'MWS', cameraAngle: 'eye', cameraMovement: 'track', focalLengthMm: 40, lensType: 'zoom', keyStyle: 'adventure', colorTemp: 'mixed', durationEstSec: 15, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.65, isLocked: false, userEdited: false, scene: { id: 's6', sceneNumber: '6', headingRaw: 'EXT. FOREST - DUSK', intExt: 'EXT', timeOfDay: 'DUSK', location: 'Forest' } },
]

const DEMO_SCENES: SceneInfo[] = [
  { id: 's1', sceneNumber: '1', headingRaw: 'INT. ARJUN HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Arjun House', _count: { shots: 1 } },
  { id: 's2', sceneNumber: '2', headingRaw: 'EXT. MARKET - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Market', _count: { shots: 1 } },
  { id: 's3', sceneNumber: '3', headingRaw: 'EXT. TEMPLE - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Temple', _count: { shots: 1 } },
  { id: 's4', sceneNumber: '4', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office', _count: { shots: 1 } },
  { id: 's5', sceneNumber: '5', headingRaw: 'INT. BEDROOM - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'Bedroom', _count: { shots: 1 } },
  { id: 's6', sceneNumber: '6', headingRaw: 'EXT. FOREST - DUSK', intExt: 'EXT', timeOfDay: 'DUSK', location: 'Forest', _count: { shots: 1 } },
]

const DEMO_STATS = { totalShots: 6, totalDuration: 48, missingFields: 2 }

export default function ShotHubPage() {
  const [shots, setShots] = useState<ShotData[]>([])
  const [scenes, setScenes] = useState<SceneInfo[]>([])
  const [stats, setStats] = useState({ totalShots: 0, totalDuration: 0, missingFields: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [directorStyle, setDirectorStyle] = useState<string>('maniRatnam')
  const [sceneFilter, setSceneFilter] = useState('')

  const [scriptId, setScriptId] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState({
    sceneId: 'all',
    shotSize: 'all',
    cameraAngle: 'all',
    cameraMovement: 'all',
  })
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const autoRefreshDropdownRef = useRef<HTMLDivElement>(null)

  // Sorting state
  const [sortBy, setSortBy] = useState<'shotIndex' | 'scene' | 'shotSize' | 'cameraAngle' | 'cameraMovement' | 'duration' | 'confidence'>('shotIndex')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Sort options
  const sortOptions = [
    { key: 'shotIndex', label: 'Shot #' },
    { key: 'scene', label: 'Scene' },
    { key: 'shotSize', label: 'Shot Size' },
    { key: 'cameraAngle', label: 'Angle' },
    { key: 'cameraMovement', label: 'Movement' },
    { key: 'duration', label: 'Duration' },
    { key: 'confidence', label: 'Confidence' },
  ]

  // Calculate active filter count (includes sort state)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.sceneId !== 'all') count++
    if (filters.shotSize !== 'all') count++
    if (filters.cameraAngle !== 'all') count++
    if (filters.cameraMovement !== 'all') count++
    if (sortBy !== 'shotIndex' || sortOrder !== 'asc') count++
    return count
  }, [filters, sortBy, sortOrder])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      sceneId: 'all',
      shotSize: 'all',
      cameraAngle: 'all',
      cameraMovement: 'all',
    })
    setSortBy('shotIndex')
    setSortOrder('asc')
  }, [])

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()
  const handleGenerateAllRef = useRef<() => Promise<void>>()
  const handleSaveShotsRef = useRef<() => Promise<void>>()
  const handlePrintRef = useRef<() => void>()
  const handleExportMarkdownRef = useRef<() => void>()
  const printingRef = useRef(printing)
  
  // Auto-refresh refs
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)
  
  // Refs for keyboard shortcuts to avoid dependency issues
  const showFilterPanelRef = useRef(showFilterPanel)
  const filtersRef = useRef(filters)
  const activeFilterCountRef = useRef(activeFilterCount)
  const setFiltersRef = useRef(setFilters)
  const clearFiltersRef = useRef(clearFilters)
  const scenesRef = useRef(scenes)
  const selectedSceneIdRef = useRef(selectedSceneId)
  
  // Keep refs in sync with state
  useEffect(() => {
    showFilterPanelRef.current = showFilterPanel
  }, [showFilterPanel])
  
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  
  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  useEffect(() => {
    scenesRef.current = scenes
  }, [scenes])

  useEffect(() => {
    selectedSceneIdRef.current = selectedSceneId
  }, [selectedSceneId])

  // Keep auto-refresh refs in sync with state
  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  const fetchScriptId = useCallback(async () => {
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      if (data.scripts?.[0]?.id) {
        setScriptId(data.scripts[0].id)
        return data.scripts[0].id
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }, [])

  const fetchShots = useCallback(async (sId: string) => {
    try {
      const res = await fetch(`/api/shots?scriptId=${sId}`)
      const data = await res.json()
      // Use demo data if API returns empty or error
      if (!data.shots || data.shots.length === 0) {
        console.log('[Shot-List] No data from API, using demo data')
        setShots(DEMO_SHOTS)
        setScenes(DEMO_SCENES)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      } else {
        setShots(data.shots || [])
        setScenes(data.scenes || [])
        setStats(data.stats || { totalShots: 0, totalDuration: 0, missingFields: 0 })
        setIsDemoMode(false)
      }
    } catch (e) {
      console.error('[Shot-List] Error fetching shots:', e)
      // Fall back to demo data on error
      console.log('[Shot-List] Using demo data due to error')
      setShots(DEMO_SHOTS)
      setScenes(DEMO_SCENES)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  // Auto-refresh interval effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (scriptId) {
        fetchShots(scriptId)
      }
    }, autoRefreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, scriptId, fetchShots])

  useEffect(() => {
    (async () => {
      const id = await fetchScriptId()
      if (id) await fetchShots(id)
      else {
        // No script found, use demo data
        console.log('[Shot-List] No script found, using demo data')
        setShots(DEMO_SHOTS)
        setScenes(DEMO_SCENES)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
        setLoading(false)
      }
    })()
  }, [fetchScriptId, fetchShots])

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = async () => {
      if (scriptId) {
        setLoading(true)
        await fetchShots(scriptId)
      }
    }
  }, [scriptId, fetchShots])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          if (!autoRefreshRef.current) {
            fetchDataRef.current?.()
          }
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(a => !a)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'g':
          e.preventDefault()
          if (scriptId && !generating) {
            handleGenerateAllRef.current?.()
          }
          break
        case 's':
          e.preventDefault()
          if (!saving && shots.length > 0) {
            // Toggle sort order when filter panel is open or there are active filters
            if (showFilterPanel || activeFilterCount > 0) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            } else {
              handleSaveShotsRef.current?.()
            }
          } else if (showFilterPanel || activeFilterCount > 0) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
          }
          break
        case 'e':
          e.preventDefault()
          if (shots.length > 0) {
            setShowExportMenu(prev => !prev)
          }
          break
        case 'm':
          e.preventDefault()
          if (shots.length > 0) {
            handleExportMarkdownRef.current?.()
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'f':
          e.preventDefault()
          setShowFilterPanel(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilterPanel(false)
          setSceneFilter('')
          setSelectedSceneId(null)
          setSortBy('shotIndex')
          setSortOrder('asc')
          break
        case 'p':
          e.preventDefault()
          if (shots.length > 0 && !printingRef.current) {
            handlePrintRef.current?.()
          }
          break
        // Scene quick-select shortcuts (0-8) - works regardless of filter panel state
        case '0':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !showFilterPanelRef.current) {
            e.preventDefault()
            setSelectedSceneId(null) // Show all scenes
            return
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !showFilterPanelRef.current) {
            e.preventDefault()
            const sceneIndex = parseInt(e.key) - 1
            const sceneList = scenesRef.current
            if (sceneList[sceneIndex]) {
              setSelectedSceneId(sceneList[sceneIndex].id)
            }
            return
          }
          break
        // Number key shortcuts for filtering (when filter panel is open)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          if (showFilterPanelRef.current) {
            e.preventDefault()
            // Map number keys to shot size filters (1-8 for SHOT_SIZES)
            const sizeIndex = parseInt(e.key) - 1
            const size = SHOT_SIZES[sizeIndex]
            if (size) {
              const currentFilters = filtersRef.current
              if (currentFilters.shotSize === size) {
                setFilters(prev => ({ ...prev, shotSize: 'all' }))
              } else {
                setFilters(prev => ({ ...prev, shotSize: size }))
              }
            }
          }
          break
        case '0':
          if (showFilterPanelRef.current) {
            e.preventDefault()
            clearFiltersRef.current()
          }
          break
        case 'x':
          if (showFilterPanelRef.current && activeFilterCountRef.current > 0) {
            e.preventDefault()
            clearFiltersRef.current()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scriptId, generating, saving, exporting, shots.length, showFilterPanel, activeFilterCount, sortOrder, sortBy, filters, setFilters, clearFilters])

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
      // Close auto-refresh dropdown when clicking outside (but don't toggle autoRefresh off)
      if (autoRefresh && autoRefreshDropdownRef.current && !autoRefreshDropdownRef.current.contains(e.target as Node)) {
        // Just let it be - the dropdown is conditionally rendered based on autoRefresh state
        // User can turn off auto-refresh by clicking the button again
      }
    }
    if (showExportMenu || showPrintMenu || showFilterPanel || autoRefresh) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu, showPrintMenu, showFilterPanel, autoRefresh])

  const handleGenerateAll = useCallback(async () => {
    if (!scriptId) return
    setGenerating(true)
    setError(null)
    setGenProgress('Generating shots for all scenes...')

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScript', scriptId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenProgress(`Generated ${data.totalShots} shots!`)
      await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }, [scriptId, directorStyle, fetchShots])

  const handleGenerateScene = async (sceneId: string) => {
    setGenerating(true)
    setError(null)
    setGenProgress(`Generating shots for scene...`)

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScene', sceneId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenProgress(`Generated ${data.shotCount} shots`)
      if (scriptId) await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleFillNull = async (shotId: string) => {
    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fillNull', shotId, directorStyle }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      if (scriptId) await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleUpdateShot = async (shotId: string, field: string, value: string | number | boolean) => {
    try {
      await fetch('/api/shots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId, [field]: value }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveShots = useCallback(async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      // Save each shot that has user edits
      const editedShots = shots.filter(s => s.userEdited)
      for (const shot of editedShots) {
        await fetch('/api/shots', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shotId: shot.id,
            shotSize: shot.shotSize,
            cameraAngle: shot.cameraAngle,
            cameraMovement: shot.cameraMovement,
            focalLengthMm: shot.focalLengthMm,
            lensType: shot.lensType,
            keyStyle: shot.keyStyle,
            colorTemp: shot.colorTemp,
            isLocked: shot.isLocked,
          }),
        })
      }
      setSaveMessage({ type: 'success', text: `Saved ${editedShots.length} shots` })
      // Refresh data
      if (scriptId) await fetchShots(scriptId)
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Failed to save shots' })
    }
    setSaving(false)
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000)
  }, [shots, scriptId, fetchShots])

  const handleExportShots = async (format: 'json' | 'csv' = 'json') => {
    setExporting(true)
    try {
      const url = `/api/shots?scriptId=${scriptId || ''}&export=${format}`
      const res = await fetch(url)
      
      if (format === 'csv') {
        const blob = await res.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `shot_list_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
        setSaveMessage({ type: 'success', text: 'Exported to CSV' })
      } else {
        const data = await res.json()
        const jsonStr = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `shot_list_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
        setSaveMessage({ type: 'success', text: `Exported ${data.total_shots} shots` })
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Failed to export shots' })
    }
    setExporting(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // Export to Markdown
  const handleExportMarkdown = useCallback(() => {
    // Compute filtered shots locally (same logic as filteredShots useMemo)
    const activeSceneShots = selectedSceneId
      ? shots.filter(s => s.scene.id === selectedSceneId)
      : shots
    
    const locallyFiltered = activeSceneShots.filter(shot => {
      if (filters.sceneId !== 'all' && shot.scene.id !== filters.sceneId) return false
      if (filters.shotSize !== 'all' && shot.shotSize !== filters.shotSize) return false
      if (filters.cameraAngle !== 'all' && shot.cameraAngle !== filters.cameraAngle) return false
      if (filters.cameraMovement !== 'all' && shot.cameraMovement !== filters.cameraMovement) return false
      return true
    })

    if (!locallyFiltered.length) return
    setExporting(true)
    setShowExportMenu(false)

    const totalDuration = locallyFiltered.reduce((sum, s) => sum + (s.durationEstSec || 0), 0)
    const avgConfidence = locallyFiltered.length > 0
      ? locallyFiltered.reduce((sum, s) => {
          const conf = ((s.confidenceCamera || 0) + (s.confidenceLens || 0) + (s.confidenceLight || 0) + (s.confidenceDuration || 0)) / 4
          return sum + conf
        }, 0) / locallyFiltered.length
      : 0

    const scenesBreakdown = locallyFiltered.reduce((acc, shot) => {
      const sceneNum = shot.scene.sceneNumber || 'Unknown'
      if (!acc[sceneNum]) acc[sceneNum] = { count: 0, shots: [] }
      acc[sceneNum].count++
      acc[sceneNum].shots.push(shot.shotIndex)
      return acc
    }, {} as Record<string, { count: number, shots: number[] }>)

    const shotSizeBreakdown = locallyFiltered.reduce((acc, shot) => {
      const size = shot.shotSize || 'Unspecified'
      acc[size] = (acc[size] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const cameraMovementBreakdown = locallyFiltered.reduce((acc, shot) => {
      const movement = shot.cameraMovement || 'Unspecified'
      acc[movement] = (acc[movement] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60)
      const s = Math.round(sec % 60)
      return m > 0 ? `${m}m ${s}s` : `${s}s`
    }

    let markdown = `# Shot List Report - CinePilot

> Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Shots | ${locallyFiltered.length} |
| Total Scenes | ${Object.keys(scenesBreakdown).length} |
| Total Duration | ${formatDuration(totalDuration)} |
| Avg Confidence | ${(avgConfidence * 100).toFixed(1)}% |
| Locked Shots | ${locallyFiltered.filter(s => s.isLocked).length} |

## Filters Applied

- **Scene Filter:** ${filters.sceneId === 'all' ? 'All Scenes' : scenes.find(s => s.id === filters.sceneId)?.sceneNumber || filters.sceneId}
- **Shot Size:** ${filters.shotSize === 'all' ? 'All' : filters.shotSize}
- **Camera Angle:** ${filters.cameraAngle === 'all' ? 'All' : filters.cameraAngle}
- **Camera Movement:** ${filters.cameraMovement === 'all' ? 'All' : filters.cameraMovement}
- **Sort By:** ${sortBy} (${sortOrder})

## Shot Size Breakdown

| Shot Size | Count |
|-----------|-------|
${Object.entries(shotSizeBreakdown).map(([size, count]) => `| ${size} | ${count} |`).join('\n')}

## Camera Movement Breakdown

| Movement | Count |
|---------|-------|
${Object.entries(cameraMovementBreakdown).map(([movement, count]) => `| ${movement} | ${count} |`).join('\n')}

## Scenes Overview

| Scene | Shot Count | Shot Numbers |
|-------|------------|--------------|
${Object.entries(scenesBreakdown).map(([scene, data]) => `| ${scene} | ${data.count} | ${data.shots.join(', ')} |`).join('\n')}

## Detailed Shot List

| # | Scene | Shot Size | Angle | Movement | Duration | Confidence | Locked |
|---|-------|-----------|-------|----------|----------|-------------|--------|
${locallyFiltered.map(shot => {
  const confidence = ((shot.confidenceCamera || 0) + (shot.confidenceLens || 0) + (shot.confidenceLight || 0) + (shot.confidenceDuration || 0)) / 4
  return `| ${shot.shotIndex} | ${shot.scene.sceneNumber || '-'} | ${shot.shotSize || '-'} | ${shot.cameraAngle || '-'} | ${shot.cameraMovement || '-'} | ${shot.durationEstSec ? formatDuration(shot.durationEstSec) : '-'} | ${(confidence * 100).toFixed(0)}% | ${shot.isLocked ? '🔒' : '🔓'} |`
}).join('\n')}

---

*Report generated by CinePilot - Film Production Management*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `shot-list-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
    setSaveMessage({ type: 'success', text: `Exported ${locallyFiltered.length} shots to Markdown` })
    setExporting(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }, [shots, filters, sortBy, sortOrder, scenes, selectedSceneId])

  // Print shot list
  const handlePrint = useCallback(() => {
    if (!shots.length) return
    setPrinting(true)
    setShowPrintMenu(false)
    
    const activeShots = selectedSceneId
      ? shots.filter(s => s.scene.id === selectedSceneId)
      : shots
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Shot List - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e293b; margin-bottom: 5px; }
    .header .subtitle { color: #64748b; font-size: 14px; }
    .header .date { color: #94a3b8; font-size: 12px; margin-top: 5px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .stat-card .value { font-size: 20px; font-weight: bold; color: #1e293b; }
    .stat-card.purple .value { color: #8b5cf6; }
    .stat-card.green .value { color: #22c55e; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 8px 6px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    th { background: #f1f5f9; font-weight: 600; color: #475569; }
    th:first-child, td:first-child { text-align: left; width: 50px; }
    .shot-num { font-weight: bold; color: #8b5cf6; }
    .scene { font-size: 10px; color: #64748b; }
    .size { font-size: 10px; }
    .locked { color: #22c55e; }
    .unlocked { color: #94a3b8; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Shot List Report</h1>
    <div class="subtitle">${selectedSceneId ? `Scene ${scenes.find(s => s.id === selectedSceneId)?.sceneNumber || ''}` : 'All Scenes'}</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
  </div>
  
  <div class="stats">
    <div class="stat-card purple">
      <div class="label">Total Shots</div>
      <div class="value">${activeShots.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">Scenes</div>
      <div class="value">${new Set(activeShots.map(s => s.scene.id)).size}</div>
    </div>
    <div class="stat-card green">
      <div class="label">Locked</div>
      <div class="value">${activeShots.filter(s => s.isLocked).length}</div>
    </div>
    <div class="stat-card">
      <div class="label">Est. Duration</div>
      <div class="value">${Math.round(activeShots.reduce((sum, s) => sum + (s.durationEstSec || 3), 0) / 60)}m</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Scene</th>
        <th>Shot Text</th>
        <th>Size</th>
        <th>Angle</th>
        <th>Movement</th>
        <th>Duration</th>
        <th>Lock</th>
      </tr>
    </thead>
    <tbody>
      ${activeShots.map(shot => `
      <tr>
        <td><span class="shot-num">${shot.shotIndex + 1}</span></td>
        <td><span class="scene">${shot.scene.sceneNumber}</span></td>
        <td>${(shot.shotText || '').substring(0, 40)}${(shot.shotText || '').length > 40 ? '...' : ''}</td>
        <td><span class="size">${shot.shotSize || '-'}</span></td>
        <td>${shot.cameraAngle || '-'}</td>
        <td>${shot.cameraMovement || '-'}</td>
        <td>${shot.durationEstSec ? shot.durationEstSec + 's' : '-'}</td>
        <td>${shot.isLocked ? '<span class="locked">🔒</span>' : '<span class="unlocked">○</span>'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>CinePilot - Shot List Generator</p>
  </div>
</body>
</html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setTimeout(() => setPrinting(false), 500);
  }, [shots, selectedSceneId, scenes]);

  // Update refs for keyboard shortcuts (after functions are defined)
  useEffect(() => {
    handleGenerateAllRef.current = handleGenerateAll
  }, [handleGenerateAll])

  useEffect(() => {
    handleSaveShotsRef.current = handleSaveShots
  }, [handleSaveShots])

  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  useEffect(() => {
    printingRef.current = printing
  }, [printing])

  const filteredScenes = scenes.filter(s => {
    if (!sceneFilter) return true
    return s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
  })

  const activeSceneShots = selectedSceneId
    ? shots.filter(s => s.scene.id === selectedSceneId)
    : shots

  // Apply filters and sorting to shots
  const filteredShots = useMemo(() => {
    const filtered = activeSceneShots.filter(shot => {
      if (filters.sceneId !== 'all' && shot.scene.id !== filters.sceneId) return false
      if (filters.shotSize !== 'all' && shot.shotSize !== filters.shotSize) return false
      if (filters.cameraAngle !== 'all' && shot.cameraAngle !== filters.cameraAngle) return false
      if (filters.cameraMovement !== 'all' && shot.cameraMovement !== filters.cameraMovement) return false
      return true
    })
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'shotIndex':
          comparison = a.shotIndex - b.shotIndex
          break
        case 'scene':
          comparison = (a.scene.sceneNumber || '').localeCompare(b.scene.sceneNumber || '')
          break
        case 'shotSize':
          comparison = (a.shotSize || '').localeCompare(b.shotSize || '')
          break
        case 'cameraAngle':
          comparison = (a.cameraAngle || '').localeCompare(b.cameraAngle || '')
          break
        case 'cameraMovement':
          comparison = (a.cameraMovement || '').localeCompare(b.cameraMovement || '')
          break
        case 'duration':
          comparison = (a.durationEstSec || 0) - (b.durationEstSec || 0)
          break
        case 'confidence':
          const aConf = ((a.confidenceCamera || 0) + (a.confidenceLens || 0) + (a.confidenceLight || 0) + (a.confidenceDuration || 0)) / 4
          const bConf = ((b.confidenceCamera || 0) + (b.confidenceLens || 0) + (b.confidenceLight || 0) + (b.confidenceDuration || 0)) / 4
          comparison = aConf - bConf
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [activeSceneShots, filters, sortBy, sortOrder])

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  // Analytics data computation
  const shotSizeData = useMemo(() => {
    const counts: Record<string, number> = {}
    shots.forEach(shot => {
      const size = shot.shotSize || 'Unspecified'
      counts[size] = (counts[size] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [shots])

  const cameraAngleData = useMemo(() => {
    const counts: Record<string, number> = {}
    shots.forEach(shot => {
      const angle = shot.cameraAngle || 'Unspecified'
      counts[angle] = (counts[angle] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [shots])

  const cameraMovementData = useMemo(() => {
    const counts: Record<string, number> = {}
    shots.forEach(shot => {
      const movement = shot.cameraMovement || 'Unspecified'
      counts[movement] = (counts[movement] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [shots])

  const lensData = useMemo(() => {
    const counts: Record<string, number> = {}
    shots.forEach(shot => {
      const lens = shot.focalLengthMm ? `${shot.focalLengthMm}mm` : 'Unspecified'
      counts[lens] = (counts[lens] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [shots])

  const durationBySizeData = useMemo(() => {
    const totals: Record<string, { count: number; total: number }> = {}
    shots.forEach(shot => {
      const size = shot.shotSize || 'Unspecified'
      if (!totals[size]) totals[size] = { count: 0, total: 0 }
      totals[size].count++
      totals[size].total += shot.durationEstSec || 0
    })
    return Object.entries(totals)
      .map(([name, data]) => ({ 
        name, 
        avgDuration: data.count > 0 ? Math.round(data.total / data.count) : 0 
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
  }, [shots])

  const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#64748b']

  if (loading) {
    return (
      <div className="p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <Skeleton className="h-10 w-full mb-3 rounded-lg" />
            <Skeleton className="h-10 w-full mb-3 rounded-lg" />
            <SceneListSkeleton />
          </div>
          <div className="col-span-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <ShotRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">&#8592;</Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Shot Hub</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">AI-powered shot breakdown engine</p>
          </div>
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {autoRefresh && (
                <span className="flex items-center gap-1 text-emerald-400 ml-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={directorStyle}
            onChange={e => setDirectorStyle(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          >
            {STYLE_PRESETS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerateAll}
            disabled={generating || !scriptId}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium text-sm"
          >
            {generating ? genProgress : 'Generate All Shots'}
          </button>
          <button
            onClick={handleSaveShots}
            disabled={saving || shots.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded font-medium text-sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={shots.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-medium text-sm flex items-center gap-2"
            >
              {exporting ? 'Exporting...' : 'Export'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
                <button
                  onClick={() => { handleExportShots('csv'); setShowExportMenu(false) }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => { handleExportShots('json'); setShowExportMenu(false) }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => { handleExportMarkdown(); setShowExportMenu(false) }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-cyan-400"
                >
                  Export Markdown
                </button>
              </div>
            )}
          </div>
          {/* Print Button */}
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              disabled={shots.length === 0 || printing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded font-medium text-sm flex items-center gap-2"
              title="Print shot list (P)"
            >
              {printing ? 'Printing...' : 'Print'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
                <button
                  onClick={handlePrint}
                  disabled={shots.length === 0}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  Print Shot List
                </button>
              </div>
            )}
          </div>
          {/* Filter Toggle Button */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-2 border rounded font-medium text-sm flex items-center gap-2 ${
                showFilterPanel || activeFilterCount > 0
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
              title="Toggle filters (F)"
            >
              <Filter className="w-4 h-4" />
              Filter & Sort
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white text-violet-600 text-xs rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Filter & Sort</h3>
                    <span className="text-xs text-cyan-400">(1-8 for size, 0 to clear, X for all)</span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                {/* Sort Options */}
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-violet-300">Sort By</label>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-1 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded flex items-center gap-1"
                      title="Toggle sort order (S)"
                    >
                      {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.key}
                        onClick={() => setSortBy(option.key as typeof sortBy)}
                        className={`px-2 py-1.5 text-xs rounded transition-colors ${
                          sortBy === option.key
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {option.label} {sortBy === option.key && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scene Filter */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Scene</label>
                  <select
                    value={filters.sceneId}
                    onChange={e => setFilters(prev => ({ ...prev, sceneId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                  >
                    <option value="all">All Scenes (0)</option>
                    {scenes.map((scene, i) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.sceneNumber}: {scene.headingRaw?.substring(0, 30) || 'Untitled'} ({i + 1})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shot Size Filter */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Shot Size</label>
                  <select
                    value={filters.shotSize}
                    onChange={e => setFilters(prev => ({ ...prev, shotSize: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                  >
                    <option value="all">All Sizes</option>
                    {SHOT_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                {/* Camera Angle Filter */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Camera Angle</label>
                  <select
                    value={filters.cameraAngle}
                    onChange={e => setFilters(prev => ({ ...prev, cameraAngle: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                  >
                    <option value="all">All Angles</option>
                    {ANGLES.map(angle => (
                      <option key={angle} value={angle}>{angle}</option>
                    ))}
                  </select>
                </div>

                {/* Camera Movement Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Camera Movement</label>
                  <select
                    value={filters.cameraMovement}
                    onChange={e => setFilters(prev => ({ ...prev, cameraMovement: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                  >
                    <option value="all">All Movements</option>
                    {MOVEMENTS.map(movement => (
                      <option key={movement} value={movement}>{movement}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          {/* Auto-Refresh Toggle */}
          <div className="relative" ref={autoRefreshDropdownRef}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white'
              }`}
              title="Auto-Refresh Toggle (A)"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {autoRefresh && (
              <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-2 min-w-[140px]">
                <div className="px-3 py-1 text-xs text-gray-500 uppercase font-medium">Interval</div>
                {[
                  { value: 10, label: '10 seconds' },
                  { value: 30, label: '30 seconds' },
                  { value: 60, label: '1 minute' },
                  { value: 300, label: '5 minutes' },
                ].map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => setAutoRefreshInterval(opt.value)}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center justify-between ${
                      autoRefreshInterval === opt.value ? 'text-cyan-400' : 'text-gray-300'
                    }`}
                  >
                    {opt.label}
                    {autoRefreshInterval === opt.value && <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-400 hover:text-white"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${
          saveMessage.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">
            {activeFilterCount > 0 ? filteredShots.length : stats.totalShots}
            {activeFilterCount > 0 && <span className="text-sm text-gray-500 ml-1">/ {stats.totalShots}</span>}
          </div>
          <div className="text-xs text-gray-500">Total Shots{activeFilterCount > 0 && ' (filtered)'}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{formatDuration(stats.totalDuration)}</div>
          <div className="text-xs text-gray-500">Est. Runtime</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.missingFields}</div>
          <div className="text-xs text-gray-500">Missing Fields</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{scenes.length}</div>
          <div className="text-xs text-gray-500">Scenes</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      {shots.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Shot Size Distribution */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-300">Shot Sizes</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shotSizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {shotSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {shotSizeData.slice(0, 4).map((entry, i) => (
                <span key={entry.name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '30', color: CHART_COLORS[i % CHART_COLORS.length] }}>
                  {entry.name}: {entry.value}
                </span>
              ))}
            </div>
          </div>

          {/* Camera Angles */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-gray-300">Camera Angles</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cameraAngleData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} width={50} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Camera Movements */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-gray-300">Movements</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cameraMovementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={9} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lens Usage */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-gray-300">Lens Usage</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lensData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={9} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Duration Analysis Row */}
      {shots.length > 0 && durationBySizeData.length > 0 && (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-medium text-gray-300">Average Duration by Shot Size</h3>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBySizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} unit="s" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`${value}s`, 'Avg Duration']}
                />
                <Bar dataKey="avgDuration" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!scriptId ? (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
          <div className="text-gray-500 mb-2">No script found</div>
          <Link href="/scripts" className="text-cinepilot-accent hover:underline text-sm">Upload a script first</Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {/* Left Panel: Scene List */}
          <div className="col-span-1 space-y-3">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Filter scenes... (/)"
                value={sceneFilter}
                onChange={e => setSceneFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-cinepilot-accent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">(/)</span>
            </div>
            <button
              onClick={() => setSelectedSceneId(null)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                !selectedSceneId ? 'bg-cinepilot-accent/20 text-cinepilot-accent border border-cinepilot-accent/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Scenes ({shots.length} shots)
            </button>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredScenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedSceneId === scene.id
                      ? 'bg-cinepilot-accent/20 text-cinepilot-accent border border-cinepilot-accent/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">{scene.sceneNumber}</span>
                    <span className="text-xs text-gray-600">
                      {scene._count.shots > 0 ? `${scene._count.shots} shots` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {scene.headingRaw || scene.location || 'Untitled'}
                  </div>
                  {scene._count.shots === 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); handleGenerateScene(scene.id) }}
                      disabled={generating}
                      className="mt-1 text-xs px-2 py-0.5 bg-purple-600/30 text-purple-400 rounded hover:bg-purple-600/50"
                    >
                      Generate
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Panel: Shot Table */}
          <div className="col-span-3">
            {filteredShots.length === 0 ? (
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
                <div className="text-gray-500 mb-2">
                  {selectedSceneId ? 'No shots generated for this scene' : activeFilterCount > 0 ? 'No shots match your filters' : 'No shots generated yet'}
                </div>
                {activeFilterCount > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="text-violet-400 hover:text-violet-300 text-sm"
                  >
                    Clear filters
                  </button>
                ) : (
                  <p className="text-gray-600 text-sm">Click "Generate All Shots" or generate per scene</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredShots.map(shot => (
                  <ShotRow
                    key={shot.id}
                    shot={shot}
                    onUpdate={handleUpdateShot}
                    onFillNull={handleFillNull}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Refresh data</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-emerald-300">Toggle auto-refresh</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-emerald-300">A</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Search scenes</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">/</kbd>
              </div>
              {/* Scene quick-select shortcuts - shown only when filter panel is closed */}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-orange-300">Show all scenes</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-orange-300">0</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-orange-300">Quick filter by scene (1-8)</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-orange-300">1-8</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">F</kbd>
              </div>
              {/* Number key shortcuts - shown only when filter panel is open */}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-cyan-300">Filter by shot size (when F open)</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-300">1-8</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-cyan-300">Clear all filters (when F open)</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-300">0</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-amber-300">Clear all filters (when F open)</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-amber-300">X</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Generate all shots</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">G</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Save shots</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Export menu</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">E</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Export Markdown</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">M</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Print shot list</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Close / Clear filters</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ShotRow({
  shot,
  onUpdate,
  onFillNull,
}: {
  shot: ShotData
  onUpdate: (id: string, field: string, value: string | number | boolean) => void
  onFillNull: (id: string) => void
}) {
  const hasMissing = !shot.shotSize || !shot.focalLengthMm || !shot.keyStyle || !shot.durationEstSec
  const avgConfidence = (
    (shot.confidenceCamera || 0) +
    (shot.confidenceLens || 0) +
    (shot.confidenceLight || 0) +
    (shot.confidenceDuration || 0)
  ) / 4

  const confidenceColor =
    avgConfidence >= 0.7 ? 'text-green-400' :
    avgConfidence >= 0.4 ? 'text-yellow-400' :
    'text-red-400'

  return (
    <div className={`bg-cinepilot-card border rounded-lg p-3 ${shot.isLocked ? 'border-blue-700/50' : 'border-cinepilot-border'}`}>
      <div className="flex items-start gap-3">
        {/* Shot Number */}
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold text-cinepilot-accent">{shot.shotIndex}</span>
          <span className="text-[10px] text-gray-600">B{shot.beatIndex}</span>
        </div>

        {/* Shot Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {shot.scene && (
              <span className="text-[10px] font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                {shot.scene.sceneNumber}
              </span>
            )}
            {shot.characters.length > 0 && (
              <div className="flex gap-1">
                {shot.characters.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded">{c}</span>
                ))}
                {shot.characters.length > 3 && (
                  <span className="text-[10px] text-gray-600">+{shot.characters.length - 3}</span>
                )}
              </div>
            )}
            <span className={`text-[10px] ${confidenceColor}`}>{Math.round(avgConfidence * 100)}%</span>
          </div>
          <p className="text-sm text-gray-300 leading-tight">{shot.shotText}</p>
        </div>

        {/* Controls Grid */}
        <div className="flex gap-2 items-center shrink-0">
          <select
            value={shot.shotSize || ''}
            onChange={e => onUpdate(shot.id, 'shotSize', e.target.value)}
            className={`w-16 text-xs py-1 px-1 rounded border ${
              shot.shotSize ? 'bg-gray-800 border-gray-700' : 'bg-yellow-900/20 border-yellow-700/50'
            }`}
          >
            <option value="">Size</option>
            {SHOT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={shot.cameraAngle || ''}
            onChange={e => onUpdate(shot.id, 'cameraAngle', e.target.value)}
            className="w-16 text-xs py-1 px-1 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="">Angle</option>
            {ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={shot.cameraMovement || ''}
            onChange={e => onUpdate(shot.id, 'cameraMovement', e.target.value)}
            className="w-20 text-xs py-1 px-1 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="">Movement</option>
            {MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={shot.focalLengthMm ?? ''}
            onChange={e => onUpdate(shot.id, 'focalLengthMm', parseInt(e.target.value))}
            className={`w-16 text-xs py-1 px-1 rounded border ${
              shot.focalLengthMm ? 'bg-gray-800 border-gray-700' : 'bg-yellow-900/20 border-yellow-700/50'
            }`}
          >
            <option value="">Lens</option>
            {LENSES.map(l => <option key={l} value={l}>{l}mm</option>)}
          </select>

          <div className="text-xs text-gray-500 w-10 text-right">
            {shot.durationEstSec ? `${Math.round(shot.durationEstSec)}s` : '—'}
          </div>

          {hasMissing && (
            <button
              onClick={() => onFillNull(shot.id)}
              className="text-[10px] px-2 py-1 bg-purple-600/30 text-purple-400 rounded hover:bg-purple-600/50"
              title="AI fill missing fields"
            >
              Fill
            </button>
          )}

          <button
            onClick={() => onUpdate(shot.id, 'isLocked', !shot.isLocked)}
            className={`p-1 rounded ${shot.isLocked ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
            title={shot.isLocked ? 'Unlock' : 'Lock'}
          >
            {shot.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
