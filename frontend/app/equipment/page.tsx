'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Package, DollarSign, Camera, Clapperboard, Search, X, Loader2, AlertCircle, TrendingUp, Download, FileText, Edit2, CheckCircle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
}

const CATEGORIES = [
  { id: 'camera', label: 'Camera', icon: Camera, color: '#6366f1' },
  { id: 'lighting', label: 'Lighting', icon: Package, color: '#f59e0b' },
  { id: 'sound', label: 'Sound', icon: Package, color: '#10b981' },
  { id: 'grip', label: 'Grip', icon: Clapperboard, color: '#ec4899' },
  { id: 'art', label: 'Art', icon: Package, color: '#8b5cf6' },
]

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  'in-use': '#f59e0b',
  maintenance: '#ef4444',
  returned: '#6b7280',
}

const DEMO_EQUIPMENT: EquipmentRental[] = [
  { id: 'demo-1', projectId: 'demo', name: 'RED Komodo', category: 'camera', dateStart: '2026-03-01', dateEnd: '2026-03-15', dailyRate: 15000, vendor: 'Film Gear', status: 'available', quantity: 1, notes: null },
  { id: 'demo-2', projectId: 'demo', name: 'Arri SkyPanel S60', category: 'lighting', dateStart: '2026-03-01', dateEnd: '2026-03-10', dailyRate: 8000, vendor: 'Light House', status: 'in-use', quantity: 1, notes: null },
  { id: 'demo-3', projectId: 'demo', name: 'Sennheiser MKH 416', category: 'sound', dateStart: '2026-03-05', dateEnd: '2026-03-20', dailyRate: 2500, vendor: 'Audio Pro', status: 'available', quantity: 1, notes: null },
  { id: 'demo-4', projectId: 'demo', name: 'DJI Ronin RS3 Pro', category: 'grip', dateStart: '2026-02-20', dateEnd: '2026-02-28', dailyRate: 5000, vendor: 'Stabilizer Co', status: 'maintenance', quantity: 1, notes: null },
  { id: 'demo-5', projectId: 'demo', name: 'Alexa Mini LF', category: 'camera', dateStart: '2026-03-10', dateEnd: '2026-03-25', dailyRate: 35000, vendor: 'Film Gear', status: 'available', quantity: 1, notes: null },
  { id: 'demo-6', projectId: 'demo', name: 'Arri M40', category: 'lighting', dateStart: '2026-03-05', dateEnd: '2026-03-20', dailyRate: 12000, vendor: 'Light House', status: 'in-use', quantity: 1, notes: null },
  { id: 'demo-7', projectId: 'demo', name: 'Zoom F6', category: 'sound', dateStart: '2026-03-01', dateEnd: '2026-03-15', dailyRate: 1200, vendor: 'Audio Pro', status: 'available', quantity: 1, notes: null },
  { id: 'demo-8', projectId: 'demo', name: 'Dana Dolly', category: 'grip', dateStart: '2026-03-10', dateEnd: '2026-03-25', dailyRate: 1500, vendor: 'Film Gear', status: 'available', quantity: 1, notes: null },
  { id: 'demo-9', projectId: 'demo', name: 'Cooke S7/i', category: 'camera', dateStart: '2026-03-15', dateEnd: '2026-03-30', dailyRate: 25000, vendor: 'Lens Hub', status: 'available', quantity: 1, notes: null },
  { id: 'demo-10', projectId: 'demo', name: 'Kino Flo 4Bank', category: 'lighting', dateStart: '2026-03-01', dateEnd: '2026-03-15', dailyRate: 2000, vendor: 'Light House', status: 'returned', quantity: 1, notes: null },
]

function StatCard({ title, value, color, icon, subtext }: { title: string; value: string | number; color: string; icon: React.ReactNode; subtext?: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  }
  
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.indigo}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
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
  const [stats, setStats] = useState<EquipmentStats>({ totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: 'camera',
    status: 'available',
    dateStart: '',
    dateEnd: '',
    dailyRate: '',
    vendor: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsDemoMode(false)
    try {
      const res = await fetch('/api/equipment')
      const data = await res.json()
      
      if (res.ok) {
        // Check if API indicates demo mode
        if (data.isDemoMode) {
          setIsDemoMode(true)
        }
        setEquipment(data.rentals || [])
        setStats(data.stats || { totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0 })
      } else {
        // Fall back to demo data if API fails
        setIsDemoMode(true)
        setEquipment(DEMO_EQUIPMENT)
        const totalDailyRate = DEMO_EQUIPMENT.reduce((acc, eq) => acc + eq.dailyRate, 0)
        setStats({
          totalItems: DEMO_EQUIPMENT.length,
          totalDailyRate,
          available: DEMO_EQUIPMENT.filter(eq => eq.status === 'available').length,
          inUse: DEMO_EQUIPMENT.filter(eq => eq.status === 'in-use').length,
        })
      }
    } catch (err) {
      // Fall back to demo data on error
      console.error('Failed to fetch equipment:', err)
      setIsDemoMode(true)
      setEquipment(DEMO_EQUIPMENT)
      const totalDailyRate = DEMO_EQUIPMENT.reduce((acc, eq) => acc + eq.dailyRate, 0)
      setStats({
        totalItems: DEMO_EQUIPMENT.length,
        totalDailyRate,
        available: DEMO_EQUIPMENT.filter(eq => eq.status === 'available').length,
        inUse: DEMO_EQUIPMENT.filter(eq => eq.status === 'in-use').length,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      (eq.vendor?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchCat = filterCat === 'all' || eq.category === filterCat
    return matchSearch && matchCat
  })

  // Chart data preparation
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    const rates: Record<string, number> = {}
    equipment.forEach(eq => {
      counts[eq.category] = (counts[eq.category] || 0) + 1
      rates[eq.category] = (rates[eq.category] || 0) + eq.dailyRate
    })
    return {
      pie: Object.entries(counts).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value,
        fill: CATEGORIES.find(c => c.id === name)?.color || '#6366f1'
      })),
      bar: Object.entries(rates).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        rate: value
      }))
    }
  }, [equipment])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    equipment.forEach(eq => {
      counts[eq.status] = (counts[eq.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: name === 'in-use' ? 'In Use' : name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] || '#6b7280'
    }))
  }, [equipment])

  const vendorData = useMemo(() => {
    const rates: Record<string, number> = {}
    equipment.forEach(eq => {
      if (eq.vendor) {
        rates[eq.vendor] = (rates[eq.vendor] || 0) + eq.dailyRate
      }
    })
    return Object.entries(rates)
      .map(([name, rate]) => ({ name, rate }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [equipment])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; fill: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm font-medium">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-slate-400 text-xs mt-1">
              {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let res
      if (editingId) {
        // Update existing equipment
        res = await fetch('/api/equipment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        })
      } else {
        // Create new equipment
        res = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      
      if (res.ok) {
        setModalOpen(false)
        setEditingId(null)
        setForm({ name: '', category: 'camera', status: 'available', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' })
        setToast({ type: 'success', message: editingId ? 'Equipment updated successfully' : 'Equipment added successfully' })
        setTimeout(() => setToast(null), 3000)
        await fetchEquipment()
      } else {
        const data = await res.json()
        setError(data.error || (editingId ? 'Failed to update equipment' : 'Failed to add equipment'))
        setToast({ type: 'error', message: data.error || (editingId ? 'Failed to update equipment' : 'Failed to add equipment') })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (err) {
      setError(editingId ? 'Failed to update equipment' : 'Failed to add equipment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this equipment?')) return
    
    try {
      const res = await fetch(`/api/equipment?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setToast({ type: 'success', message: 'Equipment removed successfully' })
        setTimeout(() => setToast(null), 3000)
        await fetchEquipment()
      } else {
        setToast({ type: 'error', message: 'Failed to remove equipment' })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (err) {
      console.error('Failed to delete equipment:', err)
      setToast({ type: 'error', message: 'Failed to remove equipment' })
      setTimeout(() => setToast(null), 5000)
    }
  }

  // Export equipment to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Status', 'Vendor', 'Daily Rate (₹)', 'Start Date', 'End Date', 'Notes']
    const rows = filtered.map(eq => [
      eq.name,
      eq.category,
      eq.status,
      eq.vendor || '',
      eq.dailyRate.toString(),
      eq.dateStart,
      eq.dateEnd,
      eq.notes || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `equipment-rental-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Equipment Rental</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your production equipment inventory</p>
          </div>
          {isDemoMode && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm shadow-xl border ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Items" value={stats.totalItems} color="indigo" icon={<Package className="w-5 h-5 text-indigo-400" />} subtext={`${equipment.length} rentals tracked`} />
        <StatCard title="Daily Value" value={`₹${(stats.totalDailyRate / 1000).toFixed(0)}K`} color="emerald" icon={<DollarSign className="w-5 h-5 text-emerald-400" />} subtext="per day" />
        <StatCard title="Available" value={stats.available} color="violet" icon={<Camera className="w-5 h-5 text-violet-400" />} subtext={`${Math.round((stats.available / (stats.totalItems || 1)) * 100)}% of inventory`} />
        <StatCard title="In Use" value={stats.inUse} color="amber" icon={<Clapperboard className="w-5 h-5 text-amber-400" />} subtext={`${Math.round((stats.inUse / (stats.totalItems || 1)) * 100)}% deployed`} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">By Category</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryData.pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold">By Status</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendors by Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Top Vendors</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v/1000)}k`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} name="Daily Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filterCat === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                  filterCat === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
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
                  onClick={() => {
                    setEditingId(eq.id)
                    setForm({
                      name: eq.name,
                      category: eq.category,
                      status: eq.status,
                      dateStart: eq.dateStart,
                      dateEnd: eq.dateEnd,
                      dailyRate: eq.dailyRate.toString(),
                      vendor: eq.vendor || '',
                      notes: eq.notes || '',
                    })
                    setModalOpen(true)
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                  title="Edit equipment"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(eq.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
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
              onClick={() => setModalOpen(true)}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Add your first equipment
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{editingId ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setEditingId(null)
                  setForm({ name: '', category: 'camera', status: 'available', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' })
                }}
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
              
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
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
                  onClick={() => {
                    setModalOpen(false)
                    setEditingId(null)
                    setForm({ name: '', category: 'camera', status: 'available', dateStart: '', dateEnd: '', dailyRate: '', vendor: '', notes: '' })
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
