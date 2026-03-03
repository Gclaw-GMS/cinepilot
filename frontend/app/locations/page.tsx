'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { 
  MapPin, Search, Filter, Download, RefreshCw, Globe, 
  Building2, Waves, TreePine, Home, Camera, ChevronRight,
  AlertTriangle, CheckCircle, Loader2, Star, Navigation,
  Calendar, Clock, Users, Zap, BarChart3, Keyboard, X
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface SceneWithIntent {
  id: string
  sceneNumber: string
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  locationIntents: {
    id: string
    keywords: string[]
    terrainType: string | null
    _count: { candidates: number }
  }[]
}

interface CandidateData {
  id: string
  name: string | null
  latitude: string
  longitude: string
  placeType: string | null
  scoreTotal: number
  scoreAccess: number | null
  scoreLocality: number | null
  riskFlags: string[]
  explanation: string | null
}

interface LocationStats {
  totalScenes: number
  extScenes: number
  intScenes: number
  totalCandidates: number
  avgScore: number
}

// Demo data for when no database is available
const DEMO_SCENES: SceneWithIntent[] = [
  { id: 'demo-1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI BEACH - SUNRISE', intExt: 'EXT', timeOfDay: 'DAY', location: 'Marina Beach', locationIntents: [{ id: 'i1', keywords: ['beach', 'sunrise', 'ocean'], terrainType: 'coastal', _count: { candidates: 4 } }] },
  { id: 'demo-2', sceneNumber: '5', headingRaw: 'INT. TRADITIONAL HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tamil House', locationIntents: [{ id: 'i2', keywords: ['house', 'traditional', 'family'], terrainType: 'residential', _count: { candidates: 3 } }] },
  { id: 'demo-3', sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Kapaleeshwarar Temple', locationIntents: [{ id: 'i3', keywords: ['temple', 'festival', 'crowd'], terrainType: 'religious', _count: { candidates: 2 } }] },
  { id: 'demo-4', sceneNumber: '18', headingRaw: 'EXT. FOREST ROAD - DUSK', intExt: 'EXT', timeOfDay: 'DUSK', location: 'Kodaikanal Highway', locationIntents: [{ id: 'i4', keywords: ['forest', 'road', 'dusk'], terrainType: 'forest', _count: { candidates: 3 } }] },
  { id: 'demo-5', sceneNumber: '25', headingRaw: 'INT. MODERN OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tech Park', locationIntents: [{ id: 'i5', keywords: ['office', 'corporate', 'modern'], terrainType: 'commercial', _count: { candidates: 2 } }] },
  { id: 'demo-6', sceneNumber: '31', headingRaw: 'EXT. CITY MARKET - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'T Nagar', locationIntents: [{ id: 'i6', keywords: ['market', 'bustling', 'street'], terrainType: 'urban', _count: { candidates: 4 } }] },
  { id: 'demo-7', sceneNumber: '38', headingRaw: 'EXT. VILLAGE POND - EVENING', intExt: 'EXT', timeOfDay: 'EVENING', location: 'Rural Village', locationIntents: [{ id: 'i7', keywords: ['village', 'pond', 'rural'], terrainType: 'village', _count: { candidates: 3 } }] },
  { id: 'demo-8', sceneNumber: '45', headingRaw: 'INT. STUDIO SET - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Film Studio', locationIntents: [{ id: 'i8', keywords: ['studio', 'set', 'controlled'], terrainType: 'studio', _count: { candidates: 3 } }] },
]

const DEMO_CANDIDATES: Record<string, CandidateData[]> = {
  'demo-1': [
    { id: 'c1', name: 'Marina Beach', latitude: '13.0500', longitude: '80.2827', placeType: 'beach', scoreTotal: 95, scoreAccess: 98, scoreLocality: 92, riskFlags: ['crowd'], explanation: 'Iconic Chennai beach, perfect for sunrise shots with golden hour lighting' },
    { id: 'c2', name: 'Covelong Beach', latitude: '12.7927', longitude: '80.2504', placeType: 'beach', scoreTotal: 88, scoreAccess: 85, scoreLocality: 90, riskFlags: [], explanation: 'Less crowded alternative, clean shoreline for dialogue scenes' },
    { id: 'c3', name: 'Mahabalipuram Shore Temple', latitude: '12.6263', longitude: '80.1948', placeType: 'heritage', scoreTotal: 92, scoreAccess: 80, scoreLocality: 88, riskFlags: ['tourists'], explanation: 'Ancient temple backdrop, requires early morning permits' },
    { id: 'c4', name: 'Thiruvanmiyur Beach', latitude: '12.9833', longitude: '80.2667', placeType: 'beach', scoreTotal: 78, scoreAccess: 90, scoreLocality: 75, riskFlags: [], explanation: 'Local beach with fishing community, authentic atmosphere' },
  ],
  'demo-2': [
    { id: 'c5', name: 'Heritage Villa', latitude: '13.0750', longitude: '80.2200', placeType: 'house', scoreTotal: 91, scoreAccess: 88, scoreLocality: 94, riskFlags: [], explanation: 'Traditional Tamil architecture with courtyard' },
    { id: 'c6', name: 'Chennai Rural Home', latitude: '12.9500', longitude: '80.1500', placeType: 'house', scoreTotal: 85, scoreAccess: 75, scoreLocality: 92, riskFlags: [], explanation: 'Authentic village house, good natural light' },
    { id: 'c7', name: 'Film Set House', latitude: '13.0600', longitude: '80.2300', placeType: 'set', scoreTotal: 98, scoreAccess: 95, scoreLocality: 85, riskFlags: [], explanation: 'Professional set with full lighting rigging access' },
  ],
}

// Calculate stats from scenes
function calculateStats(scenes: SceneWithIntent[]): LocationStats {
  const extScenes = scenes.filter(s => s.intExt === 'EXT').length
  const intScenes = scenes.filter(s => s.intExt !== 'EXT').length
  const totalCandidates = scenes.reduce((sum, s) => sum + (s.locationIntents?.[0]?._count?.candidates || 0), 0)
  
  return {
    totalScenes: scenes.length,
    extScenes,
    intScenes,
    totalCandidates,
    avgScore: totalCandidates > 0 ? 87 : 0,
  }
}

// Type badge colors
const getTypeColor = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case 'beach': return 'bg-cyan-500/20 text-cyan-400'
    case 'forest': return 'bg-green-500/20 text-green-400'
    case 'urban': return 'bg-purple-500/20 text-purple-400'
    case 'village': return 'bg-amber-500/20 text-amber-400'
    case 'studio': return 'bg-blue-500/20 text-blue-400'
    case 'heritage': return 'bg-orange-500/20 text-orange-400'
    case 'house': return 'bg-pink-500/20 text-pink-400'
    case 'religious': return 'bg-red-500/20 text-red-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

// Risk badge
const RiskBadge = ({ flag }: { flag: string }) => {
  const colors: Record<string, string> = {
    crowd: 'bg-amber-500/20 text-amber-400',
    tourists: 'bg-amber-500/20 text-amber-400',
    traffic: 'bg-red-500/20 text-red-400',
    remote: 'bg-orange-500/20 text-orange-400',
    permits: 'bg-blue-500/20 text-blue-400',
    weather: 'bg-cyan-500/20 text-cyan-400',
    wildlife: 'bg-green-500/20 text-green-400',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded ${colors[flag] || 'bg-gray-500/20 text-gray-400'}`}>{flag}</span>
}

export default function LocationsPage() {
  const [scenes, setScenes] = useState<SceneWithIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [scouting, setScouting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1)
  const filteredScenesRef = useRef<SceneWithIntent[]>([])

  const stats = calculateStats(scenes)

  // Compute chart data for location analytics
  const chartData = useMemo(() => {
    // INT/EXT breakdown
    const intExtData = [
      { name: 'EXT', value: stats.extScenes, color: '#f59e0b' },
      { name: 'INT', value: stats.intScenes, color: '#3b82f6' },
    ].filter(d => d.value > 0)

    // Time of day breakdown
    const timeOfDayCount: Record<string, number> = {}
    scenes.forEach(scene => {
      const tod = scene.timeOfDay || 'Unknown'
      timeOfDayCount[tod] = (timeOfDayCount[tod] || 0) + 1
    })
    const timeOfDayData = Object.entries(timeOfDayCount).map(([name, value]) => ({
      name, value, color: name === 'DAY' ? '#fbbf24' : name === 'NIGHT' ? '#6366f1' : '#8b5cf6'
    }))

    // Terrain type breakdown
    const terrainCount: Record<string, number> = {}
    scenes.forEach(scene => {
      const terrain = scene.locationIntents?.[0]?.terrainType || 'unknown'
      const key = terrain.charAt(0).toUpperCase() + terrain.slice(1)
      terrainCount[key] = (terrainCount[key] || 0) + 1
    })
    const terrainData = Object.entries(terrainCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Candidates per scene (top 5)
    const candidatesPerScene = scenes
      .map(s => ({
        name: `S${s.sceneNumber}`,
        candidates: s.locationIntents?.[0]?._count?.candidates || 0
      }))
      .filter(s => s.candidates > 0)
      .slice(0, 5)

    return { intExtData, timeOfDayData, terrainData, candidatesPerScene }
  }, [scenes, stats.extScenes, stats.intScenes])

  const fetchScenes = useCallback(async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      
      if (data.scenes && data.scenes.length > 0) {
        setScenes(data.scenes)
        setIsDemoMode(false)
      } else {
        // Use demo data
        setScenes(DEMO_SCENES)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.warn('Using demo locations data:', e)
      setScenes(DEMO_SCENES)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScenes() }, [fetchScenes])

  const handleSelectScene = async (sceneId: string) => {
    setSelectedSceneId(sceneId)
    setCandidates([])
    setError(null)
    
    // Check demo candidates first
    if (isDemoMode && DEMO_CANDIDATES[sceneId]) {
      setCandidates(DEMO_CANDIDATES[sceneId])
      return
    }
    
    try {
      const res = await fetch(`/api/locations?sceneId=${sceneId}`)
      const data = await res.json()
      setCandidates(data.intent?.candidates || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleScout = async () => {
    if (!selectedSceneId) return
    setScouting(true)
    setError(null)
    
    // If demo mode, use demo candidates
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1500)) // Simulate loading
      const demoCandidates = DEMO_CANDIDATES[selectedSceneId]
      if (demoCandidates) {
        setCandidates(demoCandidates)
      } else {
        // Generate random candidates for demo
        const types = ['beach', 'urban', 'village', 'studio', 'heritage']
        const randomType = types[Math.floor(Math.random() * types.length)]
        setCandidates([
          { id: 'r1', name: `Demo Location 1 (${randomType})`, latitude: '13.08', longitude: '80.27', placeType: randomType, scoreTotal: 85 + Math.floor(Math.random() * 15), scoreAccess: 80, scoreLocality: 85, riskFlags: [], explanation: 'Demo location for testing' },
          { id: 'r2', name: `Demo Location 2`, latitude: '13.10', longitude: '80.30', placeType: 'urban', scoreTotal: 75 + Math.floor(Math.random() * 15), scoreAccess: 85, scoreLocality: 70, riskFlags: ['crowd'], explanation: 'Another demo location' },
        ])
      }
      setScouting(false)
      return
    }
    
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scout', sceneId: selectedSceneId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCandidates(data.candidates || [])
      await fetchScenes()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setScouting(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchScenes()
    setRefreshing(false)
  }

  const handleExportCSV = () => {
    const headers = ['Scene', 'Type', 'Location', 'Candidates', 'Score']
    const rows = scenes.map(s => [
      s.sceneNumber,
      s.intExt || '',
      s.location || s.headingRaw || '',
      s.locationIntents?.[0]?._count?.candidates || 0,
      s.locationIntents?.[0]?._count?.candidates ? '85' : 'N/A',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locations-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    const maxIndex = filteredScenesRef.current.length - 1
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.min(prev + 1, maxIndex))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setSelectedRowIndex(0)
        break
      case 'End':
        e.preventDefault()
        setSelectedRowIndex(maxIndex)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedRowIndex >= 0 && filteredScenesRef.current[selectedRowIndex]) {
          handleSelectScene(filteredScenesRef.current[selectedRowIndex].id)
        }
        break
      case 'Escape':
        setSelectedSceneId(null)
        setSelectedRowIndex(-1)
        setCandidates([])
        break
      case '?':
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
        break
      case 's':
        if (!e.ctrlKey && !e.metaKey && selectedSceneId) {
          e.preventDefault()
          handleScout()
        }
        break
      case 'r':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleRefresh()
        }
        break
      case 'f':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          const searchInput = document.querySelector('input[placeholder="Search scenes..."]') as HTMLInputElement
          searchInput?.focus()
        }
        break
    }
  }, [selectedRowIndex, selectedSceneId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const selectedScene = scenes.find(s => s.id === selectedSceneId)
  
  // Filter scenes
  const filteredScenes = scenes.filter(s => {
    const matchesSearch = !searchQuery || 
      (s.sceneNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.headingRaw || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || 
      (filterType === 'ext' && s.intExt === 'EXT') ||
      (filterType === 'int' && s.intExt !== 'EXT')
    return matchesSearch && matchesFilter
  })

  // Update filtered scenes ref
  useEffect(() => {
    filteredScenesRef.current = filteredScenes
  }, [filteredScenes])

  // Sync selected row with scene selection
  useEffect(() => {
    if (selectedSceneId && filteredScenes.length > 0) {
      const idx = filteredScenes.findIndex(s => s.id === selectedSceneId)
      if (idx >= 0) setSelectedRowIndex(idx)
    }
  }, [selectedSceneId, filteredScenes])

  const extScenes = filteredScenes.filter(s => s.intExt === 'EXT')
  const intScenes = filteredScenes.filter(s => s.intExt !== 'EXT')

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            ←
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                📍 Location Scouter
              </h1>
              {isDemoMode ? (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                  Demo Data
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Live Data
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              AI-powered script-aware location discovery
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Keyboard shortcut hint */}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded transition-colors"
          >
            <Keyboard className="w-3 h-3" />
            Shortcuts
          </button>
          {selectedRowIndex >= 0 && (
            <span className="text-xs text-emerald-400">
              Row {selectedRowIndex + 1} of {filteredScenes.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Keyboard className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Keyboard Shortcuts
                </span>
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { keys: ['↑', '↓'], desc: 'Navigate scenes', category: 'Navigation' },
                { keys: ['Home'], desc: 'Go to first scene', category: 'Navigation' },
                { keys: ['End'], desc: 'Go to last scene', category: 'Navigation' },
                { keys: ['Enter'], desc: 'Select scene', category: 'Selection' },
                { keys: ['Esc'], desc: 'Clear selection', category: 'Selection' },
                { keys: ['S'], desc: 'Scout locations for selected', category: 'Actions' },
                { keys: ['R'], desc: 'Refresh data', category: 'Actions' },
                { keys: ['F'], desc: 'Focus search', category: 'Search' },
                { keys: ['?'], desc: 'Toggle this help', category: 'Help' },
              ].map((shortcut, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider w-20">
                      {shortcut.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <kbd 
                          key={i} 
                          className="px-2.5 py-1.5 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-md text-xs font-mono text-emerald-300 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Quick reference for power users</span>
                <span className="flex items-center gap-2">
                  Press 
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-emerald-400">?</kbd> 
                  anytime to toggle
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Scenes</span>
            <div className="p-2 rounded-lg bg-emerald-400/10">
              <Camera className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats.totalScenes}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Exterior</span>
            <div className="p-2 rounded-lg bg-amber-400/10">
              <Waves className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400">{stats.extScenes}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Interior</span>
            <div className="p-2 rounded-lg bg-blue-400/10">
              <Home className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.intScenes}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Candidates</span>
            <div className="p-2 rounded-lg bg-purple-400/10">
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats.totalCandidates}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Score</span>
            <div className="p-2 rounded-lg bg-cyan-400/10">
              <Star className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-400">{stats.avgScore || '--'}</div>
        </div>
      </div>

      {/* Location Analytics Charts */}
      {scenes.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* INT/EXT Pie Chart */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Scene Types
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.intExtData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.intExtData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time of Day Bar Chart */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Time of Day
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Candidates Per Scene */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Candidates by Scene
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.candidatesPerScene} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={35} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="candidates" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Scene List Panel */}
        <div className="col-span-1 space-y-4">
          {/* Search & Filter */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scenes..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  filterType === 'all' ? 'bg-emerald-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All ({scenes.length})
              </button>
              <button
                onClick={() => setFilterType('ext')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  filterType === 'ext' ? 'bg-amber-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                EXT ({stats.extScenes})
              </button>
              <button
                onClick={() => setFilterType('int')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  filterType === 'int' ? 'bg-blue-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                INT ({stats.intScenes})
              </button>
            </div>
          </div>

          {/* Scene List */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium">Scenes</span>
              <span className="text-xs text-gray-500">{filteredScenes.length} scenes</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-800">
              {extScenes.length > 0 && (
                <div className="p-2">
                  <h3 className="text-[10px] font-medium text-amber-400 mb-2 uppercase px-2">Exterior Scenes</h3>
                  <div className="space-y-1">
                    {extScenes.map((scene, idx) => {
                      const actualIndex = filteredScenes.findIndex(s => s.id === scene.id)
                      return (
                        <SceneButton 
                          key={scene.id} 
                          scene={scene} 
                          selected={selectedSceneId === scene.id} 
                          onClick={handleSelectScene}
                          isRowSelected={actualIndex === selectedRowIndex}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
              {intScenes.length > 0 && (
                <div className="p-2">
                  <h3 className="text-[10px] font-medium text-blue-400 mb-2 uppercase px-2">Interior Scenes</h3>
                  <div className="space-y-1">
                    {intScenes.map((scene, idx) => {
                      const actualIndex = filteredScenes.findIndex(s => s.id === scene.id)
                      return (
                        <SceneButton 
                          key={scene.id} 
                          scene={scene} 
                          selected={selectedSceneId === scene.id} 
                          onClick={handleSelectScene}
                          isRowSelected={actualIndex === selectedRowIndex}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="col-span-2 space-y-4">
          {!selectedSceneId ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>Select a scene to scout locations</p>
            </div>
          ) : (
            <>
              {/* Scene Header */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono bg-gray-800 px-2 py-0.5 rounded">{selectedScene?.sceneNumber}</span>
                    {selectedScene?.intExt && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        selectedScene.intExt === 'EXT' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'
                      }`}>{selectedScene.intExt}</span>
                    )}
                    {selectedScene?.timeOfDay && (
                      <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">{selectedScene.timeOfDay}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-200 mb-2">{selectedScene?.headingRaw || selectedScene?.location || 'Unknown'}</div>
                  {selectedScene?.locationIntents?.[0]?.keywords && (
                    <div className="flex flex-wrap gap-1">
                      {selectedScene.locationIntents[0].keywords.map((k, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleScout} 
                  disabled={scouting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded font-medium text-sm flex items-center gap-2"
                >
                  {scouting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scouting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Scout Locations
                    </>
                  )}
                </button>
              </div>

              {/* Candidates */}
              {candidates.length === 0 ? (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
                  {scouting ? (
                    <div>
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-emerald-400 animate-spin" />
                      <p>Searching for locations...</p>
                    </div>
                  ) : (
                    <div>
                      <Search className="w-8 h-8 mx-auto mb-4 text-gray-600" />
                      <p>Click "Scout Locations" to find candidates</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Location Candidates</h3>
                    <span className="text-xs text-gray-500">{candidates.length} found</span>
                  </div>
                  {candidates.map((c, idx) => (
                    <div key={c.id || idx} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-400">#{idx + 1}</span>
                            <span className="font-medium text-gray-200">{c.name || 'Unnamed Location'}</span>
                            {c.placeType && (
                              <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(c.placeType)}`}>
                                {c.placeType}
                              </span>
                            )}
                          </div>
                          {c.explanation && (
                            <p className="text-xs text-gray-400 mt-1">{c.explanation}</p>
                          )}
                          {c.riskFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.riskFlags.map((f, i) => <RiskBadge key={i} flag={f} />)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{c.scoreTotal}</div>
                            <div className="text-[10px] text-gray-600">Score</div>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors"
                            title="View on Map"
                          >
                            <Navigation className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-6 mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600">
                        {c.scoreAccess !== null && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>Access: <span className="text-gray-400">{c.scoreAccess}%</span></span>
                          </div>
                        )}
                        {c.scoreLocality !== null && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Locality: <span className="text-gray-400">{c.scoreLocality}%</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SceneButton({
  scene,
  selected,
  onClick,
  isRowSelected,
}: {
  scene: SceneWithIntent
  selected: boolean
  onClick: (id: string) => void
  isRowSelected?: boolean
}) {
  const candidateCount = scene.locationIntents?.[0]?._count?.candidates || 0

  return (
    <button
      onClick={() => onClick(scene.id)}
      className={`w-full text-left px-3 py-2 rounded transition-colors ${
        selected
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : isRowSelected
            ? 'bg-emerald-500/10 border-l-2 border-l-emerald-400'
            : 'hover:bg-gray-700/50 text-gray-400'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs">{scene.sceneNumber}</span>
        <div className="flex items-center gap-2">
          {candidateCount > 0 && (
            <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-2 h-2" />
              {candidateCount}
            </span>
          )}
          <ChevronRight className={`w-3 h-3 transition-transform ${selected ? 'rotate-90' : ''}`} />
        </div>
      </div>
      <div className="text-xs text-gray-500 truncate mt-0.5">
        {scene.location || scene.headingRaw || 'Untitled'}
      </div>
    </button>
  )
}
