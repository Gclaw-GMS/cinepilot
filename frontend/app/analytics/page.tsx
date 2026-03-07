'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, TrendingUp, Film, Clapperboard, 
  Clock, DollarSign, Users, MapPin, Zap, Target, Calendar,
  RefreshCw, Loader2, Activity, Gauge, AlertTriangle, CheckCircle,
  Camera, Keyboard, X
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  overview: {
    totalProjects: number
    activeProject: string
    shootingDaysCompleted: number
    totalShootingDays: number
    scenesCompleted: number
    totalScenes: number
    shotsCompleted: number
    totalShots: number
    pagesShot: number
    totalPages: number
  }
  progress: {
    sceneCompletion: number
    shootingDaysCompletion: number
    budgetUtilization: number
    crewEfficiency: number
  }
  dailyProgress: Array<{ date: string; scenes: number; shots: number; pages: number; budget: number }>
  budgetBreakdown: Array<{ category: string; allocated: number; spent: number; remaining: number }>
  locationBreakdown: Array<{ name: string; days: number; cost: number; percentage: number }>
  crewBreakdown: Array<{ department: string; count: number; daysWorked: number }>
  vfxBreakdown: Array<{ status: string; count: number; percentage: number }>
  weeklyStats: { avgScenesPerDay: number; avgShotsPerDay: number; avgPagesPerDay: number; avgBudgetPerDay: number }
  predictions: { estimatedCompletionDate: string; projectedBudgetOverage: number; daysAheadSchedule: number }
  isDemoMode: boolean
}

const DEMO_DATA: AnalyticsData = {
  overview: { totalProjects: 1, activeProject: 'Kaadhal Enbadhu', shootingDaysCompleted: 12, totalShootingDays: 20, scenesCompleted: 28, totalScenes: 52, shotsCompleted: 342, totalShots: 520, pagesShot: 186.5, totalPages: 320 },
  progress: { sceneCompletion: 54, shootingDaysCompletion: 60, budgetUtilization: 56, crewEfficiency: 92 },
  dailyProgress: [
    { date: '2026-03-04', scenes: 3, shots: 24, pages: 4.2, budget: 85000 },
    { date: '2026-03-03', scenes: 2, shots: 24, pages: 3.8, budget: 72000 },
    { date: '2026-03-02', scenes: 2, shots: 14, pages: 2.5, budget: 65000 },
    { date: '2026-03-01', scenes: 2, shots: 23, pages: 3.1, budget: 55000 },
    { date: '2026-02-28', scenes: 3, shots: 28, pages: 4.5, budget: 88000 },
    { date: '2026-02-27', scenes: 2, shots: 18, pages: 2.9, budget: 62000 },
    { date: '2026-02-26', scenes: 1, shots: 12, pages: 1.8, budget: 45000 },
  ],
  budgetBreakdown: [
    { category: 'Pre-Production', allocated: 1000000, spent: 800000, remaining: 200000 },
    { category: 'Production', allocated: 5000000, spent: 3200000, remaining: 1800000 },
    { category: 'Post-Production', allocated: 1500000, spent: 500000, remaining: 1000000 },
    { category: 'Contingency', allocated: 500000, spent: 0, remaining: 500000 },
  ],
  locationBreakdown: [
    { name: 'AVM Studios', days: 4, cost: 200000, percentage: 30 },
    { name: 'Mahabalipuram Beach', days: 2, cost: 50000, percentage: 15 },
    { name: 'Chennai Railway Station', days: 1, cost: 15000, percentage: 8 },
    { name: 'Ram Studios', days: 3, cost: 135000, percentage: 25 },
    { name: 'Other Locations', days: 2, cost: 100000, percentage: 22 },
  ],
  crewBreakdown: [
    { department: 'Camera', count: 12, daysWorked: 156 },
    { department: 'Lighting', count: 10, daysWorked: 142 },
    { department: 'Sound', count: 6, daysWorked: 98 },
    { department: 'Art', count: 8, daysWorked: 112 },
    { department: 'Makeup', count: 5, daysWorked: 72 },
    { department: 'Wardrobe', count: 4, daysWorked: 68 },
  ],
  vfxBreakdown: [
    { status: 'Completed', count: 89, percentage: 57 },
    { status: 'In Progress', count: 45, percentage: 29 },
    { status: 'Pending', count: 22, percentage: 14 },
  ],
  weeklyStats: { avgScenesPerDay: 2.4, avgShotsPerDay: 18.5, avgPagesPerDay: 3.1, avgBudgetPerDay: 68500 },
  predictions: { estimatedCompletionDate: '2026-03-15', projectedBudgetOverage: -250000, daysAheadSchedule: 2 },
  isDemoMode: true,
}

