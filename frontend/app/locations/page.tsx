'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  MapPin, Search, Filter, RefreshCw, Loader2, 
  Star, ExternalLink, TrendingUp, AlertTriangle,
  Building2, Trees, Warehouse, Waves, Users,
  ChevronRight, Info, Target, Award
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
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
  isFavorite?: boolean
}

const PLACE_TYPE_ICONS: Record<string, typeof Building2> = {
  'restaurant': Building2,
  'park': Trees,
  'warehouse': Warehouse,
  'beach': Waves,
  'hotel': Building2,
  'temple': Building2,
  'office': Building2,
  'resort': Building2,
  'mountain': Trees,
  'forest': Trees,
  'studio': Building2,
  'default': MapPin,
}

const PLACE_TYPE_COLORS: Record<string, string> = {
  'restaurant': '#f59e0b',
  'park': '#10b981',
  'warehouse': '#6366f1',
  'beach': '#06b6d4',
  'hotel': '#8b5cf6',
  'temple': '#f97316',
  'office': '#3b82f6',
  'resort': '#ec4899',
  'mountain': '#14b8a6',
  'forest': '#22c55e',
  'studio': '#a855f7',
  'default': '#64748b',
}

function getPlaceTypeIcon(placeType: string | null) {
  if (!placeType) return PLACE_TYPE_ICONS.default
  const key = placeType.toLowerCase()
  return PLACE_TYPE_ICONS[key] || PLACE_TYPE_ICONS.default
}

