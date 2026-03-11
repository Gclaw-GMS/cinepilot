'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { 
  BarChart3, TrendingUp, DollarSign, Calendar, 
  Users, Video, MapPin, Clapperboard, RefreshCw, Loader2, 
  Activity, Target, AlertTriangle,
  Clock, Film, Search, X, HelpCircle, Download, Printer
} from 'lucide-react'

interface DashboardData {
  overview: {
    total_scenes: number
    completed_scenes: number
    total_locations: number
    total_characters: number
    shooting_days_completed: number
    shooting_days_total: number
    budget_total: number
    budget_spent: number
    budget_remaining: number
    crew_members: number
    total_shots: number
    completed_shots: number
    vfx_shots: number
    completed_vfx: number
  }
  recent_activities: Array<{
    type: string
    user: string
    scene?: number
    timestamp: string
    amount?: number
    location?: string
    crew?: string
  }>
  upcoming_shoots: Array<{
    date: string
    scenes: number[]
    location: string
    call_time: string
  }>
  budget_breakdown: Array<{
    category: string
    allocated: number
    spent: number
  }>
  schedule_progress: Array<{
    day: number
    scenes: number
    status: string
  }>
}

interface MetricsData {
  timeline: {
    overall_progress: number
    days_remaining: number
    scenes_remaining: number
    budget_utilization: number
  }
  performance: {
    avg_scenes_per_day: number
    avg_shots_per_scene: number
    budget_burn_rate: number
    efficiency_score: number
  }
  predictions: {
    projected_completion: string
    projected_budget_overrun: number
    risk_level: string
  }
  department_stats: Array<{
    name: string
    efficiency: number
    utilization: number
  }>
}

const DEMO_DASHBOARD: DashboardData = {
  overview: {
    total_scenes: 145,
    completed_scenes: 68,
    total_locations: 12,
    total_characters: 28,
    shooting_days_completed: 12,
    shooting_days_total: 25,
    budget_total: 85000000,
    budget_spent: 42350000,
    budget_remaining: 42650000,
    crew_members: 87,
    total_shots: 892,
    completed_shots: 412,
    vfx_shots: 38,
    completed_vfx: 12,
  },
  recent_activities: [
    { type: 'scene_shot', user: 'Director', scene: 46, timestamp: '2026-03-07T10:30:00Z' },
    { type: 'schedule_updated', user: 'AD', timestamp: '2026-03-07T09:00:00Z' },
    { type: 'budget_approved', user: 'Producer', amount: 5000000, timestamp: '2026-03-06T15:00:00Z' },
    { type: 'location_added', user: 'Location Manager', location: 'ECR Beach', timestamp: '2026-03-06T11:00:00Z' },
    { type: 'crew_assigned', user: 'Production Head', crew: 'Camera Operator', timestamp: '2026-03-05T14:00:00Z' },
  ],
  upcoming_shoots: [
    { date: '2026-03-08', scenes: [47, 48, 49], location: 'Studio A', call_time: '06:00' },
    { date: '2026-03-09', scenes: [50, 51, 52], location: 'Ram Studios', call_time: '05:30' },
    { date: '2026-03-10', scenes: [53, 54], location: 'Outdoor - Ooty', call_time: '04:00' },
  ],
  budget_breakdown: [
    { category: 'Pre-Production', allocated: 8000000, spent: 7200000 },
    { category: 'Production', allocated: 45000000, spent: 28500000 },
    { category: 'Post-Production', allocated: 15000000, spent: 4200000 },
    { category: 'Marketing', allocated: 17000000, spent: 2450000 },
  ],
  schedule_progress: [
    { day: 1, scenes: 4, status: 'completed' },
    { day: 2, scenes: 6, status: 'completed' },
    { day: 3, scenes: 5, status: 'completed' },
    { day: 4, scenes: 7, status: 'completed' },
    { day: 5, scenes: 4, status: 'completed' },
    { day: 6, scenes: 8, status: 'completed' },
    { day: 7, scenes: 6, status: 'completed' },
    { day: 8, scenes: 5, status: 'completed' },
    { day: 9, scenes: 7, status: 'completed' },
    { day: 10, scenes: 6, status: 'completed' },
    { day: 11, scenes: 4, status: 'completed' },
    { day: 12, scenes: 6, status: 'completed' },
    { day: 13, scenes: 0, status: 'scheduled' },
    { day: 14, scenes: 0, status: 'scheduled' },
    { day: 15, scenes: 0, status: 'scheduled' },
  ],
}

