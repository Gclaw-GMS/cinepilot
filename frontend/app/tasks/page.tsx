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
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Printer,
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

type ViewMode = 'list' | 'board' | 'calendar' | 'conflicts'
type FilterStatus = 'all' | 'overdue' | 'pending' | 'in_progress' | 'completed' | 'blocked'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

// Task templates for quick creation
const TASK_TEMPLATES = [
  { 
    category: 'Production', 
    tasks: [
      { title: 'Confirm location permits', description: 'Get final approval from municipal office', priority: 'high', status: 'pending' },
      { title: 'Equipment rental confirmation', description: 'Confirm camera and lighting equipment', priority: 'medium', status: 'pending' },
      { title: 'Cast travel bookings', description: 'Book flights and accommodation for cast', priority: 'medium', status: 'pending' },
      { title: 'Catering arrangements', description: 'Confirm meals for crew members', priority: 'low', status: 'pending' },
      { title: 'Insurance certificates', description: 'Get all insurance docs ready', priority: 'medium', status: 'pending' },
    ]
  },
  { 
    category: 'Creative', 
    tasks: [
      { title: 'Finalize shot list', description: 'Complete detailed shot list with angles', priority: 'high', status: 'pending' },
      { title: 'Storyboard review', description: 'Review final storyboards with director', priority: 'high', status: 'pending' },
      { title: 'VFX brief preparation', description: 'Create detailed brief for VFX shots', priority: 'high', status: 'pending' },
      { title: 'Script lock confirmation', description: 'Get final sign-off on script', priority: 'medium', status: 'pending' },
    ]
  },
  { 
    category: 'Logistics', 
    tasks: [
      { title: 'Transport scheduling', description: 'Arrange vehicles for crew and equipment', priority: 'medium', status: 'pending' },
      { title: 'Parking permits', description: 'Secure parking for production vehicles', priority: 'low', status: 'pending' },
      { title: 'Security deployment', description: 'Coordinate security for shoot locations', priority: 'medium', status: 'pending' },
      { title: 'Emergency contacts list', description: 'Prepare emergency contact directory', priority: 'low', status: 'pending' },
    ]
  },
  { 
    category: 'Post-Production', 
    tasks: [
      { title: 'Editor onboarding', description: 'Brief editor on project requirements', priority: 'medium', status: 'pending' },
      { title: 'VFX pipeline setup', description: 'Establish workflow for VFX deliverables', priority: 'high', status: 'pending' },
      { title: 'Music composer brief', description: 'Share reference tracks and timeline', priority: 'medium', status: 'pending' },
      { title: 'Color grading workflow', description: 'Set up color pipeline and looks', priority: 'low', status: 'pending' },
    ]
  },
]

