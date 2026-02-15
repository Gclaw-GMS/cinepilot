'use client'

import { useState, useEffect } from 'react'
import { ProgressBar, Badge } from '@/lib/components'
import Link from 'next/link'
import ProductionAnalytics from '@/components/ProductionAnalytics'

interface Milestone {
  id: number
  name: string
  date: string
  status: 'completed' | 'in_progress' | 'pending'
  tasks: number
}

interface Task {
  name: string
  complete: boolean
  progress?: number
}

interface Progress {
  overall: number
  phases: {
    pre_production: { progress: number; status: string }
    production: { progress: number; status: string }
    post_production: { progress: number; status: string }
  }
  tasks: Task[]
  upcoming_deadlines: { task: string; date: string; days_left: number }[]
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline')

  useEffect(() => {
    setTimeout(() => {
      setProgress({
        overall: 35,
        phases: {
          pre_production: { progress: 60, status: 'active' },
          production: { progress: 0, status: 'pending' },
          post_production: { progress: 0, status: 'pending' }
        },
        tasks: [
          { name: 'Script Analysis', complete: true },
          { name: 'Location Scouting', complete: false, progress: 75 },
          { name: 'Casting', complete: false, progress: 50 },
          { name: 'Permits', complete: false, progress: 20 },
          { name: 'Equipment Booking', complete: false, progress: 0 },
        ],
        upcoming_deadlines: [
          { task: 'Casting Complete', date: '2026-02-28', days_left: 14 },
          { task: 'Location Contracts', date: '2026-03-10', days_left: 24 },
        ]
      })
      setMilestones([
        { id: 1, name: 'Script Lock', date: '2026-02-15', status: 'completed', tasks: 5 },
        { id: 2, name: 'Casting Complete', date: '2026-02-28', status: 'in_progress', tasks: 8 },
        { id: 3, name: 'Location Scouting', date: '2026-03-15', status: 'pending', tasks: 12 },
        { id: 4, name: 'Pre-Production', date: '2026-04-01', status: 'pending', tasks: 20 },
        { id: 5, name: 'Principal Photography', date: '2026-05-01', status: 'pending', tasks: 100 },
      ])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return <div className="p-6"><div className="animate-pulse h-32 bg-gray-800 rounded-lg"></div></div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">📊 Production Progress</h1>
          <p className="text-gray-500">Track your film&apos;s production milestones</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-cinepilot-accent text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-cinepilot-accent text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 Kanban
            </button>
          </div>
          <button className="px-4 py-2 bg-cinepilot-accent text-black rounded-lg font-medium text-sm">
            + Add Milestone
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <p className="text-sm text-gray-400">Pre-production phase</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-cinepilot-accent">{progress?.overall}%</div>
            <div className="text-sm text-gray-400">complete</div>
          </div>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${progress?.overall}%` }}
          />
        </div>
        {/* Phase Indicators */}
        <div className="flex justify-between mt-4">
          {Object.entries(progress?.phases || {}).map(([phase, data]: [string, any]) => (
            <div key={phase} className="flex-1 text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">{phase.replace('_', ' ')}</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                data.status === 'active' ? 'bg-green-500/20 text-green-400' :
                data.status === 'completed' ? 'bg-cinepilot-accent/20 text-cinepilot-accent' :
                'bg-gray-700 text-gray-400'
              }`}>
                {data.progress}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Overall Progress</h2>
          <span className="text-3xl font-bold text-cyan-400">{progress?.overall}%</span>
        </div>
        <ProgressBar value={progress?.overall || 0} color="blue" />
      </div>

      {/* Phase Progress */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <PhaseCard title="Pre-Production" progress={progress?.phases.pre_production.progress || 0} status={progress?.phases.pre_production.status || 'pending'} />
        <PhaseCard title="Production" progress={progress?.phases.production.progress || 0} status={progress?.phases.production.status || 'pending'} />
        <PhaseCard title="Post-Production" progress={progress?.phases.post_production.progress || 0} status={progress?.phases.post_production.status || 'pending'} />
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">⏰ Upcoming Deadlines</h2>
        <div className="space-y-3">
          {progress?.upcoming_deadlines.map((deadline, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <span>{deadline.task}</span>
              <div className="text-right">
                <div className="text-sm text-gray-400">{deadline.date}</div>
                <Badge variant={deadline.days_left <= 7 ? 'danger' : deadline.days_left <= 14 ? 'warning' : 'info'}>
                  {deadline.days_left} days
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Progress */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">✅ Task Progress</h2>
        <div className="space-y-4">
          {progress?.tasks.map((task, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className={task.complete ? 'text-green-400' : ''}>{task.complete ? '✓ ' : '○ '}{task.name}</span>
                <span className="text-sm text-gray-500">{task.complete ? 'Done' : `${task.progress || 0}%`}</span>
              </div>
              {!task.complete && <ProgressBar value={task.progress || 0} color="blue" showPercentage={false} />}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
        <h2 className="font-semibold text-lg mb-4">🎯 Milestone Timeline</h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${m.status === 'completed' ? 'bg-green-500' : m.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                {i < milestones.length - 1 && <div className="w-0.5 h-full bg-gray-700 mt-1" />}
              </div>
              <div className="pb-4 flex-1">
                <div className="text-xs text-gray-500">{m.date}</div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-400">{m.tasks} tasks</div>
              </div>
              <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'warning' : 'default'}>
                {m.status === 'completed' ? 'Done' : m.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <AnalyticsSection />
    </div>
  )
}

function PhaseCard({ title, progress, status }: { title: string; progress: number; status: string }) {
  return (
    <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{title}</h3>
        <Badge variant={status === 'active' ? 'success' : 'default'}>{status === 'active' ? 'Active' : status}</Badge>
      </div>
      <div className="text-2xl font-bold text-cyan-400 mb-2">{progress}%</div>
      <ProgressBar value={progress} color={status === 'active' ? 'green' : 'blue'} showPercentage={false} />
    </div>
  )
}

// Analytics Section
function AnalyticsSection() {
  const [showAnalytics, setShowAnalytics] = useState(false)

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📈 Analytics Dashboard</h2>
        <button 
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
        >
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>
      
      {showAnalytics && (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
          <ProductionAnalytics />
        </div>
      )}
    </div>
  )
}
