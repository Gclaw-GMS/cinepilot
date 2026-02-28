'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileText, Video, ImageIcon, Calendar, MapPin, DollarSign, Shield,
  ArrowUpRight, ArrowRight, RefreshCw, AlertCircle, Loader2,
} from 'lucide-react'

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
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const result = { ...EMPTY_STATS }

    try {
      const responses = await Promise.allSettled([
        fetch('/api/scripts').then(r => r.json()),
        fetch('/api/shots?stats=true').then(r => r.json()),
        fetch('/api/budget?action=forecast').then(r => r.json()),
        fetch('/api/schedule?stats=true').then(r => r.json()),
        fetch('/api/locations?stats=true').then(r => r.json()),
        fetch('/api/censor?stats=true').then(r => r.json()),
        fetch('/api/storyboard?stats=true').then(r => r.json()),
      ])

      if (responses[0].status === 'fulfilled') {
        const d = responses[0].value
        const scripts = d.scripts || []
        const characters = d.characters || []
        result.scripts.total = scripts.length
        result.scripts.scenes = scripts.reduce(
          (n: number, s: { scenes?: unknown[] }) => n + (s.scenes?.length || 0), 0
        )
        result.scripts.characters = characters.length
      }

      if (responses[1].status === 'fulfilled') {
        const d = responses[1].value
        result.shots.total = d.totalShots || 0
        result.shots.missingFields = d.missingFields || 0
        result.shots.runtimeMin = Math.round((d.totalDurationSec || 0) / 60)
      }

      if (responses[2].status === 'fulfilled') {
        const d = responses[2].value
        result.budget.planned = d.totalPlanned || 0
        result.budget.actual = d.totalActual || 0
        result.budget.variance = d.variance || 0
      }

      if (responses[3].status === 'fulfilled') {
        const d = responses[3].value
        const days = d.days || []
        result.schedule.days = days.length
        result.schedule.scenes = days.reduce((n: number, day: { scenes?: unknown[] }) => n + (day.scenes?.length || 0), 0)
      }

      if (responses[4].status === 'fulfilled') {
        const d = responses[4].value
        const scenes = d.scenes || []
        result.locations.scenes = scenes.length
        result.locations.candidates = scenes.reduce((n: number, s: { candidates?: unknown[] }) => n + (s.candidates?.length || 0), 0)
      }

      if (responses[5].status === 'fulfilled') {
        const d = responses[5].value
        result.censor.certificate = d.predictedCertificate || '--'
        result.censor.score = d.sensitivityScore || 0
      }

      if (responses[6].status === 'fulfilled') {
        const d = responses[6].value
        result.storyboard.frames = d.totalFrames || 0
        const scenes = d.scenes || []
        result.storyboard.approved = scenes.reduce(
          (n: number, s: { frames?: { isApproved?: boolean }[] }) =>
            n + (s.frames?.filter((f: { isApproved?: boolean }) => f.isApproved).length || 0),
          0
        )
      }

      setStats(result)
    } catch (err) {
      // Use demo data when database is not connected
      console.log('[Dashboard] Using demo data - database not connected')
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

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
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">CinePilot &mdash; AI Pre-Production Command Center</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {isDemoMode && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Preview mode — Connect a PostgreSQL database to see real production data
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
      </main>
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