const COLORS = { primary: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444', purple: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4', orange: '#f97316' }
const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.cyan]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'budget' | 'crew' | 'predictions'>('overview')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics?type=full')
      const result = await res.json()
      setData(result.success ? result.data : DEMO_DATA)
    } catch {
      setData(DEMO_DATA)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const key = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      
      if (key === '?' || (mod && key === 'k')) {
        e.preventDefault()
        setShowKeyboardHelp(prev => !prev)
      } else if (key === 'r' && !mod) {
        fetchAnalytics()
      } else if (key === 'escape') {
        setShowKeyboardHelp(false)
      } else if (key === '1') {
        setActiveTab('overview')
      } else if (key === '2') {
        setActiveTab('progress')
      } else if (key === '3') {
        setActiveTab('budget')
      } else if (key === '4') {
        setActiveTab('crew')
      } else if (key === '5') {
        setActiveTab('predictions')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fetchAnalytics])

  const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${(v/1000).toFixed(1)}K`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" /><p className="text-slate-400">Loading Analytics...</p></div>
    </div>
  )

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Analytics</h1>
              {data.isDemoMode && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">DEMO</span>}
            </div>
            <p className="text-slate-400">{data.overview.activeProject} • Production Analytics Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowKeyboardHelp(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg" title="Keyboard Shortcuts (?)">
              <Keyboard className="w-4 h-4 text-cyan-400" />
            </button>
            <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'budget', label: 'Budget', icon: DollarSign },
            { id: 'crew', label: 'Crew & VFX', icon: Users },
            { id: 'predictions', label: 'Predictions', icon: Target },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard title="Shooting Days" value={`${data.overview.shootingDaysCompleted}/${data.overview.totalShootingDays}`} subtitle={`${data.overview.totalShootingDays - data.overview.shootingDaysCompleted} remaining`} icon={Clock} color={COLORS.primary} progress={(data.overview.shootingDaysCompleted/data.overview.totalShootingDays)*100} />
            <MetricCard title="Scenes" value={`${data.overview.scenesCompleted}/${data.overview.totalScenes}`} subtitle={`${Math.round((data.overview.scenesCompleted/data.overview.totalScenes)*100)}%`} icon={Clapperboard} color={COLORS.success} progress={(data.overview.scenesCompleted/data.overview.totalScenes)*100} />
            <MetricCard title="Shots" value={`${data.overview.shotsCompleted}/${data.overview.totalShots}`} subtitle={`${Math.round((data.overview.shotsCompleted/data.overview.totalShots)*100)}%`} icon={Camera} color={COLORS.purple} progress={(data.overview.shotsCompleted/data.overview.totalShots)*100} />
            <MetricCard title="Pages" value={`${data.overview.pagesShot}/${data.overview.totalPages}`} subtitle={`${Math.round((data.overview.pagesShot/data.overview.totalPages)*100)}%`} icon={Film} color={COLORS.pink} progress={(data.overview.pagesShot/data.overview.totalPages)*100} />
            <MetricCard title="Projects" value={data.overview.totalProjects.toString()} subtitle={data.overview.activeProject} icon={Activity} color={COLORS.cyan} />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Daily Progress (Last 7 Days)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyProgress}>
                  <defs>
                    <linearGradient id="colorScenes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorShots" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.success} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={(v) => formatDate(v)} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} labelFormatter={(v) => formatDate(v)} />
                  <Area type="monotone" dataKey="scenes" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorScenes)" name="Scenes" strokeWidth={2} />
                  <Area type="monotone" dataKey="shots" stroke={COLORS.success} fillOpacity={1} fill="url(#colorShots)" name="Shots" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Avg Scenes/Day" value={data.weeklyStats.avgScenesPerDay.toFixed(1)} icon={Clapperboard} color={COLORS.primary} />
            <StatCard title="Avg Shots/Day" value={data.weeklyStats.avgShotsPerDay.toFixed(1)} icon={Camera} color={COLORS.success} />
            <StatCard title="Avg Pages/Day" value={data.weeklyStats.avgPagesPerDay.toFixed(1)} icon={Film} color={COLORS.purple} />
            <StatCard title="Avg Budget/Day" value={formatCurrency(data.weeklyStats.avgBudgetPerDay)} icon={DollarSign} color={COLORS.warning} />
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ProgressGauge title="Scene Completion" value={data.progress.sceneCompletion} color={COLORS.primary} />
            <ProgressGauge title="Shooting Days" value={data.progress.shootingDaysCompletion} color={COLORS.success} />
            <ProgressGauge title="Budget Utilization" value={data.progress.budgetUtilization} color={COLORS.warning} />
            <ProgressGauge title="Crew Efficiency" value={data.progress.crewEfficiency} color={COLORS.purple} />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Production Timeline</h3>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-2 bg-slate-700 rounded-full">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" style={{ width: `${data.progress.shootingDaysCompletion}%` }} />
              </div>
              <div className="flex justify-between pt-8">
                <div className="text-center"><div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2" /><p className="text-sm text-slate-400">Day 1</p><p className="font-semibold">Start</p></div>
                <div className="text-center"><div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-2 animate-pulse" /><p className="text-sm text-slate-400">Day {data.overview.shootingDaysCompleted}</p><p className="font-semibold">Current</p></div>
                <div className="text-center"><div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2" /><p className="text-sm text-slate-400">Day {data.overview.totalShootingDays}</p><p className="font-semibold">Complete</p></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Film className="w-5 h-5 text-pink-400" /> Pages Shot Per Day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={(v) => formatDate(v)} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: number) => [`${v} pages`, 'Pages']} labelFormatter={(v) => formatDate(v)} />
                  <Bar dataKey="pages" fill={COLORS.pink} radius={[4, 4, 0, 0]} name="Pages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.budgetBreakdown.map((item, idx) => (
              <div key={item.category} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{item.category}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${item.spent > item.allocated * 0.9 ? 'bg-red-500/20 text-red-400' : item.spent > item.allocated * 0.7 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                    {Math.round((item.spent / item.allocated) * 100)}%
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Spent: {formatCurrency(item.spent)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((item.spent / item.allocated) * 100, 100)}%`, backgroundColor: CHART_COLORS[idx] }} />
                  </div>
                </div>
                <p className="text-sm text-slate-400">Remaining: {formatCurrency(item.remaining)}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Budget Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.budgetBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="allocated" nameKey="category" label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.budgetBreakdown.map((_, i) => <Cell key={`c-${i}`} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.budgetBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="spent" nameKey="category">
                      {data.budgetBreakdown.map((_, i) => <Cell key={`c-${i}`} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-400" /> Location Costs</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.locationBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), 'Cost']} />
                  <Bar dataKey="cost" fill={COLORS.orange} radius={[0, 4, 4, 0]} name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Crew & VFX Tab */}
      {activeTab === 'crew' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Crew Department Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.crewBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="department" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Members" />
                  <Bar dataKey="daysWorked" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Days Worked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> VFX Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.vfxBreakdown} cx="50%" cy="50%" outerRadius={100} paddingAngle={5} dataKey="count" nameKey="status" label={({ status, percentage }) => `${status} ${percentage}%`}>
                      {data.vfxBreakdown.map((entry, i) => <Cell key={`c-${i}`} fill={entry.status === 'Completed' ? COLORS.success : entry.status === 'In Progress' ? COLORS.warning : COLORS.danger} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {data.vfxBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : item.status === 'In Progress' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span>{item.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{item.count}</span>
                      <span className="text-slate-400 ml-2">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PredictionCard title="Estimated Completion" value={formatDate(data.predictions.estimatedCompletionDate)} subtitle="Based on current progress" icon={Calendar} color={COLORS.primary} />
            <PredictionCard title="Budget Forecast" value={formatCurrency(Math.abs(data.predictions.projectedBudgetOverage))} subtitle={data.predictions.projectedBudgetOverage >= 0 ? 'Under budget' : 'Under budget'} icon={DollarSign} color={data.predictions.projectedBudgetOverage >= 0 ? COLORS.success : COLORS.danger} />
            <PredictionCard title="Schedule Status" value={`${data.predictions.daysAheadSchedule} days`} subtitle={data.predictions.daysAheadSchedule > 0 ? 'Ahead of schedule' : 'Behind schedule'} icon={Clock} color={data.predictions.daysAheadSchedule > 0 ? COLORS.success : COLORS.danger} />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-yellow-400" /> AI Recommendations</h3>
            <div className="space-y-3">
              {[
                { type: 'success', text: 'Production is running 2 days ahead of schedule - excellent pace!' },
                { type: 'warning', text: 'Budget utilization at 56% - consider reviewing contingency reserves' },
                { type: 'info', text: 'VFX completion at 57% - on track for post-production timeline' },
                { type: 'success', text: 'Crew efficiency at 92% - team performance is optimal' },
              ].map((rec, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-4 rounded-lg ${rec.type === 'success' ? 'bg-green-500/10 text-green-400' : rec.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {rec.type === 'success' ? <CheckCircle className="w-5 h-5" /> : rec.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  <span>{rec.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Navigation</h3>
                <div className="space-y-2">
                  <ShortcutRow keys={['1']} description="Go to Overview tab" />
                  <ShortcutRow keys={['2']} description="Go to Progress tab" />
                  <ShortcutRow keys={['3']} description="Go to Budget tab" />
                  <ShortcutRow keys={['4']} description="Go to Crew & VFX tab" />
                  <ShortcutRow keys={['5']} description="Go to Predictions tab" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Actions</h3>
                <div className="space-y-2">
                  <ShortcutRow keys={['R']} description="Refresh analytics data" />
                  <ShortcutRow keys={['?']} description="Toggle keyboard shortcuts" />
                  <ShortcutRow keys={['Esc']} description="Close modal" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, subtitle, icon: Icon, color, progress }: { title: string; value: string; subtitle: string; icon: any; color: string; progress?: number }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}><Icon className="w-5 h-5" style={{ color }} /></div>
        {progress !== undefined && <span className="text-sm text-slate-400">{Math.round(progress)}%</span>}
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {progress !== undefined && <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} /></div>}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 flex items-center gap-4">
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}><Icon className="w-6 h-6" style={{ color }} /></div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-400">{title}</p></div>
    </div>
  )
}

function ProgressGauge({ title, value, color }: { title: string; value: number; color: string }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#374151" strokeWidth="12" />
          <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{value}%</span>
        </div>
      </div>
      <p className="font-semibold">{title}</p>
    </div>
  )
}

function PredictionCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle: string; icon: any; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}><Icon className="w-6 h-6" style={{ color }} /></div>
        <div><p className="text-sm text-slate-400">{title}</p><p className="text-2xl font-bold">{value}</p></div>
      </div>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, idx) => (
          <kbd key={idx} className="px-2 py-1 bg-slate-700 text-cyan-400 text-sm font-mono rounded border border-slate-600">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