function getPlaceTypeColor(placeType: string | null) {
  if (!placeType) return PLACE_TYPE_COLORS.default
  const key = placeType.toLowerCase()
  return PLACE_TYPE_COLORS[key] || PLACE_TYPE_COLORS.default
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

// Demo data for when API returns nothing
const DEMO_SCENES: SceneWithIntent[] = [
  { id: '1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Chennai Street', locationIntents: [{ id: '1', keywords: ['street', 'urban', 'night'], terrainType: 'urban', _count: { candidates: 3 } }] },
  { id: '2', sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNSET', intExt: 'EXT', timeOfDay: 'SUNSET', location: 'Marina Beach', locationIntents: [{ id: '2', keywords: ['beach', 'sunset', 'coastal'], terrainType: 'coastal', _count: { candidates: 2 } }] },
  { id: '3', sceneNumber: '12', headingRaw: 'INT. RESTAURANT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tamil Restaurant', locationIntents: [{ id: '3', keywords: ['restaurant', 'indoor', 'traditional'], terrainType: 'indoor', _count: { candidates: 4 } }] },
  { id: '4', sceneNumber: '18', headingRaw: 'EXT. TEMPLE - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Kapaleeshwarar Temple', locationIntents: [{ id: '4', keywords: ['temple', 'heritage', 'morning'], terrainType: 'heritage', _count: { candidates: 2 } }] },
]

const DEMO_CANDIDATES: CandidateData[] = [
  { id: '1', name: 'Marina Beach Promenade', latitude: '13.0500', longitude: '80.2824', placeType: 'beach', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: [], explanation: 'Wide open space perfect for night shoots with excellent crowd control options. Multiple access points from the main road.' },
  { id: '2', name: 'Edward Elliot\'s Beach', latitude: '13.0333', longitude: '80.2833', placeType: 'beach', scoreTotal: 78, scoreAccess: 75, scoreLocality: 82, riskFlags: ['Tourist crowd'], explanation: 'Less crowded than Marina but limited parking. Good for early morning shoots.' },
  { id: '3', name: 'Besant Nagar Beach', latitude: '12.9989', longitude: '80.2678', placeType: 'beach', scoreTotal: 72, scoreAccess: 70, scoreLocality: 75, riskFlags: ['Weekend crowd', 'Limited space'], explanation: 'More local feel, good for village/realistic sequences. Requires early morning permit.' },
]

export default function LocationsPage() {
  const [scenes, setScenes] = useState<SceneWithIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [scouting, setScouting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filterScore, setFilterScore] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score')
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards')

  const fetchScenes = useCallback(async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      if (data.scenes && data.scenes.length > 0) {
        setScenes(data.scenes)
      } else {
        // Use demo data
        setScenes(DEMO_SCENES)
      }
    } catch (e) {
      console.error(e)
      setScenes(DEMO_SCENES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScenes() }, [fetchScenes])

  const handleSelectScene = async (sceneId: string) => {
    setSelectedSceneId(sceneId)
    setCandidates([])
    setError(null)
    try {
      const res = await fetch(`/api/locations?sceneId=${sceneId}`)
      const data = await res.json()
      if (data.intent?.candidates && data.intent.candidates.length > 0) {
        setCandidates(data.intent.candidates)
      } else {
        // Use demo candidates for preview
        setCandidates(DEMO_CANDIDATES)
      }
    } catch (e) {
      console.error(e)
      setCandidates(DEMO_CANDIDATES)
    }
  }

  const handleScout = async () => {
    if (!selectedSceneId) return
    setScouting(true)
    setError(null)
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
      setError(e.message || 'Failed to scout locations')
      // Still show demo data for preview
      setCandidates(DEMO_CANDIDATES)
    } finally {
      setScouting(false)
    }
  }

  const toggleFavorite = (candidateId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
  }

  const selectedScene = scenes.find(s => s.id === selectedSceneId)
  const extScenes = scenes.filter(s => s.intExt === 'EXT')
  const intScenes = scenes.filter(s => s.intExt !== 'EXT')

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => c.scoreTotal >= filterScore)
    if (sortBy === 'score') {
      return result.sort((a, b) => b.scoreTotal - a.scoreTotal)
    }
    return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [candidates, filterScore, sortBy])

  // Statistics
  const stats = useMemo(() => {
    const total = candidates.length
    const avgScore = total > 0 ? candidates.reduce((s, c) => s + c.scoreTotal, 0) / total : 0
    const highScore = total > 0 ? Math.max(...candidates.map(c => c.scoreTotal)) : 0
    const withRisks = candidates.filter(c => c.riskFlags.length > 0).length
    return { total, avgScore: Math.round(avgScore), highScore, withRisks }
  }, [candidates])

  // Chart data
  const scoreChartData = useMemo(() => {
    return filteredCandidates.map(c => ({
      name: c.name?.substring(0, 15) || 'Unknown',
      score: c.scoreTotal,
      access: c.scoreAccess || 0,
      locality: c.scoreLocality || 0,
    }))
  }, [filteredCandidates])

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    candidates.forEach(c => {
      const type = c.placeType || 'other'
      counts[type] = (counts[type] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [candidates])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Location Scouter</h1>
            <p className="text-slate-400 text-sm mt-0.5">AI-powered script-aware location discovery</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'cards' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'chart' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Scenes Found</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Upload and parse a script first to see location suggestions for each scene.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Scene List Panel */}
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Script Scenes</h3>
              
              {extScenes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-amber-400 uppercase">Exterior</span>
                    <span className="text-xs text-slate-600">({extScenes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {extScenes.map(scene => (
                      <SceneButton 
                        key={scene.id} 
                        scene={scene} 
                        selected={selectedSceneId === scene.id} 
                        onClick={handleSelectScene}
                        candidateCount={scene.locationIntents?.[0]?._count?.candidates || 0}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {intScenes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-blue-400 uppercase">Interior</span>
                    <span className="text-xs text-slate-600">({intScenes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {intScenes.map(scene => (
                      <SceneButton 
                        key={scene.id} 
                        scene={scene} 
                        selected={selectedSceneId === scene.id} 
                        onClick={handleSelectScene}
                        candidateCount={scene.locationIntents?.[0]?._count?.candidates || 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Panel */}
          <div className="col-span-9 space-y-4">
            {!selectedSceneId ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Select a Scene</h3>
                <p className="text-slate-500">Choose a scene from the list to scout locations</p>
              </div>
            ) : (
              <>
                {/* Scene Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-lg text-slate-300">
                          {selectedScene?.sceneNumber}
                        </span>
                        {selectedScene?.intExt && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            selectedScene.intExt === 'EXT' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {selectedScene.intExt}
                          </span>
                        )}
                        {selectedScene?.timeOfDay && (
                          <span className="text-xs px-3 py-1 bg-slate-800 rounded-full text-slate-400">
                            {selectedScene.timeOfDay}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-medium text-white mb-2">
                        {selectedScene?.headingRaw || selectedScene?.location || 'Unknown Location'}
                      </h2>
                      {selectedScene?.locationIntents?.[0]?.keywords && (
                        <div className="flex flex-wrap gap-2">
                          {selectedScene.locationIntents[0].keywords.map((k, i) => (
                            <span 
                              key={i} 
                              className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleScout} 
                      disabled={scouting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {scouting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {scouting ? 'Scouting...' : 'Find Locations'}
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                {candidates.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-slate-500 uppercase">Total Spots</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-500 uppercase">Avg Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                        {stats.avgScore}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-500 uppercase">Best Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(stats.highScore)}`}>
                        {stats.highScore}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-500 uppercase">With Risks</span>
                      </div>
                      <p className="text-2xl font-bold text-red-400">{stats.withRisks}</p>
                    </div>
                  </div>
                )}

                {/* Filters */}
                {candidates.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">Min Score:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filterScore}
                        onChange={(e) => setFilterScore(Number(e.target.value))}
                        className="w-32 accent-emerald-500"
                      />
                      <span className="text-sm font-medium text-emerald-400 w-12">{filterScore}+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="score">By Score</option>
                        <option value="name">By Name</option>
                      </select>
                    </div>
                    <div className="ml-auto text-sm text-slate-500">
                      Showing {filteredCandidates.length} of {candidates.length} locations
                    </div>
                  </div>
                )}

                {/* Candidates */}
                {candidates.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                    {scouting ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Searching for Locations</h3>
                        <p className="text-slate-500">Analyzing scene requirements and finding matches...</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Ready to Scout</h3>
                        <p className="text-slate-500">Click "Find Locations" to discover potential filming spots</p>
                      </>
                    )}
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCandidates.map((c, idx) => {
                      const PlaceIcon = getPlaceTypeIcon(c.placeType)
                      const placeColor = getPlaceTypeColor(c.placeType)
                      
                      return (
                        <div 
                          key={c.id || idx} 
                          className={`bg-slate-900 border rounded-xl p-5 transition-all hover:border-slate-600 ${
                            favorites.has(c.id || '') ? 'border-emerald-500/50' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${placeColor}20` }}
                              >
                                <PlaceIcon className="w-6 h-6" style={{ color: placeColor }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-emerald-400">#{idx + 1}</span>
                                  {favorites.has(c.id || '') && (
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  )}
                                </div>
                                <h4 className="font-medium text-white">{c.name || 'Unnamed Location'}</h4>
                                {c.placeType && (
                                  <span className="text-xs text-slate-500 capitalize">{c.placeType}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleFavorite(c.id || '')}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Star 
                                  className={`w-5 h-5 ${
                                    favorites.has(c.id || '') 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-slate-600'
                                  }`} 
                                />
                              </button>
                              <a
                                href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-5 h-5 text-slate-400" />
                              </a>
                            </div>
                          </div>

                          {c.explanation && (
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{c.explanation}</p>
                          )}

                          {/* Score bars */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Total</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${getScoreBg(c.scoreTotal)}`}
                                  style={{ width: `${c.scoreTotal}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold w-8 ${getScoreColor(c.scoreTotal)}`}>
                                {c.scoreTotal}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Access</span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${c.scoreAccess || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{c.scoreAccess || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Locality</span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${c.scoreLocality || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{c.scoreLocality || '-'}</span>
                            </div>
                          </div>

                          {c.riskFlags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                              {c.riskFlags.map((f, i) => (
                                <span 
                                  key={i} 
                                  className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Score Comparison Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Score Comparison
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} name="Total" />
                            <Bar dataKey="access" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Access" />
                            <Bar dataKey="locality" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Locality" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Type Distribution */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        Location Types
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={typeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {typeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getPlaceTypeColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneButton({
  scene,
  selected,
  onClick,
  candidateCount = 0,
}: {
  scene: SceneWithIntent
  selected: boolean
  onClick: (id: string) => void
  candidateCount?: number
}) {
  return (
    <button
      onClick={() => onClick(scene.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
        selected
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs font-medium">{scene.sceneNumber}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${selected ? 'text-emerald-400' : 'text-slate-600'}`} />
      </div>
      <div className="text-xs text-slate-500 truncate">
        {scene.location || scene.headingRaw?.substring(0, 30) || 'Untitled'}
      </div>
      {candidateCount > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400">{candidateCount} spots</span>
        </div>
      )}
    </button>
  )
}