const DEMO_METRICS: MetricsData = {
  timeline: {
    overall_progress: 48,
    days_remaining: 13,
    scenes_remaining: 77,
    budget_utilization: 49.8,
  },
  performance: {
    avg_scenes_per_day: 5.7,
    avg_shots_per_scene: 6.2,
    budget_burn_rate: 3529167,
    efficiency_score: 87,
  },
  predictions: {
    projected_completion: '2026-04-15',
    projected_budget_overrun: 2500000,
    risk_level: 'medium',
  },
  department_stats: [
    { name: 'Camera', efficiency: 92, utilization: 88 },
    { name: 'Lighting', efficiency: 85, utilization: 75 },
    { name: 'Sound', efficiency: 94, utilization: 82 },
    { name: 'Art', efficiency: 78, utilization: 70 },
    { name: 'VFX', efficiency: 65, utilization: 45 },
  ],
}

type ViewMode = 'overview' | 'performance' | 'forecast'

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, metricsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/analytics?type=metrics'),
      ])
      
      const dashData = await dashRes.json()
      const metricsData = await metricsRes.json()
      
      if (!dashData.error) {
        setDashboard(dashData)
        setMetrics(metricsData)
        setIsDemoMode(dashData.isDemoMode === true || metricsData.isDemoMode === true)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setDashboard(DEMO_DASHBOARD)
      setMetrics(DEMO_METRICS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefresh()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          setViewMode('overview')
          break
        case '2':
          e.preventDefault()
          setViewMode('performance')
          break
        case '3':
          e.preventDefault()
          setViewMode('forecast')
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(true)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowShortcuts(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setSearchQuery('')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu])

  // Export functions
  const handleExportCSV = () => {
    if (!dashboard) return
    setExporting(true)
    setShowExportMenu(false)

    const rows = [
      ['Metric', 'Value'],
      ['Total Scenes', dashboard.overview.total_scenes.toString()],
      ['Completed Scenes', dashboard.overview.completed_scenes.toString()],
      ['Total Locations', dashboard.overview.total_locations.toString()],
      ['Total Characters', dashboard.overview.total_characters.toString()],
      ['Shooting Days Completed', dashboard.overview.shooting_days_completed.toString()],
      ['Shooting Days Total', dashboard.overview.shooting_days_total.toString()],
      ['Budget Total', dashboard.overview.budget_total.toString()],
      ['Budget Spent', dashboard.overview.budget_spent.toString()],
      ['Budget Remaining', dashboard.overview.budget_remaining.toString()],
      ['Crew Members', dashboard.overview.crew_members.toString()],
      ['Total Shots', dashboard.overview.total_shots.toString()],
      ['Completed Shots', dashboard.overview.completed_shots.toString()],
      ['VFX Shots', dashboard.overview.vfx_shots.toString()],
      ['Completed VFX', dashboard.overview.completed_vfx.toString()],
      [],
      ['Budget Breakdown'],
      ['Category', 'Allocated', 'Spent'],
      ...dashboard.budget_breakdown.map(b => [b.category, b.allocated.toString(), b.spent.toString()]),
    ]

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    setExporting(false)
  }

  const handleExportJSON = () => {
    if (!dashboard || !metrics) return
    setExporting(true)
    setShowExportMenu(false)

    const exportData = {
      exportDate: new Date().toISOString(),
      overview: dashboard.overview,
      timeline: metrics.timeline,
      performance: metrics.performance,
      predictions: metrics.predictions,
      budgetBreakdown: dashboard.budget_breakdown,
      scheduleProgress: dashboard.schedule_progress,
      departmentStats: metrics.department_stats,
      recentActivities: dashboard.recent_activities,
      upcomingShoots: dashboard.upcoming_shoots,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setExporting(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  // Print analytics report
  const handlePrint = () => {
    if (!dashboard || !metrics) return
    setShowPrintMenu(false)
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const overview = dashboard.overview
    const timeline = metrics.timeline
    const performance = metrics.performance
    
    // Build budget breakdown rows
    const budgetRows = dashboard.budget_breakdown.map(b => {
      const variance = b.allocated - b.spent
      const varianceClass = variance >= 0 ? 'positive' : 'negative'
      return `<tr>
        <td>${b.category}</td>
        <td>${formatCurrency(b.allocated)}</td>
        <td>${formatCurrency(b.spent)}</td>
        <td class="${varianceClass}">${formatCurrency(Math.abs(variance))}</td>
      </tr>`
    }).join('')
    
    // Build schedule progress rows
    const scheduleRows = dashboard.schedule_progress.slice(0, 15).map(s => {
      const statusClass = s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in-progress' : 'scheduled'
      return `<tr>
        <td>Day ${s.day}</td>
        <td>${s.scenes}</td>
        <td><span class="status status-${statusClass}">${s.status.replace('_', ' ')}</span></td>
      </tr>`
    }).join('')
    
    // Build department stats rows
    const deptRows = metrics.department_stats.map(d => {
      return `<tr>
        <td>${d.name}</td>
        <td>${d.efficiency}%</td>
        <td>${d.utilization}%</td>
      </tr>`
    }).join('')
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Analytics Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #0f172a; }
    .header .subtitle { color: #64748b; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .summary-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .summary-card .value { font-size: 28px; font-weight: 700; color: #0f172a; }
    .summary-card .label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; margin-bottom: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .status { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-in-progress { background: #dbeafe; color: #1e40af; }
    .status-scheduled { background: #fef3c7; color: #92400e; }
    .positive { color: #059669; }
    .negative { color: #dc2626; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .metric-item { display: flex; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .metric-label { color: #64748b; }
    .metric-value { font-weight: 600; color: #0f172a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📊 Production Analytics Report</h1>
      <p class="subtitle">Generated by CinePilot - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="value">${overview.total_scenes}</div>
      <div class="label">Total Scenes</div>
    </div>
    <div class="summary-card">
      <div class="value">${overview.completed_scenes}</div>
      <div class="label">Completed</div>
    </div>
    <div class="summary-card">
      <div class="value">${overview.shooting_days_completed}/${overview.shooting_days_total}</div>
      <div class="label">Shooting Days</div>
    </div>
    <div class="summary-card">
      <div class="value">${formatCurrency(overview.budget_total)}</div>
      <div class="label">Total Budget</div>
    </div>
  </div>
  
  <div class="two-col">
    <div class="section">
      <h2>📈 Timeline & Performance</h2>
      <div class="metric-grid">
        <div class="metric-item"><span class="metric-label">Overall Progress</span><span class="metric-value">${timeline.overall_progress}%</span></div>
        <div class="metric-item"><span class="metric-label">Days Remaining</span><span class="metric-value">${timeline.days_remaining}</span></div>
        <div class="metric-item"><span class="metric-label">Budget Used</span><span class="metric-value">${timeline.budget_utilization.toFixed(1)}%</span></div>
        <div class="metric-item"><span class="metric-label">Efficiency Score</span><span class="metric-value">${performance.efficiency_score}%</span></div>
        <div class="metric-item"><span class="metric-label">Avg Scenes/Day</span><span class="metric-value">${performance.avg_scenes_per_day}</span></div>
        <div class="metric-item"><span class="metric-label">Avg Shots/Scene</span><span class="metric-value">${performance.avg_shots_per_scene}</span></div>
      </div>
    </div>
    
    <div class="section">
      <h2>💰 Budget Overview</h2>
      <div class="metric-grid">
        <div class="metric-item"><span class="metric-label">Total Budget</span><span class="metric-value">${formatCurrency(overview.budget_total)}</span></div>
        <div class="metric-item"><span class="metric-label">Spent</span><span class="metric-value">${formatCurrency(overview.budget_spent)}</span></div>
        <div class="metric-item"><span class="metric-label">Remaining</span><span class="metric-value">${formatCurrency(overview.budget_remaining)}</span></div>
        <div class="metric-item"><span class="metric-label">Crew Members</span><span class="metric-value">${overview.crew_members}</span></div>
        <div class="metric-item"><span class="metric-label">Total Shots</span><span class="metric-value">${overview.total_shots}</span></div>
        <div class="metric-item"><span class="metric-label">VFX Shots</span><span class="metric-value">${overview.vfx_shots}</span></div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2>💵 Budget Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Allocated</th>
          <th>Spent</th>
          <th>Variance</th>
        </tr>
      </thead>
      <tbody>
        ${budgetRows}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>📅 Schedule Progress (First 15 Days)</h2>
    <table>
      <thead>
        <tr>
          <th>Day</th>
          <th>Scenes</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${scheduleRows}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>👥 Department Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Efficiency</th>
          <th>Utilization</th>
        </tr>
      </thead>
      <tbody>
        ${deptRows}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    CinePilot Production Management • Analytics Report
  </div>
</body>
</html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scene_shot': return <Video className="w-4 h-4" />
      case 'schedule_updated': return <Calendar className="w-4 h-4" />
      case 'budget_approved': return <DollarSign className="w-4 h-4" />
      case 'location_added': return <MapPin className="w-4 h-4" />
      case 'crew_assigned': return <Users className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const budgetPercent = dashboard ? Math.round((dashboard.overview.budget_spent / dashboard.overview.budget_total) * 100) : 0
  const scenePercent = dashboard ? Math.round((dashboard.overview.completed_scenes / dashboard.overview.total_scenes) * 100) : 0

  const budgetData = dashboard?.budget_breakdown.map(item => ({
    ...item,
    utilization: Math.round((item.spent / item.allocated) * 100),
  })) || []

  const deptData = metrics?.department_stats || []

  // Filter data based on search query
  const filteredActivities = dashboard?.recent_activities.filter(activity => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      activity.user.toLowerCase().includes(query) ||
      activity.type.toLowerCase().includes(query) ||
      activity.location?.toLowerCase().includes(query) ||
      activity.crew?.toLowerCase().includes(query) ||
      activity.scene?.toString().includes(query)
    )
  }) || []

  const filteredUpcomingShoots = dashboard?.upcoming_shoots.filter(shoot => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      shoot.location.toLowerCase().includes(query) ||
      shoot.scenes.some(s => s.toString().includes(query)) ||
      shoot.date.includes(query)
    )
  }) || []

  const filteredDeptStats = metrics?.department_stats.filter(dept => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return dept.name.toLowerCase().includes(query)
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            Production Analytics
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time insights into your film's production metrics
            {isDemoMode && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">Demo Data</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search analytics... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || !dashboard}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Export (E)"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  Export as JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-green-400" />
                  Export as CSV
                </button>
              </div>
            )}
          </div>
          
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              disabled={!dashboard}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Print (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  Print Analytics
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtered Count */}
      {searchQuery && (
        <div className="mb-4 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm">
          Filtering by: "{searchQuery}" 
          <span className="ml-2 text-slate-400">
            (Press Esc to clear)
          </span>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: Target, shortcut: '1' },
          { key: 'performance', label: 'Performance', icon: Activity, shortcut: '2' },
          { key: 'forecast', label: 'Forecast', icon: TrendingUp, shortcut: '3' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key as ViewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === tab.key 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.shortcut})</span>
          </button>
        ))}
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Video className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">Scenes</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboard.overview.completed_scenes}
                <span className="text-lg text-slate-500 font-normal">/{dashboard.overview.total_scenes}</span>
              </p>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${scenePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{scenePercent}% complete</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Clapperboard className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-slate-400 text-sm">Shoot Days</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboard.overview.shooting_days_completed}
                <span className="text-lg text-slate-500 font-normal">/{dashboard.overview.shooting_days_total}</span>
              </p>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  style={{ width: `${(dashboard.overview.shooting_days_completed / dashboard.overview.shooting_days_total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Math.round((dashboard.overview.shooting_days_completed / dashboard.overview.shooting_days_total) * 100)}% complete</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-slate-400 text-sm">Budget</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(dashboard.overview.budget_spent)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {formatCurrency(dashboard.overview.budget_remaining)} remaining
              </p>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${budgetPercent > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-amber-500 to-yellow-500'}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{budgetPercent}% utilized</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-slate-400 text-sm">Crew</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboard.overview.crew_members}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {dashboard.overview.total_characters} characters
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Progress Chart */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule Progress
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.schedule_progress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="scenes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                Budget Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis dataKey="category" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="allocated" fill="#6366f1" name="Allocated" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="spent" fill="#10b981" name="Spent" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity & Upcoming Shoots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {filteredActivities.length === 0 && searchQuery ? (
                  <p className="text-slate-500 text-center py-4">No activities match "{searchQuery}"</p>
                ) : (
                  filteredActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <div className="p-2 bg-slate-600 rounded-lg text-slate-300">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {activity.type === 'scene_shot' && `Scene ${activity.scene} shot by ${activity.user}`}
                          {activity.type === 'schedule_updated' && `${activity.user} updated schedule`}
                          {activity.type === 'budget_approved' && `${activity.user} approved ${formatCurrency(activity.amount!)}`}
                          {activity.type === 'location_added' && `Added ${activity.location}`}
                          {activity.type === 'crew_assigned' && `${activity.user} assigned ${activity.crew}`}
                        </p>
                        <p className="text-slate-500 text-xs">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Shoots */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                Upcoming Shoots
              </h3>
              <div className="space-y-3">
                {filteredUpcomingShoots.length === 0 && searchQuery ? (
                  <p className="text-slate-500 text-center py-4">No shoots match "{searchQuery}"</p>
                ) : (
                  filteredUpcomingShoots.map((shoot, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{formatDate(shoot.date)}</p>
                        <p className="text-slate-400 text-xs">Scenes {shoot.scenes.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">{shoot.location}</p>
                        <p className="text-slate-500 text-xs">Call: {shoot.call_time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Mode */}
      {viewMode === 'performance' && metrics && (
        <div className="space-y-6">
          {/* Performance KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">Progress</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.timeline.overall_progress}%</p>
              <p className="text-sm text-slate-500 mt-1">{metrics.timeline.scenes_remaining} scenes remaining</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Video className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-slate-400 text-sm">Avg Scenes/Day</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.performance.avg_scenes_per_day}</p>
              <p className="text-sm text-slate-500 mt-1">Target: 5-6</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-slate-400 text-sm">Burn Rate</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(metrics.performance.budget_burn_rate)}</p>
              <p className="text-sm text-slate-500 mt-1">Per day</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-slate-400 text-sm">Efficiency</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.performance.efficiency_score}%</p>
              <p className="text-sm text-slate-500 mt-1">Target: 85%+</p>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Department Performance
              {searchQuery && (
                <span className="ml-2 text-sm text-slate-400">
                  ({filteredDeptStats.length} of {deptData.length})
                </span>
              )}
            </h3>
            {filteredDeptStats.length === 0 && searchQuery ? (
              <p className="text-slate-500 text-center py-8">No departments match "{searchQuery}"</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredDeptStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#6366f1" name="Efficiency %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilization" fill="#10b981" name="Utilization %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Timeline Stats */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Timeline Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-indigo-400">{metrics.timeline.overall_progress}%</p>
                <p className="text-slate-400 text-sm">Complete</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">{metrics.timeline.days_remaining}</p>
                <p className="text-slate-400 text-sm">Days Left</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-cyan-400">{metrics.timeline.scenes_remaining}</p>
                <p className="text-slate-400 text-sm">Scenes Left</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-400">{metrics.timeline.budget_utilization}%</p>
                <p className="text-slate-400 text-sm">Budget Used</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Mode */}
      {viewMode === 'forecast' && metrics && dashboard && (
        <div className="space-y-6">
          {/* Risk Assessment */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${metrics.predictions.risk_level === 'high' ? 'text-red-400' : metrics.predictions.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`} />
              Risk Assessment
            </h3>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${
                metrics.predictions.risk_level === 'high' ? 'bg-red-500/20 text-red-400' : 
                metrics.predictions.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                <span className="font-semibold capitalize">{metrics.predictions.risk_level} Risk</span>
              </div>
              <div className="flex-1">
                <p className="text-slate-300">
                  Projected completion: <span className="text-white font-medium">{metrics.predictions.projected_completion}</span>
                </p>
                {metrics.predictions.projected_budget_overrun > 0 && (
                  <p className="text-slate-400 text-sm mt-1">
                    Potential budget overrun: <span className="text-red-400">{formatCurrency(metrics.predictions.projected_budget_overrun)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Forecast Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Budget Forecast
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={[
                  { month: 'Jan', planned: 15000000, actual: 14000000 },
                  { month: 'Feb', planned: 30000000, actual: 28000000 },
                  { month: 'Mar', planned: 50000000, actual: 42350000 },
                  { month: 'Apr', planned: 70000000, actual: 0 },
                  { month: 'May', planned: 85000000, actual: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="planned" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Planned" />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Shot Progress */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Shot Progress
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: dashboard.overview.completed_shots },
                      { name: 'Remaining', value: dashboard.overview.total_shots - dashboard.overview.completed_shots },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-slate-400 text-sm mt-2">
                {dashboard.overview.completed_shots} / {dashboard.overview.total_shots} shots completed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh analytics data' },
                { key: 'E', description: 'Toggle export dropdown' },
                { key: 'P', description: 'Print analytics report' },
                { key: '/', description: 'Focus search input' },
                { key: '1', description: 'Switch to Overview view' },
                { key: '2', description: 'Switch to Performance view' },
                { key: '3', description: 'Switch to Forecast view' },
                { key: '?', description: 'Show this help modal' },
                { key: 'Esc', description: 'Close modal, menus, or clear search' },
              ].map((shortcut) => (
                <div 
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1 bg-slate-600 text-white text-sm font-mono rounded border border-slate-500">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            
            <p className="text-slate-500 text-sm text-center mt-6">
              Press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
