'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Target, Calendar, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Plus, RefreshCw, Loader2, GripVertical,
  MoreHorizontal, Edit2, Trash2, BarChart3, PieChart as PieChartIcon,
  TrendingUp, Activity, Search, X, Keyboard
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface Milestone {
  id: string
  name: string
  date: string
  status: 'completed' | 'in_progress' | 'pending' | 'delayed'
  tasks: number
}

interface Task {
  id: string
  name: string
  description?: string
  status: 'completed' | 'in_progress' | 'pending' | 'blocked'
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  milestoneId?: string
}

interface Phase {
  name: string
  displayName: string
  status: string
  progress: number
  order: number
}

interface Progress {
  overall: number
  phases: Phase[]
  milestones: Milestone[]
  tasks: Task[]
  upcoming_deadlines: { task: string; date: string; days_left: number }[]
}

const PHASE_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  pre_production: { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  production: { bg: 'bg-orange-500/20', text: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  post_production: { bg: 'bg-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
}

const CHART_COLORS = {
  completed: '#10b981',
  in_progress: '#3b82f6',
  pending: '#64748b',
  blocked: '#ef4444',
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#64748b',
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-500/20'
    case 'high': return 'text-orange-400 bg-orange-500/20'
    case 'medium': return 'text-yellow-400 bg-yellow-500/20'
    default: return 'text-slate-400 bg-slate-500/20'
  }
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'completed': return { bg: 'bg-green-500/20', text: 'text-green-400' }
    case 'in_progress': return { bg: 'bg-blue-500/20', text: 'text-blue-400' }
    case 'pending': return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'delayed': return { bg: 'bg-red-500/20', text: 'text-red-400' }
    case 'blocked': return { bg: 'bg-red-500/20', text: 'text-red-400' }
    default: return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'tasks'>('timeline')
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/progress')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch progress')
      }
      const data = await res.json()
      setProgress(data)
    } catch (err) {
      console.error('Progress fetch error:', err)
      // Use comprehensive demo data when API fails
      const today = new Date();
      const demoProgress: Progress = {
        overall: 45,
        phases: [
          { name: 'pre_production', displayName: 'Pre-Production', status: 'completed', progress: 100, order: 0 },
          { name: 'production', displayName: 'Production', status: 'in_progress', progress: 35, order: 1 },
          { name: 'post_production', displayName: 'Post-Production', status: 'pending', progress: 0, order: 2 },
        ],
        milestones: [
          { id: '1', name: 'Script Finalization', date: '2024-01-15', status: 'completed', tasks: 12 },
          { id: '2', name: 'Casting Complete', date: '2024-02-01', status: 'completed', tasks: 8 },
          { id: '3', name: 'Principal Photography Start', date: '2024-02-15', status: 'completed', tasks: 15 },
          { id: '4', name: 'First Schedule Wrap', date: '2024-03-15', status: 'in_progress', tasks: 20 },
          { id: '5', name: 'Director\'s Cut', date: '2024-04-30', status: 'pending', tasks: 10 },
          { id: '6', name: 'Final Delivery', date: '2024-06-15', status: 'pending', tasks: 25 },
        ],
        tasks: [
          { id: '1', name: 'Location Scouting - Chennai', description: 'Find outdoor locations for song sequences', status: 'completed', progress: 100, priority: 'high', dueDate: '2024-01-20' },
          { id: '2', name: 'Equipment Rental', description: 'Book ARRI Alexa Mini, lenses, grip equipment', status: 'completed', progress: 100, priority: 'critical', dueDate: '2024-02-01' },
          { id: '3', name: 'Permit Applications', description: 'Apply for shoot permits with TN Film Corporation', status: 'completed', progress: 100, priority: 'high', dueDate: '2024-02-10' },
          { id: '4', name: 'Art Department Setup', description: 'Set construction and prop procurement', status: 'in_progress', progress: 75, priority: 'high', dueDate: '2024-02-20' },
          { id: '5', name: 'Rehearsals - Lead Actors', description: '3-day rehearsal schedule with protagonists', status: 'in_progress', progress: 60, priority: 'medium', dueDate: '2024-02-25' },
          { id: '6', name: 'Day 1 Shoot - Factory Sequence', description: 'Major action sequence with 200 extras', status: 'in_progress', progress: 40, priority: 'critical', dueDate: '2024-02-15' },
          { id: '7', name: 'Song Recording', description: 'Schedule studio time for bgm and songs', status: 'pending', progress: 0, priority: 'medium', dueDate: '2024-03-01' },
          { id: '8', name: 'VFX Pre-visualization', description: 'Work with VFX team on wirework and CGI shots', status: 'pending', progress: 0, priority: 'high', dueDate: '2024-03-15' },
          { id: '9', name: 'Post-Production Sound Design', description: 'Book audio studio for mixing', status: 'pending', progress: 0, priority: 'medium', dueDate: '2024-05-01' },
          { id: '10', name: 'Music Release', description: 'Coordinate with music label for release', status: 'blocked', progress: 0, priority: 'high', dueDate: '2024-04-15' },
        ],
        upcoming_deadlines: [
          { task: 'Day 1 Shoot - Factory Sequence', date: '2024-02-15', days_left: 3 },
          { task: 'Art Department Setup', date: '2024-02-20', days_left: 8 },
          { task: 'Rehearsals - Lead Actors', date: '2024-02-25', days_left: 13 },
          { task: 'Song Recording', date: '2024-03-01', days_left: 18 },
        ],
      };
      setProgress(demoProgress);
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress, refreshKey])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          setIsRefreshing(true)
          setRefreshKey(k => k + 1)
          setTimeout(() => setIsRefreshing(false), 1000)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          setViewMode('timeline')
          break
        case '2':
          e.preventDefault()
          setViewMode('tasks')
          break
        case '3':
          e.preventDefault()
          setViewMode('kanban')
          break
        case '?':
          e.preventDefault()
          setShowHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowHelp(false)
          setSearchQuery('')
          searchInputRef.current?.blur()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Compute chart data from progress
  const chartData = useMemo(() => {
    if (!progress) return null
    
    // Task status distribution
    const taskStatus = [
      { name: 'Completed', value: progress.tasks?.filter(t => t.status === 'completed').length || 0, color: CHART_COLORS.completed },
      { name: 'In Progress', value: progress.tasks?.filter(t => t.status === 'in_progress').length || 0, color: CHART_COLORS.in_progress },
      { name: 'Pending', value: progress.tasks?.filter(t => t.status === 'pending').length || 0, color: CHART_COLORS.pending },
      { name: 'Blocked', value: progress.tasks?.filter(t => t.status === 'blocked').length || 0, color: CHART_COLORS.blocked },
    ].filter(d => d.value > 0)

    // Priority distribution
    const priorityDist = [
      { name: 'Critical', value: progress.tasks?.filter(t => t.priority === 'critical').length || 0, color: CHART_COLORS.critical },
      { name: 'High', value: progress.tasks?.filter(t => t.priority === 'high').length || 0, color: CHART_COLORS.high },
      { name: 'Medium', value: progress.tasks?.filter(t => t.priority === 'medium').length || 0, color: CHART_COLORS.medium },
      { name: 'Low', value: progress.tasks?.filter(t => t.priority === 'low').length || 0, color: CHART_COLORS.low },
    ].filter(d => d.value > 0)

    // Milestone progress data
    const milestoneProgress = progress.milestones?.map(m => ({
      name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
      tasks: m.tasks,
      status: m.status,
    })) || []

    // Phase progress data
    const phaseProgress = progress.phases?.map(p => ({
      name: p.displayName,
      progress: p.progress,
      status: p.status,
    })) || []

    return { taskStatus, priorityDist, milestoneProgress, phaseProgress }
  }, [progress])

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!progress?.tasks || !searchQuery) return progress?.tasks || []
    const query = searchQuery.toLowerCase()
    return progress.tasks.filter(task => 
      task.name.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query) ||
      task.priority.toLowerCase().includes(query)
    )
  }, [progress?.tasks, searchQuery])

  // Filter milestones based on search query
  const filteredMilestones = useMemo(() => {
    if (!progress?.milestones || !searchQuery) return progress?.milestones || []
    const query = searchQuery.toLowerCase()
    return progress.milestones.filter(milestone => 
      milestone.name.toLowerCase().includes(query) ||
      milestone.status.toLowerCase().includes(query)
    )
  }, [progress?.milestones, searchQuery])

  const handleInitialize = async () => {
    setInitializing(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      })
      if (!res.ok) throw new Error('Failed to initialize')
      await fetchProgress()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed')
    } finally {
      setInitializing(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateTask', taskId, ...updates }),
      })
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error('Task update failed:', err)
    }
  }

  const handleMilestoneUpdate = async (milestoneId: string, updates: Partial<Milestone>) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateMilestone', milestoneId, ...updates }),
      })
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error('Milestone update failed:', err)
    }
  }

  const activePhase = progress?.phases?.find(p => p.status === 'active') || progress?.phases?.[0]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-400">Loading production progress...</p>
        </div>
      </div>
    )
  }

  const hasData = progress && (progress.milestones?.length > 0 || progress.tasks?.length > 0)

  return (
    <div className="p-6 min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            Production Progress
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your film's production milestones and tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 transition-all focus:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['timeline', 'tasks', 'kanban'] as const).map((mode, idx) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-cyan-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {idx + 1} {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsRefreshing(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: 'R', action: 'Refresh data' },
                { key: '/', action: 'Focus search' },
                { key: '1', action: 'Timeline view' },
                { key: '2', action: 'Tasks view' },
                { key: '3', action: 'Kanban view' },
                { key: '?', action: 'Show shortcuts' },
                { key: 'Esc', action: 'Close modal / Clear search' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 px-3 hover:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm font-mono text-cyan-400">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Initialize Prompt */}
      {!hasData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6 text-center">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Set Up Production Tracking</h2>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">
            Initialize your production tracking with default milestones and tasks tailored for film production.
          </p>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {initializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Initialize Progress Tracking
              </>
            )}
          </button>
        </div>
      )}

      {/* Overall Progress */}
      {hasData && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Overall Progress</h2>
                <p className="text-sm text-slate-400">
                  {activePhase ? `${activePhase.displayName} phase` : 'No active phase'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-cyan-400">{progress?.overall || 0}%</div>
                <div className="text-sm text-slate-500">complete</div>
              </div>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${progress?.overall || 0}%` }}
              />
            </div>
            {/* Phase Indicators */}
            <div className="flex justify-between mt-4">
              {progress?.phases?.map((phase) => {
                const colors = PHASE_COLORS[phase.name] || PHASE_COLORS.pre_production
                return (
                  <div key={phase.name} className="flex-1 text-center">
                    <div className="text-xs text-slate-500 uppercase mb-1">{phase.displayName}</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {phase.progress}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Analytics Charts Row */}
          {chartData && chartData.taskStatus.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Task Status Pie Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-cyan-400" />
                  Task Status Distribution
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.taskStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.taskStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} tasks`, '']}
                      />
                      <Legend 
                        formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Distribution Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Priority Breakdown
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.priorityDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={60} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} tasks`, '']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.priorityDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Phase Progress Area Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Phase Progress
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.phaseProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}%`, 'Progress']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Row */}
          {hasData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 uppercase">Total Tasks</span>
                </div>
                <p className="text-2xl font-semibold text-white">{progress?.tasks?.length || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400 uppercase">Completed</span>
                </div>
                <p className="text-2xl font-semibold text-green-400">{progress?.tasks?.filter(t => t.status === 'completed').length || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase">In Progress</span>
                </div>
                <p className="text-2xl font-semibold text-blue-400">{progress?.tasks?.filter(t => t.status === 'in_progress').length || 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400 uppercase">Blocked</span>
                </div>
                <p className="text-2xl font-semibold text-red-400">{progress?.tasks?.filter(t => t.status === 'blocked').length || 0}</p>
              </div>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Milestone Timeline
              </h2>
              <div className="space-y-0">
                {filteredMilestones?.map((milestone, i) => {
                  const statusColors = getStatusColor(milestone.status)
                  return (
                    <div key={milestone.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in_progress' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`} />
                        {i < (filteredMilestones?.length || 0) - 1 && (
                          <div className="w-0.5 h-16 bg-slate-700 mt-1" />
                        )}
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500 font-mono">{milestone.date}</div>
                          <div className="font-medium">{milestone.name}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">{milestone.tasks} tasks</div>
                      </div>
                    </div>
                  )
                })}
                {(!filteredMilestones || filteredMilestones.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    {searchQuery ? 'No milestones match your search.' : 'No milestones yet. Initialize progress tracking to get started.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks View */}
          {viewMode === 'tasks' && (
            <div className="space-y-4">
              {/* Upcoming Deadlines */}
              {progress?.upcoming_deadlines && progress.upcoming_deadlines.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Upcoming Deadlines
                  </h2>
                  <div className="space-y-3">
                    {progress.upcoming_deadlines.map((deadline, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-4 h-4 ${deadline.days_left <= 7 ? 'text-red-400' : 'text-amber-400'}`} />
                          <span>{deadline.task}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{deadline.date}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            deadline.days_left <= 7 ? 'bg-red-500/20 text-red-400' :
                            deadline.days_left <= 14 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {deadline.days_left} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  All Tasks
                </h2>
                <div className="space-y-2">
                  {filteredTasks?.map((task) => {
                    const statusColors = getStatusColor(task.status)
                    const priorityColor = getPriorityColor(task.priority)
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <button className="text-slate-600 hover:text-slate-400">
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTaskUpdate(task.id, { 
                            status: task.status === 'completed' ? 'pending' : 'completed',
                            progress: task.status === 'completed' ? 0 : 100 
                          })}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === 'completed'
                              ? 'border-green-500 bg-green-500 text-black'
                              : 'border-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : ''}`}>
                            {task.name}
                          </div>
                          {task.description && (
                            <div className="text-sm text-slate-500 truncate">{task.description}</div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-slate-500">{task.dueDate}</span>
                        )}
                        <div className="w-24">
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {(!filteredTasks || filteredTasks.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      {searchQuery ? 'No tasks match your search.' : 'No tasks yet. Initialize progress tracking to get started.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-4 gap-4">
              {['pending', 'in_progress', 'completed', 'blocked'].map((status) => {
                const statusTasks = filteredTasks?.filter(t => t.status === status) || []
                const statusColors = getStatusColor(status)
                return (
                  <div key={status} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium capitalize">{status.replace('_', ' ')}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                        {statusTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {statusTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="font-medium text-sm">{task.name}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-slate-500">{task.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
