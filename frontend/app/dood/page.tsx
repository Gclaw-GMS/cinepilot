'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  RefreshCw,
  AlertCircle,
  FileText,
  BarChart3,
  PieChart,
  Share2,
  Filter,
  Eye,
  List
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts'

interface DOODRow {
  characterId: string
  character: string
  characterTamil: string
  actorName?: string
  isMain: boolean
  total_days: number
  days: number[]
  percentage: number
}

interface DOODStats {
  totalCharacters: number
  totalShootingDays: number
  totalCalls: number
  avgDaysPerActor: number
  mainCastDays: number
  supportingCastDays: number
}

const DEMO_DOOD: DOODRow[] = [
  { characterId: '1', character: 'Arjun', characterTamil: 'அர்ஜுன்', actorName: 'Ajith Kumar', isMain: true, total_days: 15, days: [1,2,3,5,6,7,9,10,11,12,14,15,16,18,20], percentage: 75 },
  { characterId: '2', character: 'Priya', characterTamil: 'பிரியா', actorName: 'Sai Pallavi', isMain: true, total_days: 12, days: [1,2,4,5,6,8,9,10,12,13,14,15], percentage: 60 },
  { characterId: '3', character: 'Mahendra', characterTamil: 'மகேந்திரா', actorName: 'Vijay Sethupathi', isMain: true, total_days: 8, days: [3,7,11,15,16,17,18,19], percentage: 40 },
  { characterId: '4', character: 'Sathya', characterTamil: 'சத்யா', actorName: 'Nivin Pauly', isMain: false, total_days: 10, days: [1,4,5,9,10,14,15,16,20,21], percentage: 50 },
  { characterId: '5', character: 'Divya', characterTamil: 'திவ்யா', actorName: 'Aishwarya Rajesh', isMain: false, total_days: 6, days: [2,3,8,12,13,19], percentage: 30 },
]

const DEMO_STATS: DOODStats = {
  totalCharacters: 5,
  totalShootingDays: 20,
  totalCalls: 51,
  avgDaysPerActor: 10.2,
  mainCastDays: 35,
  supportingCastDays: 16,
}