// Demo data fallback for when database is not connected
const DEMO_TASKS: Task[] = [
  { id: 'demo-1', projectId: 'default-project', title: 'Finalize shot list for Day 1', description: 'Complete the detailed shot list with camera angles and lens specifications', status: 'completed', priority: 'high', assignee: 'Director', dueDate: '2026-03-12', createdAt: '2026-03-01' },
  { id: 'demo-2', projectId: 'default-project', title: 'Confirm location permits', description: 'Get final approval from municipal office for temple shooting', status: 'in_progress', priority: 'high', assignee: 'Production Manager', dueDate: '2026-03-15', createdAt: '2026-03-01' },
  { id: 'demo-3', projectId: 'default-project', title: 'Equipment rental confirmation', description: 'Confirm ARRI Alexa Mini LF and Angenieux lenses', status: 'completed', priority: 'medium', assignee: 'Unit Production Manager', dueDate: '2026-03-10', createdAt: '2026-02-28' },
  { id: 'demo-4', projectId: 'default-project', title: 'Cast travel bookings', description: 'Book flights for lead actors arriving from Mumbai', status: 'in_progress', priority: 'medium', assignee: 'Line Producer', dueDate: '2026-03-16', createdAt: '2026-03-02' },
  { id: 'demo-5', projectId: 'default-project', title: 'Catering menu finalization', description: 'Confirm diet-specific meals for 80 crew members', status: 'pending', priority: 'low', assignee: 'Unit Production Manager', dueDate: '2026-03-18', createdAt: '2026-03-01' },
  { id: 'demo-6', projectId: 'default-project', title: 'VFX brief preparation', description: 'Create detailed brief for 12 VFX shots', status: 'blocked', priority: 'high', assignee: 'VFX Supervisor', dueDate: '2026-03-11', createdAt: '2026-03-01' },
  { id: 'demo-7', projectId: 'default-project', title: 'Insurance certificates', description: 'Get all insurance docs ready for shoot days', status: 'completed', priority: 'medium', assignee: 'Production Coordinator', dueDate: '2026-03-08', createdAt: '2026-02-27' },
  { id: 'demo-8', projectId: 'default-project', title: 'Storyboard review meeting', description: 'Review final storyboards with director and DP', status: 'blocked', priority: 'high', assignee: 'Storyboard Artist', dueDate: '2026-03-11', createdAt: '2026-03-01' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // Task conflicts detection
  const [taskConflicts, setTaskConflicts] = useState<{id: string; type: string; severity: 'high' | 'medium' | 'low'; taskId: string; title: string; description: string; recommendation: string}[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'title' | 'assignee' | 'createdAt'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds
  
  // Filter panel ref for click outside
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Calculate active filter count (includes search, sort, and filter state)
  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0) + (sortBy !== 'dueDate' || sortOrder !== 'asc' ? 1 : 0)
  
  // Active filter count ref for keyboard shortcuts
  const activeFilterCountRef = useRef(activeFilterCount)
  useEffect(() => { activeFilterCountRef.current = activeFilterCount }, [activeFilterCount])
  
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
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
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  
  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const bulkActionsRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Ref for filtered tasks (used in keyboard handler to avoid dependency issues)
  const filteredTasksRef = useRef<Task[]>([])
  const showFiltersRef = useRef(showFilters)
  const filterStatusRef = useRef(filterStatus)
  const filterPriorityRef = useRef(filterPriority)
  const viewModeRef = useRef(viewMode)

  // Keep refs in sync with state
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    filterStatusRef.current = filterStatus
  }, [filterStatus])

  useEffect(() => {
    filterPriorityRef.current = filterPriority
  }, [filterPriority])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])
  const sortOrderRef = useRef(sortOrder)
  const selectedTasksSizeRef = useRef(selectedTasks.size)
  const sortByRef = useRef(sortBy)
  
  // Auto-refresh refs
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)

  // Keep auto-refresh refs in sync
  useEffect(() => { autoRefreshRef.current = autoRefresh }, [autoRefresh])
  useEffect(() => { autoRefreshIntervalRef.current = autoRefreshInterval }, [autoRefreshInterval])

  // Clear all filters function
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterPriority('all')
    setSortBy('dueDate')
    setSortOrder('asc')
  }, [])

  // Clear filters ref for keyboard shortcuts
  const clearFiltersRef = useRef(clearFilters)
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])
  useEffect(() => { sortByRef.current = sortBy }, [sortBy])
  useEffect(() => { sortOrderRef.current = sortOrder }, [sortOrder])
  useEffect(() => { selectedTasksSizeRef.current = selectedTasks.size }, [selectedTasks])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[Tasks] Fetching tasks...')
      const res = await fetch('/api/tasks?projectId=default-project')
      const data = await res.json()
      console.log('[Tasks] Received data:', data)
      
      // Use demo data if API returns empty or error
      if (!data.data || data.data.length === 0) {
        console.log('[Tasks] No data from API, using demo data')
        setTasks(DEMO_TASKS)
        setIsDemoMode(true)
      } else {
        console.log('[Tasks] Setting tasks:', data.data.length)
        setTasks(data.data)
        setIsDemoMode(data.isDemoMode === true)
      }
      console.log('[Tasks] Tasks state updated')
    } catch (err) {
      console.error('[Tasks] Error fetching tasks:', err)
      // Fall back to demo data on error
      console.log('[Tasks] Using demo data due to error')
      setTasks(DEMO_TASKS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
      console.log('[Tasks] Loading complete')
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchTasks()
    }, autoRefreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, fetchTasks])

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
        setShowExportMenu(false)
        setShowFilters(false)
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
          setShowFilters(!showFilters)
        }
        break
      case '/':
        e.preventDefault()
        searchInputRef.current?.focus()
        break
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        }
        break
      case '/':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          const searchInput = document.querySelector('input[placeholder="Search tasks... (F)"]') as HTMLInputElement
          searchInput?.focus()
        }
        break
      case 'v':
      case 'V':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault()
          setViewMode(prev => prev === 'list' ? 'board' : prev === 'board' ? 'calendar' : prev === 'calendar' ? 'conflicts' : 'list')
        }
        break
      case 'x':
      case 'X':
        if (!e.ctrlKey && !e.metaKey && showFiltersRef.current && activeFilterCountRef.current > 0) {
          e.preventDefault()
          clearFiltersRef.current()
        }
        break
      // Context-aware number keys: behave differently based on filter panel state
      case '1':
        e.preventDefault()
        if (!showFiltersRef.current) {
          // When filters closed: switch to List view
          setViewMode('list')
        } else {
          // When filters open: filter by All Status (toggle)
          setFilterStatus(prev => prev === 'all' ? 'all' : 'all')
        }
        break
      case '2':
        e.preventDefault()
        if (!showFiltersRef.current) {
          // When filters closed: switch to Board view
          setViewMode('board')
        } else {
          // When filters open: filter by Overdue (toggle)
          setFilterStatus(prev => prev === 'overdue' ? 'all' : 'overdue')
        }
        break
      case '3':
        e.preventDefault()
        if (!showFiltersRef.current) {
          // When filters closed: switch to Calendar view
          setViewMode('calendar')
        } else {
          // When filters open: filter by Pending (toggle)
          setFilterStatus(prev => prev === 'pending' ? 'all' : 'pending')
        }
        break
      case '4':
        e.preventDefault()
        if (!showFiltersRef.current) {
          // When filters closed: switch to Conflicts view
          setViewMode('conflicts')
        } else {
          // When filters open: filter by In Progress (toggle)
          setFilterStatus(prev => prev === 'in_progress' ? 'all' : 'in_progress')
        }
        break
      case '5':
        if (showFiltersRef.current) {
          e.preventDefault()
          // When filters open: filter by Completed (toggle)
          setFilterStatus(prev => prev === 'completed' ? 'all' : 'completed')
        }
        break
      case '6':
        if (showFiltersRef.current) {
          e.preventDefault()
          // When filters open: filter by Blocked (toggle)
          setFilterStatus(prev => prev === 'blocked' ? 'all' : 'blocked')
        }
        break
      case '7':
        if (showFiltersRef.current) {
          e.preventDefault()
          // Clear all filters
          setFilterStatus('all')
          setFilterPriority('all')
        }
        break
      // Priority filtering with Shift (when filters panel is open)
      case '8':
        if (e.shiftKey && showFiltersRef.current) {
          e.preventDefault()
          // Filter by High priority (toggle)
          setFilterPriority(prev => prev === 'high' ? 'all' : 'high')
        } else if (showFiltersRef.current) {
          e.preventDefault()
          // Filter by Low priority (toggle)
          setFilterPriority(prev => prev === 'low' ? 'all' : 'low')
        }
        break
      case '9':
        if (e.shiftKey && showFiltersRef.current) {
          e.preventDefault()
          // Filter by Medium priority (toggle)
          setFilterPriority(prev => prev === 'medium' ? 'all' : 'medium')
        }
        break
      case '0':
        if (showFiltersRef.current) {
          e.preventDefault()
          // Clear status filter
          setFilterStatus('all')
        } else if (e.shiftKey && showFiltersRef.current) {
          // Shift+0 clears priority filter
          e.preventDefault()
          setFilterPriority('all')
        }
        break
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setShowExportMenu(prev => !prev)
        }
        break
      case 'm':
      case 'M':
        e.preventDefault()
        if (filteredTasksRef.current.length > 0) {
          handleExportMarkdownRef.current?.()
        }
        break
      case 'p':
      case 'P':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
        }
        break
      // Bulk selection shortcuts
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          // Select all visible tasks
          const allIds = new Set(filteredTasksRef.current.map(t => t.id))
          setSelectedTasks(allIds)
          setShowBulkActions(allIds.size > 0)
        } else {
          // Toggle auto-refresh (when not in input)
          e.preventDefault()
          setAutoRefresh(prev => !prev)
        }
        break
      case 'Escape':
        if (selectedTasksSizeRef.current > 0) {
          setSelectedTasks(new Set())
          setShowBulkActions(false)
        }
        break
      case 'd':
      case 'D':
        if ((e.ctrlKey || e.metaKey) && selectedTasksSizeRef.current > 0) {
          e.preventDefault()
          handleBulkDeleteRef.current?.()
        }
        break
    }
  }, [showFilters, sortOrder])

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

  // Click outside handler for export/print menus and filter panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setShowPrintMenu(false)
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        // Check if click is on the filter toggle button
        const filterButton = document.getElementById('filter-toggle-btn')
        if (filterButton && !filterButton.contains(event.target as Node)) {
          setShowFilters(false)
        }
      }
    }
    if (showExportMenu || showPrintMenu || showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu, showPrintMenu, showFilters])

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

  // Detect task conflicts
  const conflictStats = useMemo(() => {
    const conflicts: {id: string; type: string; severity: 'high' | 'medium' | 'low'; taskId: string; title: string; description: string; recommendation: string}[] = []
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    tasks.forEach(task => {
      const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'completed'
      const isDueSoon = task.dueDate && task.dueDate >= today && task.dueDate <= thirtyDaysFromNow && task.status !== 'completed'
      const isHighPriority = task.priority === 'high' && task.status !== 'completed'
      const isBlocked = task.status === 'blocked'
      
      // 1. Overdue task (high severity)
      if (isOverdue) {
        const daysOverdue = task.dueDate ? Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
        conflicts.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          severity: daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
          taskId: task.id,
          title: task.title,
          description: `Task is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue (due: ${task.dueDate})`,
          recommendation: daysOverdue > 7 ? 'Urgent: Complete or reschedule immediately' : 'Complete or extend due date',
        })
      }
      
      // 2. High priority task due soon (medium severity)
      if (isHighPriority && isDueSoon) {
        const daysUntilDue = task.dueDate ? Math.floor((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
        conflicts.push({
          id: `high-priority-soon-${task.id}`,
          type: 'high-priority-soon',
          severity: daysUntilDue <= 2 ? 'high' : 'medium',
          taskId: task.id,
          title: task.title,
          description: `High priority task due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          recommendation: 'Prioritize this task in upcoming work',
        })
      }
      
      // 3. Blocked high priority task (high severity)
      if (isBlocked && isHighPriority) {
        conflicts.push({
          id: `blocked-high-${task.id}`,
          type: 'blocked-high-priority',
          severity: 'high',
          taskId: task.id,
          title: task.title,
          description: 'High priority task is blocked',
          recommendation: 'Resolve blocker or reassign to unblock',
        })
      }
      
      // 4. Task without assignee (low severity)
      if (!task.assignee && task.status !== 'completed') {
        conflicts.push({
          id: `unassigned-${task.id}`,
          type: 'unassigned',
          severity: isHighPriority ? 'medium' : 'low',
          taskId: task.id,
          title: task.title,
          description: 'Task has no assignee',
          recommendation: 'Assign to a team member',
        })
      }
      
      // 5. Task without due date (low severity)
      if (!task.dueDate && task.status !== 'completed') {
        conflicts.push({
          id: `no-date-${task.id}`,
          type: 'no-due-date',
          severity: isHighPriority ? 'medium' : 'low',
          taskId: task.id,
          title: task.title,
          description: 'Task has no due date',
          recommendation: 'Set a realistic due date',
        })
      }
    })
    
    // Check for duplicate titles
    const titleMap = new Map<string, string[]>()
    tasks.forEach(task => {
      const normalizedTitle = task.title.toLowerCase().trim()
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, [])
      }
      titleMap.get(normalizedTitle)!.push(task.id)
    })
    titleMap.forEach((taskIds, title) => {
      if (taskIds.length > 1) {
        const duplicateTasks = tasks.filter(t => t.title.toLowerCase().trim() === title)
        duplicateTasks.forEach(task => {
          conflicts.push({
            id: `duplicate-${task.id}`,
            type: 'duplicate',
            severity: 'low',
            taskId: task.id,
            title: task.title,
            description: `Duplicate task title: "${task.title}"`,
            recommendation: 'Review and merge duplicate tasks',
          })
        })
      }
    })
    
    return {
      conflicts,
      highCount: conflicts.filter(c => c.severity === 'high').length,
      mediumCount: conflicts.filter(c => c.severity === 'medium').length,
      lowCount: conflicts.filter(c => c.severity === 'low').length,
    }
  }, [tasks])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    let result = tasks.filter(task => {
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
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'dueDate':
          comparison = (a.dueDate || '').localeCompare(b.dueDate || '')
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'assignee':
          comparison = (a.assignee || '').localeCompare(b.assignee || '')
          break
        case 'createdAt':
          comparison = a.createdAt.localeCompare(b.createdAt)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [tasks, filterStatus, filterPriority, searchQuery, sortBy, sortOrder])

  // Update refs for keyboard handler
  useEffect(() => {
    filteredTasksRef.current = filteredTasks
  }, [filteredTasks])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  useEffect(() => {
    sortOrderRef.current = sortOrder
  }, [sortOrder])
  
  useEffect(() => {
    selectedTasksSizeRef.current = selectedTasks.size
  }, [selectedTasks])

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

  // Handle adding task from template
  const handleAddFromTemplate = async (template: { title: string; description: string; priority: string; status: string }) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          priority: template.priority,
          status: template.status,
          projectId: 'default-project',
        }),
      })
      
      if (!res.ok) throw new Error('Failed to add task from template')
      
      const data = await res.json()
      setTasks(prev => [...prev, data.data])
      setShowTemplates(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task from template')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle bulk add from templates
  const handleBulkAddFromTemplate = async (templates: { title: string; description: string; priority: string; status: string }[]) => {
    setSubmitting(true)
    try {
      // Add all templates
      const results = await Promise.all(
        templates.map(template =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: template.title,
              description: template.description,
              priority: template.priority,
              status: template.status,
              projectId: 'default-project',
            }),
          }).then(r => r.json())
        )
      )
      
      const newTasks = results.map(r => r.data).filter(Boolean)
      setTasks(prev => [...prev, ...newTasks])
      setShowTemplates(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks from templates')
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

  // Bulk selection handlers
  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
    setShowBulkActions(true)
  }

  const handleSelectAll = useCallback(() => {
    const currentFiltered = filteredTasksRef.current
    if (selectedTasks.size === currentFiltered.length) {
      setSelectedTasks(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedTasks(new Set(currentFiltered.map(t => t.id)))
      setShowBulkActions(true)
    }
  }, [selectedTasks.size])

  const handleBulkDelete = useCallback(async () => {
    const currentSelected = selectedTasks
    if (currentSelected.size === 0) return
    if (!confirm(`Delete ${currentSelected.size} selected task(s)?`)) return
    
    setLoading(true)
    try {
      // Delete each selected task
      await Promise.all(
        Array.from(currentSelected).map(taskId => 
          fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' })
        )
      )
      setTasks(prev => prev.filter(t => !currentSelected.has(t.id)))
      setSelectedTasks(new Set())
      setShowBulkActions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected tasks')
    } finally {
      setLoading(false)
    }
  }, [selectedTasks])

  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    const currentSelected = selectedTasks
    if (currentSelected.size === 0) return
    
    setLoading(true)
    try {
      // Update each selected task
      await Promise.all(
        Array.from(currentSelected).map(taskId => 
          fetch(`/api/tasks?id=${taskId}`, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      )
      setTasks(prev => prev.map(t => 
        selectedTasks.has(t.id) ? { ...t, status: newStatus } : t
      ))
      setSelectedTasks(new Set())
      setShowBulkActions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update selected tasks')
    } finally {
      setLoading(false)
    }
  }, [selectedTasks])

  const handleBulkDeleteRef = useRef(handleBulkDelete)
  const handleBulkStatusChangeRef = useRef(handleBulkStatusChange)
  const handleSelectAllRef = useRef(handleSelectAll)
  
  // Export tasks to CSV
  const handleExportCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date', 'Created']
    const rows = filteredTasks.map(task => [
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.assignee || '',
      task.dueDate || '',
      task.createdAt,
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Export tasks to JSON
  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalTasks: filteredTasks.length,
        total: stats.total,
        pending: stats.pending,
        inProgress: stats.inProgress,
        completed: stats.completed,
        blocked: stats.blocked,
        overdue: stats.overdue,
        highPriority: stats.highPriority,
        completionPercent: stats.completionPercent,
      },
      tasks: filteredTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Export tasks to Markdown
  const handleExportMarkdown = () => {
    if (filteredTasks.length === 0) return

    // Build summary statistics
    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    const byAssignee: Record<string, number> = {}
    
    filteredTasks.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
      if (task.assignee) {
        byAssignee[task.assignee] = (byAssignee[task.assignee] || 0) + 1
      }
    })

    // Build markdown content
    let markdown = `# CinePilot Tasks Report

**Generated:** ${new Date().toISOString().split('T')[0]}

## Summary

- **Total Tasks:** ${stats.total}
- **Pending:** ${stats.pending}
- **In Progress:** ${stats.inProgress}
- **Completed:** ${stats.completed}
- **Blocked:** ${stats.blocked}
- **Overdue:** ${stats.overdue}
- **High Priority:** ${stats.highPriority}
- **Completion:** ${stats.completionPercent}%

### By Status

| Status | Count |
|--------|-------|
`
    Object.entries(byStatus).forEach(([status, count]) => {
      const emoji = status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : status === 'blocked' ? '🚫' : '⏳'
      markdown += `| ${emoji} ${status.replace('_', ' ')} | ${count} |\n`
    })

    markdown += `
### By Priority

| Priority | Count |
|----------|-------|
`
    Object.entries(byPriority).forEach(([priority, count]) => {
      const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '⚪'
      markdown += `| ${emoji} ${priority} | ${count} |\n`
    })

    markdown += `
### By Assignee

| Assignee | Tasks |
|----------|-------|
`
    Object.entries(byAssignee).forEach(([assignee, count]) => {
      markdown += `| ${assignee} | ${count} |\n`
    })

    markdown += `
---

## Tasks Detail

| Title | Status | Priority | Assignee | Due Date |
|-------|--------|----------|----------|----------|
`
    filteredTasks.forEach(task => {
      const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : task.status === 'blocked' ? '🚫' : '⏳'
      const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '⚪'
      markdown += `| ${task.title} | ${statusEmoji} ${task.status.replace('_', ' ')} | ${priorityEmoji} ${task.priority} | ${task.assignee || '-'} | ${task.dueDate || '-'} |\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }
  const handleExportMarkdownRef = useRef(handleExportMarkdown)

  // Print tasks report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    // Build table rows
    let tableRows = ''
    if (filteredTasks.length > 0) {
      tableRows = filteredTasks.map(t => {
        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        const priorityIcon = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '⚪'
        const statusDisplay = t.status.replace('_', ' ')
        return `<tr>
          <td>${t.title}</td>
          <td><span class="badge badge-${t.status}">${statusDisplay}</span></td>
          <td><span class="priority priority-${t.priority}">${priorityIcon} ${t.priority}</span></td>
          <td>${t.assignee || '-'}</td>
          <td class="${isOverdue ? 'overdue' : ''}">${t.dueDate || '-'}</td>
        </tr>`
      }).join('')
    } else {
      tableRows = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8">No tasks found</td></tr>'
    }
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Tasks Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #0f172a; }
    .header .subtitle { color: #64748b; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
    .summary-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .summary-card .value { font-size: 32px; font-weight: 700; color: #0f172a; }
    .summary-card .label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; margin-bottom: 16px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-pending { background: #f1f5f9; color: #475569; }
    .badge-in_progress { background: #dbeafe; color: #1e40af; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-blocked { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #f1f5f9; color: #475569; }
    .priority { display: inline-flex; align-items: center; gap: 4px; }
    .priority-high { color: #dc2626; }
    .priority-medium { color: #d97706; }
    .priority-low { color: #64748b; }
    .overdue { color: #dc2626; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>✅ Tasks Report</h1>
      <p class="subtitle">Generated by CinePilot - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="value">${stats.total}</div>
      <div class="label">Total</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.pending}</div>
      <div class="label">Pending</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.inProgress}</div>
      <div class="label">In Progress</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.completed}</div>
      <div class="label">Completed</div>
    </div>
    <div class="summary-card">
      <div class="value">${stats.completionPercent}%</div>
      <div class="label">Done</div>
    </div>
  </div>
  
  <div class="section">
    <h2>📋 All Tasks</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    CinePilot Production Management • Tasks Report
  </div>
</body>
</html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setShowPrintMenu(false)
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
          <div className="flex items-center gap-6">
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
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {autoRefresh && (
                  <span className="text-emerald-400 ml-1">Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}</span>
                )}
              </span>
            )}
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
              disabled={refreshing || autoRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
                title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
              >
                <div className="relative">
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  )}
                </div>
              </button>
              {autoRefresh && (
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              )}
            </div>
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
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={filteredTasks.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-700/50 rounded-lg text-sm text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export tasks (E)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredTasks.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-emerald-900/30 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    disabled={filteredTasks.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Export Markdown
                  </button>
                  <button
                    onClick={handleExportJSON}
                    disabled={filteredTasks.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-purple-900/30 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              )}
            </div>

            {/* Print Dropdown */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={filteredTasks.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-700/50 rounded-lg text-sm text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print tasks (P)"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    disabled={filteredTasks.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-amber-900/30 hover:text-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                    Print Tasks
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Templates
            </button>
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
                placeholder="Search tasks... (F for filters, / for search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              id="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
              title={`Toggle filters (F)${activeFilterCount > 0 ? ' - X to clear all' : ''}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter & Sort Panel */}
            {showFilters && (
              <div ref={filterPanelRef} className="flex flex-wrap items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Filter & Sort:</span>
                  </div>
                  <div className="text-xs text-cyan-400">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-400">1-6</kbd> status · <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-400">⇧8-9</kbd> priority · <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-400">X</kbd> clear all
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Status (1)</option>
                    <option value="overdue">⚠️ Overdue (2)</option>
                    <option value="pending">Pending (3)</option>
                    <option value="in_progress">In Progress (4)</option>
                    <option value="completed">Completed (5)</option>
                    <option value="blocked">Blocked (6)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Priority:</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High (8)</option>
                    <option value="medium">Medium (9)</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {/* Sort Controls */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-600">
                  <label className="text-sm text-slate-400">Sort By:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                    <option value="title">Title</option>
                    <option value="assignee">Assignee</option>
                    <option value="createdAt">Created</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      sortOrder === 'asc' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    title="Toggle sort order (S)"
                  >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear All ({activeFilterCount})
                  </button>
                )}
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors relative ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View (1)"
              >
                <ListChecks className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 text-[8px] opacity-60">(1)</span>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-colors relative ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Board View (2)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 text-[8px] opacity-60">(2)</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors relative ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Calendar View (3)"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 text-[8px] opacity-60">(3)</span>
              </button>
              <button
                onClick={() => setViewMode('conflicts')}
                className={`p-2 rounded-md transition-colors relative ${viewMode === 'conflicts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Conflicts View (4)"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 text-[8px] opacity-60">(4)</span>
                {conflictStats.highCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                    {conflictStats.highCount}
                  </span>
                )}
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
              {/* Select All Header */}
              {filteredTasks.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-800 rounded-lg mb-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedTasks.size === filteredTasks.length && filteredTasks.length > 0
                        ? 'bg-indigo-500 border-indigo-500'
                        : selectedTasks.size > 0
                        ? 'bg-indigo-500/50 border-indigo-500'
                        : 'border-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {selectedTasks.size === filteredTasks.length && filteredTasks.length > 0 && <CheckCircle className="w-3 h-3 text-white" />}
                    {selectedTasks.size > 0 && selectedTasks.size < filteredTasks.length && <div className="w-2 h-2 bg-indigo-400 rounded-sm" />}
                  </button>
                  <span className="text-sm text-slate-400">
                    {selectedTasks.size > 0 
                      ? `${selectedTasks.size} of ${filteredTasks.length} selected`
                      : 'Select all'}
                  </span>
                  {selectedTasks.size > 0 && (
                    <button 
                      onClick={() => { setSelectedTasks(new Set()); setShowBulkActions(false) }}
                      className="ml-auto text-sm text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              
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
                  isChecked={selectedTasks.has(task.id)}
                  onCheck={handleToggleSelect}
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

        {/* Conflicts View */}
        {viewMode === 'conflicts' && (
          <div className="space-y-6">
            {/* Conflict Stats Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{conflictStats.highCount}</p>
                    <p className="text-sm text-slate-400">High Priority</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{conflictStats.mediumCount}</p>
                    <p className="text-sm text-slate-400">Medium Priority</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{conflictStats.lowCount}</p>
                    <p className="text-sm text-slate-400">Low Priority</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{conflictStats.conflicts.length}</p>
                    <p className="text-sm text-slate-400">Total Issues</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Clear Message */}
            {conflictStats.conflicts.length === 0 && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-8 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-400 mb-2">All Clear!</h3>
                <p className="text-slate-400">No task conflicts detected. Your tasks are in good shape.</p>
              </div>
            )}

            {/* Conflict Cards */}
            {conflictStats.conflicts.length > 0 && (
              <div className="grid gap-4">
                {conflictStats.conflicts
                  .sort((a, b) => {
                    const severityOrder = { high: 0, medium: 1, low: 2 }
                    return severityOrder[a.severity] - severityOrder[b.severity]
                  })
                  .map((conflict) => (
                    <div
                      key={conflict.id}
                      className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${
                        conflict.severity === 'high' 
                          ? 'border-red-700/30 hover:border-red-600' 
                          : conflict.severity === 'medium'
                          ? 'border-amber-700/30 hover:border-amber-600'
                          : 'border-slate-700/30 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        const task = tasks.find(t => t.id === conflict.taskId)
                        if (task) openEditForm(task)
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          conflict.severity === 'high' 
                            ? 'bg-red-500/20' 
                            : conflict.severity === 'medium'
                            ? 'bg-amber-500/20'
                            : 'bg-slate-500/20'
                        }`}>
                          {conflict.severity === 'high' ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          ) : conflict.severity === 'medium' ? (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              conflict.severity === 'high' 
                                ? 'bg-red-500/20 text-red-400' 
                                : conflict.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {conflict.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500 uppercase">
                              {conflict.type.replace(/-/g, ' ')}
                            </span>
                          </div>
                          <h4 className="font-medium text-white truncate">{conflict.title}</h4>
                          <p className="text-sm text-slate-400 mt-1">{conflict.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-400">
                            <Target className="w-3 h-3" />
                            {conflict.recommendation}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {showBulkActions && selectedTasks.size > 0 && (
          <div 
            ref={bulkActionsRef}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-indigo-500/20 px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <span className="text-sm text-slate-300 font-medium">
              {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
            </span>
            <div className="h-6 w-px bg-slate-700" />
            
            {/* Bulk Status Change */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChangeRef.current(e.target.value)
                  e.target.value = ''
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              defaultValue=""
            >
              <option value="" disabled>Change Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            
            <button
              onClick={handleBulkDeleteRef.current}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            
            <div className="h-6 w-px bg-slate-700" />
            
            <button
              onClick={() => { setSelectedTasks(new Set()); setShowBulkActions(false) }}
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
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
              <div className="space-y-3">
                {/* View Switching (When Filters Closed) - Amber section */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2 px-1">When Filters Closed (View Mode)</div>
                  {[
                    { keys: ['1'], desc: 'Switch to List view' },
                    { keys: ['2'], desc: 'Switch to Board view' },
                    { keys: ['3'], desc: 'Switch to Calendar view' },
                    { keys: ['4'], desc: 'Switch to Conflicts view' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-amber-400">{shortcut.keys[0]}</kbd>
                      </div>
                      <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
                {/* Status/Priority Filtering (When Filters Open) - Cyan section */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider mb-2 px-1">When Filters Open (Filtering)</div>
                  {[
                    { keys: ['1'], desc: 'Filter: All Status (toggle)' },
                    { keys: ['2'], desc: 'Filter: Overdue (toggle)' },
                    { keys: ['3'], desc: 'Filter: Pending (toggle)' },
                    { keys: ['4'], desc: 'Filter: In Progress (toggle)' },
                    { keys: ['5'], desc: 'Filter: Completed (toggle)' },
                    { keys: ['6'], desc: 'Filter: Blocked (toggle)' },
                    { keys: ['8'], desc: 'Filter: Low Priority (toggle)' },
                    { keys: ['⇧8'], desc: 'Filter: High Priority (toggle)' },
                    { keys: ['⇧9'], desc: 'Filter: Medium Priority (toggle)' },
                    { keys: ['0'], desc: 'Clear status filter' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {shortcut.keys.map((key, i) => (
                          <kbd key={i} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-cyan-400">{key}</kbd>
                        ))}
                      </div>
                      <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
                {/* General Actions - Emerald section */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2 px-1">Actions</div>
                  {[
                    { keys: ['↑', '↓'], desc: 'Navigate tasks' },
                    { keys: ['Home'], desc: 'Go to first task' },
                    { keys: ['End'], desc: 'Go to last task' },
                    { keys: ['N'], desc: 'New task' },
                    { keys: ['F'], desc: 'Toggle filters' },
                    { keys: ['S'], desc: 'Toggle sort order' },
                    { keys: ['/'], desc: 'Focus search' },
                    { keys: ['V'], desc: 'Toggle view mode' },
                    { keys: ['X'], desc: 'Clear all filters (when filters active)' },
                    { keys: ['E'], desc: 'Export dropdown' },
                    { keys: ['M'], desc: 'Export Markdown' },
                    { keys: ['P'], desc: 'Print tasks' },
                    { keys: ['A'], desc: 'Toggle auto-refresh' },
                    { keys: ['Ctrl', 'A'], desc: 'Select all tasks' },
                    { keys: ['Ctrl', 'D'], desc: 'Delete selected' },
                    { keys: ['Esc'], desc: 'Clear selection' },
                    { keys: ['?'], desc: 'Toggle this help' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {shortcut.keys.map((key, i) => (
                          <kbd key={i} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-emerald-400">{key}</kbd>
                        ))}
                      </div>
                      <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
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

      {/* Task Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Task Templates</h2>
                  <p className="text-sm text-slate-400">Quick-add common production tasks</p>
                </div>
              </div>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {TASK_TEMPLATES.map((category) => (
                <div key={category.category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.tasks.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddFromTemplate(template)}
                        disabled={submitting}
                        className="flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg text-left transition-all disabled:opacity-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{template.title}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{template.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          template.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          template.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {template.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Add All Button */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    const allTemplates = TASK_TEMPLATES.flatMap(cat => cat.tasks)
                    handleBulkAddFromTemplate(allTemplates)
                  }}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add All Templates ({TASK_TEMPLATES.reduce((acc, cat) => acc + cat.tasks.length, 0)} tasks)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  isSelected,
  isChecked,
  onCheck
}: { 
  task: Task
  onStatusChange: (id: string, status: string) => void
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  getDaysUntilDue: (date: string) => number
  isSelected?: boolean
  isChecked?: boolean
  onCheck?: (id: string) => void
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
        {/* Bulk Selection Checkbox */}
        {onCheck && (
          <button
            type="button"
            onClick={() => onCheck(task.id)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              isChecked
                ? 'bg-indigo-500 border-indigo-500'
                : 'border-slate-600 hover:border-indigo-500'
            }`}
          >
            {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
          </button>
        )}
        
        {/* Status Checkbox */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
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
