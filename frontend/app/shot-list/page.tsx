'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Video, Filter, Download, RefreshCw, Lock, Unlock, Plus,
  Sparkles, AlertCircle, CheckCircle, Clock, Target, Film,
  ChevronDown, ChevronUp, Settings, Wand2, X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

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

interface Stats {
  totalShots: number
  totalDuration: number
  missingFields: number
  avgConfidence: number
  bySize: Record<string, number>
  byMovement: Record<string, number>
  byScene: { sceneNumber: string; count: number }[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#64748b',
}

// ============================================================================
// COMPONENTS
// ============================================================================

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308']

// Shared helper functions
const getConfidenceColor = (conf: number) => {
  if (conf >= 0.7) return 'text-green-400'
  if (conf >= 0.4) return 'text-yellow-400'
  return 'text-red-400'
}

const getConfidenceBg = (conf: number) => {
  if (conf >= 0.7) return 'bg-green-400/10 border-green-400/30'
  if (conf >= 0.4) return 'bg-yellow-400/10 border-yellow-400/30'
  return 'bg-red-400/10 border-red-400/30'
}

export default function ShotHubPage() {
  const [shots, setShots] = useState<ShotData[]>([])
  const [scenes, setScenes] = useState<SceneInfo[]>([])
  const [stats, setStats] = useState<Stats>({
    totalShots: 0, totalDuration: 0, missingFields: 0, avgConfidence: 0,
    bySize: {}, byMovement: {}, byScene: []
  })
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState('')

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [directorStyle, setDirectorStyle] = useState<string>('maniRatnam')
  const [sceneFilter, setSceneFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [movementFilter, setMovementFilter] = useState<string>('')
  const [showIncomplete, setShowIncomplete] = useState(false)

  const [scriptId, setScriptId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [expandedShot, setExpandedShot] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------

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
      const shotList = data.shots || []
      const sceneList = data.scenes || []
      
      // Check if using demo data
      setIsDemoMode(data.isDemoMode === true)
      
      // Calculate detailed stats
      const bySize: Record<string, number> = {}
      const byMovement: Record<string, number> = {}
      let totalConf = 0
      let confCount = 0
      let missing = 0

      shotList.forEach((shot: ShotData) => {
        if (shot.shotSize) bySize[shot.shotSize] = (bySize[shot.shotSize] || 0) + 1
        if (shot.cameraMovement) byMovement[shot.cameraMovement] = (byMovement[shot.cameraMovement] || 0) + 1
        
        const conf = ((shot.confidenceCamera || 0) + (shot.confidenceLens || 0) + 
                      (shot.confidenceLight || 0) + (shot.confidenceDuration || 0)) / 4
        if (conf > 0) { totalConf += conf; confCount++ }
        
        if (!shot.shotSize || !shot.focalLengthMm || !shot.keyStyle || !shot.durationEstSec) missing++
      })

      const byScene = sceneList.map((s: SceneInfo) => ({
        sceneNumber: s.sceneNumber,
        count: s._count.shots
      }))

      setStats({
        totalShots: shotList.length,
        totalDuration: data.stats?.totalDuration || 0,
        missingFields: missing,
        avgConfidence: confCount > 0 ? totalConf / confCount : 0,
        bySize,
        byMovement,
        byScene
      })

      setShots(shotList)
      setScenes(sceneList)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      const id = await fetchScriptId()
      if (id) await fetchShots(id)
      else setLoading(false)
    })()
  }, [fetchScriptId, fetchShots])

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const handleGenerateAll = async () => {
    if (!scriptId) return
    setGenerating(true)
    setError(null)
    setSuccess(null)
    setGenProgress('Analyzing script and generating shots...')

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScript', scriptId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGenProgress(`Generating shot details with AI...`)
      setSuccess(`Successfully generated ${data.totalShots} shots!`)
      await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message || 'Failed to generate shots')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateScene = async (sceneId: string) => {
    setGenerating(true)
    setError(null)
    setSuccess(null)
    setGenProgress('Generating shots for scene...')

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScene', sceneId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Generated ${data.shotCount} shots for this scene`)
      if (scriptId) await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleFillNull = async (shotId: string) => {
    try {
      setError(null)
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fillNull', shotId, directorStyle }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      if (scriptId) await fetchShots(scriptId)
      setSuccess('Shot details filled!')
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
      if (scriptId) await fetchShots(scriptId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = () => {
    const headers = ['Shot #', 'Scene', 'Description', 'Size', 'Angle', 'Movement', 'Lens', 'Duration', 'Confidence']
    const rows = filteredShots.map(s => [
      s.shotIndex,
      s.scene.sceneNumber,
      s.shotText.substring(0, 50),
      s.shotSize || '',
      s.cameraAngle || '',
      s.cameraMovement || '',
      s.focalLengthMm ? `${s.focalLengthMm}mm` : '',
      s.durationEstSec ? `${s.durationEstSec}s` : '',
      Math.round(((s.confidenceCamera || 0) + (s.confidenceLens || 0) + (s.confidenceLight || 0) + (s.confidenceDuration || 0)) / 4 * 100) + '%'
    ])
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shots-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export to JSON format
  const handleExportJSON = () => {
    const exportData = filteredShots.map(s => ({
      shotNumber: s.shotIndex,
      beatIndex: s.beatIndex,
      scene: s.scene.sceneNumber,
      description: s.shotText,
      size: s.shotSize,
      angle: s.cameraAngle,
      movement: s.cameraMovement,
      lens: s.focalLengthMm ? `${s.focalLengthMm}mm` : null,
      style: s.keyStyle,
      colorTemp: s.colorTemp,
      durationSec: s.durationEstSec,
      characters: s.characters,
      confidence: {
        camera: s.confidenceCamera,
        lens: s.confidenceLens,
        lighting: s.confidenceLight,
        duration: s.confidenceDuration,
      },
      isLocked: s.isLocked,
      userEdited: s.userEdited,
    }))
    
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shots-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import shots from CSV file
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setError(null)
    setSuccess(null)
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setError('CSV file is empty or has no data rows')
        return
      }
      
      // Parse CSV - skip header row
      const importedShots: { shotIndex: number; beatIndex: number; sceneNumber: string; shotText: string; shotSize: string | null; cameraAngle: string | null; cameraMovement: string | null; focalLengthMm: number | null; durationEstSec: number | null }[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (cols.length >= 4) {
          importedShots.push({
            shotIndex: parseInt(cols[0]) || i,
            beatIndex: 1,
            sceneNumber: cols[1] || '', // Scene number from CSV
            shotText: cols[2] || '',
            shotSize: cols[3] || null,
            cameraAngle: cols[4] || null,
            cameraMovement: cols[5] || null,
            focalLengthMm: cols[6] ? parseInt(cols[6].replace('mm', '')) : null,
            durationEstSec: cols[7] ? parseInt(cols[7].replace('s', '')) : null,
          })
        }
      }
      
      if (importedShots.length > 0) {
        // Actually import via API
        try {
          const res = await fetch('/api/shots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'importCSV', 
              scriptId,
              shots: importedShots 
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Import failed')
          setSuccess(`Successfully imported ${importedShots.length} shots from CSV!`)
          // Refresh shots after import
          if (scriptId) await fetchShots(scriptId)
        } catch (importErr: any) {
          // If API fails, at least show what was parsed
          setError(`API import failed: ${importErr.message}. Parsed ${importedShots.length} shots locally.`)
        }
      } else {
        setError('No valid shots found in CSV')
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`)
    }
    
    // Reset file input
    e.target.value = ''
  }

  // --------------------------------------------------------------------------
  // FILTERING
  // --------------------------------------------------------------------------

  const filteredScenes = useMemo(() => {
    return scenes.filter(s => {
      if (!sceneFilter) return true
      const search = sceneFilter.toLowerCase()
      return s.sceneNumber.toLowerCase().includes(search) ||
        (s.headingRaw || '').toLowerCase().includes(search) ||
        (s.location || '').toLowerCase().includes(search)
    })
  }, [scenes, sceneFilter])

  const filteredShots = useMemo(() => {
    return shots.filter(s => {
      if (selectedSceneId && s.scene.id !== selectedSceneId) return false
      if (sizeFilter && s.shotSize !== sizeFilter) return false
      if (movementFilter && s.cameraMovement !== movementFilter) return false
      if (showIncomplete && s.shotSize && s.focalLengthMm && s.keyStyle && s.durationEstSec) return false
      return true
    })
  }, [shots, selectedSceneId, sizeFilter, movementFilter, showIncomplete])

  // --------------------------------------------------------------------------
  // CHART DATA
  // --------------------------------------------------------------------------

  const sizeChartData = useMemo(() => {
    return Object.entries(stats.bySize).map(([name, value]) => ({ name, value }))
  }, [stats.bySize])

  const movementChartData = useMemo(() => {
    return Object.entries(stats.byMovement).map(([name, value]) => ({ name, value }))
  }, [stats.byMovement])

  const sceneChartData = useMemo(() => {
    return stats.byScene.slice(0, 10)
  }, [stats.byScene])

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400">Loading Shot Hub...</p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ChevronDown className="rotate-90 w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight">Shot Hub</h1>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full font-medium">
                    AI-Powered
                  </span>
                  {isDemoMode && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-0.5">Intelligent shot breakdown & planning</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => scriptId && fetchShots(scriptId)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                disabled={shots.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                disabled={shots.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
                title="Export as JSON"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                title="Import from CSV"
              >
                <Download className="w-4 h-4" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <select
                value={directorStyle}
                onChange={e => setDirectorStyle(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                {STYLE_PRESETS.map(s => (
                  <option key={s.key} value={s.key}>{s.label} Style</option>
                ))}
              </select>
              <button
                onClick={handleGenerateAll}
                disabled={generating || !scriptId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="max-w-[150px] truncate">{genProgress}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate All Shots
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* No Script State */}
        {!scriptId ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Film className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Script Found</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Upload a script first to generate AI-powered shot breakdowns with intelligent camera work, lens selection, and blocking.
            </p>
            <Link href="/scripts" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              Upload Script
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard 
                label="Total Shots" 
                value={stats.totalShots} 
                icon={Video}
                color="indigo"
              />
              <StatCard 
                label="Est. Runtime" 
                value={formatDuration(stats.totalDuration)} 
                icon={Clock}
                color="violet"
              />
              <StatCard 
                label="Missing Details" 
                value={stats.missingFields} 
                icon={AlertCircle}
                color={stats.missingFields > 0 ? "amber" : "emerald"}
              />
              <StatCard 
                label="Avg. Confidence" 
                value={`${Math.round(stats.avgConfidence * 100)}%`} 
                icon={Target}
                color={stats.avgConfidence >= 0.7 ? "emerald" : stats.avgConfidence >= 0.4 ? "amber" : "red"}
              />
              <StatCard 
                label="Scenes" 
                value={scenes.length} 
                icon={Film}
                color="slate"
              />
            </div>

            {/* Charts Row */}
            {shots.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Shot Size Distribution */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Shot Size Distribution</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sizeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sizeChartData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sizeChartData.map(d => (
                      <div key={d.name} className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Movement Distribution */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Camera Movement</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={movementChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={10} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={60} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Shots by Scene */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Shots by Scene</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sceneChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="sceneNumber" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Filters & Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">Filters:</span>
                </div>
                <input
                  type="text"
                  placeholder="Search scenes..."
                  value={sceneFilter}
                  onChange={e => setSceneFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm w-40 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={sizeFilter}
                  onChange={e => setSizeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Sizes</option>
                  {SHOT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={movementFilter}
                  onChange={e => setMovementFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Movements</option>
                  {MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showIncomplete}
                    onChange={e => setShowIncomplete(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  Show incomplete only
                </label>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-slate-500">
                  {filteredShots.length} of {shots.length} shots
                </span>
              </div>
            </div>

            {/* Shot List */}
            {filteredShots.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <Video className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  {shots.length === 0 ? 'No Shots Generated Yet' : 'No Matching Shots'}
                </h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  {shots.length === 0 
                    ? 'Click "Generate All Shots" to create an AI-powered shot breakdown for your script.'
                    : 'Try adjusting your filters to see more shots.'}
                </p>
                {shots.length === 0 && (
                  <button
                    onClick={handleGenerateAll}
                    disabled={generating || !scriptId}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Shots
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShots.map(shot => (
                  <ShotCard
                    key={shot.id}
                    shot={shot}
                    isExpanded={expandedShot === shot.id}
                    onToggleExpand={() => setExpandedShot(expandedShot === shot.id ? null : shot.id)}
                    onUpdate={handleUpdateShot}
                    onFillNull={handleFillNull}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'indigo' | 'violet' | 'amber' | 'emerald' | 'red' | 'slate'
}) {
  const colorClasses = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    red: 'text-red-400 bg-red-500/10',
    slate: 'text-slate-400 bg-slate-500/10',
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ShotCard({
  shot,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onFillNull,
}: {
  shot: ShotData
  isExpanded: boolean
  onToggleExpand: () => void
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

  const confidenceColor = getConfidenceColor(avgConfidence)
  const confidenceBg = getConfidenceBg(avgConfidence)

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
      shot.isLocked ? 'border-blue-700/50' : isExpanded ? 'border-indigo-500/50' : 'border-slate-800'
    }`}>
      <div 
        className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-4">
          {/* Shot Number */}
          <div className="w-12 h-12 bg-slate-800 rounded-lg flex flex-col items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-400">{shot.shotIndex}</span>
            <span className="text-[10px] text-slate-500">B{shot.beatIndex}</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {shot.scene && (
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {shot.scene.sceneNumber}
                </span>
              )}
              {shot.scene?.intExt && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {shot.scene.intExt}
                </span>
              )}
              {shot.scene?.timeOfDay && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {shot.scene.timeOfDay}
                </span>
              )}
              {shot.characters.length > 0 && (
                <div className="flex gap-1">
                  {shot.characters.slice(0, 3).map((c, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded">{c}</span>
                  ))}
                  {shot.characters.length > 3 && (
                    <span className="text-xs text-slate-500">+{shot.characters.length - 3}</span>
                  )}
                </div>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${confidenceBg} ${confidenceColor}`}>
                {Math.round(avgConfidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{shot.shotText}</p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs text-slate-500">Size</p>
              <p className={`text-sm font-medium ${shot.shotSize ? 'text-white' : 'text-amber-400'}`}>
                {shot.shotSize || '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Lens</p>
              <p className={`text-sm font-medium ${shot.focalLengthMm ? 'text-white' : 'text-amber-400'}`}>
                {shot.focalLengthMm ? `${shot.focalLengthMm}mm` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Duration</p>
              <p className={`text-sm font-medium ${shot.durationEstSec ? 'text-white' : 'text-amber-400'}`}>
                {shot.durationEstSec ? `${Math.round(shot.durationEstSec)}s` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Movement</p>
              <p className="text-sm font-medium text-white">
                {shot.cameraMovement || '—'}
              </p>
            </div>
            <div className={`p-1.5 rounded ${isExpanded ? 'text-indigo-400' : 'text-slate-500'}`}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-slate-800 p-4 bg-slate-800/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Shot Size */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Shot Size</label>
              <select
                value={shot.shotSize || ''}
                onChange={e => onUpdate(shot.id, 'shotSize', e.target.value)}
                onClick={e => e.stopPropagation()}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  shot.shotSize ? 'bg-slate-800 border-slate-700' : 'bg-amber-900/20 border-amber-700/50'
                }`}
              >
                <option value="">Select Size</option>
                {SHOT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Camera Angle */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Camera Angle</label>
              <select
                value={shot.cameraAngle || ''}
                onChange={e => onUpdate(shot.id, 'cameraAngle', e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                <option value="">Select Angle</option>
                {ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Movement */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Movement</label>
              <select
                value={shot.cameraMovement || ''}
                onChange={e => onUpdate(shot.id, 'cameraMovement', e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                <option value="">Select Movement</option>
                {MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Focal Length */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Focal Length</label>
              <select
                value={shot.focalLengthMm ?? ''}
                onChange={e => onUpdate(shot.id, 'focalLengthMm', parseInt(e.target.value))}
                onClick={e => e.stopPropagation()}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  shot.focalLengthMm ? 'bg-slate-800 border-slate-700' : 'bg-amber-900/20 border-amber-700/50'
                }`}
              >
                <option value="">Select Lens</option>
                {LENSES.map(l => <option key={l} value={l}>{l}mm</option>)}
              </select>
            </div>

            {/* Key Style */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Key Style</label>
              <input
                type="text"
                value={shot.keyStyle || ''}
                onChange={e => onUpdate(shot.id, 'keyStyle', e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="e.g., Motivated, High contrast"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  shot.keyStyle ? 'bg-slate-800 border-slate-700' : 'bg-amber-900/20 border-amber-700/50'
                }`}
              />
            </div>

            {/* Color Temp */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Color Temp</label>
              <select
                value={shot.colorTemp || ''}
                onChange={e => onUpdate(shot.id, 'colorTemp', e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                <option value="">Select Temp</option>
                <option value="3200K">3200K (Tungsten)</option>
                <option value="4300K">4300K (Neutral)</option>
                <option value="5600K">5600K (Daylight)</option>
                <option value="6500K">6500K (Cool)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={shot.durationEstSec || ''}
                onChange={e => onUpdate(shot.id, 'durationEstSec', parseInt(e.target.value))}
                onClick={e => e.stopPropagation()}
                placeholder="Duration in seconds"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  shot.durationEstSec ? 'bg-slate-800 border-slate-700' : 'bg-amber-900/20 border-amber-700/50'
                }`}
              />
            </div>

            {/* Lock */}
            <div className="flex items-end">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(shot.id, 'isLocked', !shot.isLocked) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  shot.isLocked 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {shot.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {shot.isLocked ? 'Locked' : 'Unlock'}
              </button>
            </div>
          </div>

          {/* AI Actions */}
          {hasMissing && (
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Some fields are missing</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onFillNull(shot.id) }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                AI Fill Missing
              </button>
            </div>
          )}

          {/* Confidence Scores */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">AI Confidence Scores</p>
            <div className="grid grid-cols-4 gap-3">
              <ConfidenceBadge label="Camera" value={shot.confidenceCamera} />
              <ConfidenceBadge label="Lens" value={shot.confidenceLens} />
              <ConfidenceBadge label="Lighting" value={shot.confidenceLight} />
              <ConfidenceBadge label="Duration" value={shot.confidenceDuration} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfidenceBadge({ label, value }: { label: string; value: number | null }) {
  const percentage = value ? Math.round(value * 100) : 0
  const color = value && value >= 0.7 ? 'text-green-400' : value && value >= 0.4 ? 'text-yellow-400' : 'text-red-400'
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{percentage}%</p>
    </div>
  )
}
