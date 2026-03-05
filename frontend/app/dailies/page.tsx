'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Clapperboard, Plus, Calendar, Film, Camera, Clock, Users, 
  CheckCircle, AlertCircle, Download, RefreshCw, Loader2, 
  ChevronDown, ChevronUp, Search, Filter, Video, Image, 
  FileText, TrendingUp, DollarSign, Sun, Moon, MapPin,
  Edit2, Trash2, X, Save, Printer, BarChart3, PieChart, Keyboard
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line
} from 'recharts'

// Types
interface DailyScene {
  sceneId: string
  sceneNumber: string
  description: string
  plannedShots: number
  actualShots: number
  status: 'completed' | 'partial' | 'pending' | 'not_done'
  notes: string
}

interface DailyReport {
  id: string
  date: string
  dayNumber: number
  location: string
  callTime: string
  wrapTime: string
  weather: string
  scenes: DailyScene[]
  totalShotsPlanned: number
  totalShotsShot: number
  crewPresent: number
  castPresent: number
  incidents: string[]
  notes: string
  createdAt: string
  createdBy: string
}

interface DailiesStats {
  totalDays: number
  totalScenesShot: number
  totalShotsShot: number
  avgShotsPerDay: number
  completionRate: number
}

// Demo data
const DEMO_REPORTS: DailyReport[] = [
  {
    id: 'd1',
    date: '2026-03-04',
    dayNumber: 12,
    location: 'AVM Studios, Chennai',
    callTime: '06:00',
    wrapTime: '19:30',
    weather: 'Indoor (Studio)',
    scenes: [
      { sceneId: 's1', sceneNumber: '24', description: 'Arjun & Priya conversation', plannedShots: 8, actualShots: 8, status: 'completed', notes: 'Perfect take on 3rd shot' },
      { sceneId: 's2', sceneNumber: '25', description: 'Emotional confrontation', plannedShots: 12, actualShots: 12, status: 'completed', notes: 'Excellent performance' },
      { sceneId: 's3', sceneNumber: '26', description: 'Reaction shots', plannedShots: 4, actualShots: 4, status: 'completed', notes: '' },
    ],
    totalShotsPlanned: 24,
    totalShotsShot: 24,
    crewPresent: 45,
    castPresent: 8,
    incidents: [],
    notes: 'Great day of shooting. All scenes completed ahead of schedule.',
    createdAt: '2026-03-04T20:00:00Z',
    createdBy: 'Production Manager'
  },
  {
    id: 'd2',
    date: '2026-03-03',
    dayNumber: 11,
    location: 'Mahabalipuram Beach',
    callTime: '05:30',
    wrapTime: '18:00',
    weather: 'Sunny, 32°C',
    scenes: [
      { sceneId: 's4', sceneNumber: '15', description: 'Beach song sequence', plannedShots: 20, actualShots: 18, status: 'partial', notes: '2 shots pending due to tide' },
      { sceneId: 's5', sceneNumber: '16', description: 'Sunset dialogue', plannedShots: 6, actualShots: 6, status: 'completed', notes: 'Golden hour captured perfectly' },
    ],
    totalShotsPlanned: 26,
    totalShotsShot: 24,
    crewPresent: 52,
    castPresent: 12,
    incidents: ['Equipment issue with drone - delayed by 30 mins'],
    notes: 'Beautiful sunset shots. Some shots rescheduled for next outdoor day.',
    createdAt: '2026-03-03T19:30:00Z',
    createdBy: 'Production Manager'
  },
  {
    id: 'd3',
    date: '2026-03-02',
    dayNumber: 10,
    location: 'Kollywood Studio',
    callTime: '07:00',
    wrapTime: '20:00',
    weather: 'Indoor (Studio)',
    scenes: [
      { sceneId: 's6', sceneNumber: '8', description: 'Office confrontation', plannedShots: 10, actualShots: 0, status: 'not_done', notes: 'Cast illness - rescheduled' },
      { sceneId: 's7', sceneNumber: '9', description: 'Flashback sequence', plannedShots: 15, actualShots: 15, status: 'completed', notes: 'VFX reference shots captured' },
    ],
    totalShotsPlanned: 25,
    totalShotsShot: 15,
    crewPresent: 38,
    castPresent: 5,
    incidents: ['Lead actor had fever - reduced schedule'],
    notes: 'Partial day due to cast illness. Reshot flashback material.',
    createdAt: '2026-03-02T21:00:00Z',
    createdBy: 'Production Manager'
  },
]

const DEMO_STATS: DailiesStats = {
  totalDays: 12,
  totalScenesShot: 45,
  totalShotsShot: 280,
  avgShotsPerDay: 23.3,
  completionRate: 87.5,
}

const STATUS_COLORS = {
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Completed' },
  partial: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Partial' },
  pending: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Pending' },
  not_done: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Not Done' },
}

export default function DailyReportPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [stats, setStats] = useState<DailiesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'partial' | 'pending'>('all')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  
  const [newReport, setNewReport] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    callTime: '06:00',
    wrapTime: '19:00',
    weather: 'Indoor (Studio)',
    notes: '',
  })

  // Fetch data function
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const response = await fetch('/api/dailies')
      const result = await response.json()
      
      if (result.success && result.data) {
        setReports(result.data)
        setStats(result.stats)
        setIsDemoMode(result.mode === 'demo')
        setLastUpdated(new Date())
      } else {
        setReports(DEMO_REPORTS)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching dailies:', error)
      setReports(DEMO_REPORTS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter reports based on search query
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.scenes.some(s => s.sceneNumber.includes(searchQuery))
    return matchesSearch
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setShowKeyboardHelp(prev => !prev)
        return
      }
      
      if (isInput) return
      
      switch (e.key.toLowerCase()) {
        case 'a':
          if (!showAddForm) {
            e.preventDefault()
            setShowAddForm(true)
          }
          break
        case 'r':
          e.preventDefault()
          fetchData(true)
          break
        case 'e':
          e.preventDefault()
          handleExportCSV()
          break
        case 'f':
          e.preventDefault()
          document.getElementById('search-input')?.focus()
          break
        case 'arrowdown':
          e.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, filteredReports.length - 1))
          break
        case 'arrowup':
          e.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'end':
          e.preventDefault()
          setFocusedIndex(filteredReports.length - 1)
          break
        case 'enter':
          e.preventDefault()
          if (filteredReports[focusedIndex]) {
            setExpandedReport(prev => prev === filteredReports[focusedIndex].id ? null : filteredReports[focusedIndex].id)
          }
          break
        case 'escape':
          setShowKeyboardHelp(false)
          setShowAddForm(false)
          setEditingReport(null)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fetchData, showAddForm, filteredReports, focusedIndex])

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Location', 'Call Time', 'Wrap Time', 'Weather', 'Shots Planned', 'Shots Shot', 'Completion %', 'Crew', 'Cast']
    const rows = filteredReports.map(r => [
      r.date,
      r.dayNumber,
      r.location,
      r.callTime,
      r.wrapTime,
      r.weather,
      r.totalShotsPlanned,
      r.totalShotsShot,
      Math.round((r.totalShotsShot / r.totalShotsPlanned) * 100) + '%',
      r.crewPresent,
      r.castPresent
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dailies-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const currentIndex = focusedIndex
      const maxIndex = filteredReports.length - 1

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (currentIndex < maxIndex) {
            setFocusedIndex(currentIndex + 1)
            setExpandedReport(filteredReports[currentIndex + 1]?.id || null)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (currentIndex > 0) {
            setFocusedIndex(currentIndex - 1)
            setExpandedReport(filteredReports[currentIndex - 1]?.id || null)
          }
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          setExpandedReport(filteredReports[0]?.id || null)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(maxIndex)
          setExpandedReport(filteredReports[maxIndex]?.id || null)
          break
        case 'Enter':
          e.preventDefault()
          if (expandedReport) {
            setExpandedReport(null)
          } else if (filteredReports[currentIndex]) {
            setExpandedReport(filteredReports[currentIndex].id)
          }
          break
        case 'Escape':
          e.preventDefault()
          setExpandedReport(null)
          setShowAddForm(false)
          setEditingReport(null)
          setShowKeyboardHelp(false)
          break
        case '?':
          if (e.shiftKey) {
            e.preventDefault()
            setShowKeyboardHelp(true)
          }
          break
        case 'a':
        case 'A':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            setShowAddForm(true)
            setEditingReport(null)
          }
          break
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            fetchData(true)
          }
          break
        case 'e':
        case 'E':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleExportCSV()
          }
          break
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            document.getElementById('search-input')?.focus()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fetchData, focusedIndex, filteredReports, expandedReport])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCompletionColor = (actual: number, planned: number) => {
    const rate = planned > 0 ? (actual / planned) * 100 : 0
    if (rate >= 90) return 'text-green-400'
    if (rate >= 70) return 'text-amber-400'
    return 'text-red-400'
  }

  const completionData = reports.map(r => ({
    date: new Date(r.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    shots: r.totalShotsShot,
    planned: r.totalShotsPlanned,
    rate: Math.round((r.totalShotsShot / r.totalShotsPlanned) * 100)
  })).reverse()

  const sceneStatusData = [
    { 
      name: 'Completed', 
      value: reports.reduce((sum, r) => sum + r.scenes.filter(s => s.status === 'completed').length, 0),
      color: '#10b981' 
    },
    { 
      name: 'Partial', 
      value: reports.reduce((sum, r) => sum + r.scenes.filter(s => s.status === 'partial').length, 0),
      color: '#f59e0b' 
    },
    { 
      name: 'Not Done', 
      value: reports.reduce((sum, r) => sum + r.scenes.filter(s => s.status === 'not_done').length, 0),
      color: '#ef4444' 
    },
  ]

  const handleAddReport = async () => {
    const dayNumber = reports.length + 1
    const newReportData: DailyReport = {
      id: `d${Date.now()}`,
      ...newReport,
      dayNumber,
      scenes: [],
      totalShotsPlanned: 0,
      totalShotsShot: 0,
      crewPresent: 0,
      castPresent: 0,
      incidents: [],
      createdAt: new Date().toISOString(),
      createdBy: 'Production Manager'
    }
    
    // Try to POST to API
    try {
      const response = await fetch('/api/dailies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData)
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        setReports([result.data, ...reports])
      } else {
        // Fallback to local state
        setReports([newReportData, ...reports])
      }
    } catch (error) {
      console.error('Error creating daily report:', error)
      // Fallback to local state
      setReports([newReportData, ...reports])
    }
    
    setShowAddForm(false)
    setNewReport({
      date: new Date().toISOString().split('T')[0],
      location: '',
      callTime: '06:00',
      wrapTime: '19:00',
      weather: 'Indoor (Studio)',
      notes: '',
    })
  }

  const handleDeleteReport = (id: string) => {
    if (!confirm('Delete this daily report?')) return
    setReports(reports.filter(r => r.id !== id))
  }

  const calculateDayStats = (report: DailyReport) => {
    const completed = report.scenes.filter(s => s.status === 'completed').length
    const partial = report.scenes.filter(s => s.status === 'partial').length
    const notDone = report.scenes.filter(s => s.status === 'not_done').length
    return { completed, partial, notDone }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Day', 'Date', 'Location', 'Call Time', 'Wrap Time', 'Weather', 'Shots Planned', 'Shots Shot', 'Crew Present', 'Cast Present', 'Completion %', 'Notes']
    const rows = reports.map(r => [
      r.dayNumber,
      r.date,
      r.location,
      r.callTime,
      r.wrapTime,
      r.weather,
      r.totalShotsPlanned,
      r.totalShotsShot,
      r.crewPresent,
      r.castPresent,
      Math.round((r.totalShotsShot / r.totalShotsPlanned) * 100) || 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily-reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading daily reports...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg">
            <Clapperboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Daily Reports</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                  Demo Data
                </span>
              )}
              {lastUpdated && !isDemoMode && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                  Live
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Track daily production progress & shot completion
              {lastUpdated && (
                <span className="ml-2 text-slate-600">
                  • Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-slate-400">Shooting Days</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalDays}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Film className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">Scenes Shot</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalScenesShot}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">Total Shots</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalShotsShot}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-slate-400">Avg/Day</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgShotsPerDay}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">Completion</span>
            </div>
            <p className={`text-2xl font-bold ${stats.completionRate >= 80 ? 'text-green-400' : stats.completionRate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.completionRate}%
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Shot Completion Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 col-span-2">
          <h3 className="font-semibold mb-4 text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Shot Completion Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="shots" fill="#f97316" radius={[4, 4, 0, 0]} name="Shots Shot" />
                <Bar dataKey="planned" fill="#475569" radius={[4, 4, 0, 0]} name="Planned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scene Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-slate-300 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-pink-400" />
            Scene Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={sceneStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sceneStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {sceneStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Search by location, notes, or scene number... (Press F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <Clapperboard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No daily reports found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-medium text-sm"
            >
              Create First Report
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
            const sceneStats = calculateDayStats(report)
            const isExpanded = expandedReport === report.id
            
            return (
              <div 
                key={report.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                {/* Report Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-orange-400">D{report.dayNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{formatDate(report.date)}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            report.totalShotsShot >= report.totalShotsPlanned * 0.9
                              ? 'bg-green-500/20 text-green-400'
                              : report.totalShotsShot >= report.totalShotsPlanned * 0.7
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {report.totalShotsShot >= report.totalShotsPlanned * 0.9 ? 'On Track' : 
                             report.totalShotsShot >= report.totalShotsPlanned * 0.7 ? 'Behind' : 'Delayed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {report.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {report.callTime} - {report.wrapTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {report.crewPresent} crew, {report.castPresent} cast
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Shot Stats */}
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getCompletionColor(report.totalShotsShot, report.totalShotsPlanned)}`}>
                          {report.totalShotsShot}/{report.totalShotsPlanned}
                        </p>
                        <p className="text-xs text-slate-500">shots completed</p>
                      </div>
                      
                      {/* Scene Stats */}
                      <div className="flex gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-400">{sceneStats.completed}</p>
                          <p className="text-xs text-slate-500">done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-amber-400">{sceneStats.partial}</p>
                          <p className="text-xs text-slate-500">partial</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-400">{sceneStats.notDone}</p>
                          <p className="text-xs text-slate-500">missed</p>
                        </div>
                      </div>
                      
                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 bg-slate-800/30">
                    {/* Quick Info */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Weather</p>
                        <p className="text-sm text-white">{report.weather}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Call Time</p>
                        <p className="text-sm text-white">{report.callTime}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Wrap Time</p>
                        <p className="text-sm text-white">{report.wrapTime}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Created By</p>
                        <p className="text-sm text-white">{report.createdBy}</p>
                      </div>
                    </div>

                    {/* Scenes Table */}
                    {report.scenes.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-slate-400 mb-3">Scenes Shot</h4>
                        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-slate-800">
                              <tr>
                                <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Scene</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Description</th>
                                <th className="text-center px-4 py-2 text-xs font-medium text-slate-400">Shots</th>
                                <th className="text-center px-4 py-2 text-xs font-medium text-slate-400">Status</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {report.scenes.map((scene) => (
                                <tr key={scene.sceneId} className="hover:bg-slate-800/30">
                                  <td className="px-4 py-3">
                                    <span className="font-medium text-white">#{scene.sceneNumber}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-300 text-sm">{scene.description}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={getCompletionColor(scene.actualShots, scene.plannedShots)}>
                                      {scene.actualShots}/{scene.plannedShots}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      STATUS_COLORS[scene.status].bg
                                    } ${STATUS_COLORS[scene.status].text} border ${
                                      STATUS_COLORS[scene.status].border
                                    }`}>
                                      {STATUS_COLORS[scene.status].label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-sm">{scene.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Incidents */}
                    {report.incidents.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          Incidents / Issues
                        </h4>
                        <div className="space-y-2">
                          {report.incidents.map((incident, idx) => (
                            <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-amber-400 text-sm">
                              {incident}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {report.notes && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          Notes
                        </h4>
                        <p className="text-slate-300 text-sm bg-slate-800/50 rounded-lg p-4">
                          {report.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <button
                        onClick={() => setEditingReport(report)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm ml-auto"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Report Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Daily Report</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddReport() }} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={newReport.date}
                  onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={newReport.location}
                  onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                  placeholder="e.g., AVM Studios, Chennai"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Call Time</label>
                  <input
                    type="time"
                    value={newReport.callTime}
                    onChange={(e) => setNewReport({ ...newReport, callTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Wrap Time</label>
                  <input
                    type="time"
                    value={newReport.wrapTime}
                    onChange={(e) => setNewReport({ ...newReport, wrapTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Weather</label>
                <select
                  value={newReport.weather}
                  onChange={(e) => setNewReport({ ...newReport, weather: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Indoor (Studio)</option>
                  <option>Sunny</option>
                  <option>Cloudy</option>
                  <option>Rainy</option>
                  <option>Overcast</option>
                  <option>Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  value={newReport.notes}
                  onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
                  rows={3}
                  placeholder="General notes for the day..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium"
                >
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-orange-400" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Navigate Up/Down</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">↑ / ↓</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">First / Last</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Home / End</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Expand/Collapse</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Close</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Esc</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Add Report</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">A</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Refresh</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">R</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Export CSV</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">E</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 text-sm">Search</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">F</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 col-span-2">
                  <span className="text-slate-400 text-sm">Show Help</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Shift + ?</kbd>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center pt-2">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
