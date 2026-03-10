'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  FileText, BarChart3, Download, RefreshCw, Loader2, 
  ChevronRight, TrendingUp, Target, Film, Users, 
  MapPin, DollarSign, Calendar, PieChart, Shield,
  AlertTriangle, CheckCircle, Keyboard, Search
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

interface ReportData {
  production: {
    totalScenes: number
    totalCharacters: number
    totalLocations: number
    shootingDays: number
    budget: number
    spent: number
  }
  schedule: {
    completedDays: number
    totalDays: number
    scenesShot: number
    totalScenes: number
  }
  crew: {
    totalMembers: number
    departments: number
    totalDailyRate: number
  }
  censor: {
    certificate: string
    score: number
    issues: number
  }
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

type ReportTab = 'overview' | 'production' | 'schedule' | 'crew' | 'censor'

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (data.success) {
        setReportData(data.data)
        setIsDemoMode(data.isDemoMode === true)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport() }, [fetchReport])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchReport()
          break
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case '1':
          e.preventDefault()
          setActiveTab('overview')
          break
        case '2':
          e.preventDefault()
          setActiveTab('production')
          break
        case '3':
          e.preventDefault()
          setActiveTab('schedule')
          break
        case '4':
          e.preventDefault()
          setActiveTab('crew')
          break
        case '5':
          e.preventDefault()
          setActiveTab('censor')
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(!showExportMenu)
          break
        case 'g':
          e.preventDefault()
          handleGenerate()
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setSearchQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reportData])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      const data = await res.json()
      if (data.success) {
        setReportData(data.data)
        setIsDemoMode(data.isDemoMode === true)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = (format: 'csv' | 'json' = 'json') => {
    if (!reportData) return
    
    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        report: reportData,
        isDemoMode
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `production-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } else if (format === 'csv') {
      // CSV export with production overview data
      const csvRows = [
        ['Category', 'Metric', 'Value'],
        ['Production', 'Total Scenes', reportData.production.totalScenes.toString()],
        ['Production', 'Total Characters', reportData.production.totalCharacters.toString()],
        ['Production', 'Total Locations', reportData.production.totalLocations.toString()],
        ['Production', 'Shooting Days', reportData.production.shootingDays.toString()],
        ['Production', 'Budget', reportData.production.budget.toString()],
        ['Production', 'Spent', reportData.production.spent.toString()],
        ['Schedule', 'Completed Days', reportData.schedule.completedDays.toString()],
        ['Schedule', 'Total Days', reportData.schedule.totalDays.toString()],
        ['Schedule', 'Scenes Shot', reportData.schedule.scenesShot.toString()],
        ['Schedule', 'Total Scenes', reportData.schedule.totalScenes.toString()],
        ['Crew', 'Total Members', reportData.crew.totalMembers.toString()],
        ['Crew', 'Departments', reportData.crew.departments.toString()],
        ['Crew', 'Total Daily Rate', reportData.crew.totalDailyRate.toString()],
        ['Censor', 'Certificate', reportData.censor.certificate],
        ['Censor', 'Score', reportData.censor.score.toString()],
        ['Censor', 'Issues', reportData.censor.issues.toString()],
      ]
      const csv = csvRows.map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `production-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
    setShowExportMenu(false)
  }

  const budgetData = reportData ? [
    { name: 'Budget', value: reportData.production.budget },
    { name: 'Spent', value: reportData.production.spent },
    { name: 'Remaining', value: reportData.production.budget - reportData.production.spent },
  ] : []

  const scheduleData = reportData ? [
    { name: 'Completed', value: reportData.schedule.completedDays },
    { name: 'Remaining', value: reportData.schedule.totalDays - reportData.schedule.completedDays },
  ] : []

  const scenesData = reportData ? [
    { name: 'Shot', value: reportData.schedule.scenesShot },
    { name: 'Remaining', value: reportData.schedule.totalScenes - reportData.schedule.scenesShot },
  ] : []

  const productionPercentage = reportData ? Math.round((reportData.production.spent / reportData.production.budget) * 100) : 0
  const schedulePercentage = reportData ? Math.round((reportData.schedule.completedDays / reportData.schedule.totalDays) * 100) : 0

  const tabs: { key: ReportTab; label: string; icon: typeof FileText }[] = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'production', label: 'Production', icon: Film },
    { key: 'schedule', label: 'Schedule', icon: Calendar },
    { key: 'crew', label: 'Crew', icon: Users },
    { key: 'censor', label: 'Censor', icon: Shield },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Production Reports</h1>
              {isDemoMode && <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">Demo Data</span>}
            </div>
            <p className="text-gray-500 text-sm mt-1">Comprehensive production analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="search"
              placeholder="Search reports... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!reportData} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>
          <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />}
            {generating ? 'Generating...' : 'Refresh'}
          </button>
          <button onClick={() => setShowKeyboardHelp(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2" title="Keyboard shortcuts (?)">
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key 
                ? 'bg-indigo-500/20 text-indigo-400' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Film className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-gray-500">Production</span>
              </div>
              <p className="text-2xl font-bold text-white">{reportData.production.totalScenes}</p>
              <p className="text-sm text-gray-500">Total Scenes</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-gray-500">Crew</span>
              </div>
              <p className="text-2xl font-bold text-white">{reportData.crew.totalMembers}</p>
              <p className="text-sm text-gray-500">Team Members</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-gray-500">Locations</span>
              </div>
              <p className="text-2xl font-bold text-white">{reportData.production.totalLocations}</p>
              <p className="text-sm text-gray-500">Locations</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-500">Budget</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{(reportData.production.budget / 10000000).toFixed(1)}Cr</p>
              <p className="text-sm text-gray-500">Total Budget</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Budget Utilization</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {budgetData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => `₹${(value / 10000000).toFixed(1)}Cr`}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <div>
                  <p className="text-gray-400">Spent</p>
                  <p className="text-white font-semibold">₹{(reportData.production.spent / 10000000).toFixed(1)}Cr</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">{productionPercentage}%</p>
                  <p className="text-white font-semibold">of budget</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Schedule Progress</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Days', completed: reportData.schedule.completedDays, remaining: reportData.schedule.totalDays - reportData.schedule.completedDays },
                    { name: 'Scenes', completed: reportData.schedule.scenesShot, remaining: reportData.schedule.totalScenes - reportData.schedule.scenesShot },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                    <Bar dataKey="remaining" fill="#374151" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <div>
                  <p className="text-gray-400">Completed</p>
                  <p className="text-white font-semibold">{reportData.schedule.completedDays} days / {reportData.schedule.scenesShot} scenes</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">{schedulePercentage}%</p>
                  <p className="text-white font-semibold">on schedule</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-indigo-400">{reportData.production.totalCharacters}</p>
                <p className="text-sm text-gray-400 mt-1">Characters</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-400">{reportData.crew.departments}</p>
                <p className="text-sm text-gray-400 mt-1">Departments</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">{reportData.censor.certificate}</p>
                <p className="text-sm text-gray-400 mt-1">Censor Rating</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-purple-400">{reportData.censor.score}</p>
                <p className="text-sm text-gray-400 mt-1">Censor Score</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && reportData && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Production Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Scenes</span>
                  <span className="text-white font-semibold">{reportData.production.totalScenes}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Characters</span>
                  <span className="text-white font-semibold">{reportData.production.totalCharacters}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Locations</span>
                  <span className="text-white font-semibold">{reportData.production.totalLocations}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Shooting Days</span>
                  <span className="text-white font-semibold">{reportData.production.shootingDays}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Budget</span>
                  <span className="text-white font-semibold">₹{(reportData.production.budget / 10000000).toFixed(1)}Cr</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Spent</span>
                  <span className="text-emerald-400 font-semibold">₹{(reportData.production.spent / 10000000).toFixed(1)}Cr</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Remaining</span>
                  <span className="text-amber-400 font-semibold">₹{((reportData.production.budget - reportData.production.spent) / 10000000).toFixed(1)}Cr</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Utilization</span>
                  <span className={`font-semibold ${productionPercentage > 80 ? 'text-red-400' : productionPercentage > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{productionPercentage}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Daily Rate</span>
                  <span className="text-white font-semibold">₹{(reportData.crew.totalDailyRate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && reportData && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Schedule Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { day: 1, progress: 5 }, { day: 5, progress: 15 }, { day: 10, progress: 20 },
                  { day: 15, progress: 25 }, { day: 20, progress: 25 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="progress" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-400">{reportData.schedule.completedDays}</p>
                <p className="text-sm text-gray-400">Days Completed</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{reportData.schedule.totalDays - reportData.schedule.completedDays}</p>
                <p className="text-sm text-gray-400">Days Remaining</p>
              </div>
              <div className="text-center p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <p className="text-2xl font-bold text-indigo-400">{reportData.schedule.scenesShot}</p>
                <p className="text-sm text-gray-400">Scenes Shot</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{reportData.schedule.totalScenes - reportData.schedule.scenesShot}</p>
                <p className="text-sm text-gray-400">Scenes Remaining</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crew' && reportData && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Crew Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Users className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{reportData.crew.totalMembers}</p>
                <p className="text-sm text-gray-400 mt-1">Total Crew</p>
              </div>
              <div className="text-center p-6 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <BarChart3 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{reportData.crew.departments}</p>
                <p className="text-sm text-gray-400 mt-1">Departments</p>
              </div>
              <div className="text-center p-6 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <DollarSign className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">₹{(reportData.crew.totalDailyRate / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-400 mt-1">Daily Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'censor' && reportData && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Censor Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{reportData.censor.certificate}</p>
                <p className="text-sm text-gray-400 mt-1">Predicted Certificate</p>
              </div>
              <div className="text-center p-6 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{reportData.censor.score}</p>
                <p className="text-sm text-gray-400 mt-1">Safety Score</p>
              </div>
              <div className="text-center p-6 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{reportData.censor.issues}</p>
                <p className="text-sm text-gray-400 mt-1">Issues Found</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Refresh data</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Focus search</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Toggle export menu</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">E</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Generate report</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">G</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Overview tab</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">1</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Production tab</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">2</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Schedule tab</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">3</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Crew tab</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">4</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Censor tab</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">5</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Show shortcuts</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">?</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-gray-300">Close modal</span>
                <kbd className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono">Esc</kbd>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
