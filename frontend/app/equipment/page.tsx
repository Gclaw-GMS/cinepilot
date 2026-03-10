'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Package, DollarSign, Camera, Clapperboard, Search, X, Loader2, AlertCircle, Trash2, Edit2, RefreshCw, HelpCircle, Filter, AlertTriangle, Download } from 'lucide-react'
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

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()

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
    }
  }, [])

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = () => {
    fetchEquipment()
  }

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
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
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setSearch('')
          setFilterCat('all')
          setFilterStatus('all')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, editModalOpen, showExportMenu])

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

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      (eq.vendor?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      eq.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || eq.category === filterCat
    const matchStatus = filterStatus === 'all' || eq.status === filterStatus
    return matchSearch && matchCat && matchStatus
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
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs">?</span>
            </button>
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
            <span className="text-xs text-slate-500">
              Showing {filtered.length} of {equipment.length} items
            </span>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((eq) => (
            <div key={eq.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
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
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Refresh equipment data</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">R</kbd>
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