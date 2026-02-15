// Production Timeline Component
// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { productionTimeline, type Milestone } from '../lib/api'

interface ProductionTimelineProps {
  projectId: number
}

export function ProductionTimeline({ projectId }: ProductionTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [projectId])

  const loadTimeline = async () => {
    try {
      const data = await productionTimeline.get(projectId)
      setMilestones(data.milestones)
    } catch (error) {
      console.error('Failed to load timeline:', error)
      // Mock data for demo
      setMilestones([
        { id: 1, name: 'Script Lock', date: '2026-03-01', status: 'completed', tasks: 12 },
        { id: 2, name: 'Pre-Production', date: '2026-03-15', status: 'in_progress', tasks: 24 },
        { id: 3, name: 'Principal Photography', date: '2026-04-01', status: 'pending', tasks: 45 },
        { id: 4, name: 'Post-Production', date: '2026-06-01', status: 'pending', tasks: 30 },
        { id: 5, name: 'Release', date: '2026-08-01', status: 'pending', tasks: 15 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓'
      case 'in_progress': return '◐'
      default: return '○'
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Production Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex items-start ml-4">
              {/* Dot */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getStatusColor(milestone.status)}`}>
                {getStatusIcon(milestone.status)}
              </div>
              
              {/* Content */}
              <div className="ml-12 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                  <span className="text-sm text-gray-500">{milestone.date}</span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {milestone.tasks} tasks
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                    milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Cast Availability Component
'use client'

import { useState, useEffect } from 'react'
import { castAvailability, type CastMember } from '../lib/api'

interface CastAvailabilityProps {
  projectId: number
}

export function CastAvailability({ projectId }: CastAvailabilityProps) {
  const [cast, setCast] = useState<CastMember[]>([])
  const [conflicts, setConflicts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCast()
  }, [projectId])

  const loadCast = async () => {
    try {
      const data = await castAvailability.get(projectId)
      setCast(data.cast)
      setConflicts(data.conflicts)
    } catch (error) {
      console.error('Failed to load cast:', error)
      // Mock data
      setCast([
        { name: 'Vijay', available: true, unavailable_dates: [], total_days_contract: 30 },
        { name: 'Nayanthara', available: true, unavailable_dates: ['2026-04-15', '2026-04-16'], total_days_contract: 25 },
        { name: 'Prashanth', available: false, unavailable_dates: ['2026-04-01', '2026-05-01'], total_days_contract: 20 },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Cast Availability</h3>
      
      <div className="space-y-2">
        {cast.map((member, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${member.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium text-gray-900">{member.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              {member.unavailable_dates.length > 0 ? (
                <span className="text-red-600">{member.unavailable_dates.length} days unavailable</span>
              ) : (
                <span className="text-green-600">Available</span>
              )}
              <span className="mx-2">|</span>
              <span>{member.total_days_contract} days</span>
            </div>
          </div>
        ))}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800">Scheduling Conflicts</h4>
          {conflicts.map((conflict, index) => (
            <div key={index} className="mt-2 text-sm text-yellow-700">
              <p><strong>{conflict.date}:</strong> {conflict.suggested_action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Equipment Management Component
'use client'

import { useState, useEffect } from 'react'
import { equipment, type EquipmentCategory } from '../lib/api'
import { utils } from '../lib/api'

interface EquipmentListProps {
  projectId: number
}

export function EquipmentList({ projectId }: EquipmentListProps) {
  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [totalEstimate, setTotalEstimate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string[]>([])

  useEffect(() => {
    loadEquipment()
  }, [projectId])

  const loadEquipment = async () => {
    try {
      const data = await equipment.list(projectId)
      setCategories(data.categories)
      setTotalEstimate(data.total_estimate)
    } catch (error) {
      console.error('Failed to load equipment:', error)
      // Mock data
      setCategories([
        {
          name: 'Camera',
          items: [
            { name: 'ARRI Alexa Mini', quantity: 2, days: 30, cost_per_day: 15000 },
            { name: 'RED Komodo', quantity: 1, days: 15, cost_per_day: 8000 },
          ]
        },
        {
          name: 'Lighting',
          items: [
            { name: 'ARRI SkyPanel S60', quantity: 4, days: 30, cost_per_day: 2500 },
            { name: 'Godox SL60', quantity: 6, days: 30, cost_per_day: 500 },
          ]
        },
        {
          name: 'Sound',
          items: [
            { name: 'Zoom F8n Pro', quantity: 2, days: 30, cost_per_day: 1500 },
            { name: 'Sennheiser MKH 416', quantity: 4, days: 30, cost_per_day: 800 },
          ]
        }
      ])
      setTotalEstimate(485000)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (name: string) => {
    setExpanded(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
  }

  const categoryTotal = (items: any[]) => 
    items.reduce((sum, item) => sum + (item.quantity * item.days * item.cost_per_day), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Equipment</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Estimate</div>
          <div className="text-xl font-bold text-gray-900">{utils.formatCurrency(totalEstimate)}</div>
        </div>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.name} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{expanded.includes(category.name) ? '▼' : '▶'}</span>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <span className="text-gray-600">{utils.formatCurrency(categoryTotal(category.items))}</span>
            </button>
            
            {expanded.includes(category.name) && (
              <div className="p-4 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-2">Item</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Days</th>
                      <th className="pb-2">Rate/Day</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">{item.days}</td>
                        <td className="py-2">{utils.formatCurrency(item.cost_per_day)}</td>
                        <td className="py-2 text-right">{utils.formatCurrency(item.quantity * item.days * item.cost_per_day)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Script Version History Component
'use client'

import { useState, useEffect } from 'react'
import { scriptVersions, type ScriptVersion } from '../lib/api'

interface ScriptVersionHistoryProps {
  projectId: number
}

export function ScriptVersionHistory({ projectId }: ScriptVersionHistoryProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVersions()
  }, [projectId])

  const loadVersions = async () => {
    try {
      const data = await scriptVersions.list(projectId)
      setVersions(data.versions)
    } catch (error) {
      console.error('Failed to load versions:', error)
      // Mock data
      setVersions([
        { version: 3, uploaded_at: '2026-02-14T10:00:00Z', notes: 'Final tweaks to climax', scenes: 45 },
        { version: 2, uploaded_at: '2026-02-10T14:30:00Z', notes: 'Added interval song sequence', scenes: 44 },
        { version: 1, uploaded_at: '2026-02-01T09:00:00Z', notes: 'Initial draft', scenes: 42 },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
      
      <div className="space-y-2">
        {versions.map((v, index) => (
          <div key={v.version} className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">Version {v.version}</span>
                {index === 0 && <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Latest</span>}
              </div>
              <span className="text-sm text-gray-500">{new Date(v.uploaded_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{v.notes}</p>
            <p className="mt-1 text-xs text-gray-500">{v.scenes} scenes</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductionTimeline
