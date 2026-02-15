'use client'

import { useState, useEffect } from 'react'
import { CollaboratorAvatar, CollaboratorList, ActivityFeed, TeamWorkload, ProjectTimeline, CollaborationStats } from '@/lib/enhanced-components-phase29'

// Demo data
const DEMO_COLLABORATORS = [
  { id: '1', name: 'Sarah Chen', role: 'Director', isOnline: true },
  { id: '2', name: 'Mike Johnson', role: 'Producer', isOnline: true },
  { id: '3', name: 'Emily Davis', role: 'Cinematographer', isOnline: false },
  { id: '4', name: 'James Wilson', role: '1st AD', isOnline: true },
  { id: '5', name: 'Lisa Park', role: 'Production Designer', isOnline: false },
  { id: '6', name: 'Tom Brown', role: 'Sound Mixer', isOnline: true },
]

const DEMO_ACTIVITIES = [
  { id: '1', user: 'Sarah Chen', action: 'updated', target: 'Scene 12 - The Meeting', timestamp: '2026-02-15T20:30:00Z', type: 'update' as const },
  { id: '2', user: 'Mike Johnson', action: 'commented on', target: 'Budget Overview', timestamp: '2026-02-15T20:15:00Z', type: 'comment' as const },
  { id: '3', user: 'Emily Davis', action: 'uploaded', target: 'Shot List v2.pdf', timestamp: '2026-02-15T19:45:00Z', type: 'create' as const },
  { id: '4', user: 'James Wilson', action: 'created', target: 'Call Sheet - Day 5', timestamp: '2026-02-15T18:30:00Z', type: 'create' as const },
  { id: '5', user: 'Lisa Park', action: 'updated', target: 'Location: Warehouse', timestamp: '2026-02-15T17:00:00Z', type: 'update' as const },
]

const DEMO_WORKLOAD = [
  { name: 'Sarah Chen', role: 'Director', tasks: 12, capacity: 80 },
  { name: 'Mike Johnson', role: 'Producer', tasks: 8, capacity: 60 },
  { name: 'Emily Davis', role: 'Cinematographer', tasks: 15, capacity: 95 },
  { name: 'James Wilson', role: '1st AD', tasks: 20, capacity: 100 },
]

const DEMO_TIMELINE: Array<{id: string; title: string; status: 'completed' | 'in-progress' | 'pending'; date: string; description?: string}> = [
  { id: '1', title: 'Pre-Production', status: 'completed', date: 'Jan 15 - Feb 1', description: '100% complete' },
  { id: '2', title: 'Principal Photography', status: 'in-progress', date: 'Feb 2 - Mar 15', description: '45% complete' },
  { id: '3', title: 'Post-Production', status: 'pending', date: 'Mar 16 - Apr 30', description: 'Not started' },
]

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤝 Collaboration Hub</h1>
        <p className="text-gray-400">Real-time team collaboration and project tracking</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <CollaborationStats 
          title="Active Members"
          value="24"
          change="+3 this week"
          icon="👥"
          trend="up"
        />
        <CollaborationStats 
          title="Tasks Completed"
          value="156"
          change="+28 this week"
          icon="✅"
          trend="up"
        />
        <CollaborationStats 
          title="Pending Reviews"
          value="12"
          change="-5 this week"
          icon="👀"
          trend="down"
        />
        <CollaborationStats 
          title="Comments Today"
          value="47"
          change="+12 this week"
          icon="💬"
          trend="up"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Collaborators */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">🎯 Active Team</h2>
            <CollaboratorList collaborators={DEMO_COLLABORATORS} />
            <div className="mt-4 text-sm text-gray-400">
              {DEMO_COLLABORATORS.filter(c => c.isOnline).length} online now
            </div>
          </div>

          {/* Project Timeline */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📅 Project Timeline</h2>
            <ProjectTimeline events={DEMO_TIMELINE} />
          </div>

          {/* Team Workload */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📊 Team Workload</h2>
            <TeamWorkload members={DEMO_WORKLOAD} />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📝 Recent Activity</h2>
            <ActivityFeed 
              activities={DEMO_ACTIVITIES}
              onLoadMore={() => console.log('Load more')}
              hasMore={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
