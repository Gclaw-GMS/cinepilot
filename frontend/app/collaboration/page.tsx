'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Mail, Phone, MessageSquare, Calendar, Plus, Search,
  Film, Star, Clock, CheckCircle, MoreHorizontal, X, Edit2,
  Trash2, UserPlus, BarChart3, PieChart as PieChartIcon, Send,
  Loader2, AlertCircle, Check
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: 'active' | 'busy' | 'offline'
  skills: string[]
  createdAt: string
}

interface Stats {
  total: number
  active: number
  busy: number
  offline: number
}

const STATUS_COLORS = {
  active: '#10b981',
  busy: '#f59e0b',
  offline: '#64748b',
}

const STATUS_VARIANTS = {
  active: 'emerald',
  busy: 'amber',
  offline: 'slate',
} as const

const DEPARTMENTS = ['Direction', 'Production', 'Camera', 'Lighting', 'Sound', 'Art', 'Makeup', 'Costume', 'VFX', 'Stunts']

const DEPT_COLORS: Record<string, string> = {
  Direction: '#ef4444',
  Production: '#3b82f6',
  Camera: '#6366f1',
  Lighting: '#f59e0b',
  Sound: '#10b981',
  Art: '#ec4899',
  Makeup: '#8b5cf6',
  Costume: '#14b8a6',
  VFX: '#f97316',
  Stunts: '#84cc16',
}

// Demo data for initial load
const DEMO_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'], createdAt: '2026-01-15' },
  { id: '2', name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'], createdAt: '2026-01-15' },
  { id: '3', name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'], createdAt: '2026-01-16' },
  { id: '4', name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'], createdAt: '2026-01-16' },
  { id: '5', name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'], createdAt: '2026-01-17' },
  { id: '6', name: 'Anand Venkatesh', role: 'Gaffer', email: 'anand@film.com', phone: '+91 98765 43215', status: 'active', skills: ['Lighting', 'Electrical'], createdAt: '2026-01-17' },
  { id: '7', name: 'Lakshmi Devi', role: 'Chief Makeup Artist', email: 'lakshmi@film.com', phone: '+91 98765 43216', status: 'busy', skills: ['Prosthetics', 'SFX Makeup'], createdAt: '2026-01-18' },
  { id: '8', name: 'Vasantha Kumar', role: 'Costume Designer', email: 'vasantha@film.com', phone: '+91 98765 43217', status: 'active', skills: ['Period Costumes', 'Wardrobe'], createdAt: '2026-01-18' },
]

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getDeptFromRole(role: string): string {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('director') || roleLower.includes('assistant')) return 'Direction'
  if (roleLower.includes('producer') || roleLower.includes('production')) return 'Production'
  if (roleLower.includes('camera') || roleLower.includes('cinematographer')) return 'Camera'
  if (roleLower.includes('light') || roleLower.includes('gaffer')) return 'Lighting'
  if (roleLower.includes('sound') || roleLower.includes('audio')) return 'Sound'
  if (roleLower.includes('art') || roleLower.includes('design')) return 'Art'
  if (roleLower.includes('makeup')) return 'Makeup'
  if (roleLower.includes('costume') || roleLower.includes('wardrobe')) return 'Costume'
  if (roleLower.includes('vfx')) return 'VFX'
  if (roleLower.includes('stunt')) return 'Stunts'
  return 'Production'
}

function Badge({ variant, children }: { variant: 'emerald' | 'amber' | 'slate' | 'indigo', children: React.ReactNode }) {
  const styles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  )
}

export default function CollaborationPage() {
  const [members, setMembers] = useState<TeamMember[]>(DEMO_MEMBERS)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, busy: 0, offline: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'offline' as 'active' | 'busy' | 'offline',
    skills: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/collaboration')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      // Check for demo mode from API response
      setIsDemoMode(data.isDemoMode === true)
      if (data.members && data.members.length > 0) {
        setMembers(data.members)
        setStats(data.stats)
      } else {
        // Use demo data if no real data
        setMembers(DEMO_MEMBERS)
        setStats({
          total: DEMO_MEMBERS.length,
          active: DEMO_MEMBERS.filter(m => m.status === 'active').length,
          busy: DEMO_MEMBERS.filter(m => m.status === 'busy').length,
          offline: DEMO_MEMBERS.filter(m => m.status === 'offline').length,
        })
        setIsDemoMode(true)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      // Use demo data on error
      setMembers(DEMO_MEMBERS)
      setStats({
        total: DEMO_MEMBERS.length,
        active: DEMO_MEMBERS.filter(m => m.status === 'active').length,
        busy: DEMO_MEMBERS.filter(m => m.status === 'busy').length,
        offline: DEMO_MEMBERS.filter(m => m.status === 'offline').length,
      })
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const statusData = [
    { name: 'Active', value: stats.active, color: STATUS_COLORS.active },
    { name: 'Busy', value: stats.busy, color: STATUS_COLORS.busy },
    { name: 'Offline', value: stats.offline, color: STATUS_COLORS.offline },
  ]

  const deptData = DEPARTMENTS.map(dept => ({
    name: dept,
    value: members.filter(m => getDeptFromRole(m.role) === dept).length,
    color: DEPT_COLORS[dept] || '#64748b',
  })).filter(d => d.value > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      }

      const res = editingMember 
        ? await fetch('/api/collaboration', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingMember.id, ...payload }),
          })
        : await fetch('/api/collaboration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) throw new Error('Failed to save')

      await fetchData()
      setShowModal(false)
      setEditingMember(null)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      status: member.status,
      skills: member.skills.join(', '),
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      const res = await fetch(`/api/collaboration?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleStatusChange = async (id: string, status: 'active' | 'busy' | 'offline') => {
    try {
      const res = await fetch('/api/collaboration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      await fetchData()
    } catch (err) {
      // Optimistic update for demo mode
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      status: 'offline',
      skills: '',
    })
  }

  const openAddModal = () => {
    resetForm()
    setEditingMember(null)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team Collaboration
            {isDemoMode && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">
                Demo
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your production team and communications</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Team Members</p>
              <p className="text-2xl font-semibold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/20">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Active Now</p>
              <p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Busy</p>
              <p className="text-2xl font-semibold text-amber-400 mt-1">{stats.busy}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Offline</p>
              <p className="text-2xl font-semibold text-slate-400 mt-1">{stats.offline}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/20">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Department Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member) => (
            <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-semibold shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white truncate">{member.name}</h3>
                      <p className="text-slate-400 text-sm truncate">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={STATUS_VARIANTS[member.status]}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-500">
                      +{member.skills.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </button>
                  <div className="relative group/menu">
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                      <button
                        onClick={() => handleEdit(member)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-b-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Quick Toggle */}
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Quick Status</p>
                  <div className="flex gap-1">
                    {(['active', 'busy', 'offline'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(member.id, s)}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                          member.status === s
                            ? s === 'active' ? 'bg-emerald-500/20 text-emerald-400'
                              : s === 'busy' ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No members found</h3>
          <p className="text-slate-500 text-sm mb-4">Try adjusting your search or add a new team member</p>
          <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium">
            Add Team Member
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingMember ? 'Edit Team Member' : 'Invite Team Member'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingMember(null) }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select role...</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@company.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="offline">Offline</option>
                  <option value="active">Active</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Camera, Lighting, Stunts"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingMember(null) }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingMember ? (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
