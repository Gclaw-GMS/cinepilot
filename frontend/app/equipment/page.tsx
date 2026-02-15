'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'
import type { Project } from '@/lib/types'

interface Equipment {
  id: number
  project_id: number
  name: string
  category: string
  quantity: number
  daily_rate: number
  vendor?: string
  status: string
  notes?: string
  created_at: string
}

const CATEGORIES = ['camera', 'lighting', 'sound', 'grip', 'art']
const STATUSES = ['available', 'in-use', 'maintenance']

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    category: 'camera',
    quantity: 1,
    daily_rate: 0,
    vendor: '',
    status: 'available',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const eqData = await api.equipment.list(1) as Equipment[]
      const projData = await api.projects.list() as Project[]
      setEquipment(eqData || [])
      setProjects(projData || [])
    } catch (e) {
      console.error('Error fetching data:', e)
      setEquipment(DEMO_EQUIPMENT)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newEquipment: Equipment = {
      id: Date.now(),
      project_id: selectedProject || 1,
      name: form.name,
      category: form.category,
      quantity: form.quantity,
      daily_rate: form.daily_rate,
      vendor: form.vendor || undefined,
      status: form.status,
      notes: form.notes || undefined,
      created_at: new Date().toISOString()
    }

    try {
      await (api.equipment as any).create(newEquipment)
      setEquipment([...equipment, newEquipment])
    } catch (e) {
      // Fallback to local
      setEquipment([...equipment, newEquipment])
    }

    setForm({
      name: '',
      category: 'camera',
      quantity: 1,
      daily_rate: 0,
      vendor: '',
      status: 'available',
      notes: ''
    })
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this equipment?')) return
    try {
      await (api.equipment as any).delete(id)
      setEquipment(equipment.filter(e => e.id !== id))
    } catch (e) {
      setEquipment(equipment.filter(e => e.id !== id))
    }
  }

  const filteredEquipment = equipment.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  })

  const totalValue = equipment.reduce((sum, e) => sum + (e.daily_rate * e.quantity), 0)

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      camera: '📷',
      lighting: '💡',
      sound: '🎤',
      grip: '🔧',
      art: '🎨'
    }
    return icons[cat] || '📦'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500/20 text-green-400',
      'in-use': 'bg-yellow-500/20 text-yellow-400',
      maintenance: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const DEMO_EQUIPMENT: Equipment[] = [
    { id: 1, project_id: 1, name: 'ARRI Alexa Mini LF', category: 'camera', quantity: 2, daily_rate: 15000, vendor: 'Film Gear Rentals', status: 'available', created_at: '2026-02-01' },
    { id: 2, project_id: 1, name: 'Cooke S7/i Full Frame Prime Set', category: 'camera', quantity: 1, daily_rate: 25000, vendor: 'Film Gear Rentals', status: 'in-use', created_at: '2026-02-01' },
    { id: 3, project_id: 1, name: 'ARRI SkyPanel S60-C', category: 'lighting', quantity: 4, daily_rate: 3000, vendor: 'Light House Studios', status: 'available', created_at: '2026-02-01' },
    { id: 4, project_id: 1, name: 'Cooke Panchro/i Prime Set', category: 'camera', quantity: 1, daily_rate: 18000, vendor: 'Film Gear Rentals', status: 'available', created_at: '2026-02-01' },
    { id: 5, project_id: 1, name: 'Sennheiser MKH 416 Shotgun Mic', category: 'sound', quantity: 3, daily_rate: 800, vendor: 'Audio Solutions', status: 'available', created_at: '2026-02-01' },
    { id: 6, project_id: 1, name: 'Diavedia 12x12 Butterfly Frame', category: 'grip', quantity: 2, daily_rate: 500, vendor: 'Grip House', status: 'maintenance', created_at: '2026-02-01' },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinepilot-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipment Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your film production equipment</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium text-sm hover:bg-cyan-400 transition-colors"
        >
          + Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-500 text-sm">Total Items</div>
          <div className="text-2xl font-bold">{equipment.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-500 text-sm">Total Value/Day</div>
          <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-500 text-sm">Available</div>
          <div className="text-2xl font-bold text-green-400">
            {equipment.filter(e => e.status === 'available').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-500 text-sm">In Use</div>
          <div className="text-2xl font-bold text-yellow-400">
            {equipment.filter(e => e.status === 'in-use').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => (
          <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.category.toUpperCase()}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Quantity</span>
                <div className="font-medium">{item.quantity}</div>
              </div>
              <div>
                <span className="text-gray-500">Daily Rate</span>
                <div className="font-medium">₹{item.daily_rate.toLocaleString()}</div>
              </div>
            </div>

            {item.vendor && (
              <p className="text-xs text-gray-500 mb-2">Vendor: {item.vendor}</p>
            )}
            
            {item.notes && (
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.notes}</p>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-700">
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 text-xs text-red-400 hover:text-red-300 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No equipment found. Add your first item!
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Add Equipment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Equipment Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.daily_rate}
                    onChange={(e) => setForm({...form, daily_rate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Vendor</label>
                <input
                  type="text"
                  value={form.vendor}
                  onChange={(e) => setForm({...form, vendor: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cinepilot-accent text-black rounded-lg text-sm font-medium hover:bg-cyan-400"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
