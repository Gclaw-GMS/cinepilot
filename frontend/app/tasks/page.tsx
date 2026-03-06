'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Trash2,
  Edit2,
  Flag,
  Bell,
  BarChart3,
  PieChart,
  RefreshCw,
  Target,
  TrendingUp,
  CalendarDays,
  ListChecks,
  LayoutGrid,
  Keyboard,
  ChevronDown
} from 'lucide-react'
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; color: string }> = {
  high: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', color: '#ef4444' },
  medium: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', color: '#f59e0b' },
  low: { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-600', color: '#64748b' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; color: string }> = {
  pending: { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-600', color: '#64748b' },
  'in_progress': { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/50', color: '#3b82f6' },
  completed: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/50', color: '#10b981' },
  blocked: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', color: '#ef4444' },
}

interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: string
  priority: string
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt?: string
}

interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  blocked: number
  overdue: number
  highPriority: number
  completionPercent: number
}

type ViewMode = 'list' | 'board' | 'calendar'
type FilterStatus = 'all' | 'overdue' | 'pending' | 'in_progress' | 'completed' | 'blocked'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignee: '',
    dueDate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[Tasks] Fetching tasks...')
      const res = await fetch('/api/tasks?projectId=default-project')
      const data = await res.json()
      console.log('[Tasks] Received data:', data)
      console.log('[Tasks] Setting tasks:', data.data?.length || 0)
      setTasks(data.data || [])
      setIsDemoMode(data.isDemoMode === true)
      console.log('[Tasks] Tasks state updated, length:', (data.data || []).length)
    } catch (err) {
      console.error('[Tasks] Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
      console.log('[Tasks] Loading complete')
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    // Get the current filtered count from DOM
    const taskCards = document.querySelectorAll('[data-task-card]')
    const maxIndex = taskCards.length - 1
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.min(prev + 1, maxIndex))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setSelectedRowIndex(0)
        break
      case 'End':
        e.preventDefault()
        setSelectedRowIndex(maxIndex)
        break
      case 'Escape':
        setSelectedRowIndex(-1)
        break
      case '?':
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
        break
      case 'n':
      case 'N':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setEditingTask(null)
          setFormData({ title: '', description: '', status: 'pending', priority: 'medium', assignee: '', dueDate: '' })
          setShowForm(true)
        }
        break
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement
          searchInput?.focus()
        }
        break
      case 'v':
      case 'V':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault()
          setViewMode(prev => prev === 'list' ? 'board' : prev === 'board' ? 'calendar' : 'list')
        }
        break
    }
  }, [tasks.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Auto-scroll to selected task
  useEffect(() => {
    if (selectedRowIndex >= 0) {
      const taskElements = document.querySelectorAll('[data-task-card]')
      const selectedElement = taskElements[selectedRowIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedRowIndex])

  // Calculate stats
  const stats = useMemo((): TaskStats => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const completed = tasks.filter(t => t.status === 'completed').length
    const total = tasks.length
    
    console.log('[Tasks] Calculating stats from', total, 'tasks')
    
    return {
      total,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed').length,
      highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    return tasks.filter(task => {
      const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'completed'
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'overdue' ? isOverdue : task.status === filterStatus)
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [tasks, filterStatus, filterPriority, searchQuery])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setSubmitting(true)
    try {
      const method = editingTask ? 'PUT' : 'POST'
      const url = editingTask ? `/api/tasks?id=${editingTask.id}` : '/api/tasks'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: 'default-project',
        }),
      })
      
      if (!res.ok) throw new Error('Failed to save task')
      
      const data = await res.json()
      
      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data.data : t))
      } else {
        setTasks(prev => [...prev, data.data])
      }
      
      setShowForm(false)
      setEditingTask(null)
      setFormData({ title: '', description: '', status: 'pending', priority: 'medium', assignee: '', dueDate: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      const data = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? data.data : t))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  // Handle delete
  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  // Handle clear all completed tasks
  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completed')
    if (completedTasks.length === 0) {
      setError('No completed tasks to clear')
      return
    }
    if (!confirm(`Delete ${completedTasks.length} completed task(s)?`)) return
    
    try {
      // Delete each completed task
      await Promise.all(completedTasks.map(task => 
        fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' })
      ))
      setTasks(prev => prev.filter(t => t.status !== 'completed'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear completed tasks')
    }
  }

  // Open edit form
  const openEditForm = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || '',
      dueDate: task.dueDate || '',
    })
    setShowForm(true)
  }

  // Chart data
  const statusChartData = [
    { name: 'Pending', value: stats.pending, color: '#64748b' },
    { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Blocked', value: stats.blocked, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const priorityChartData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#64748b' },
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Task Manager</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">Track production tasks and deadlines</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors"
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-3 h-3" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
            <button
              onClick={() => fetchTasks()}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {stats.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-700/50 rounded-lg text-sm text-slate-400 hover:text-red-400 transition-colors"
                title="Clear completed tasks"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Done</span>
              </button>
            )}
            <button
              onClick={() => { setEditingTask(null); setFormData({ title: '', description: '', status: 'pending', priority: 'medium', assignee: '', dueDate: '' }); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{stats.completionPercent}%</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Overall Progress</h3>
                <p className="text-sm text-slate-400">{stats.completed} of {stats.total} tasks completed</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">{stats.pending} pending</span>
              <span className="text-blue-400">{stats.inProgress} in progress</span>
              {stats.overdue > 0 && <span className="text-red-400">{stats.overdue} overdue</span>}
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} icon={<ListChecks className="w-4 h-4" />} color="indigo" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="slate" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp className="w-4 h-4" />} color="blue" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="w-4 h-4" />} color="emerald" />
          <StatCard label="Overdue" value={stats.overdue} icon={<AlertCircle className="w-4 h-4" />} color="red" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<Flag className="w-4 h-4" />} color="amber" />
        </div>

        {/* Charts */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Status Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Task Status Distribution</h3>
              <div className="h-48 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Priority Breakdown</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="overdue">⚠️ Overdue</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <ListChecks className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Calendar View"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            <span className="text-sm text-slate-500">
              {filteredTasks.length} of {tasks.length} tasks
            </span>
            {selectedRowIndex >= 0 && (
              <span className="text-sm text-indigo-400">
                Row {selectedRowIndex + 1} selected
              </span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4 text-red-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Board View */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['pending', 'in_progress', 'completed', 'blocked'].map(status => {
              const statusTasks = filteredTasks.filter(t => t.status === status)
              const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.pending
              return (
                <div key={status} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className={`p-3 border-b ${statusInfo.bg} ${statusInfo.border} border`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${statusInfo.text} capitalize`}>
                        {status.replace('_', ' ')}
                      </span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                        {statusTasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                    {statusTasks.map((task, index) => (
                      <div
                        key={task.id}
                        data-task-card
                        className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => openEditForm(task)}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed') }}
                            className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                              task.status === 'completed' 
                                ? 'bg-emerald-500 border-emerald-500' 
                                : 'border-slate-500 hover:border-indigo-500'
                            }`}
                          >
                            {task.status === 'completed' && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className={`text-[10px] flex items-center gap-1 ${
                                  getDaysUntilDue(task.dueDate) < 0 && task.status !== 'completed' 
                                    ? 'text-red-400' 
                                    : 'text-slate-500'
                                }`}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Task List */}
        {viewMode === 'list' && (
          loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded border-2 border-slate-700 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-slate-800/50 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-slate-800 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-lg">No tasks found</p>
              <p className="text-slate-500 text-sm mt-1">Create your first task to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={() => openEditForm(task)}
                  onDelete={() => handleDelete(task.id)}
                  formatDate={formatDate}
                  getDaysUntilDue={getDaysUntilDue}
                  isSelected={selectedRowIndex === index}
                />
              ))}
            </div>
          )
        )}

        {/* Calendar View - Simple Month View */}
        {viewMode === 'calendar' && (
          <CalendarView 
            tasks={filteredTasks} 
            onTaskClick={openEditForm}
            formatDate={formatDate}
            getDaysUntilDue={getDaysUntilDue}
          />
        )}

        {/* Task Form Modal */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) { setShowForm(false); setEditingTask(null) }
            }}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-white">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingTask(null) }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="Task title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    placeholder="Task description..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Assignee</label>
                    <input
                      type="text"
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      placeholder="Assign to..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingTask(null) }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.title.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingTask ? 'Update Task' : 'Create Task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Keyboard className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Keyboard Shortcuts
                  </span>
                </h3>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { keys: ['↑', '↓'], desc: 'Navigate tasks', category: 'Navigation' },
                  { keys: ['Home'], desc: 'Go to first task', category: 'Navigation' },
                  { keys: ['End'], desc: 'Go to last task', category: 'Navigation' },
                  { keys: ['Esc'], desc: 'Clear selection', category: 'Navigation' },
                  { keys: ['N'], desc: 'New task', category: 'Actions' },
                  { keys: ['F'], desc: 'Focus search', category: 'Actions' },
                  { keys: ['V'], desc: 'Toggle view mode', category: 'View' },
                  { keys: ['?'], desc: 'Toggle this help', category: 'Help' },
                ].map((shortcut, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wider w-20">
                        {shortcut.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {shortcut.keys.map((key, i) => (
                          <kbd 
                            key={i} 
                            className="px-2.5 py-1.5 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-md text-xs font-mono text-indigo-300 shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                    <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Quick reference for power users</span>
                  <span className="flex items-center gap-2">
                    Press 
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-indigo-400">?</kbd> 
                    anytime to toggle
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete,
  formatDate,
  getDaysUntilDue,
  isSelected
}: { 
  task: Task
  onStatusChange: (id: string, status: string) => void
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  getDaysUntilDue: (date: string) => number
  isSelected?: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.pending
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low
  
  const isOverdue = task.dueDate && getDaysUntilDue(task.dueDate) < 0 && task.status !== 'completed'

  return (
    <div 
      data-task-card 
      className={`bg-slate-900 border rounded-xl p-4 transition-all ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10' 
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Status Checkbox */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.status === 'completed' 
              ? 'bg-emerald-500 border-emerald-500' 
              : 'border-slate-600 hover:border-indigo-500'
          }`}
        >
          {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
            
            {/* Priority Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} border`}>
              {task.priority}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Status */}
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border cursor-pointer`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Assignee */}
            {task.assignee && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <User className="w-3 h-3" />
                {task.assignee}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
                {isOverdue && <AlertCircle className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                <button
                  onClick={() => { onEdit(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple Calendar View Component
function CalendarView({ 
  tasks, 
  onTaskClick,
  formatDate,
  getDaysUntilDue
}: { 
  tasks: Task[]
  onTaskClick: (task: Task) => void
  formatDate: (date: string) => string
  getDaysUntilDue: (date: string) => number
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const getTasksForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.dueDate === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ChevronDown className="w-5 h-5 -rotate-90" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] bg-slate-800/30 rounded" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = getTasksForDay(day)
          const isToday = dateStr === todayStr
          
          return (
            <div 
              key={day}
              className={`min-h-[80px] bg-slate-800/50 rounded p-1 ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                      task.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : task.priority === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-slate-500 text-center">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    slate: 'bg-slate-700/50 border-slate-600 text-slate-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.slate}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50">
          {icon}
        </div>
      </div>
    </div>
  )
}
