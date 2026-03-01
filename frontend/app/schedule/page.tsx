'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  Calendar, RefreshCw, AlertTriangle, CheckCircle, Clock, 
  MapPin, Sun, Moon, Film, Zap, TrendingUp, LayoutGrid
} from 'lucide-react'

interface DaySceneData {
  id: string
  orderNumber: number | null
  estimatedMinutes: number | null
  scene: {
    id: string
    sceneNumber: string
    headingRaw: string | null
    intExt: string | null
    timeOfDay: string | null
    location: string | null
  }
}

interface ShootingDayData {
  id: string
  dayNumber: number
  scheduledDate: string | null
  callTime: string | null
  estimatedHours: string | null
  notes: string | null
  status: string
  locationId: string | null
  location?: { name: string } | null
  dayScenes: DaySceneData[]
}

interface VersionData {
  id: string
  versionNum: number
  label: string | null
  score: number | null
  isActive: boolean
  createdAt: string
}

interface ScheduleStats {
  totalDays: number
  totalHours: number
  totalScenes: number
}

// Demo data for when no real data exists
const DEMO_SHOOTING_DAYS: ShootingDayData[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    scheduledDate: '2026-03-15',
    callTime: '06:00',
    estimatedHours: '11',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-1',
    location: { name: 'KAPALEESHWARAR TEMPLE' },
    dayScenes: [
      { id: 'ds-1', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's1', sceneNumber: '1', headingRaw: 'EXT. TEMPLE - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'KAPALEESHWARAR TEMPLE' }},
      { id: 'ds-2', orderNumber: 2, estimatedMinutes: 30, scene: { id: 's2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE COURTYARD - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'KAPALEESHWARAR TEMPLE' }},
      { id: 'ds-3', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's3', sceneNumber: '3', headingRaw: 'INT. TEMPLE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'KAPALEESHWARAR TEMPLE' }},
    ]
  },
  {
    id: 'day-2',
    dayNumber: 2,
    scheduledDate: '2026-03-16',
    callTime: '07:00',
    estimatedHours: '10',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-2',
    location: { name: 'MARINA BEACH' },
    dayScenes: [
      { id: 'ds-4', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's4', sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNRISE', intExt: 'EXT', timeOfDay: 'DAWN', location: 'MARINA BEACH' }},
      { id: 'ds-5', orderNumber: 2, estimatedMinutes: 30, scene: { id: 's5', sceneNumber: '6', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'MARINA BEACH' }},
      { id: 'ds-6', orderNumber: 3, estimatedMinutes: 90, scene: { id: 's6', sceneNumber: '7', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'MARINA BEACH' }},
    ]
  },
  {
    id: 'day-3',
    dayNumber: 3,
    scheduledDate: '2026-03-17',
    callTime: '18:00',
    estimatedHours: '8',
    notes: 'Night shoot - pack warm',
    status: 'scheduled',
    locationId: 'loc-3',
    location: { name: 'CHENNAI POLICE STATION' },
    dayScenes: [
      { id: 'ds-7', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's7', sceneNumber: '12', headingRaw: 'EXT. POLICE STATION - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'CHENNAI POLICE STATION' }},
      { id: 'ds-8', orderNumber: 2, estimatedMinutes: 45, scene: { id: 's8', sceneNumber: '13', headingRaw: 'INT. POLICE STATION - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'CHENNAI POLICE STATION' }},
    ]
  },
  {
    id: 'day-4',
    dayNumber: 4,
    scheduledDate: '2026-03-18',
    callTime: '06:00',
    estimatedHours: '12',
    notes: 'CRITICAL: Major action sequence',
    status: 'scheduled',
    locationId: 'loc-4',
    location: { name: 'WAREHOUSE DISTRICT' },
    dayScenes: [
      { id: 'ds-9', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's9', sceneNumber: '15', headingRaw: 'EXT. WAREHOUSE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
      { id: 'ds-10', orderNumber: 2, estimatedMinutes: 120, scene: { id: 's10', sceneNumber: '16', headingRaw: 'INT. WAREHOUSE - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
      { id: 'ds-11', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's11', sceneNumber: '17', headingRaw: 'EXT. WAREHOUSE ROOFTOP - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
    ]
  },
  {
    id: 'day-5',
    dayNumber: 5,
    scheduledDate: '2026-03-19',
    callTime: '08:00',
    estimatedHours: '9',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-5',
    location: { name: 'RAVI\'S HOUSE' },
    dayScenes: [
      { id: 'ds-12', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's12', sceneNumber: '20', headingRaw: 'INT. RAVI\'S HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
      { id: 'ds-13', orderNumber: 2, estimatedMinutes: 60, scene: { id: 's13', sceneNumber: '21', headingRaw: 'EXT. RAVI\'S HOUSE - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
      { id: 'ds-14', orderNumber: 3, estimatedMinutes: 30, scene: { id: 's14', sceneNumber: '22', headingRaw: 'INT. RAVI\'S BEDROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
    ]
  },
  {
    id: 'day-6',
    dayNumber: 6,
    scheduledDate: '2026-03-20',
    callTime: '19:00',
    estimatedHours: '7',
    notes: 'Emotional scene - allow extra time',
    status: 'scheduled',
    locationId: 'loc-6',
    location: { name: 'DIVYA\'S APARTMENT' },
    dayScenes: [
      { id: 'ds-15', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's15', sceneNumber: '25', headingRaw: 'INT. DIVYA\'S APARTMENT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'DIVYA\'S APARTMENT' }},
      { id: 'ds-16', orderNumber: 2, estimatedMinutes: 45, scene: { id: 's16', sceneNumber: '26', headingRaw: 'EXT. DIVYA\'S BALCONY - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'DIVYA\'S APARTMENT' }},
    ]
  },
  {
    id: 'day-7',
    dayNumber: 7,
    scheduledDate: '2026-03-21',
    callTime: '06:00',
    estimatedHours: '10',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-7',
    location: { name: 'COURTROOM' },
    dayScenes: [
      { id: 'ds-17', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's17', sceneNumber: '30', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' }},
      { id: 'ds-18', orderNumber: 2, estimatedMinutes: 60, scene: { id: 's18', sceneNumber: '31', headingRaw: 'EXT. COURTROOM - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'COURTROOM' }},
    ]
  },
  {
    id: 'day-8',
    dayNumber: 8,
    scheduledDate: '2026-03-22',
    callTime: '18:00',
    estimatedHours: '9',
    notes: 'Final climax - critical day',
    status: 'scheduled',
    locationId: 'loc-8',
    location: { name: 'STADIUM' },
    dayScenes: [
      { id: 'ds-19', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's19', sceneNumber: '40', headingRaw: 'EXT. STADIUM - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'STADIUM' }},
      { id: 'ds-20', orderNumber: 2, estimatedMinutes: 120, scene: { id: 's20', sceneNumber: '41', headingRaw: 'EXT. STADIUM - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'STADIUM' }},
      { id: 'ds-21', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's21', sceneNumber: '42', headingRaw: 'EXT. STADIUM - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'STADIUM' }},
    ]
  },
]

const DEMO_VERSIONS: VersionData[] = [
  { id: 'v3', versionNum: 3, label: 'Final', score: 94, isActive: true, createdAt: '2026-02-28T10:00:00Z' },
  { id: 'v2', versionNum: 2, label: 'Weather Backup', score: 88, isActive: false, createdAt: '2026-02-25T14:30:00Z' },
  { id: 'v1', versionNum: 1, label: 'Initial', score: 76, isActive: false, createdAt: '2026-02-20T09:15:00Z' },
]

const DEMO_STATS: ScheduleStats = { totalDays: 8, totalHours: 76, totalScenes: 21 }

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

const MODES = [
  { key: 'balanced', label: 'Balanced', desc: 'Default optimization' },
  { key: 'fast', label: 'Fast', desc: 'Minimal optimization, quick result' },
  { key: 'cost_minimum', label: 'Cost Minimum', desc: 'Minimize location moves' },
  { key: 'travel_minimum', label: 'Travel Minimum', desc: 'Cluster by location' },
  { key: 'weather_safe', label: 'Weather Safe', desc: 'Prioritize indoor scenes' },
]

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400', icon: Calendar },
  'in-progress': { label: 'In Progress', color: 'bg-amber-500/20 text-amber-400', icon: Zap },
  completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  delayed: { label: 'Delayed', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
}

interface SchedulePageProps {
  initialData?: {
    shootingDays: ShootingDayData[]
    versions: VersionData[]
    stats: ScheduleStats
  }
}

export default function SchedulePage() {
  const [shootingDays, setShootingDays] = useState<ShootingDayData[]>([])
  const [versions, setVersions] = useState<VersionData[]>([])
  const [stats, setStats] = useState<ScheduleStats>({ totalDays: 0, totalHours: 0, totalScenes: 0 })
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('timeline')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const [mode, setMode] = useState('balanced')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/schedule')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      
      // Use real data if available, otherwise use demo data
      if (data.shootingDays && data.shootingDays.length > 0) {
        setShootingDays(data.shootingDays || [])
        setVersions(data.versions || [])
        setStats(data.stats || { totalDays: 0, totalHours: 0, totalScenes: 0 })
        setIsDemoMode(false)
      } else {
        // Use demo data when no real data exists
        setShootingDays(DEMO_SHOOTING_DAYS)
        setVersions(DEMO_VERSIONS)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.error('Schedule fetch error:', e)
      // Use demo data on error for better UX
      setShootingDays(DEMO_SHOOTING_DAYS)
      setVersions(DEMO_VERSIONS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchData() 
  }, [fetchData])

  const handleOptimize = async () => {
    setOptimizing(true)
    setError(null)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', startDate, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Optimization failed')
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOptimizing(false)
    }
  }

  // Compute chart data
  const chartData = useMemo(() => {
    return shootingDays.map(day => {
      const hours = Number(day.estimatedHours || 0)
      const scenes = day.dayScenes.length
      const intScenes = day.dayScenes.filter(ds => ds.scene.intExt === 'INT').length
      const extScenes = day.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length
      const nightScenes = day.dayScenes.filter(ds => ds.scene.timeOfDay === 'NIGHT').length
      
      return {
        day: `D${day.dayNumber}`,
        fullDate: day.scheduledDate,
        scenes,
        hours: Math.round(hours * 10) / 10,
        intScenes,
        extScenes,
        nightScenes,
        utilization: Math.round((hours / 12) * 100),
      }
    })
  }, [shootingDays])

  // Pie chart data for int/ext
  const pieData = useMemo(() => {
    const intCount = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'INT').length, 0)
    const extCount = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length, 0)
    return [
      { name: 'Interior', value: intCount, color: COLORS.info },
      { name: 'Exterior', value: extCount, color: COLORS.warning },
    ].filter(d => d.value > 0)
  }, [shootingDays])

  // Location breakdown
  const locationData = useMemo(() => {
    const locMap = new Map<string, { scenes: number; hours: number; days: number }>()
    shootingDays.forEach(day => {
      const locName = day.location?.name || 'Unknown'
      const existing = locMap.get(locName) || { scenes: 0, hours: 0, days: 0 }
      existing.scenes += day.dayScenes.length
      existing.hours += Number(day.estimatedHours || 0)
      existing.days += 1
      locMap.set(locName, existing)
    })
    return Array.from(locMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.scenes - a.scenes)
  }, [shootingDays])

  // Night vs Day breakdown
  const dayNightData = useMemo(() => {
    const dayShoots = shootingDays.filter(d => 
      !d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
    ).length
    const nightShoots = shootingDays.filter(d => 
      d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
    ).length
    return [
      { name: 'Day Shoots', value: dayShoots, color: COLORS.warning },
      { name: 'Night Shoots', value: nightShoots, color: COLORS.secondary },
    ]
  }, [shootingDays])

  // Stats computation
  const computedStats = useMemo(() => {
    const totalHours = shootingDays.reduce((sum, d) => sum + Number(d.estimatedHours || 0), 0)
    const totalScenes = shootingDays.reduce((sum, d) => sum + d.dayScenes.length, 0)
    const avgHoursPerDay = shootingDays.length > 0 ? totalHours / shootingDays.length : 0
    const overtimeDays = shootingDays.filter(d => Number(d.estimatedHours || 0) > 10).length
    const nightShootDays = shootingDays.filter(d => 
      d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')).length
    const intScenes = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'INT').length, 0)
    const extScenes = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length, 0)
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      overtimeDays,
      nightShootDays,
      intScenes,
      extScenes,
    }
  }, [shootingDays])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getStatusConfig = (status: string) => STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400">Loading schedule...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-400" />
              Schedule Engine
            </h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">AI-powered shooting schedule with TFPC compliance</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 inline-block mr-1.5" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'chart' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-1.5" />
            Analytics
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-red-400 font-medium">Schedule Error</div>
            <div className="text-red-300/70 text-sm mt-0.5">{error}</div>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Mode:</label>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)} 
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {MODES.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleOptimize} 
            disabled={optimizing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-white flex items-center gap-2 transition-colors"
          >
            {optimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Schedule
              </>
            )}
          </button>
          <button 
            onClick={fetchData}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Shoot Days
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalDays}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Total Hours
          </div>
          <div className="text-2xl font-bold text-indigo-400">{computedStats.totalHours}h</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Film className="w-3.5 h-3.5" />
            Scenes
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalScenes}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Avg/Day
          </div>
          <div className="text-2xl font-bold text-amber-400">{computedStats.avgHoursPerDay}h</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Sun className="w-3.5 h-3.5" />
            Day Shoots
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalDays - computedStats.nightShootDays}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Moon className="w-3.5 h-3.5" />
            Night Shoots
          </div>
          <div className="text-2xl font-bold text-purple-400">{computedStats.nightShootDays}</div>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && shootingDays.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenes per Day Bar Chart */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Scenes & Hours per Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="scenes" name="Scenes" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="hours" name="Hours" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interior/Exterior Pie */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Interior vs Exterior</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Day vs Night Pie */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Day vs Night Shoots</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dayNightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} days`}
                >
                  {dayNightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Location Breakdown */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Location Breakdown</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {locationData.map((loc, idx) => (
                <div key={loc.name} className="flex items-center gap-3">
                  <div className="w-8 text-center text-xs font-bold text-indigo-400">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300 truncate">{loc.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{loc.days} days</span>
                      <span className="text-gray-600">•</span>
                      <span>{loc.scenes} scenes</span>
                      <span className="text-gray-600">•</span>
                      <span>{loc.hours}h</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(loc.scenes / Math.max(...locationData.map(l => l.scenes))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day Utilization Chart */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Day Utilization (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Utilization']}
                />
                <Bar dataKey="utilization" name="Utilization" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.utilization > 80 ? COLORS.danger : entry.utilization > 60 ? COLORS.warning : COLORS.success} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Version Info */}
      {versions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Versions:</span>
          {versions.map(v => (
            <div 
              key={v.id} 
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                v.isActive 
                  ? 'bg-indigo-900/40 border border-indigo-700/50 text-indigo-400' 
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {v.label || `v${v.versionNum}`}
              {v.score !== null && <span className="ml-1.5 text-gray-600">• {v.score}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        shootingDays.length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No Schedule Generated</div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload and parse a script first, then click "Optimize Schedule" to create your shooting plan with AI-powered scene clustering and TFPC compliance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shootingDays.map(day => {
              const hours = Number(day.estimatedHours || 0)
              const utilizationPct = Math.min(100, (hours / 12) * 100)
              const isOvertime = hours > 10
              const isLight = hours < 6
              const StatusIcon = getStatusConfig(day.status).icon

              return (
                <div 
                  key={day.id} 
                  className="bg-gray-800/40 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
                >
                  {/* Day Header */}
                  <div className="px-5 py-4 bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-indigo-400 w-12">D{day.dayNumber}</span>
                        <div className="w-px h-6 bg-gray-700" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">{formatDate(day.scheduledDate)}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {day.callTime || '06:00'} call
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Time badges */}
                      <div className="flex items-center gap-2">
                        {day.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT') ? (
                          <span className="px-2 py-1 bg-indigo-900/40 text-indigo-400 rounded text-xs flex items-center gap-1">
                            <Moon className="w-3 h-3" />
                            Night
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs flex items-center gap-1">
                            <Sun className="w-3 h-3" />
                            Day
                          </span>
                        )}
                      </div>

                      {/* Utilization bar */}
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Utilization</span>
                            <span className={isOvertime ? 'text-red-400' : isLight ? 'text-gray-400' : 'text-emerald-400'}>
                              {Math.round(utilizationPct)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isOvertime ? 'bg-red-500' : isLight ? 'bg-gray-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${utilizationPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className={`text-lg font-bold ${isOvertime ? 'text-red-400' : 'text-white'}`}>
                            {hours}h
                          </div>
                          <div className="text-xs text-gray-500">{day.dayScenes.length} scenes</div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                        getStatusConfig(day.status).color
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {getStatusConfig(day.status).label}
                      </div>
                    </div>
                  </div>

                  {/* Scenes List */}
                  <div className="divide-y divide-gray-800/50">
                    {day.dayScenes.map((ds, idx) => (
                      <div 
                        key={ds.id} 
                        className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors"
                      >
                        <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded w-14 text-center text-gray-300">
                          {ds.scene.sceneNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {ds.scene.intExt && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              ds.scene.intExt === 'INT' 
                                ? 'bg-blue-900/40 text-blue-400' 
                                : 'bg-amber-900/40 text-amber-400'
                            }`}>
                              {ds.scene.intExt}
                            </span>
                          )}
                          {ds.scene.timeOfDay && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              ds.scene.timeOfDay === 'NIGHT'
                                ? 'bg-indigo-900/40 text-indigo-400'
                                : 'bg-yellow-900/40 text-yellow-400'
                            }`}>
                              {ds.scene.timeOfDay}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-300 flex-1 truncate">
                          {ds.scene.headingRaw || ds.scene.location || 'Untitled Scene'}
                        </span>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {ds.estimatedMinutes ? `${ds.estimatedMinutes}m` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {day.notes && (
                    <div className="px-5 py-2.5 bg-yellow-900/10 text-yellow-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {day.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
