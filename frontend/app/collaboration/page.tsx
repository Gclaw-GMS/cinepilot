'use client'

import { useState } from 'react'
import { Card, StatCard, Button, Badge, PageHeader } from '@/components/ui'
import { 
  Users, Mail, Phone, MessageSquare, Calendar, Plus, Search,
  Film, Star, Clock, CheckCircle, MoreHorizontal
} from 'lucide-react'

interface TeamMember {
  id: number
  name: string
  role: string
  email: string
  phone: string
  status: 'active' | 'busy' | 'offline'
  avatar?: string
  skills: string[]
}

const DEMO_MEMBERS: TeamMember[] = [
  { id: 1, name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'] },
  { id: 2, name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'] },
  { id: 3, name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'] },
  { id: 4, name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'] },
  { id: 5, name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'] },
]

const STATUS_COLORS = {
  active: 'emerald',
  busy: 'amber',
  offline: 'slate',
}

export default function CollaborationPage() {
  const [members] = useState<TeamMember[]>(DEMO_MEMBERS)
  const [search, setSearch] = useState('')

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = members.filter(m => m.status === 'active').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <PageHeader 
        title="Team Collaboration" 
        subtitle="Manage your production team and communications"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Team Members" 
          value={members.length} 
          color="indigo"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard 
          title="Active Now" 
          value={activeCount} 
          color="emerald"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard 
          title="Pending Tasks" 
          value={12} 
          color="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard 
          title="Messages" 
          value={47} 
          color="violet"
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 bg-slate-800 border-slate-700 rounded-lg"
          />
        </div>
      </Card>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <Card key={member.id} hover className="group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-semibold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-slate-400 text-sm">{member.role}</p>
                  </div>
                  <Badge variant={STATUS_COLORS[member.status]}>
                    {member.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex flex-wrap gap-2 mb-4">
                {member.skills.map(skill => (
                  <span key={skill} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
