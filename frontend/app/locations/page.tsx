'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'
import Link from 'next/link'

interface Location {
  id: number
  project_id: number
  name: string
  tamil: string | null
  type: string
  address: string
  notes?: string
  permit_status: string
}

const DEMO_LOCATIONS: Location[] = [
  { id: 1, project_id: 1, name: 'Chennai Street', tamil: 'சென்னை வீதி', type: 'outdoor', address: 'Anna Nagar, Chennai', permit_status: 'approved' },
  { id: 2, project_id: 1, name: 'Priya Apartment', tamil: 'பிரியாவின் அபார்ட்மென்ட்', type: 'indoor', address: 'T Nagar, Chennai', permit_status: 'approved' },
  { id: 3, project_id: 2, name: 'Meenakshi Temple', tamil: 'மீனாட்சி கோவில்', type: 'religious', address: 'Madurai', permit_status: 'pending' },
  { id: 4, project_id: 2, name: 'Madurai Market', tamil: 'மதுரை சந்தை', type: 'outdoor', address: 'Velan Market, Madurai', permit_status: 'approved' },
]

const LOCATION_TYPES = [
  { value: 'indoor', label: 'Indoor', icon: '🏠' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'religious', label: 'Religious', icon: '🛕' },
  { value: 'commercial', label: 'Commercial', icon: '🏢' },
  { value: 'residential', label: 'Residential', icon: '🏘️' },
]

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProject, setSelectedProject] = useState(1)
  const [newLocation, setNewLocation] = useState({
    name: '',
    tamil: '',
    type: 'outdoor',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const data = await api.locations.list()
      setLocations(data || [])
    } catch (e) {
      setLocations(DEMO_LOCATIONS)
    }
    setLoading(false)
  }

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) return

    const location: Partial<Location> = {
      project_id: selectedProject,
      name: newLocation.name,
      tamil: newLocation.tamil || undefined,
      type: newLocation.type,
      address: newLocation.address,
      notes: newLocation.notes || undefined
    }

    try {
      const saved = await api.locations.create(location as any)
      if (saved) {
        setLocations([...locations, saved])
      }
    } catch (e) {
      // Demo fallback
      setLocations([...locations, { ...location, id: Date.now(), permit_status: 'pending' } as Location])
    }

    setNewLocation({ name: '', tamil: '', type: 'outdoor', address: '', notes: '' })
    setShowAdd(false)
  }

  const getPermitColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'denied': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    const t = LOCATION_TYPES.find(t => t.value === type)
    return t?.icon || '📍'
  }

  const filteredLocations = locations.filter(l => l.project_id === selectedProject)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">←</Link>
          <div>
            <h1 className="text-2xl font-bold">📍 Locations</h1>
            <p className="text-gray-500 mt-1">Manage shooting locations and permits</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-medium"
        >
          + Add Location
        </button>
      </div>

      {/* Project Filter */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 mb-6">
        <label className="text-sm text-gray-400 block mb-2">Filter by Project</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProject(1)}
            className={`px-4 py-2 rounded font-medium ${
              selectedProject === 1 
                ? 'bg-cinepilot-accent text-black' 
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            🎬 இதயத்தின் ஒலி
          </button>
          <button
            onClick={() => setSelectedProject(2)}
            className={`px-4 py-2 rounded font-medium ${
              selectedProject === 2 
                ? 'bg-cinepilot-accent text-black' 
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            🎬 Veera's Journey
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading locations...</div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-xl font-semibold mb-2">No Locations Yet</h3>
          <p className="text-gray-400 mb-4">Add your first shooting location</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium"
          >
            + Add Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-5 hover:border-cinepilot-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(location.type)}</span>
                  <div>
                    <h3 className="font-semibold">{location.name}</h3>
                    {location.tamil && (
                      <p className="text-sm text-purple-400">{location.tamil}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getPermitColor(location.permit_status)}`}>
                  {location.permit_status}
                </span>
              </div>
              
              <div className="text-sm text-gray-400 mb-2">
                📍 {location.address || 'Address not specified'}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                  {LOCATION_TYPES.find(t => t.value === location.type)?.label || location.type}
                </span>
              </div>
              
              {location.notes && (
                <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-800">
                  {location.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Location</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Location Name</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="e.g., Chennai Beach"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Tamil Name (Optional)</label>
                <input
                  type="text"
                  value={newLocation.tamil}
                  onChange={(e) => setNewLocation({ ...newLocation, tamil: e.target.value })}
                  placeholder="e.g., சென்னை கடல்"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Type</label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none"
                >
                  {LOCATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Notes</label>
                <textarea
                  value={newLocation.notes}
                  onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLocation}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-medium"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
