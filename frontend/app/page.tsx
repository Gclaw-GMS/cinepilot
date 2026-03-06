'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileText, Video, ImageIcon, Calendar, MapPin, DollarSign, Shield,
  ArrowUpRight, ArrowRight, RefreshCw, AlertCircle, Loader2, Plus, X, Zap,
  Activity, Wifi, WifiOff, Cloud, Sun, Moon, CloudRain, Wind, Droplets
} from 'lucide-react'

// Weather widget types
interface WeatherData {
  location: string
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: { day: string; high: number; low: number; condition: string }[]
}

const PALETTE = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#64748b',
}

interface DashboardStats {
  scripts: { total: number; scenes: number; characters: number }
  shots: { total: number; missingFields: number; runtimeMin: number }
  budget: { planned: number; actual: number; variance: number }
  schedule: { days: number; scenes: number }
  locations: { scenes: number; candidates: number }
  censor: { certificate: string; score: number }
  storyboard: { frames: number; approved: number }
}

const EMPTY_STATS: DashboardStats = {
  scripts: { total: 0, scenes: 0, characters: 0 },
  shots: { total: 0, missingFields: 0, runtimeMin: 0 },
  budget: { planned: 0, actual: 0, variance: 0 },
  schedule: { days: 0, scenes: 0 },
  locations: { scenes: 0, candidates: 0 },
  censor: { certificate: '--', score: 0 },
  storyboard: { frames: 0, approved: 0 },
}

// Demo data for preview when database is not configured
const DEMO_STATS: DashboardStats = {
  scripts: { total: 2, scenes: 47, characters: 23 },
  shots: { total: 312, missingFields: 45, runtimeMin: 142 },
  budget: { planned: 85000000, actual: 32400000, variance: -52600000 },
  schedule: { days: 20, scenes: 47 },
  locations: { scenes: 12, candidates: 34 },
  censor: { certificate: 'UA 13+', score: 78 },
  storyboard: { frames: 156, approved: 89 },
}

const FEATURES = [
  {
    key: 'scripts',
    label: 'Script Breakdown',
    href: '/scripts',
    icon: FileText,
    color: 'from-blue-600 to-indigo-600',
    metric: (s: DashboardStats) => `${s.scripts.scenes} scenes`,
    sub: (s: DashboardStats) => `${s.scripts.characters} characters`,
  },
  {
    key: 'shots',
    label: 'Shot Hub',
    href: '/shot-list',
    icon: Video,
    color: 'from-violet-600 to-purple-600',
    metric: (s: DashboardStats) => `${s.shots.total} shots`,
    sub: (s: DashboardStats) => s.shots.runtimeMin > 0 ? `~${s.shots.runtimeMin} min runtime` : 'Generate shots',
  },
  {
    key: 'storyboard',
    label: 'Storyboard',
    href: '/storyboard',
    icon: ImageIcon,
    color: 'from-fuchsia-600 to-pink-600',
    metric: (s: DashboardStats) => `${s.storyboard.frames} frames`,
    sub: (s: DashboardStats) => `${s.storyboard.approved} approved`,
  },
  {
    key: 'schedule',
    label: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    color: 'from-amber-600 to-orange-600',
    metric: (s: DashboardStats) => `${s.schedule.days} shoot days`,
    sub: (s: DashboardStats) => `${s.schedule.scenes} scenes scheduled`,
  },
  {
    key: 'locations',
    label: 'Location Scout',
    href: '/locations',
    icon: MapPin,
    color: 'from-emerald-600 to-teal-600',
    metric: (s: DashboardStats) => `${s.locations.candidates} candidates`,
    sub: (s: DashboardStats) => `${s.locations.scenes} scenes scouted`,
  },
  {
    key: 'budget',
    label: 'Budget Engine',
    href: '/budget',
    icon: DollarSign,
    color: 'from-green-600 to-emerald-600',
    metric: (s: DashboardStats) =>
      s.budget.planned > 0
        ? `₹${(s.budget.planned / 10000000).toFixed(1)}Cr planned`
        : 'Not generated',
    sub: (s: DashboardStats) =>
      s.budget.actual > 0
        ? `₹${(s.budget.actual / 10000000).toFixed(1)}Cr spent`
        : 'Generate budget',
  },
  {
    key: 'censor',
    label: 'Censor Board',
    href: '/reports',
    icon: Shield,
    color: 'from-red-600 to-rose-600',
    metric: (s: DashboardStats) => s.censor.certificate !== '--' ? `CBFC: ${s.censor.certificate}` : 'Not analyzed',
    sub: (s: DashboardStats) => s.censor.score > 0 ? `Score: ${s.censor.score}/100` : 'Run analysis',
  },
]

