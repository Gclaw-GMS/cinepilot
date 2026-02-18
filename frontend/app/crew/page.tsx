'use client'

import { useState } from 'react'
import { Card, StatCard, Button, Badge, PageHeader } from '@/components/ui'
import { Users, Plus, Search, Filter, Mail, Phone, Film, Star } from 'lucide-react'

interface CrewMember {
  id: number
  name: string
  department: string
  role: string
  email: string
  phone: string
  status: 'available' | 'assigned' | 'unavailable'
}

const DEMO_CREW: CrewMember[] = [
  { id: 1, name: 'Karthik Raja', department: 'Camera', role: 'Cinematographer', email: 'karthik@film.com', phone: '+91 98765 43210', status: 'assigned' },
  { id: 2, name: 'Lakshmi Narayanan', department: 'Lighting', role: 'Gaffer', email: 'lakshmi@film.com', phone: '+91 98765 43211', status: 'assigned' },
  { id: 3, name: 'Prabhu Deva', department: 'Sound', role: 'Sound Mixer', email: 'prabhu@film.com', phone: '+91 98765 43212', status: 'available' },
  { id: 4, name: 'Anjali Ravichandran', department: 'Art', role: 'Production Designer', email: 'anjali@film.com', phone: '+91 98765 43213', status: 'assigned' },
  { id: 5, name: 'Vijay Antony', department: 'Makeup', role: 'Makeup Artist', email: 'vijay@film.com', phone: '+91 98765 43214', status: 'available' },
  { id: 6, name: 'Samantha Ruth Prabhu', department: 'Costume', role: 'Costume Designer', email: 'samantha@film.com', phone: '+91 98765 43215', status: 'unavailable' },
]

const DEPARTMENTS = ['Camera', 'Lighting', 'Sound', 'Art', 'Makeup', 'Costume', 'Direction', 'Production']

const STATUS_COLORS = {
  available: 'emerald',
  assigned: 'indigo',
  unavailable: 'rose',
}

export default function CrewPage() {
  const [crew] = useState<CrewMember[]>(DEMO_CREW)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')

  const filtered = crew.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || c.department === deptFilter
    return matchSearch && matchDept
  })

  const assigned = crew.filter(c => c.status === 'assigned').length
  const available = crew.filter(c => c.status === 'available').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <PageHeader 
        title="Crew" 
        subtitle="Manage your production crew"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Crew Member
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Crew" value={crew.length} color="indigo" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Assigned" value={assigned} color="violet" icon={<Film className="w-5 h-5" />} />
        <StatCard title="Available" value={available} color="emerald" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Departments" value={DEPARTMENTS.length} color="amber" icon={<Star className="w-5 h-5" />} />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search crew..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 bg-slate-800 border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {DEPARTMENTS.slice(0, 5).map(dept => (
              <button
                key={dept}
                onClick={() => setDeptFilter(deptFilter === dept ? 'all' : dept)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  deptFilter === dept ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Crew Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <Card key={member.id} hover className="group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-semibold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-indigo-400 text-sm">{member.role}</p>
                <p className="text-slate-500 text-xs">{member.department}</p>
              </div>
              <Badge variant={STATUS_COLORS[member.status]}>
                {member.status}
              </Badge>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Phone className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
