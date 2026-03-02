/**
 * Task Manager Component - PERFECTED VERSION
 * CinePilot - Professional Dark Theme
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  Clock,
  AlertCircle,
  Calendar,
  User,
  X,
  ChevronDown,
  Check,
  MoreVertical,
  Flag,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface Task {
  id: number | string
  projectId: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt?: string
}

interface TaskManagerProps {
  projectId?: string
}

const DEMO_TASKS: Task[] = [
  { id: 'demo-1', projectId: 'default-project', title: 'Confirm venue for song shoot', description: 'Need to book Studio B for the romantic song sequence', status: 'in_progress', priority: 'high', assignee: 'Line Producer', dueDate: '2026-03-05', createdAt: new Date().toISOString() },
  { id: 'demo-2', projectId: 'default-project', title: 'Get insurance approval', description: 'Production insurance for outdoor shoots including beach and temple locations', status: 'pending', priority: 'medium', assignee: 'Producer', dueDate: '2026-03-10', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-3', projectId: 'default-project', title: 'Finalize cast travel dates', description: 'Coordinate flights for lead actors arriving from Mumbai', status: 'completed', priority: 'high', assignee: 'Assistant Director', dueDate: '2026-02-28', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'demo-4', projectId: 'default-project', title: 'Location permit for temple shoot', description: 'Get special permission from temple authorities', status: 'pending', priority: 'urgent', assignee: 'Location Manager', dueDate: '2026-03-03', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'demo-5', projectId: 'default-project', title: 'Arrange backup generators', description: 'Ensure 50KVA backup for night shoots', status: 'pending', priority: 'low', assignee: 'Electrical Dept', dueDate: '2026-03-15', createdAt: new Date(Date.now() - 129600000).toISOString() },
]

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: ArrowUp },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: Flag },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Flag },
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30', icon: Flag },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
}

export default function TaskManager({ projectId = 'default-project' }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assignee: '',
    dueDate: '',
  })

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      
      if (data && data.length > 0) {
        setTasks(data)
        setIsDemoMode(false)
      } else {
        setTasks(DEMO_TASKS)
        setIsDemoMode(true)
      }
    } catch (err) {
      setTasks(DEMO_TASKS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title: formData.title,
      description: formData.description,
      status: 'pending',
      priority: formData.priority,
      assignee: formData.assignee || undefined,
      dueDate: formData.dueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
    } catch {
      // Continue with local state even if API fails
    }

    setTasks(prev => [...prev, newTask])
    setFormData({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' })
    setShowForm(false)
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed'
    
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    )
    setTasks(updatedTasks)

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // Continue with local state even if API fails
    }
  }

  const handleDelete = async (taskId: string | number) => {
    if (!confirm('Delete this task?')) return
    
    setTasks(prev => prev.filter(t => t.id !== taskId))
    
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    } catch {
      // Continue with local state even if API fails
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee: task.assignee || '',
      dueDate: task.dueDate || '',
    })
    setShowForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask || !formData.title.trim()) return

    const updatedTask = {
      ...editingTask,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignee: formData.assignee || undefined,
      dueDate: formData.dueDate || undefined,
      updatedAt: new Date().toISOString(),
    }

    setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t))
    
    try {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      })
    } catch {
      // Continue with local state even if API fails
    }

    setFormData({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' })
    setEditingTask(null)
    setShowForm(false)
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' })
    setEditingTask(null)
    setShowForm(false)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'completed' && task.status === 'completed') ||
      (filterStatus === 'pending' && task.status !== 'completed')
    return matchesSearch && matchesPriority && matchesStatus
  })

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed')
  const completedTasks = filteredTasks.filter(t => t.status === 'completed')

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return { text: 'Overdue', color: 'text-red-400' }
    if (days === 0) return { text: 'Today', color: 'text-amber-400' }
    if (days === 1) return { text: 'Tomorrow', color: 'text-amber-400' }
    if (days <= 7) return { text: `${days} days`, color: 'text-slate-400' }
    return { text: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'text-slate-500' }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Task Manager
              {isDemoMode && (
                <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  Demo
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-400">{stats.inProgress}</p>
            <p className="text-xs text-slate-500">In Progress</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-slate-500">Done</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-400">{stats.urgent}</p>
            <p className="text-xs text-slate-500">Urgent</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters || filterPriority !== 'all' || filterStatus !== 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="mt-3 flex gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pendingTasks.map((task) => {
              const priority = PRIORITY_CONFIG[task.priority]
              const status = STATUS_CONFIG[task.status]
              const PriorityIcon = priority?.icon || Flag
              const dueInfo = task.dueDate ? formatDate(task.dueDate) : null

              return (
                <div
                  key={task.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${priority?.bg} ${priority?.color} border ${priority?.border}`}>
                          <PriorityIcon className="w-3 h-3 inline mr-1" />
                          {priority?.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${status?.bg} ${status?.color}`}>
                          {status?.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>
                        )}
                        {dueInfo && (
                          <span className={`flex items-center gap-1 ${dueInfo.color}`}>
                            <Calendar className="w-3 h-3" />
                            {dueInfo.text}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <div className="border-t border-slate-800">
                <div className="px-4 py-3 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Completed ({completedTasks.length})
                  </h4>
                </div>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-slate-800/30 transition-colors opacity-60 group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="mt-0.5 w-5 h-5 rounded border-2 bg-emerald-500 border-emerald-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-500 line-through">{task.title}</span>
                      </div>

                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingTask ? handleUpdate : handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Assignee</label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  placeholder="Who's responsible?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
