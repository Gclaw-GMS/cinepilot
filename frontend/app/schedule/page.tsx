'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Film,
  MapPin,
  Sun,
  Moon,
  Cloud,
  Target,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
  BarChart3,
  Zap,
  DollarSign,
  Settings,
  RefreshCw
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

// ============================================================================
// TYPES
// ============================================================================

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
  avgScenesPerDay: number
  avgHoursPerDay: number
  intScenes: number
  extScenes: number
  dayScenes: number
  nightScenes: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODES = [
  { key: 'balanced', label: '⚖️ Balanced', desc: 'Default optimization' },
  { key: 'fast', label: '⚡ Fast', desc: 'Minimal optimization, quick result' },
  { key: 'cost_minimum', label: '💰 Cost Minimum', desc: 'Minimize location moves' },
  { key: 'travel_minimum', label: '🚗 Travel Minimum', desc: 'Cluster by location' },
  { key: 'weather_safe', label: '🌧️ Weather Safe', desc: 'Prioritize indoor scenes' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
}

const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_SHOOTING_DAYS: ShootingDayData[] = [
  { id: 'd1', dayNumber: 1, scheduledDate: '2026-03-15', callTime: '06:00', estimatedHours: '12', notes: 'First day - temple song sequence', status: 'scheduled', dayScenes: [
    { id: 's1', orderNumber: 1, estimatedMinutes: 45, scene: { id: 'sc1', sceneNumber: '1', headingRaw: 'EXT. TEMPLE - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'Kapaleeshwarar Temple' } },
    { id: 's2', orderNumber: 2, estimatedMinutes: 60, scene: { id: 'sc2', sceneNumber: '2', headingRaw: 'INT. TEMPLE - DAWN', intExt: 'INT', timeOfDay: 'DAWN', location: 'Kapaleeshwarar Temple' } },
    { id: 's3', orderNumber: 3, estimatedMinutes: 30, scene: { id: 'sc3', sceneNumber: '3', headingRaw: 'EXT. TEMPLE COURTYARD - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'Kapaleeshwarar Temple' } },
  ]},
  { id: 'd2', dayNumber: 2, scheduledDate: '2026-03-16', callTime: '07:00', estimatedHours: '10', notes: 'City chase sequence', status: 'scheduled', dayScenes: [
    { id: 's4', orderNumber: 1, estimatedMinutes: 90, scene: { id: 'sc4', sceneNumber: '15', headingRaw: 'EXT. MARKET STREET - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'George Town' } },
    { id: 's5', orderNumber: 2, estimatedMinutes: 45, scene: { id: 'sc5', sceneNumber: '16', headingRaw: 'EXT. ALLEY - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'George Town' } },
  ]},
  { id: 'd3', dayNumber: 3, scheduledDate: '2026-03-17', callTime: '18:00', estimatedHours: '8', notes: 'Night romantic sequence', status: 'scheduled', dayScenes: [
    { id: 's6', orderNumber: 1, estimatedMinutes: 60, scene: { id: 'sc6', sceneNumber: '22', headingRaw: 'EXT. BEACH - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Mahabalipuram' } },
    { id: 's7', orderNumber: 2, estimatedMinutes: 45, scene: { id: 'sc7', sceneNumber: '23', headingRaw: 'EXT. RESORT POOL - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Mahabalipuram Resort' } },
  ]},
  { id: 'd4', dayNumber: 4, scheduledDate: '2026-03-18', callTime: '09:00', estimatedHours: '14', notes: 'Office drama', status: 'scheduled', dayScenes: [
    { id: 's8', orderNumber: 1, estimatedMinutes: 90, scene: { id: 'sc8', sceneNumber: '28', headingRaw: 'INT. CORPORATE OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tidel Park' } },
    { id: 's9', orderNumber: 2, estimatedMinutes: 60, scene: { id: 'sc9', sceneNumber: '29', headingRaw: 'INT. MEETING ROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tidel Park' } },
    { id: 's10', orderNumber: 3, estimatedMinutes: 45, scene: { id: 'sc10', sceneNumber: '30', headingRaw: 'INT. LIFT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tidel Park' } },
  ]},
  { id: 'd5', dayNumber: 5, scheduledDate: '2026-03-19', callTime: '08:00', estimatedHours: '12', notes: 'Flashback sequence', status: 'pending', dayScenes: [
    { id: 's11', orderNumber: 1, estimatedMinutes: 45, scene: { id: 'sc11', sceneNumber: '35', headingRaw: 'EXT. VILLAGE - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Thanjavur' } },
    { id: 's12', orderNumber: 2, estimatedMinutes: 60, scene: { id: 'sc12', sceneNumber: '36', headingRaw: 'INT. TRADITIONAL HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Thanjavur' } },
  ]},
]

const DEMO_VERSIONS: VersionData[] = [
  { id: 'v1', versionNum: 3, label: 'Current', score: 94, isActive: true, createdAt: '2026-03-01T10:30:00Z' },
  { id: 'v2', versionNum: 2, label: null, score: 87, isActive: false, createdAt: '2026-02-28T14:15:00Z' },
  { id: 'v3', versionNum: 1, label: null, score: 78, isActive: false, createdAt: '2026-02-25T09:00:00Z' },
]

const DEMO_STATS: ScheduleStats = {
  totalDays: 5,
  totalHours: 56,
  totalScenes: 12,
  avgScenesPerDay: 2.4,
  avgHoursPerDay: 11.2,
  intScenes: 5,
  extScenes: 7,
  dayScenes: 9,
  nightScenes: 3,
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string | number; subtitle?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-')}/20`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending
  const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {label}
    </span>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchedulePage() {
  const [shootingDays, setShootingDays] = useState<ShootingDayData[]>([])
  const [versions, setVersions] = useState<VersionData[]>([])
  const [stats, setStats] = useState<ScheduleStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'schedule' | 'versions' | 'analytics'>('schedule')

  const [mode, setMode] = useState('balanced')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      const data = await res.json()
      
      if (data.shootingDays && data.shootingDays.length > 0) {
        setShootingDays(data.shootingDays)
        setVersions(data.versions || [])
        setStats(data.stats || DEMO_STATS)
        setIsDemoMode(data.isDemoMode === true)
      } else {
        setShootingDays(DEMO_SHOOTING_DAYS)
        setVersions(DEMO_VERSIONS)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.error(e)
      setShootingDays(DEMO_SHOOTING_DAYS)
      setVersions(DEMO_VERSIONS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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
      if (!res.ok) throw new Error(data.error)
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOptimizing(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Chart data
  const sceneTypeData = useMemo(() => [
    { name: 'Interior', value: stats.intScenes, fill: CHART_COLORS.primary },
    { name: 'Exterior', value: stats.extScenes, fill: CHART_COLORS.secondary },
  ], [stats])

  const timeOfDayData = useMemo(() => [
    { name: 'Day', value: stats.dayScenes, fill: CHART_COLORS.warning },
    { name: 'Night', value: stats.nightScenes, fill: CHART_COLORS.info },
  ], [stats])

  const dailyScenesData = useMemo(() => 
    shootingDays.map(day => ({
      day: `Day ${day.dayNumber}`,
      scenes: day.dayScenes.length,
      hours: parseFloat(day.estimatedHours || '0'),
    })), [shootingDays])

  const locationData = useMemo(() => {
    const locations: Record<string, number> = {}
    shootingDays.forEach(day => {
      day.dayScenes.forEach(ds => {
        const loc = ds.scene.location || 'Unknown'
        locations[loc] = (locations[loc] || 0) + 1
      })
    })
    return Object.entries(locations)
      .map(([name, scenes]) => ({ name, scenes }))
      .sort((a, b) => b.scenes - a.scenes)
      .slice(0, 5)
  }, [shootingDays])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-400">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Schedule Engine</h1>
              {isDemoMode && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">AI-powered shooting schedule with TFPC compliance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              if (!shootingDays?.length) return
              const headers = ['Day', 'Date', 'Call Time', 'Location', 'Scenes', 'Est. Hours']
              const rows = shootingDays.map((d: ShootingDayData) => [
                `Day ${d.dayNumber}`,
                d.scheduledDate || 'TBD',
                d.callTime || '--',
                d.dayScenes?.[0]?.scene?.location || '--',
                d.dayScenes?.length || 0,
                d.estimatedHours || '--'
              ])
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `schedule-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            disabled={!shootingDays?.length}
            className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Demo Mode Info Banner */}
      {isDemoMode && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl px-5 py-3 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Using Demo Data</p>
            <p className="text-sm text-amber-200/70 mt-1">
              Database is not connected. Showing sample schedule data for demonstration. 
              Connect a PostgreSQL database to see your actual production data.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Optimization:</label>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {MODES.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleOptimize} 
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
          >
            {optimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Optimize Schedule
              </>
            )}
          </button>
          
          <div className="ml-auto flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {(['schedule', 'versions', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'schedule' && '📅'} {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Days" 
          value={stats.totalDays} 
          subtitle="shooting days"
          icon={<Calendar className="w-5 h-5 text-indigo-400" />}
          color="text-indigo-400"
        />
        <StatCard 
          title="Total Hours" 
          value={stats.totalHours}
          subtitle={`${stats.avgHoursPerDay.toFixed(1)} avg/day`}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          color="text-amber-400"
        />
        <StatCard 
          title="Total Scenes" 
          value={stats.totalScenes}
          subtitle={`${stats.avgScenesPerDay.toFixed(1)} avg/day`}
          icon={<Film className="w-5 h-5 text-emerald-400" />}
          color="text-emerald-400"
        />
        <StatCard 
          title="Score" 
          value={versions.find(v => v.isActive)?.score || '—'}
          subtitle="optimization score"
          icon={<Target className="w-5 h-5 text-purple-400" />}
          color="text-purple-400"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {shootingDays.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Schedule Generated</h3>
              <p className="text-slate-400 mb-4">Click "Optimize Schedule" to generate a shooting schedule from your script.</p>
              <button 
                onClick={handleOptimize}
                disabled={optimizing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Generate Schedule
              </button>
            </div>
          ) : (
            shootingDays.map((day) => (
              <div 
                key={day.id} 
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Day Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      day.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : day.status === 'in_progress'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {day.dayNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{formatDate(day.scheduledDate)}</span>
                        <StatusBadge status={day.status} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {day.callTime || '—'} call
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {day.estimatedHours || '—'} hrs
                        </span>
                        <span className="flex items-center gap-1">
                          <Film className="w-3.5 h-3.5" />
                          {day.dayScenes.length} scenes
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {day.notes && (
                    <p className="text-sm text-slate-500 italic truncate max-w-md">{day.notes}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {day.dayScenes.length > 0 && (
                      <div className="flex -space-x-2">
                        {day.dayScenes.slice(0, 3).map((ds) => (
                          <div 
                            key={ds.id}
                            className={`w-8 h-8 rounded-lg border-2 border-slate-900 flex items-center justify-center text-xs font-medium ${
                              ds.scene.intExt === 'EXT' 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {ds.scene.sceneNumber.replace('Scene ', '')}
                          </div>
                        ))}
                        {day.dayScenes.length > 3 && (
                          <div className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                            +{day.dayScenes.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    {expandedDay === day.id ? (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Scenes */}
                {expandedDay === day.id && day.dayScenes.length > 0 && (
                  <div className="border-t border-slate-800 p-4 bg-slate-800/30">
                    <div className="grid gap-2">
                      {day.dayScenes.map((ds, idx) => (
                        <div 
                          key={ds.id}
                          className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg"
                        >
                          <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-indigo-400">{ds.scene.sceneNumber}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                                ds.scene.intExt === 'EXT' 
                                  ? 'bg-purple-500/20 text-purple-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {ds.scene.intExt}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                                ds.scene.timeOfDay === 'NIGHT'
                                  ? 'bg-indigo-500/20 text-indigo-400'
                                  : ds.scene.timeOfDay === 'DAY'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-700 text-slate-400'
                              }`}>
                                {ds.scene.timeOfDay || '—'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 truncate mt-0.5">{ds.scene.headingRaw}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            {ds.scene.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {ds.scene.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {ds.estimatedMinutes || '—'} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Schedule Versions</h3>
          <div className="space-y-3">
            {versions.map((version) => (
              <div 
                key={version.id}
                className={`p-4 rounded-xl border ${
                  version.isActive 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">Version {version.versionNum}</span>
                    {version.label && (
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                        {version.label}
                      </span>
                    )}
                    {version.isActive && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">{version.score}</p>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(version.createdAt).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scene Type Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Interior vs Exterior</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sceneTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sceneTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time of Day Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Day vs Night</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeOfDayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {timeOfDayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Scenes Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Scenes per Day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyScenesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="scenes" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Scenes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="scenes" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} name="Scenes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
