'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Target, Calendar, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Plus, RefreshCw, Loader2, GripVertical,
  MoreHorizontal, Edit2, Trash2, BarChart3
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Demo data fallback - used when API fails
  const DEMO_PROGRESS: Progress = {
    overall: 42,
    phases: [
      { name: 'pre_production', displayName: 'Pre-Production', status: 'in_progress', progress: 75, order: 0 },
      { name: 'production', displayName: 'Production', status: 'pending', progress: 15, order: 1 },
      { name: 'post_production', displayName: 'Post-Production', status: 'pending', progress: 0, order: 2 },
    ],
    milestones: [
      { id: '1', name: 'Script Lock', date: '2026-01-15', status: 'completed', tasks: 3 },
      { id: '2', name: 'Casting Complete', date: '2026-02-20', status: 'in_progress', tasks: 3 },
      { id: '3', name: 'Location Scouting', date: '2026-03-15', status: 'in_progress', tasks: 2 },
      { id: '4', name: 'Pre-Production Complete', date: '2026-04-01', status: 'pending', tasks: 3 },
      { id: '5', name: 'Principal Photography', date: '2026-05-01', status: 'pending', tasks: 0 },
      { id: '6', name: 'First Cut', date: '2026-07-15', status: 'pending', tasks: 0 },
      { id: '7', name: 'Final Delivery', date: '2026-09-01', status: 'pending', tasks: 0 },
    ],
    tasks: [
      { id: 't1', name: 'Script Analysis', description: 'Initial script review and breakdown', status: 'completed', progress: 100, priority: 'critical', dueDate: '2026-01-10' },
      { id: 't2', name: 'Script Revisions', description: 'Incorporate feedback', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-15' },
      { id: 't3', name: 'Character Breakdown', description: 'Detailed character analysis', status: 'completed', progress: 100, priority: 'high', dueDate: '2026-01-20' },
      { id: 't4', name: 'Location Shortlist', description: 'Create list of potential locations', status: 'in_progress', progress: 75, priority: 'high', dueDate: '2026-03-10' },
      { id: 't5', name: 'Casting Calls', description: 'Post casting calls and auditions', status: 'in_progress', progress: 50, priority: 'critical', dueDate: '2026-02-15' },
      { id: 't6', name: 'Auditions', description: 'Conduct actor auditions', status: 'in_progress', progress: 30, priority: 'critical', dueDate: '2026-02-20' },
      { id: 't7', name: 'Permits Application', description: 'Film permits for locations', status: 'in_progress', progress: 20, priority: 'high', dueDate: '2026-03-25' },
      { id: 't8', name: 'Equipment Booking', description: 'Reserve cameras, lights, grip', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-04-01' },
      { id: 't9', name: 'Crew Hiring', description: 'Hire key crew members', status: 'pending', progress: 0, priority: 'high', dueDate: '2026-04-05' },
      { id: 't10', name: 'Shot List Creation', description: 'Detailed shot list for production', status: 'pending', progress: 0, priority: 'medium', dueDate: '2026-04-10' },
    ],
    upcoming_deadlines: [
      { task: 'Casting Calls', date: '2026-02-15', days_left: 14 },
      { task: 'Auditions', date: '2026-02-20', days_left: 19 },
      { task: 'Location Shortlist', date: '2026-03-10', days_left: 37 },
      { task: 'Permits Application', date: '2026-03-25', days_left: 52 },
    ],
  }

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/progress')
      const data = await res.json()
      
      // Detect demo mode from API response
      setIsDemoMode(!!data.isDemoMode)
      
      // Use API data if available (includes demo data on error)
      if (data && data.phases && data.phases.length > 0) {
        setProgress(data)
      } else {
        // Fallback to local demo data
        setProgress(DEMO_PROGRESS)
        setIsDemoMode(true)
      }
    } catch (err) {
      console.error('Progress fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress')
      // Use demo data as fallback
      setProgress(DEMO_PROGRESS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress, refreshKey])

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
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['timeline', 'tasks', 'kanban'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-cyan-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'timeline' ? '📅' : mode === 'tasks' ? '✅' : '📋'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {isDemoMode && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Demo Data
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Quick Stats Cards */}
      {hasData && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Total Tasks</p>
                <p className="text-2xl font-bold text-white mt-1">{progress?.tasks?.length || 0}</p>
              </div>
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Completed</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {progress?.tasks?.filter(t => t.status === 'completed').length || 0}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">In Progress</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {progress?.tasks?.filter(t => t.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Milestones</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{progress?.milestones?.length || 0}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
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

          {/* Phase Progress Bar Chart */}
          {progress?.phases && progress.phases.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Phase Progress Comparison
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progress.phases} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="displayName" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Bar dataKey="progress" name="Progress %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Task Status Breakdown */}
          {progress?.tasks && progress.tasks.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Task Status Breakdown
              </h2>
              <div className="flex items-center gap-8">
                {/* Pie Chart */}
                <div className="w-40 h-40">
                  {(() => {
                    const statusCounts = {
                      completed: progress.tasks.filter(t => t.status === 'completed').length,
                      in_progress: progress.tasks.filter(t => t.status === 'in_progress').length,
                      pending: progress.tasks.filter(t => t.status === 'pending').length,
                      blocked: progress.tasks.filter(t => t.status === 'blocked').length,
                    }
                    const pieData = [
                      { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
                      { name: 'In Progress', value: statusCounts.in_progress, color: '#3b82f6' },
                      { name: 'Pending', value: statusCounts.pending, color: '#64748b' },
                      { name: 'Blocked', value: statusCounts.blocked, color: '#ef4444' },
                    ].filter(d => d.value > 0)
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )
                  })()}
                </div>
                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Completed', count: progress.tasks.filter(t => t.status === 'completed').length, color: 'bg-emerald-500', text: 'text-emerald-400' },
                    { label: 'In Progress', count: progress.tasks.filter(t => t.status === 'in_progress').length, color: 'bg-blue-500', text: 'text-blue-400' },
                    { label: 'Pending', count: progress.tasks.filter(t => t.status === 'pending').length, color: 'bg-slate-500', text: 'text-slate-400' },
                    { label: 'Blocked', count: progress.tasks.filter(t => t.status === 'blocked').length, color: 'bg-red-500', text: 'text-red-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-400">{item.label}</span>
                      <span className={`text-sm font-medium ${item.text}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Priority Distribution */}
          {progress?.tasks && progress.tasks.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Priority Distribution
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Critical', count: progress.tasks.filter(t => t.priority === 'critical').length, color: 'bg-red-500', text: 'text-red-400', bar: 'bg-red-500' },
                  { label: 'High', count: progress.tasks.filter(t => t.priority === 'high').length, color: 'bg-orange-500', text: 'text-orange-400', bar: 'bg-orange-500' },
                  { label: 'Medium', count: progress.tasks.filter(t => t.priority === 'medium').length, color: 'bg-yellow-500', text: 'text-yellow-400', bar: 'bg-yellow-500' },
                  { label: 'Low', count: progress.tasks.filter(t => t.priority === 'low').length, color: 'bg-slate-500', text: 'text-slate-400', bar: 'bg-slate-500' },
                ].map((item) => {
                  const percentage = progress.tasks.length > 0 ? Math.round((item.count / progress.tasks.length) * 100) : 0
                  return (
                    <div key={item.label} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                        <span className={`text-lg font-bold ${item.text}`}>{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.bar} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{percentage}% of tasks</div>
                    </div>
                  )
                })}
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
                {progress?.milestones?.map((milestone, i) => {
                  const statusColors = getStatusColor(milestone.status)
                  return (
                    <div key={milestone.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in_progress' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`} />
                        {i < (progress.milestones?.length || 0) - 1 && (
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
                {(!progress?.milestones || progress.milestones.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    No milestones yet. Initialize progress tracking to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Milestone Progress */}
          {viewMode === 'timeline' && progress?.milestones && progress.milestones.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Milestone Progress Details
              </h2>
              <div className="space-y-4">
                {progress.milestones.map((milestone) => {
                  const statusColors = getStatusColor(milestone.status)
                  const progressValue = milestone.status === 'completed' ? 100 : milestone.status === 'in_progress' ? 50 : 0
                  return (
                    <div key={milestone.id} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'in_progress' ? 'bg-cyan-500' : 'bg-slate-500'}`} />
                          <span className="font-medium">{milestone.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{milestone.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              milestone.status === 'completed' ? 'bg-green-500' : 
                              milestone.status === 'in_progress' ? 'bg-cyan-500' : 'bg-slate-500'
                            }`}
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-12">{milestone.tasks} tasks</span>
                      </div>
                    </div>
                  )
                })}
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
                  {progress?.tasks?.map((task) => {
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
                  {(!progress?.tasks || progress.tasks.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      No tasks yet. Initialize progress tracking to get started.
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
                const statusTasks = progress?.tasks?.filter(t => t.status === status) || []
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