export default function Dashboard() {
  // Use demo stats as initial state so data appears immediately
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(true)
  
  // New Project modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    title: '',
    description: '',
    language: 'tamil',
    genre: '',
    budget: '',
    status: 'planning',
  })
  const [projectError, setProjectError] = useState<string | null>(null)
  const [projectSuccess, setProjectSuccess] = useState<string | null>(null)
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  
  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  
  // Demo weather data fallback
  const DEMO_WEATHER: WeatherData = {
    location: 'Chennai',
    temp: 32,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    forecast: [
      { day: 'Today', high: 32, low: 24, condition: 'Partly Cloudy' },
      { day: 'Mon', high: 33, low: 25, condition: 'Clear' },
      { day: 'Tue', high: 34, low: 26, condition: 'Clear' },
      { day: 'Wed', high: 31, low: 23, condition: 'Rain' },
      { day: 'Thu', high: 30, low: 22, condition: 'Rain' },
    ]
  }
  
  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true)
    try {
      const res = await fetch('/api/weather?location=Chennai')
      const data = await res.json()
      if (data.forecast && data.forecast.length > 0) {
        setWeather({
          location: data.location || 'Chennai',
          temp: data.forecast[0]?.tempHigh || 32,
          condition: data.forecast[0]?.condition || 'Clear',
          humidity: data.forecast[0]?.humidity || 65,
          windSpeed: data.forecast[0]?.windSpeed || 12,
          forecast: data.forecast.slice(0, 5).map((f: any) => ({
            day: f.dayName || f.date,
            high: f.tempHigh || 32,
            low: f.tempLow || 24,
            condition: f.condition || 'Clear'
          }))
        })
      } else {
        // Use demo data if no forecast
        setWeather(DEMO_WEATHER)
      }
    } catch (e) {
      console.warn('Weather fetch failed, using demo data:', e)
      setWeather(DEMO_WEATHER)
    } finally {
      setWeatherLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setConnectionStatus('checking')
    
    // Check API health first
    try {
      const healthRes = await fetch('/api/health', { method: 'GET' })
      if (healthRes.ok) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
    
    const result = { ...EMPTY_STATS }

    try {
      // Helper to safely fetch and parse JSON
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          console.log(`[Dashboard] Fetch success for ${url}:`, data ? 'OK' : 'empty')
          return data
        } catch (e) {
          console.error(`[Dashboard] Fetch failed for ${url}:`, e)
          return null
        }
      }

      const [scriptsData, shotsData, budgetData, scheduleData, locationsData, censorData, storyboardData] = await Promise.all([
        safeFetch('/api/scripts'),
        safeFetch('/api/shots?stats=true'),
        safeFetch('/api/budget?action=forecast'),
        safeFetch('/api/schedule?stats=true'),
        safeFetch('/api/locations?stats=true'),
        safeFetch('/api/censor?stats=true'),
        safeFetch('/api/storyboard?stats=true'),
      ])

      console.log('[Dashboard] API responses:', {
        scriptsData: scriptsData ? 'OK' : 'FAILED',
        shotsData: shotsData ? 'OK' : 'FAILED',
        budgetData: budgetData ? 'OK' : 'FAILED',
      })

      // Scripts
      if (scriptsData) {
        const scripts = scriptsData.scripts || []
        const characters = scriptsData.characters || []
        result.scripts.total = scripts.length
        result.scripts.scenes = scripts.reduce(
          (n: number, s: { scenes?: unknown[] }) => n + (s.scenes?.length || 0), 0
        )
        result.scripts.characters = characters.length
      }

      // Shots
      if (shotsData) {
        result.shots.total = shotsData.totalShots || 0
        result.shots.missingFields = shotsData.missingFields || 0
        result.shots.runtimeMin = Math.round((shotsData.totalDurationSec || 0) / 60)
      }

      // Budget
      if (budgetData) {
        result.budget.planned = budgetData.totalPlanned || 0
        result.budget.actual = budgetData.totalActual || 0
        result.budget.variance = budgetData.variance || 0
      }

      // Schedule
      if (scheduleData) {
        const days = scheduleData.days || []
        result.schedule.days = days.length
        result.schedule.scenes = days.reduce((n: number, day: { scenes?: unknown[] }) => n + (day.scenes?.length || 0), 0)
      }

      // Locations
      if (locationsData) {
        const scenes = locationsData.scenes || []
        result.locations.scenes = scenes.length
        result.locations.candidates = scenes.reduce((n: number, s: { candidates?: unknown[] }) => n + (s.candidates?.length || 0), 0)
      }

      // Censor
      if (censorData) {
        result.censor.certificate = censorData.predictedCertificate || '--'
        result.censor.score = censorData.sensitivityScore || 0
      }

      // Storyboard
      if (storyboardData) {
        result.storyboard.frames = storyboardData.totalFrames || 0
        const scenes = storyboardData.scenes || []
        result.storyboard.approved = scenes.reduce(
          (n: number, s: { frames?: { isApproved?: boolean }[] }) =>
            n + (s.frames?.filter((f: { isApproved?: boolean }) => f.isApproved).length || 0),
          0
        )
      }

      // Check if we got real data - update stats if we have data
      // Also check for any meaningful data from any source
      const hasRealData = 
        result.scripts.total > 0 || 
        result.shots.total > 0 || 
        result.budget.planned > 0 ||
        result.schedule.days > 0 ||
        result.locations.scenes > 0
      
      if (hasRealData) {
        console.log('[Dashboard] Got real data:', result)
        setStats(result)
        setIsDemoMode(false)
      } else {
        console.log('[Dashboard] Using demo mode - no real data found')
        // Fall back to demo data when no real data is available
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (err) {
      // Use demo data when database is not connected
      console.log('[Dashboard] Using demo data - database not connected')
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setProjectError(null)
    setProjectSuccess(null)
    setCreatingProject(true)
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectFormData.name || projectFormData.title,
          title: projectFormData.title,
          description: projectFormData.description,
          language: projectFormData.language,
          genre: projectFormData.genre,
          budget: projectFormData.budget ? parseInt(projectFormData.budget) : null,
          status: projectFormData.status,
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to create project')
      }
      
      const newProject = await res.json()
      setProjectSuccess(`Project "${newProject.name || newProject.title}" created successfully!`)
      setProjectFormData({
        name: '',
        title: '',
        description: '',
        language: 'tamil',
        genre: '',
        budget: '',
        status: 'planning',
      })
      
      // Close modal after success
      setTimeout(() => {
        setShowNewProjectModal(false)
        setProjectSuccess(null)
        // Refresh stats to reflect new project
        fetchStats()
      }, 1500)
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const budgetData = stats.budget.planned > 0
    ? [
        { name: 'Planned', value: stats.budget.planned, color: PALETTE.primary },
        { name: 'Spent', value: stats.budget.actual, color: PALETTE.success },
        { name: 'Remaining', value: Math.max(0, stats.budget.planned - stats.budget.actual), color: PALETTE.muted },
      ]
    : []

  const pipelineData = [
    { stage: 'Scripts', count: stats.scripts.total },
    { stage: 'Scenes', count: stats.scripts.scenes },
    { stage: 'Shots', count: stats.shots.total },
    { stage: 'Frames', count: stats.storyboard.frames },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Production Dashboard</h1>
                {isDemoMode && (
                  <span className="group relative px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium cursor-help" title="Demo data shown. Upload a script or configure your database to see real production data.">
                    Demo Mode
                  </span>
                )}
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-1.5 ml-2">
                  {connectionStatus === 'checking' && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking...
                    </span>
                  )}
                  {connectionStatus === 'connected' && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full" title="Database connected">
                      <Wifi className="w-3 h-3" />
                      Connected
                    </span>
                  )}
                  {connectionStatus === 'disconnected' && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full" title="Using demo data - no database connection">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">CinePilot &mdash; AI Pre-Production Command Center</p>
            </div>
            <button
              onClick={() => {
                // Force refresh by clearing cache first
                setStats(EMPTY_STATS)
                setIsDemoMode(true)
                // Small delay to ensure state is cleared before fetch
                setTimeout(() => fetchStats(), 50)
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {isDemoMode && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Preview mode — Connect a PostgreSQL database or <Link href="/scripts" className="underline hover:text-amber-300">upload a script</Link> to see real production data</span>
          </div>
        )}

        {/* Feature Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {FEATURES.map((f) => (
            <Link
              key={f.key}
              href={f.href}
              className="group relative bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${f.color} shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">{f.label}</p>
              <p className="text-lg font-semibold text-white">{f.metric(stats)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.sub(stats)}</p>
            </Link>
          ))}
        </div>

        {/* Weather Widget */}
        {weather && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-800/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    {weather.condition.toLowerCase().includes('rain') ? (
                      <CloudRain className="w-5 h-5 text-blue-400" />
                    ) : weather.condition.toLowerCase().includes('cloud') ? (
                      <Cloud className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{weather.temp}°</span>
                      <span className="text-slate-400">{weather.condition}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {weather.windSpeed} km/h</span>
                      <span className="text-slate-500">📍 {weather.location}</span>
                    </div>
                  </div>
                </div>
                <Link href="/weather" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  View Details →
                </Link>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto pb-1">
                {weather.forecast.map((day, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center min-w-[60px]">
                    <div className="text-xs text-slate-400 mb-1">{idx === 0 ? 'Today' : day.day}</div>
                    <div className="text-lg mb-1">
                      {day.condition.toLowerCase().includes('rain') ? '🌧️' : day.condition.toLowerCase().includes('cloud') ? '☁️' : '☀️'}
                    </div>
                    <div className="text-xs">
                      <span className="text-white font-medium">{day.high}°</span>
                      <span className="text-slate-500"> / {day.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline Funnel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Production Pipeline</h3>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Script to Storyboard</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill={PALETTE.primary} radius={[4, 4, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Budget Overview</h3>
              {stats.budget.planned > 0 && (
                <span className="text-xs text-slate-500">
                  Variance: {stats.budget.variance >= 0 ? '+' : ''}
                  {((stats.budget.variance / (stats.budget.planned || 1)) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            {budgetData.length > 0 ? (
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {budgetData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [`₹${(value / 100000).toFixed(0)}L`, '']}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                No budget data yet.{' '}
                <Link href="/budget" className="text-indigo-400 hover:text-indigo-300 ml-1">
                  Generate budget
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Scripts" value={stats.scripts.total} />
          <StatCard label="Total Shots" value={stats.shots.total} />
          <StatCard label="Shoot Days" value={stats.schedule.days} />
          <StatCard
            label="Censor Certificate"
            value={stats.censor.certificate}
            isText
          />
        </div>

        {/* Production Progress Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            Production Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Script Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Script Analysis</span>
                <span className="text-xs text-emerald-400">{stats.scripts.scenes > 0 ? '100%' : '0%'}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: stats.scripts.scenes > 0 ? '100%' : '0%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.scripts.scenes} scenes identified</p>
            </div>

            {/* Shot Generation Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Shot Generation</span>
                <span className="text-xs text-emerald-400">
                  {stats.scripts.scenes > 0 ? Math.round((stats.shots.total / (stats.scripts.scenes * 6)) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: stats.scripts.scenes > 0 ? `${Math.min(100, (stats.shots.total / (stats.scripts.scenes * 6)) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.shots.total} shots / ~{stats.scripts.scenes * 6} expected</p>
            </div>

            {/* Storyboard Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Storyboard</span>
                <span className="text-xs text-emerald-400">
                  {stats.shots.total > 0 ? Math.round((stats.storyboard.frames / stats.shots.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: stats.shots.total > 0 ? `${Math.min(100, (stats.storyboard.frames / stats.shots.total) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.storyboard.frames} frames / {stats.shots.total} shots</p>
            </div>

            {/* Budget Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Budget Setup</span>
                <span className={`text-xs ${stats.budget.planned > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stats.budget.planned > 0 ? '100%' : 'Pending'}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: stats.budget.planned > 0 ? '100%' : '0%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.budget.planned > 0 
                  ? `₹${(stats.budget.planned / 10000000).toFixed(1)}Cr allocated`
                  : 'Generate budget to track'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link 
              href="/scripts" 
              className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Upload Script</p>
                <p className="text-xs text-slate-500">Start new project</p>
              </div>
            </Link>
            <Link 
              href="/shot-list" 
              className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-xl transition-all group"
            >
              <div className="p-2 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30">
                <Video className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Generate Shots</p>
                <p className="text-xs text-slate-500">AI-powered breakdown</p>
              </div>
            </Link>
            <Link 
              href="/budget" 
              className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Create Budget</p>
                <p className="text-xs text-slate-500">Plan finances</p>
              </div>
            </Link>
            <Link 
              href="/schedule" 
              className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group"
            >
              <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30">
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Plan Schedule</p>
                <p className="text-xs text-slate-500">Optimize shoot days</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewProjectModal(false)
          }}
        >  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {projectError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
                  {projectError}
                </div>
              )}
              {projectSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-4 py-3 text-sm">
                  {projectSuccess}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Kaadhal Vartham"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title (Tamil)</label>
                  <input
                    type="text"
                    value={projectFormData.title}
                    onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="காதல் வர்த்தம்"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  placeholder="Brief description of the film..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Language</label>
                  <select
                    value={projectFormData.language}
                    onChange={(e) => setProjectFormData({ ...projectFormData, language: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="hindi">Hindi</option>
                    <option value="malayalam">Malayalam</option>
                    <option value="kannada">Kannada</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Genre</label>
                  <input
                    type="text"
                    value={projectFormData.genre}
                    onChange={(e) => setProjectFormData({ ...projectFormData, genre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Romance, Action"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Budget (INR)</label>
                  <input
                    type="number"
                    value={projectFormData.budget}
                    onChange={(e) => setProjectFormData({ ...projectFormData, budget: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., 15000000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="pre_production">Pre-Production</option>
                    <option value="production">In Production</option>
                    <option value="post_production">Post-Production</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                >
                  {creatingProject ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 font-semibold ${isText ? 'text-lg' : 'text-2xl'} text-white`}>{value}</p>
    </div>
  )
}
