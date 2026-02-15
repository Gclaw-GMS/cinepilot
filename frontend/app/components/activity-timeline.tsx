/**
 * Activity Timeline Component
 * CinePilot Phase 28
 */

'use client'

import { useState, useEffect } from 'react'
import { Activity, getActivity } from '../lib/api-phase28'

interface ActivityTimelineProps {
  projectId: number
}

export default function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadActivity()
  }, [projectId, filter])

  const loadActivity = async () => {
    try {
      const data = await getActivity(projectId, 50)
      if (filter !== 'all') {
        setActivities(data.filter(a => a.type === filter))
      } else {
        setActivities(data)
      }
    } catch (e) {
      // Mock data for demo
      setActivities([
        { id: 1, project_id: projectId, type: 'scene', action: 'Created', details: 'Scene 12 - Beach Chase', user: 'Director', created_at: new Date().toISOString() },
        { id: 2, project_id: projectId, type: 'budget', action: 'Updated', details: 'Equipment budget increased by ₹50,000', user: 'Producer', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, project_id: projectId, type: 'task', action: 'Completed', details: 'Location scouting - Hill Station', user: 'Assistant', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, project_id: projectId, type: 'crew', action: 'Added', details: 'New crew member: Anbu (Art Director)', user: 'HR', created_at: new Date(Date.now() - 86400000).toISOString() },
      ])
    }
  }

  const typeIcons: Record<string, string> = {
    scene: '🎬',
    budget: '💰',
    crew: '👥',
    schedule: '📅',
    task: '✅',
    note: '📝'
  }

  const typeColors: Record<string, string> = {
    scene: 'border-blue-400 bg-blue-50',
    budget: 'border-green-400 bg-green-50',
    crew: 'border-purple-400 bg-purple-50',
    schedule: 'border-yellow-400 bg-yellow-50',
    task: 'border-indigo-400 bg-indigo-50',
    note: 'border-gray-400 bg-gray-50'
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'scene', label: '🎬 Scenes' },
    { value: 'budget', label: '💰 Budget' },
    { value: 'crew', label: '👥 Crew' },
    { value: 'task', label: '✅ Tasks' },
    { value: 'schedule', label: '📅 Schedule' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📜 Activity Timeline</h3>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-2 py-1 text-xs rounded ${
              filter === f.value 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 && (
          <p className="text-gray-500 text-center py-4">No activity yet.</p>
        )}
        
        {activities.map(activity => (
          <div key={activity.id} className={`flex gap-3 p-3 rounded border-l-4 ${typeColors[activity.type]}`}>
            <div className="text-2xl">{typeIcons[activity.type]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{activity.action}</span>
                <span className="text-gray-500 text-sm">{activity.details}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                👤 {activity.user} • {formatTime(activity.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
