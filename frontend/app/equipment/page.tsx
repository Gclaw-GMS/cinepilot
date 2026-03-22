'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Package, DollarSign, Camera, Clapperboard, Search, X, Loader2, AlertCircle, Trash2, Edit2, RefreshCw, HelpCircle, Filter, AlertTriangle, Download, Printer, Keyboard, ChevronRight, Check, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface EquipmentRental {
  id: string
  projectId: string
  name: string
  category: string
  dateStart: string
  dateEnd: string
  dailyRate: number
  vendor: string | null
  notes: string | null
  status: string
  quantity: number
}

interface EquipmentStats {
  totalItems: number
  totalDailyRate: number
  available: number
  inUse: number
  maintenance: number
  returned: number
}

interface EquipmentConflict {
  id: string
  type: 'overdue' | 'maintenance' | 'budget' | 'missing-date' | 'high-value' | 'quantity'
  severity: 'high' | 'medium' | 'low'
  equipmentId: string
  equipmentName: string
  title: string
  description: string
  recommendation: string
}

const CATEGORIES = [
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'lighting', label: 'Lighting', icon: Package },
  { id: 'sound', label: 'Sound', icon: Package },
  { id: 'grip', label: 'Grip', icon: Clapperboard },
  { id: 'art', label: 'Art', icon: Package },
]

