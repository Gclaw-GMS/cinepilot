/**
 * Production Assistant - AI-Powered Helper
 * Provides intelligent suggestions and guidance
 */
'use client'

import { useState, useEffect } from 'react'
import { getSceneSuggestions, eventBus, Events } from '../lib/api-phase26'

interface Suggestion {
  type: string
  suggestion: string
  reason?: string
  scene_type?: string
  location_suggestion?: string
  time_suggestion?: string
}

export function ProductionAssistant({ projectId }: { projectId: number }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')

  const fetchSuggestions = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const result = await getSceneSuggestions(projectId, context)
      setSuggestions(result.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expansion': return '📈'
      case 'time_addition': return '🕐'
      case 'location_expansion': return '📍'
      case 'introduction': return '🎬'
      case 'conflict': return '⚔️'
      case 'climax': return '🔥'
      default: return '💡'
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🤖</span>
        <div>
          <h3 className="text-lg font-bold text-purple-900">Production Assistant</h3>
          <p className="text-sm text-purple-600">AI-powered scene suggestions</p>
        </div>
      </div>

      <div className="mb-4">
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Add context or specific requirements..."
          className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          rows={2}
        />
      </div>

      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
      >
        {loading ? 'Analyzing...' : 'Get Suggestions'}
      </button>

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-purple-800">Suggestions</h4>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-3 shadow-sm border border-purple-100"
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">{getTypeIcon(s.type)}</span>
                <div>
                  <p className="font-medium text-purple-900">{s.suggestion}</p>
                  {s.reason && (
                    <p className="text-xs text-purple-600 mt-1">{s.reason}</p>
                  )}
                  {s.scene_type && (
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {s.scene_type}
                      </span>
                      {s.location_suggestion && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          📍 {s.location_suggestion}
                        </span>
                      )}
                      {s.time_suggestion && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          🕐 {s.time_suggestion}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Scene Card Component
 * Reusable scene display with actions
 */
export function SceneCard({ 
  scene, 
  onEdit, 
  onDelete 
}: { 
  scene: any
  onEdit?: () => void
  onDelete?: () => void 
}) {
  const getTimeClass = (tod: string) => {
    switch (tod?.toUpperCase()) {
      case 'DAY': return 'bg-yellow-100 text-yellow-800'
      case 'NIGHT': return 'bg-blue-100 text-blue-800'
      case 'DAWN': return 'bg-orange-100 text-orange-800'
      case 'DUSK': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIEOClass = (ie: string) => {
    return ie?.toUpperCase() === 'INT' 
      ? 'bg-red-100 text-red-800' 
      : ie?.toUpperCase() === 'EXT'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <span className="font-bold text-lg">Scene {scene.scene_number}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${getIEOClass(scene.interior_exterior)}`}>
            {scene.interior_exterior || 'INT/EXT'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${getTimeClass(scene.time_of_day)}`}>
            {scene.time_of_day || 'TIME'}
          </span>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button onClick={onEdit} className="p-1 text-gray-400 hover:text-purple-600">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600">
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {scene.heading && (
        <p className="font-medium text-gray-800 mb-1">{scene.heading}</p>
      )}
      
      {scene.location && (
        <p className="text-sm text-gray-600 flex items-center gap-1">
          📍 {scene.location}
          {scene.location_tamil && <span className="text-gray-400">({scene.location_tamil})</span>}
        </p>
      )}
      
      {scene.description && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{scene.description}</p>
      )}
    </div>
  )
}

/**
 * Budget Overview Widget
 * Quick budget status display
 */
export function BudgetOverview({ budget }: { budget: any }) {
  const estimated = budget?.estimated_total || 0
  const actual = budget?.actual_total || 0
  const remaining = estimated - actual
  const percentUsed = estimated > 0 ? (actual / estimated) * 100 : 0

  const getStatusColor = () => {
    if (percentUsed > 90) return 'text-red-600'
    if (percentUsed > 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        💰 Budget Overview
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated</span>
          <span className="font-medium">₹{estimated.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Spent</span>
          <span className={`font-medium ${getStatusColor()}`}>
            ₹{actual.toLocaleString()}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="text-gray-600">Remaining</span>
          <span className="font-bold text-green-600">
            ₹{remaining.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Utilization</span>
          <span>{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Crew Member Card
 * Display crew with quick actions
 */
export function CrewCard({ 
  member, 
  onCall,
  onMessage 
}: { 
  member: any
  onCall?: () => void
  onMessage?: () => void
}) {
  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      'camera': 'bg-red-100 text-red-700',
      'lighting': 'bg-yellow-100 text-yellow-700',
      'sound': 'bg-blue-100 text-blue-700',
      'art': 'bg-purple-100 text-purple-700',
      'makeup': 'bg-pink-100 text-pink-700',
      'transport': 'bg-green-100 text-green-700'
    }
    return colors[dept?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{member.name}</h4>
          <p className="text-sm text-gray-600">{member.role}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${getDeptColor(member.department)}`}>
          {member.department}
        </span>
      </div>
      
      {member.daily_rate && (
        <p className="text-sm text-gray-500 mt-2">₹{member.daily_rate.toLocaleString()}/day</p>
      )}
      
      {member.phone && (
        <div className="flex gap-2 mt-3">
          {onCall && (
            <button 
              onClick={onCall}
              className="flex-1 py-1.5 bg-green-50 text-green-700 rounded text-sm hover:bg-green-100"
            >
              📞 Call
            </button>
          )}
          {onMessage && (
            <button 
              onClick={onMessage}
              className="flex-1 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
            >
              💬 Message
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Quick Stats Widget
 * Production metrics at a glance
 */
export function QuickStats({ stats }: { stats: any }) {
  const statCards = [
    { label: 'Scenes', value: stats?.scenes || 0, icon: '🎬', color: 'purple' },
    { label: 'Locations', value: stats?.locations || 0, icon: '📍', color: 'blue' },
    { label: 'Crew', value: stats?.crew || 0, icon: '👥', color: 'green' },
    { label: 'Shoot Days', value: stats?.shootDays || 0, icon: '📅', color: 'orange' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, i) => (
        <div 
          key={i}
          className={`bg-${stat.color}-50 rounded-xl p-4 text-center border border-${stat.color}-100`}
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
          <div className="text-xs text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
