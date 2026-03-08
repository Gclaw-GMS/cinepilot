'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Package, DollarSign, Camera, Clapperboard, Search, X, Loader2, AlertCircle, Trash2, Edit2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
]

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
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
  const [stats, setStats] = useState<EquipmentStats>({ totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
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

  // Calculate category breakdown for chart
  const categoryData = useMemo(() => {
    const breakdown: Record<string, number> = {}
    equipment.forEach(eq => {
      breakdown[eq.category] = (breakdown[eq.category] || 0) + eq.dailyRate
    })
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  }, [equipment])

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/equipment')
      const data = await res.json()
      
      if (res.ok) {
        setEquipment(data.rentals || [])
        setStats(data.stats || { totalItems: 0, totalDailyRate: 0, available: 0, inUse: 0 })
      } else {
        // Fall back to demo data if API fails
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
      console.error('Failed to fetch equipment:', err)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
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
      }
    } catch (err) {
      console.error('Failed to delete equipment:', err)
    }
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
        <div>
          <h1 className="text-2xl font-semibold">Equipment Rental</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your production equipment inventory</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Items" value={stats.totalItems} color="indigo" icon={<Package className="w-5 h-5 text-indigo-400" />} />
        <StatCard title="Daily Value" value={`₹${(stats.totalDailyRate / 1000).toFixed(0)}K`} color="emerald" icon={<DollarSign className="w-5 h-5 text-emerald-400" />} />
        <StatCard title="Available" value={stats.available} color="violet" icon={<Camera className="w-5 h-5 text-violet-400" />} />
        <StatCard title="In Use" value={stats.inUse} color="amber" icon={<Clapperboard className="w-5 h-5 text-amber-400" />} />
      </div>

      {/* Category Breakdown Chart */}
      {categoryData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
      )}

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
                  onClick={() => handleEdit(eq)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(eq.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
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
              onClick={() => setModalOpen(true)}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Add your first equipment
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
    </div>
  )
}