const CHART_COLORS = {
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

const CATEGORY_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

// Get percentage color based on value
const getPercentageColor = (percentage: number): string => {
  if (percentage >= 70) return 'text-emerald-400'
  if (percentage >= 50) return 'text-cyan-400'
  if (percentage >= 30) return 'text-amber-400'
  return 'text-orange-400'
}

const getPercentageGradient = (percentage: number): string => {
  if (percentage >= 70) return 'from-emerald-500 to-emerald-400'
  if (percentage >= 50) return 'from-cyan-500 to-cyan-400'
  if (percentage >= 30) return 'from-amber-500 to-amber-400'
  return 'from-orange-500 to-orange-400'
}

export default function DOODPage() {
  const [report, setReport] = useState<DOODRow[]>([])
  const [stats, setStats] = useState<DOODStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'analytics'>('analytics')
  const [filterRole, setFilterRole] = useState<'all' | 'main' | 'supporting'>('all')

  const loadDOOD = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dood?projectId=${selectedProject}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      
      if (data.isDemoMode) {
        setIsDemoMode(true)
      }
      
      if (data.report && data.report.length > 0) {
        setReport(data.report)
        setStats(data.stats)
      } else {
        setReport(DEMO_DOOD)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.warn('Using demo DOOD data:', e)
      setReport(DEMO_DOOD)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    }
    setLoading(false)
  }, [selectedProject])

  useEffect(() => {
    loadDOOD()
  }, [loadDOOD])

  // Filter report based on role
  const filteredReport = useMemo(() => {
    if (filterRole === 'all') return report
    if (filterRole === 'main') return report.filter(r => r.isMain)
    return report.filter(r => !r.isMain)
  }, [report, filterRole])

  // Chart data
  const pieChartData = useMemo(() => {
    const mainCount = report.filter(r => r.isMain).length
    const supportingCount = report.filter(r => !r.isMain).length
    return [
      { name: 'Main Cast', value: mainCount, color: CHART_COLORS.primary },
      { name: 'Supporting', value: supportingCount, color: CHART_COLORS.secondary },
    ]
  }, [report])

  const barChartData = useMemo(() => {
    return report.slice(0, 8).map(r => ({
      name: r.character.length > 10 ? r.character.slice(0, 10) + '...' : r.character,
      days: r.total_days,
      fullName: r.character,
    }))
  }, [report])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/dood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', projectId: selectedProject })
      })
      if (!res.ok) {
        console.warn('Generate API error:', res.status)
      }
      await loadDOOD()
    } catch (e) {
      console.warn('Refresh failed, using cached data')
    }
    setRefreshing(false)
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['Character', 'Tamil Name', 'Actor', 'Total Days', 'Days', 'Percentage', 'Role']
      const rows = report.map(r => [
        r.character,
        r.characterTamil,
        r.actorName || '',
        r.total_days,
        r.days.join(', '),
        `${r.percentage}%`,
        r.isMain ? 'Main' : 'Supporting'
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'json') {
      const jsonData = {
        report: report,
        stats: stats,
        generatedAt: new Date().toISOString(),
        projectId: selectedProject
      }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const totalShootingDays = stats.totalShootingDays

  // Generate calendar grid
  const renderCalendar = (days: number[], isCompact = false) => {
    const size = isCompact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
    return (
      <div className={`flex flex-wrap gap-1 mt-2 ${isCompact ? 'gap-0.5' : ''}`}>
        {Array.from({ length: Math.max(totalShootingDays, 1) }, (_, i) => {
          const dayNum = i + 1
          const isWorking = days.includes(dayNum)
          return (
            <div
              key={dayNum}
              className={`${size} rounded flex items-center justify-center transition-all ${
                isWorking
                  ? 'bg-cyan-400 text-black font-semibold shadow-md shadow-cyan-400/30'
                  : 'bg-gray-800/60 text-gray-600'
              }`}
              title={`Day ${dayNum}: ${isWorking ? 'Working' : 'Off'}`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    )
  }

  // Render analytics view
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Days by Character - Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Days per Character
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  width={80}
                  tickFormatter={(value) => value.length > 8 ? `${value.slice(0,8)}...` : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: number) => [`${value} days`, 'Days']}
                />
                <Bar dataKey="days" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cast Distribution - Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Cast Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend 
                  formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.mainCastDays}</div>
          <div className="text-xs text-slate-500 mt-1">Main Cast Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.supportingCastDays}</div>
          <div className="text-xs text-slate-500 mt-1">Supporting Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {report.filter(r => r.percentage >= 50).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Heavy Shoot Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {Math.max(...report.map(r => r.days.length), 0) - Math.min(...report.map(r => r.days.length), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Day Range Spread</div>
        </div>
      </div>
    </div>
  )

  // Stats cards
  const statCards = [
    { 
      label: 'Total Characters', 
      value: stats.totalCharacters, 
      icon: Users, 
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      subtext: `${report.filter(r => r.isMain).length} main, ${report.filter(r => !r.isMain).length} supporting`
    },
    { 
      label: 'Shooting Days', 
      value: stats.totalShootingDays, 
      icon: Calendar, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      subtext: `${totalShootingDays} days scheduled`
    },
    { 
      label: 'Total Calls', 
      value: stats.totalCalls, 
      icon: Clock, 
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      subtext: 'Actor day calls'
    },
    { 
      label: 'Avg Days/Actor', 
      value: stats.avgDaysPerActor, 
      icon: TrendingUp, 
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      subtext: 'Per actor average'
    },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading DOOD Report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📊 Day Out of Days (DOOD)
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track actor availability and call days across the production schedule
            </p>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo Data</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-sm font-medium">API Connected</span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'analytics' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'list' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">All Cast</option>
              <option value="main">Main Cast Only</option>
              <option value="supporting">Supporting Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="default-project">இதயத்தின் ஒலி</option>
            <option value="project-2">Veera's Journey</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600 mt-1">{stat.subtext}</div>
          </div>
        ))}
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && renderAnalytics()}

      {/* Main Content - Table View */}
      {(viewMode === 'calendar' || viewMode === 'list') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold">Cast Schedule</h2>
              <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredReport.length} actors
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-400 w-16">#</th>
                  <th className="text-left p-4 font-medium text-gray-400">Character</th>
                  <th className="text-center p-4 font-medium text-gray-400 w-24">Total Days</th>
                  <th className="text-center p-4 font-medium text-gray-400 w-32">% of Shoot</th>
                  <th className="text-left p-4 font-medium text-gray-400">
                    {viewMode === 'calendar' ? 'Shooting Calendar' : 'Working Days'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReport.map((row, idx) => (
                  <tr 
                    key={row.characterId} 
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-gray-500 text-sm">{idx + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          row.isMain 
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black' 
                            : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                        }`}>
                          {row.character[0]}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {row.character}
                            {row.isMain && (
                              <span className="text-[10px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded">
                                MAIN
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {row.characterTamil} • {row.actorName || 'TBA'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-2xl font-bold ${getPercentageColor(row.percentage)}`}>
                        {row.total_days}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getPercentageGradient(row.percentage)} rounded-full transition-all duration-500`}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getPercentageColor(row.percentage)} w-12 text-right`}>
                          {row.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {viewMode === 'calendar' ? (
                        renderCalendar(row.days)
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {row.days.length > 0 ? row.days.map(d => (
                            <span 
                              key={d}
                              className="px-2 py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-xs"
                            >
                              Day {d}
                            </span>
                          )) : (
                            <span className="text-gray-500 text-sm">No calls</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend & Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-400 rounded"></div>
            <span>Working Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-800 rounded"></div>
            <span>Off Day</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )
}
