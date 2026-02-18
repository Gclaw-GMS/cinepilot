'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, PageHeader, StatCard } from '@/components/ui'
import { Plus, Package, DollarSign, Camera, Clapperboard } from 'lucide-react'

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
}

const CATEGORIES = [
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'lighting', label: 'Lighting', icon: Package },
  { id: 'sound', label: 'Sound', icon: Package },
  { id: 'grip', label: 'Grip', icon: Clapperboard },
  { id: 'art', label: 'Art', icon: Package },
]

const DEMO_EQUIPMENT: Equipment[] = [
  { id: 1, project_id: 1, name: 'RED Komodo', category: 'camera', quantity: 2, daily_rate: 15000, vendor: 'Film Gear', status: 'available' },
  { id: 2, project_id: 1, name: 'Arri SkyPanel S60', category: 'lighting', quantity: 4, daily_rate: 8000, vendor: 'Light House', status: 'in-use' },
  { id: 3, project_id: 1, name: 'Sennheiser MKH 416', category: 'sound', quantity: 3, daily_rate: 2500, vendor: 'Audio Pro', status: 'available' },
  { id: 4, project_id: 1, name: 'DJI Ronin RS3 Pro', category: 'grip', quantity: 2, daily_rate: 5000, vendor: 'Stabilizer Co', status: 'maintenance' },
  { id: 5, project_id: 1, name: 'Alexa Mini LF', category: 'camera', quantity: 1, daily_rate: 35000, vendor: 'Film Gear', status: 'available' },
]

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    setEquipment(DEMO_EQUIPMENT)
    setLoading(false)
  }, [])

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || eq.category === filterCat
    return matchSearch && matchCat
  })

  const totalValue = equipment.reduce((acc, eq) => acc + (eq.daily_rate * eq.quantity), 0)
  const availableCount = equipment.filter(eq => eq.status === 'available').length
  const inUseCount = equipment.filter(eq => eq.status === 'in-use').length

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <PageHeader title="Equipment" subtitle="Manage your production equipment inventory" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Items" value={equipment.length} color="indigo" icon={<Package className="w-5 h-5" />} />
        <StatCard title="Daily Value" value={`₹${(totalValue/1000).toFixed(0)}K`} color="emerald" icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Available" value={availableCount} color="violet" icon={<Camera className="w-5 h-5" />} />
        <StatCard title="In Use" value={inUseCount} color="amber" icon={<Clapperboard className="w-5 h-5" />} />
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          />
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filterCat === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((eq) => (
          <Card key={eq.id} hover className="group">
            <h3 className="font-semibold text-lg">{eq.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{eq.vendor || 'No vendor'}</p>
            <div className="flex items-center justify-between">
              <Badge variant={eq.status}>{eq.status}</Badge>
              <div className="text-right">
                <p className="text-sm text-slate-400">₹{eq.daily_rate.toLocaleString()}/day</p>
                <p className="text-xs text-slate-500">Qty: {eq.quantity}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
