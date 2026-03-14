// @ts-nocheck
/**
 * Analytics Dashboard
 * Project analytics and insights display
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { analytics, type Project } from '../lib/api'

interface AnalyticsDashboardProps {
  project: Project
}

export function AnalyticsDashboard({ project }: AnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])
  
  // Refs for useEffect dependencies
  const loadAnalyticsRef = useRef<() => void>(() => {})
  const loadActivityRef = useRef<() => void>(() => {})

  const loadActivity = useCallback(async () => {
    // Demo data (API integration pending)
    setActivities([
      { type: 'scene_added', user: 'Writer', scene: 46, timestamp: '2026-02-14T15:30:00Z' },
      { type: 'schedule_updated', user: 'Director', timestamp: '2026-02-14T14:00:00Z' },
      { type: 'budget_approved', user: 'Producer', amount: 5000000, timestamp: '2026-02-14T12:00:00Z' },
    ])
    setLoading(false)
  }, [])

  const loadAnalytics = useCallback(async () => {
    try {
      const result = await analytics.get(project.id)
      setData(result)
    } catch (err) {
      // Demo data
      setData({
        overview: {
          total_scenes: 45,
          completed_scenes: 30,
          total_locations: 12,
          total_characters: 8,
          shooting_days_completed: 18,
          budget_spent: 2500000,
          budget_remaining: 2500000
        },
        weekly_progress: [
          { week: 'Week 1', scenes_shot: 5, budget_spent: 500000 },
          { week: 'Week 2', scenes_shot: 8, budget_spent: 750000 },
          { week: 'Week 3', scenes_shot: 10, budget_spent: 800000 },
          { week: 'Week 4', scenes_shot: 7, budget_spent: 450000 }
        ],
        upcoming: {
          next_shoot_day: '2026-02-15',
          scenes_remaining: 15,
          estimated_days: 10
        }
      })
    } finally {
      setLoading(false)
    }
  }, [project.id])

  // Update refs when functions change
  useEffect(() => {
    loadAnalyticsRef.current = loadAnalytics
    loadActivityRef.current = loadActivity
  }, [loadAnalytics, loadActivity])

  useEffect(() => {
    loadAnalyticsRef.current()
    loadActivityRef.current()
  }, [project.id])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const { overview, weekly_progress, upcoming } = data || {}

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 Project Analytics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{overview?.total_scenes}</div>
          <div className="text-sm text-gray-600">Total Scenes</div>
          <div className="text-xs text-green-600 mt-1">
            {overview?.completed_scenes} completed
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-600">{overview?.shooting_days_completed}</div>
          <div className="text-sm text-gray-600">Shoot Days</div>
          <div className="text-xs text-gray-500 mt-1">
            {upcoming?.estimated_days} remaining
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{overview?.total_locations}</div>
          <div className="text-sm text-gray-600">Locations</div>
          <div className="text-xs text-gray-500 mt-1">
            {overview?.total_characters} characters
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="text-3xl font-bold text-orange-600">
            ₹{((overview?.budget_spent || 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-sm text-gray-600">Budget Spent</div>
          <div className="text-xs text-green-600 mt-1">
            ₹{((overview?.budget_remaining || 0) / 100000).toFixed(1)}L left
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-gray-600">
            {Math.round((overview?.completed_scenes / overview?.total_scenes) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${(overview?.completed_scenes / overview?.total_scenes) * 100}%` }}
          />
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Progress</h3>
        <div className="space-y-3">
          {weekly_progress?.map((week: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-600">{week.week}</div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{week.scenes_shot} scenes</span>
                  <span>₹{(week.budget_spent / 100000).toFixed(1)}L</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(week.scenes_shot / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">🎯 Upcoming</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">
              {upcoming?.next_shoot_day?.split('-')[2]}
            </div>
            <div className="text-xs text-gray-600">Next Shoot</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {upcoming?.scenes_remaining}
            </div>
            <div className="text-xs text-gray-600">Scenes Left</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-600">
              {upcoming?.estimated_days}
            </div>
            <div className="text-xs text-gray-600">Days Left</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Activity Feed Component
interface ActivityFeedProps {
  projectId: number
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Ref for useEffect dependencies
  const loadActivityRef = useRef<() => void>(() => {})

  const loadActivity = useCallback(async () => {
    // Demo data (API integration pending)
    setActivities([
      { type: 'scene_added', user: 'Writer', scene: 46, timestamp: '2026-02-14T15:30:00Z' },
      { type: 'schedule_updated', user: 'Director', timestamp: '2026-02-14T14:00:00Z' },
      { type: 'budget_approved', user: 'Producer', amount: 5000000, timestamp: '2026-02-14T12:00:00Z' },
    ])
    setLoading(false)
  }, [])

  // Update ref when function changes
  useEffect(() => {
    loadActivityRef.current = loadActivity
  }, [loadActivity])

  useEffect(() => {
    loadActivityRef.current()
  }, [projectId])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scene_added': return '📝'
      case 'schedule_updated': return '📅'
      case 'budget_approved': return '💰'
      case 'location_confirmed': return '📍'
      case 'cast_confirmed': return '🎭'
      default: return '📌'
    }
  }

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'scene_added': return `Added scene ${activity.scene}`
      case 'schedule_updated': return 'Updated schedule'
      case 'budget_approved': return `Approved budget: ₹${(activity.amount / 100000).toFixed(1)}L`
      case 'location_confirmed': return `Confirmed: ${activity.location}`
      case 'cast_confirmed': return `Cast confirmed: ${activity.actor}`
      default: return 'Updated project'
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
    </div>
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Recent Activity</h3>
      <div className="space-y-2">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{activity.user}</div>
              <div className="text-sm text-gray-600">{getActivityText(activity)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
