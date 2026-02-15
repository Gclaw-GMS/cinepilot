'use client'

import { useState } from 'react'

interface TimelineEvent {
  id: string
  title: string
  date: string
  type: 'milestone' | 'shoot' | 'meeting' | 'review' | 'deadline'
  status: 'completed' | 'current' | 'upcoming'
  description?: string
  sceneCount?: number
  location?: string
}

interface ProductionTimelineProps {
  projectName: string
  events?: TimelineEvent[]
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    title: 'Script Lock',
    date: '2026-02-01',
    type: 'milestone',
    status: 'completed',
    description: 'Final script locked for production'
  },
  {
    id: '2',
    title: 'Pre-Production Start',
    date: '2026-02-05',
    type: 'milestone',
    status: 'completed',
    description: 'Casting and location scouting begins'
  },
  {
    id: '3',
    title: 'Location Recce',
    date: '2026-02-10',
    type: 'meeting',
    status: 'completed',
    description: 'Visit all primary locations'
  },
  {
    id: '4',
    title: 'Principal Photography Begins',
    date: '2026-02-15',
    type: 'shoot',
    status: 'current',
    description: 'First day of shooting',
    sceneCount: 8,
    location: 'Meenakshi Temple, Madurai'
  },
  {
    id: '5',
    title: 'Song Sequence Shoot',
    date: '2026-02-20',
    type: 'shoot',
    status: 'upcoming',
    description: 'Musical sequence shooting',
    sceneCount: 12,
    location: 'Studio, Chennai'
  },
  {
    id: '6',
    title: 'Action Sequence',
    date: '2026-02-25',
    type: 'shoot',
    status: 'upcoming',
    description: 'Major action sequence',
    sceneCount: 6,
    location: 'Open Ground, Madurai'
  },
  {
    id: '7',
    title: 'Climax Shoot',
    date: '2026-03-05',
    type: 'shoot',
    status: 'upcoming',
    description: 'Final major sequence',
    sceneCount: 15,
    location: 'Various'
  },
  {
    id: '8',
    title: 'Wrap & Post-Production',
    date: '2026-03-10',
    type: 'milestone',
    status: 'upcoming',
    description: 'Principal photography wraps'
  },
  {
    id: '9',
    title: 'First Cut Review',
    date: '2026-03-20',
    type: 'review',
    status: 'upcoming',
    description: 'Review first cut with director'
  },
  {
    id: '10',
    title: 'Release',
    date: '2026-05-01',
    type: 'deadline',
    status: 'upcoming',
    description: 'Theatrical release'
  }
]

export default function ProductionTimeline({ 
  projectName, 
  events = DEFAULT_EVENTS 
}: ProductionTimelineProps) {
  const [view, setView] = useState<'timeline' | 'list'>('timeline')
  const [filter, setFilter] = useState<string>('all')

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🏁'
      case 'shoot': return '🎬'
      case 'meeting': return '👥'
      case 'review': return '📽️'
      case 'deadline': return '⚠️'
      default: return '📅'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 border-green-500 text-green-400'
      case 'current': return 'bg-purple-500/20 border-purple-500 text-purple-400'
      case 'upcoming': return 'bg-gray-700/30 border-gray-600 text-gray-400'
      default: return 'bg-gray-700'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysUntil = (dateStr: string) => {
    const today = new Date('2026-02-14') // Using the current date from context
    const target = new Date(dateStr)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} days ago`
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 Production Timeline</h1>
          <p className="text-gray-500 text-sm mt-1">{projectName}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-1.5 rounded text-sm ${
              view === 'timeline' ? 'bg-cinepilot-accent text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded text-sm ${
              view === 'list' ? 'bg-cinepilot-accent text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'shoot', 'milestone', 'meeting', 'review', 'deadline'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs capitalize ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {f === 'all' ? '📋 All' : `${getTypeIcon(f)} ${f}`}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800" />
          
          {/* Events */}
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div 
                key={event.id} 
                className={`relative flex gap-4 p-4 rounded-lg border ${getStatusColor(event.status)}`}
              >
                {/* Icon */}
                <div className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 border-2 border-current text-lg">
                  {getTypeIcon(event.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm opacity-70 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatDate(event.date)}</div>
                      <div className="text-xs opacity-60">{getDaysUntil(event.date)}</div>
                    </div>
                  </div>
                  
                  {/* Shoot Details */}
                  {event.type === 'shoot' && (
                    <div className="mt-2 flex gap-4 text-sm">
                      {event.sceneCount && (
                        <span className="flex items-center gap-1">
                          🎬 {event.sceneCount} scenes
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          📍 {event.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {event.status === 'completed' && <span className="text-xs">✅</span>}
                  {event.status === 'current' && <span className="text-xs animate-pulse">🔴</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Date</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Event</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Status</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">When</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-sm">{formatDate(event.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-xs text-gray-500">{event.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg">{getTypeIcon(event.type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      event.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                      event.status === 'current' ? 'bg-purple-900/50 text-purple-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-400">
                    {getDaysUntil(event.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {events.filter(e => e.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {events.filter(e => e.status === 'current').length}
          </div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {events.filter(e => e.type === 'shoot').length}
          </div>
          <div className="text-xs text-gray-500">Shoot Days</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {events.filter(e => e.status === 'upcoming').length}
          </div>
          <div className="text-xs text-gray-500">Upcoming</div>
        </div>
      </div>
    </div>
  )
}