const DEMO_EQUIPMENT: EquipmentRental[] = [
  { id: 'demo-1', projectId: 'demo', name: 'RED Komodo', category: 'camera', dateStart: '2026-03-01', dateEnd: '2026-03-15', dailyRate: 15000, vendor: 'Film Gear', status: 'available', quantity: 1, notes: null },
  { id: 'demo-2', projectId: 'demo', name: 'Arri SkyPanel S60', category: 'lighting', dateStart: '2026-03-01', dateEnd: '2026-03-10', dailyRate: 8000, vendor: 'Light House', status: 'in-use', quantity: 1, notes: null },
  { id: 'demo-3', projectId: 'demo', name: 'Sennheiser MKH 416', category: 'sound', dateStart: '2026-03-05', dateEnd: '2026-03-20', dailyRate: 2500, vendor: 'Audio Pro', status: 'available', quantity: 1, notes: null },
  { id: 'demo-4', projectId: 'demo', name: 'DJI Ronin RS3 Pro', category: 'grip', dateStart: '2026-02-20', dateEnd: '2026-02-28', dailyRate: 5000, vendor: 'Stabilizer Co', status: 'maintenance', quantity: 1, notes: null },
  { id: 'demo-5', projectId: 'demo', name: 'Alexa Mini LF', category: 'camera', dateStart: '2026-03-10', dateEnd: '2026-03-25', dailyRate: 35000, vendor: 'Film Gear', status: 'available', quantity: 1, notes: null },
  { id: 'demo-6', projectId: 'demo', name: 'Cooke S7/i Full Frame', category: 'camera', dateStart: '2026-03-01', dateEnd: '2026-03-20', dailyRate: 12000, vendor: 'Lens House', status: 'in-use', quantity: 1, notes: 'Prime lens set' },
  { id: 'demo-7', projectId: 'demo', name: 'Aputure 600d Pro', category: 'lighting', dateStart: '2026-03-05', dateEnd: '2026-03-15', dailyRate: 4500, vendor: 'Light House', status: 'available', quantity: 2, notes: null },
  { id: 'demo-8', projectId: 'demo', name: 'Zoom F6 Field Recorder', category: 'sound', dateStart: '2026-02-25', dateEnd: '2026-03-10', dailyRate: 1500, vendor: 'Audio Pro', status: 'returned', quantity: 1, notes: 'Returned after shoot' },
]

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  }
  
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.indigo}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50">
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'in-use': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
    returned: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusClasses[status] || statusClasses.returned}`}>
      {status}
    </span>
  )
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentRental[]>([])
  const [stats, setStats] = useState<EquipmentStats>({ totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0, maintenance: 0, returned: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'camera',
    dateStart: '',
    dateEnd: '',
    dailyRate: '',
    vendor: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRental | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'camera',
    dateStart: '',
    dateEnd: '',
    dailyRate: '',
    vendor: '',
    notes: '',
  })
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'status' | 'dailyRate' | 'dateEnd'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Refs for keyboard shortcuts (to avoid dependency issues)
  const showFiltersRef = useRef(showFilters)
  const filterStatusRef = useRef(filterStatus)
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'conflicts'>('list')
  const [budgetLimit, setBudgetLimit] = useState<number>(50000) // Daily budget limit for rentals
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds
  
  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterCat !== 'all') count++
    if (filterStatus !== 'all') count++
    return count
  }, [filterCat, filterStatus])
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterCat('all')
    setFilterStatus('all')
    setSearch('')
  }, [])

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()
  const handlePrintRef = useRef<() => void>()
  const bulkStatusMenuRef = useRef<HTMLDivElement>(null)
  const deleteConfirmRef = useRef<HTMLDivElement>(null)
  const selectedEquipmentRef = useRef<Set<string>>(new Set())
  const showBulkActionsRef = useRef<boolean>(false)
  const clearSelectionRef = useRef<() => void>(() => {})
  const selectAllEquipmentRef = useRef<() => void>(() => {})
  const filteredLengthRef = useRef<number>(0)
  const activeFilterCountRef = useRef<number>(0)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)

  // Keep refs in sync with state for keyboard shortcuts
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    filterStatusRef.current = filterStatus
  }, [filterStatus])

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchDataRef.current?.()
    }, autoRefreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval])

  // Calculate category breakdown for chart
  const categoryData = useMemo(() => {
    const breakdown: Record<string, number> = {}
    equipment.forEach(eq => {
      breakdown[eq.category] = (breakdown[eq.category] || 0) + eq.dailyRate
    })
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  }, [equipment])

  // Status breakdown for chart
  const statusData = useMemo(() => {
    const breakdown: Record<string, number> = {
      available: 0,
      'in-use': 0,
      maintenance: 0,
      returned: 0,
    }
    equipment.forEach(eq => {
      if (breakdown[eq.status] !== undefined) {
        breakdown[eq.status]++
      }
    })
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  }, [equipment])

  // Conflict detection
  const equipmentConflicts = useMemo(() => {
    const conflicts: EquipmentConflict[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    equipment.forEach(eq => {
      const startDate = new Date(eq.dateStart)
      const endDate = new Date(eq.dateEnd)
      
      // 1. Overdue Returns: Past return date but still in-use
      if (eq.status === 'in-use' && endDate < today) {
        const daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
        conflicts.push({
          id: `overdue-${eq.id}`,
          type: 'overdue',
          severity: daysOverdue > 7 ? 'high' : 'medium',
          equipmentId: eq.id,
          equipmentName: eq.name,
          title: 'Overdue Return',
          description: `${eq.name} was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago (${eq.dateEnd}) but is still marked as in-use`,
          recommendation: 'Confirm return status with vendor or update the equipment status'
        })
      }

      // 2. Maintenance Issues: Equipment in maintenance for too long
      if (eq.status === 'maintenance') {
        const daysInMaintenance = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysInMaintenance > 7) {
          conflicts.push({
            id: `maintenance-${eq.id}`,
            type: 'maintenance',
            severity: daysInMaintenance > 14 ? 'high' : 'medium',
            equipmentId: eq.id,
            equipmentName: eq.name,
            title: 'Extended Maintenance',
            description: `${eq.name} has been in maintenance for ${daysInMaintenance} days`,
            recommendation: 'Review maintenance status and either return to service or arrange replacement'
          })
        }
      }

      // 3. Missing Return Date
      if (!eq.dateEnd || eq.dateEnd === '') {
        conflicts.push({
          id: `missing-date-${eq.id}`,
          type: 'missing-date',
          severity: 'medium',
          equipmentId: eq.id,
          equipmentName: eq.name,
          title: 'Missing Return Date',
          description: `${eq.name} does not have a return date specified`,
          recommendation: 'Add a return date to track rental period'
        })
      }

      // 4. High Value Items: Expensive daily rate
      if (eq.dailyRate > 20000) {
        conflicts.push({
          id: `high-value-${eq.id}`,
          type: 'high-value',
          severity: 'low',
          equipmentId: eq.id,
          equipmentName: eq.name,
          title: 'High Value Rental',
          description: `${eq.name} has a daily rate of ₹${eq.dailyRate.toLocaleString()}`,
          recommendation: 'Ensure adequate insurance coverage for this high-value item'
        })
      }

      // 5. Quantity Issues
      if (eq.quantity < 1) {
        conflicts.push({
          id: `quantity-${eq.id}`,
          type: 'quantity',
          severity: 'high',
          equipmentId: eq.id,
          equipmentName: eq.name,
          title: 'Invalid Quantity',
          description: `${eq.name} has quantity of ${eq.quantity}, which is invalid`,
          recommendation: 'Update quantity to at least 1 or remove the equipment'
        })
      }
    })

    // 6. Budget Overrun: Check total daily rate against budget limit
    const totalDailyRate = equipment
      .filter(eq => eq.status === 'in-use')
      .reduce((acc, eq) => acc + eq.dailyRate * eq.quantity, 0)
    
    if (totalDailyRate > budgetLimit) {
      const overrun = totalDailyRate - budgetLimit
      conflicts.push({
        id: 'budget-overrun',
        type: 'budget',
        severity: overrun > budgetLimit * 0.5 ? 'high' : 'medium',
        equipmentId: 'budget',
        equipmentName: 'All In-Use Equipment',
        title: 'Budget Overrun',
        description: `Total daily rental cost (₹${totalDailyRate.toLocaleString()}) exceeds budget limit (₹${budgetLimit.toLocaleString()}) by ₹${overrun.toLocaleString()}`,
        recommendation: 'Review active rentals and consider returning unused equipment'
      })
    }

    return conflicts
  }, [equipment, budgetLimit])

  // Conflict stats
  const conflictStats = useMemo(() => ({
    total: equipmentConflicts.length,
    high: equipmentConflicts.filter(c => c.severity === 'high').length,
    medium: equipmentConflicts.filter(c => c.severity === 'medium').length,
    low: equipmentConflicts.filter(c => c.severity === 'low').length,
  }), [equipmentConflicts])

  // Conflict type breakdown
  const conflictTypeStats = useMemo(() => {
    const types: Record<string, number> = {}
    equipmentConflicts.forEach(c => {
      types[c.type] = (types[c.type] || 0) + 1
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }, [equipmentConflicts])

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const STATUS_COLORS: Record<string, string> = {
    available: '#10b981',
    'in-use': '#f59e0b',
    maintenance: '#ef4444',
    returned: '#64748b',
  }

  const calculateStats = (items: EquipmentRental[]) => {
    const totalDailyRate = items.reduce((acc, eq) => acc + eq.dailyRate, 0)
    setStats({
      totalItems: items.length,
      totalDailyRate,
      available: items.filter(eq => eq.status === 'available').length,
      inUse: items.filter(eq => eq.status === 'in-use').length,
      maintenance: items.filter(eq => eq.status === 'maintenance').length,
      returned: items.filter(eq => eq.status === 'returned').length,
    })
  }

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/equipment')
      const data = await res.json()
      
      if (res.ok) {
        setEquipment(data.rentals || [])
        setStats(data.stats || { totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0, maintenance: 0, returned: 0 })
      } else {
        // Fall back to demo data if API fails
        setEquipment(DEMO_EQUIPMENT)
        calculateStats(DEMO_EQUIPMENT)
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err)
      setEquipment(DEMO_EQUIPMENT)
      calculateStats(DEMO_EQUIPMENT)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = () => {
    fetchEquipment()
  }

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  // Click outside to close filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showFilters && !target.closest('.filter-menu')) {
        setShowFilters(false)
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Click outside to close print menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrintMenu])

  // Click outside to close bulk status menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkStatusMenuRef.current && !bulkStatusMenuRef.current.contains(e.target as Node)) {
        setShowBulkStatusMenu(false)
      }
    }
    if (showBulkStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBulkStatusMenu])

  // Click outside to close delete confirm
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(e.target as Node)) {
        setShowDeleteConfirm(false)
      }
    }
    if (showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDeleteConfirm])

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      (eq.vendor?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      eq.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || eq.category === filterCat
    const matchStatus = filterStatus === 'all' || eq.status === filterStatus
    return matchSearch && matchCat && matchStatus
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'dailyRate':
        comparison = a.dailyRate - b.dailyRate
        break
      case 'dateEnd':
        comparison = new Date(a.dateEnd).getTime() - new Date(b.dateEnd).getTime()
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (res.ok) {
        setModalOpen(false)
        setForm({ name: '', category: 'camera', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' })
        await fetchEquipment()
        setSuccess('Equipment added successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add equipment')
      }
    } catch (err) {
      setError('Failed to add equipment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this equipment?')) return
    
    try {
      const res = await fetch(`/api/equipment?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchEquipment()
        setSuccess('Equipment removed successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to delete equipment')
    }
  }

  // Bulk selection handlers
  const toggleEquipmentSelection = useCallback((id: string) => {
    setSelectedEquipment(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      selectedEquipmentRef.current = newSet
      setShowBulkActions(newSet.size > 0)
      showBulkActionsRef.current = newSet.size > 0
      return newSet
    })
  }, [])

  const selectAllEquipment = useCallback(() => {
    const allIds = new Set(filtered.map(eq => eq.id))
    setSelectedEquipment(allIds)
    selectedEquipmentRef.current = allIds
    setShowBulkActions(allIds.size > 0)
    showBulkActionsRef.current = allIds.size > 0
  }, [filtered])

  const clearSelection = useCallback(() => {
    setSelectedEquipment(new Set())
    selectedEquipmentRef.current = new Set()
    setShowBulkActions(false)
    showBulkActionsRef.current = false
    setShowBulkStatusMenu(false)
    setShowDeleteConfirm(false)
  }, [])

  // Update refs for keyboard shortcuts
  useEffect(() => {
    selectAllEquipmentRef.current = selectAllEquipment
  }, [selectAllEquipment])

  useEffect(() => {
    clearSelectionRef.current = clearSelection
  }, [clearSelection])

  useEffect(() => {
    filteredLengthRef.current = filtered.length
  }, [filtered.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      // Context-aware keyboard shortcuts
      const isFiltersOpen = showFiltersRef.current
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          if (!autoRefreshRef.current) {
            fetchDataRef.current?.()
          }
          break
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            setAutoRefresh(prev => !prev)
          }
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case '1':
          e.preventDefault()
          if (isFiltersOpen) {
            // Filter by all status
            setFilterStatus(prev => prev === 'all' ? 'all' : 'all')
          } else {
            setViewMode('list')
          }
          break
        case '2':
          e.preventDefault()
          if (isFiltersOpen) {
            // Filter by available status (toggle)
            setFilterStatus(prev => prev === 'available' ? 'all' : 'available')
          } else {
            setViewMode('analytics')
          }
          break
        case '3':
          e.preventDefault()
          if (isFiltersOpen) {
            // Filter by in-use status (toggle)
            setFilterStatus(prev => prev === 'in-use' ? 'all' : 'in-use')
          } else {
            setViewMode('conflicts')
          }
          break
        case '4':
          e.preventDefault()
          if (isFiltersOpen) {
            // Filter by maintenance status (toggle)
            setFilterStatus(prev => prev === 'maintenance' ? 'all' : 'maintenance')
          }
          break
        case '5':
          e.preventDefault()
          if (isFiltersOpen) {
            // Filter by returned status (toggle)
            setFilterStatus(prev => prev === 'returned' ? 'all' : 'returned')
          }
          break
        case '0':
          e.preventDefault()
          if (isFiltersOpen) {
            // Clear status filter
            setFilterStatus('all')
          }
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          if (!modalOpen && !editModalOpen) {
            setModalOpen(true)
            setForm({ name: '', category: 'camera', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' })
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          if (filtered.length > 0) {
            handleExportMarkdownRef.current()
          }
          break
        case 'p':
          e.preventDefault()
          if (equipment.length > 0) {
            handlePrintRef.current?.()
          }
          break
        case 'x':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            if (showFiltersRef.current && activeFilterCountRef.current > 0) {
              clearFilters()
            }
          }
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setShowBulkStatusMenu(false)
          setShowDeleteConfirm(false)
          setSearch('')
          setFilterCat('all')
          setFilterStatus('all')
          if (showBulkActionsRef.current) {
            clearSelectionRef.current()
          }
          break
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (filteredLengthRef.current > 0) {
              selectAllEquipmentRef.current()
            }
          }
          break
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (selectedEquipmentRef.current.size > 0) {
              setShowDeleteConfirm(true)
            }
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, editModalOpen, showExportMenu])

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedEquipment)
    setShowDeleteConfirm(false)
    try {
      const deletePromises = ids.map(id => 
        fetch(`/api/equipment?id=${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      await fetchEquipment()
      clearSelection()
      setSuccess(`${ids.length} equipment item(s) removed!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete selected equipment')
    }
  }, [selectedEquipment, fetchEquipment, clearSelection])

  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    const ids = Array.from(selectedEquipment)
    setShowBulkStatusMenu(false)
    try {
      const updatePromises = ids.map(id => 
        fetch('/api/equipment', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        })
      )
      await Promise.all(updatePromises)
      await fetchEquipment()
      clearSelection()
      setSuccess(`${ids.length} equipment status changed!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to update equipment status')
    }
  }, [selectedEquipment, fetchEquipment, clearSelection])

  // Export functions
  const handleExportCSV = () => {
    setExporting(true)
    const headers = ['Name', 'Category', 'Start Date', 'End Date', 'Daily Rate', 'Vendor', 'Status', 'Quantity', 'Notes']
    const rows = filtered.map(eq => [
      eq.name,
      eq.category,
      eq.dateStart.split('T')[0],
      eq.dateEnd.split('T')[0],
      eq.dailyRate.toString(),
      eq.vendor || '',
      eq.status,
      eq.quantity.toString(),
      eq.notes || ''
    ])
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `equipment-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
    setSuccess('Equipment exported to CSV!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleExportJSON = () => {
    setExporting(true)
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: filtered.length,
      totalDailyRate: filtered.reduce((acc, eq) => acc + eq.dailyRate, 0),
      stats: {
        available: filtered.filter(eq => eq.status === 'available').length,
        inUse: filtered.filter(eq => eq.status === 'in-use').length,
        maintenance: filtered.filter(eq => eq.status === 'maintenance').length,
        returned: filtered.filter(eq => eq.status === 'returned').length,
      },
      items: filtered.map(eq => ({
        name: eq.name,
        category: eq.category,
        dateStart: eq.dateStart,
        dateEnd: eq.dateEnd,
        dailyRate: eq.dailyRate,
        vendor: eq.vendor,
        status: eq.status,
        quantity: eq.quantity,
        notes: eq.notes,
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `equipment-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
    setSuccess('Equipment exported to JSON!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleExportMarkdown = useCallback(() => {
    setExporting(true)
    
    const totalItems = filtered.length
    const totalDailyRate = filtered.reduce((acc, eq) => acc + eq.dailyRate, 0)
    const available = filtered.filter(eq => eq.status === 'available').length
    const inUse = filtered.filter(eq => eq.status === 'in-use').length
    const maintenance = filtered.filter(eq => eq.status === 'maintenance').length
    const returned = filtered.filter(eq => eq.status === 'returned').length
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    filtered.forEach(eq => {
      categoryBreakdown[eq.category] = (categoryBreakdown[eq.category] || 0) + 1
    })
    
    // Status breakdown with emojis
    const statusEmoji: Record<string, string> = {
      available: '✅',
      'in-use': '📷',
      maintenance: '🔧',
      returned: '📦',
    }
    
    let markdown = `# Equipment Rental Report - CinePilot

**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

---

## Summary

| Metric | Value |
|--------|-------|
| Total Items | ${totalItems} |
| Total Daily Rate | $${totalDailyRate.toLocaleString()} |
| Available | ${available} |
| In Use | ${inUse} |
| Maintenance | ${maintenance} |
| Returned | ${returned} |

---

## By Category

`
    
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      const dailyRate = filtered.filter(eq => eq.category === category).reduce((acc, eq) => acc + eq.dailyRate, 0)
      markdown += `- **${category.charAt(0).toUpperCase() + category.slice(1)}**: ${count} items ($${dailyRate.toLocaleString()}/day)\n`
    })
    
    markdown += `\n## Equipment Details\n\n`
    markdown += `| Name | Category | Status | Daily Rate | Vendor | Start Date | End Date | Qty |\n`
    markdown += `|------|----------|--------|------------|--------|------------|----------|-----|\n`
    
    filtered.forEach(eq => {
      const statusIcon = statusEmoji[eq.status] || '❓'
      markdown += `| ${eq.name} | ${eq.category} | ${statusIcon} ${eq.status} | $${eq.dailyRate.toLocaleString()} | ${eq.vendor || '-'} | ${eq.dateStart.split('T')[0]} | ${eq.dateEnd.split('T')[0]} | ${eq.quantity} |\n`
    })
    
    markdown += `\n---\n\n*Generated by CinePilot - Film Production Management*`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `equipment-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
    setSuccess('Equipment exported to Markdown!')
    setTimeout(() => setSuccess(null), 3000)
  }, [filtered])

  // Assign handleExportMarkdown to ref for keyboard shortcuts
  const handleExportMarkdownRef = useRef(handleExportMarkdown)
  handleExportMarkdownRef.current = handleExportMarkdown

  // Print functionality
  const handlePrint = useCallback(() => {
    setPrinting(true)
    setShowPrintMenu(false)
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Equipment Rental Report - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e293b; }
    .header .subtitle { color: #64748b; font-size: 14px; }
    .logo { color: #6366f1; font-weight: bold; font-size: 18px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-card.available .value { color: #10b981; }
    .stat-card.in-use .value { color: #f59e0b; }
    .stat-card.maintenance .value { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #6366f1; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.available { background: #d1fae5; color: #065f46; }
    .badge.in-use { background: #fef3c7; color: #92400e; }
    .badge.maintenance { background: #fee2e2; color: #991b1b; }
    .badge.returned { background: #f1f5f9; color: #475569; }
    .badge.camera { background: #e0e7ff; color: #4338ca; }
    .badge.lighting { background: #fef3c7; color: #92400e; }
    .badge.sound { background: #dbeafe; color: #1e40af; }
    .badge.grip { background: #fce7f3; color: #9d174d; }
    .badge.art { background: #f3e8ff; color: #6b21a8; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Equipment Rental Report</h1>
      <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div class="logo">🎬 CinePilot</div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Total Items</div>
      <div class="value">${stats.totalItems}</div>
    </div>
    <div class="stat-card">
      <div class="label">Daily Rate</div>
      <div class="value">₹${stats.totalDailyRate.toLocaleString()}</div>
    </div>
    <div class="stat-card available">
      <div class="label">Available</div>
      <div class="value">${stats.available}</div>
    </div>
    <div class="stat-card in-use">
      <div class="label">In Use</div>
      <div class="value">${stats.inUse}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Equipment Name</th>
        <th>Category</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Daily Rate</th>
        <th>Vendor</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((eq, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${eq.name}</strong></td>
          <td><span class="badge ${eq.category}">${eq.category.charAt(0).toUpperCase() + eq.category.slice(1)}</span></td>
          <td>${eq.dateStart.split('T')[0]}</td>
          <td>${eq.dateEnd.split('T')[0]}</td>
          <td>₹${eq.dailyRate.toLocaleString()}</td>
          <td>${eq.vendor || '-'}</td>
          <td><span class="badge ${eq.status}">${eq.status === 'in-use' ? 'In Use' : eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>🎬 CinePilot - Production Equipment Management</p>
  </div>
</body>
</html>
`
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    setPrinting(false)
  }, [filtered, stats])

  // Assign handlePrint to ref for keyboard shortcuts
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  const handleEdit = (eq: EquipmentRental) => {
    setEditingEquipment(eq)
    setEditForm({
      name: eq.name,
      category: eq.category,
      dateStart: eq.dateStart.split('T')[0],
      dateEnd: eq.dateEnd.split('T')[0],
      dailyRate: eq.dailyRate.toString(),
      vendor: eq.vendor || '',
      notes: eq.notes || '',
    })
    setEditModalOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEquipment) return
    setSaving(true)
    setError(null)
    
    try {
      const res = await fetch('/api/equipment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEquipment.id,
          ...editForm,
        }),
      })
      
      if (res.ok) {
        setEditModalOpen(false)
        setEditingEquipment(null)
        await fetchEquipment()
        setSuccess('Equipment updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update equipment')
      }
    } catch (err) {
      setError('Failed to update equipment')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEquipment().finally(() => setRefreshing(false))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Equipment Rental</h1>
              <p className="text-sm text-slate-400">Manage your production equipment inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && <span className="ml-2 text-emerald-400">Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}</span>}
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || autoRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  autoRefresh ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
                title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                Auto
              </button>
              {autoRefresh && (
                <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-2 z-10">
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    className="bg-slate-700 text-slate-200 text-sm rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs">?</span>
            </button>
            {/* Filter Toggle Button */}
            <div className="relative filter-menu">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                }`}
                title="Filter (F)"
              >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Filters</span>
                      <span className="text-xs text-cyan-400 ml-2">(1-5 for status, 0 to clear)</span>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Category Filter */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'camera', label: 'Camera' },
                          { key: 'lighting', label: 'Lighting' },
                          { key: 'sound', label: 'Sound' },
                          { key: 'grip', label: 'Grip' },
                          { key: 'art', label: 'Art' },
                        ].map(cat => (
                          <button
                            key={cat.key}
                            onClick={() => setFilterCat(cat.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              filterCat === cat.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Status Filter */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'available', label: 'Available' },
                          { key: 'in-use', label: 'In Use' },
                          { key: 'maintenance', label: 'Maintenance' },
                          { key: 'returned', label: 'Returned' },
                        ].map(status => (
                          <button
                            key={status.key}
                            onClick={() => setFilterStatus(status.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              filterStatus === status.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Sort Options */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Sort By</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'name', label: 'Name' },
                          { key: 'category', label: 'Category' },
                          { key: 'status', label: 'Status' },
                          { key: 'dailyRate', label: 'Daily Rate' },
                          { key: 'dateEnd', label: 'End Date' },
                        ].map(sort => (
                          <button
                            key={sort.key}
                            onClick={() => setSortBy(sort.key as typeof sortBy)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              sortBy === sort.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                            }`}
                          >
                            {sort.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-1.5 rounded-lg text-xs transition-all bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white flex items-center gap-1"
                          title="Toggle sort order"
                        >
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Export (E)"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-violet-400" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    Export Markdown
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={printing || equipment.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Print (P)"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    Print Report
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => { setModalOpen(true); setForm({ name: '', category: 'camera', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' }) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Equipment
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-5 py-3 text-sm">
            <Package className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-2" />
            List<span className="text-xs opacity-60 ml-1">(1)</span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 inline-block mr-2" />
            Analytics<span className="text-xs opacity-60 ml-1">(2)</span>
          </button>
          <button
            onClick={() => setViewMode('conflicts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'conflicts'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline-block" />
            Conflicts<span className="text-xs opacity-60 ml-1">(3)</span>
            {conflictStats.high > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {conflictStats.high}
              </span>
            )}
          </button>
        </div>

        {/* List/Analytics View */}
        {(viewMode === 'list' || viewMode === 'analytics') && (
          <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Items" value={stats.totalItems} color="indigo" icon={<Package className="w-5 h-5 text-indigo-400" />} />
          <StatCard title="Daily Value" value={`₹${(stats.totalDailyRate / 1000).toFixed(0)}K`} color="emerald" icon={<DollarSign className="w-5 h-5 text-emerald-400" />} />
          <StatCard title="Available" value={stats.available} color="emerald" icon={<Package className="w-5 h-5 text-emerald-400" />} />
          <StatCard title="In Use" value={stats.inUse} color="amber" icon={<Clapperboard className="w-5 h-5 text-amber-400" />} />
          <StatCard title="Maintenance" value={stats.maintenance} color="red" icon={<AlertTriangle className="w-5 h-5 text-red-400" />} />
          <StatCard title="Returned" value={stats.returned} color="slate" icon={<Package className="w-5 h-5 text-slate-400" />} />
        </div>

        {/* Charts */}
        {categoryData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}/day`, '']}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-sm capitalize">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Status Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [value, 'Items']}
                    />
                    <Bar dataKey="name" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Conflicts View */}
        {viewMode === 'conflicts' && (
          <div className="space-y-6">
            {/* Budget Limit Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Daily Budget Limit</h3>
                  <p className="text-sm text-slate-400">Set threshold for budget alerts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Conflict Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Issues</p>
                <p className="text-3xl font-bold mt-1">{conflictStats.total}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400 uppercase tracking-wider">High Priority</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{conflictStats.high}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs text-amber-400 uppercase tracking-wider">Medium Priority</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{conflictStats.medium}</p>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Low Priority</p>
                <p className="text-3xl font-bold text-slate-400 mt-1">{conflictStats.low}</p>
              </div>
            </div>

            {/* Conflict Type Summary */}
            {conflictTypeStats.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-semibold mb-3">Issues by Type</h3>
                <div className="flex flex-wrap gap-3">
                  {conflictTypeStats.map(({ type, count }) => (
                    <span key={type} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm">
                      <span className="capitalize">{type.replace('-', ' ')}</span>: <span className="text-indigo-400 font-medium">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* All Clear State */}
            {equipmentConflicts.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
                <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-400">All Clear!</h3>
                <p className="text-slate-400 mt-2">No issues detected with your equipment rentals.</p>
              </div>
            ) : (
              /* Conflict Cards */
              <div className="grid gap-4">
                {equipmentConflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={`bg-slate-900 border rounded-xl p-5 ${
                      conflict.severity === 'high'
                        ? 'border-red-500/30'
                        : conflict.severity === 'medium'
                        ? 'border-amber-500/30'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          conflict.severity === 'high'
                            ? 'bg-red-500/20'
                            : conflict.severity === 'medium'
                            ? 'bg-amber-500/20'
                            : 'bg-slate-800'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            conflict.severity === 'high'
                              ? 'text-red-400'
                              : conflict.severity === 'medium'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{conflict.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              conflict.severity === 'high'
                                ? 'bg-red-500/20 text-red-400'
                                : conflict.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {conflict.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{conflict.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500">
                        <span className="text-indigo-400 font-medium">Recommendation:</span> {conflict.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search equipment... (/)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            {/* Inline Filters - hidden when filter panel is open */}
            {!showFilters && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            )}
            <span className="text-xs text-slate-500">
              Showing {filtered.length} of {equipment.length} items
              {activeFilterCount > 0 && showFilters && (
                <span className="ml-2 text-indigo-400">({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active)</span>
              )}
            </span>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Select All Header */}
          {filtered.length > 0 && (
            <div className="col-span-full flex items-center gap-3 mb-2 px-2">
              <input
                type="checkbox"
                checked={selectedEquipment.size === filtered.length && filtered.length > 0}
                onChange={(e) => e.target.checked ? selectAllEquipment() : clearSelection()}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm text-slate-400">
                {selectedEquipment.size > 0 ? `${selectedEquipment.size} of ${filtered.length} selected` : 'Select all'}
              </span>
              {selectedEquipment.size > 0 && (
                <button onClick={clearSelection} className="text-xs text-indigo-400 hover:text-indigo-300 ml-2">Clear</button>
              )}
            </div>
          )}
          {filtered.map((eq) => (
            <div 
              key={eq.id} 
              className={`bg-slate-900 border rounded-xl p-5 transition-all group ${
                selectedEquipment.has(eq.id) 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedEquipment.has(eq.id)}
                  onChange={() => toggleEquipmentSelection(eq.id)}
                  className="w-4 h-4 mt-1 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{eq.name}</h3>
                      <p className="text-slate-500 text-sm">{eq.vendor || 'No vendor'}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(eq)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(eq.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400 capitalize">
                      {eq.category}
                    </span>
                    <StatusBadge status={eq.status} />
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <p className="text-sm text-slate-400">₹{eq.dailyRate.toLocaleString()}/day</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(eq.dateStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - 
                        {new Date(eq.dateEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No equipment found</p>
              <button
                onClick={() => { setSearch(''); setFilterCat('all'); setFilterStatus('all') }}
                className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Floating Bulk Actions Toolbar */}
        {showBulkActions && selectedEquipment.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                {selectedEquipment.size} selected
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="relative" ref={bulkStatusMenuRef}>
              <button
                onClick={() => setShowBulkStatusMenu(!showBulkStatusMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                Change Status
                <ChevronRight className={`w-4 h-4 transition-transform ${showBulkStatusMenu ? 'rotate-90' : ''}`} />
              </button>
              {showBulkStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-700 border border-slate-600 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                  {['available', 'in-use', 'maintenance', 'returned'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-600 transition-colors flex items-center gap-2 capitalize"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'available' ? 'bg-emerald-500' :
                        status === 'in-use' ? 'bg-amber-500' :
                        status === 'maintenance' ? 'bg-red-500' : 'bg-slate-500'
                      }`} />
                      {status === 'in-use' ? 'In Use' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6" ref={deleteConfirmRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Delete Equipment</h2>
                </div>
                <button onClick={() => setShowDeleteConfirm(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete {selectedEquipment.size} equipment item{selectedEquipment.size > 1 ? 's' : ''}? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add Equipment</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Equipment Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., RED Komodo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      value={form.dateStart}
                      onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">End Date *</label>
                    <input
                      type="date"
                      value={form.dateEnd}
                      onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="15000"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Vendor</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Film Gear"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Equipment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit Equipment</h2>
                <button
                  onClick={() => { setEditModalOpen(false); setEditingEquipment(null) }}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Equipment Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      value={editForm.dateStart}
                      onChange={(e) => setEditForm({ ...editForm, dateStart: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">End Date *</label>
                    <input
                      type="date"
                      value={editForm.dateEnd}
                      onChange={(e) => setEditForm({ ...editForm, dateEnd: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    value={editForm.dailyRate}
                    onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Vendor</label>
                  <input
                    type="text"
                    value={editForm.vendor}
                    onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setEditModalOpen(false); setEditingEquipment(null) }}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowKeyboardHelp(false)}
          >
            <div 
              className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                <button onClick={() => setShowKeyboardHelp(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider mt-2 mb-1">When Filters OPEN (press F)</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter All Status</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">1</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter Available (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter In-Use (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">3</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter Maintenance (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">4</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter Returned (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">5</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Clear Status Filter</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-sm">0</kbd>
                </div>
                <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mt-2 mb-1">When Filters CLOSED</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Switch to List view</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">1</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Switch to Analytics view</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Switch to Conflicts view</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">3</kbd>
                </div>
                <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mt-2 mb-1">Selection</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Select all equipment</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">Ctrl+A</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Delete selected</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">Ctrl+D</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Clear selection</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">Esc</kbd>
                </div>
                <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mt-2 mb-1">Actions</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Refresh equipment data</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Toggle auto-refresh</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-emerald-400 rounded text-sm">A</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Toggle sort order</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">S</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Toggle filters</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">F</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Clear all filters</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">X</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Focus search input</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">/</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Add new equipment</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">N</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Export dropdown</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">E</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Export Markdown</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">M</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Print equipment report</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">P</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">?</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Close modal / Clear</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}