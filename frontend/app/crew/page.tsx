'use client'

import { useState } from 'react'

interface CrewMember {
  id: number
  name: string
  role: string
  department: string
  phone: string
  email: string
  dailyRate: number
  status: 'confirmed' | 'pending' | 'unavailable'
}

const DEMO_CREW: CrewMember[] = [
  { id: 1, name: 'Rajesh Kumar', role: 'Director', department: 'Direction', phone: '+91 98765 43210', email: 'rajesh@film.com', dailyRate: 50000, status: 'confirmed' },
  { id: 2, name: 'Anand Chakravarthy', role: 'Cinematographer', department: 'Camera', phone: '+91 98765 43211', email: 'anand@film.com', dailyRate: 45000, status: 'confirmed' },
  { id: 3, name: 'Vijay Sethupathi', role: 'Lead Actor', department: 'Cast', phone: '+91 98765 43212', email: 'vijay@film.com', dailyRate: 100000, status: 'confirmed' },
  { id: 4, name: 'Nithya Menen', role: 'Lead Actress', department: 'Cast', phone: '+91 98765 43213', email: 'nithya@film.com', dailyRate: 75000, status: 'pending' },
  { id: 5, name: 'Santosh Sivan', role: 'Cinematographer (2nd)', department: 'Camera', phone: '+91 98765 43214', email: 'santosh@film.com', dailyRate: 25000, status: 'confirmed' },
  { id: 6, name: 'Gautham Vasudev', role: 'Assistant Director', department: 'Direction', phone: '+91 98765 43215', email: 'gautham@film.com', dailyRate: 15000, status: 'confirmed' },
  { id: 7, name: 'Micheal', role: 'Sound Engineer', department: 'Sound', phone: '+91 98765 43216', email: 'micheal@film.com', dailyRate: 12000, status: 'pending' },
  { id: 8, name: 'Anirudh', role: 'Music Director', department: 'Music', phone: '+91 98765 43217', email: 'anirudh@film.com', dailyRate: 80000, status: 'confirmed' },
]

const DEPARTMENTS = ['Direction', 'Camera', 'Sound', 'Art', 'Lighting', 'Makeup', 'Costume', 'Music', 'Cast', 'Production']

export default function CrewPage() {
  const [crew, setCrew] = useState(DEMO_CREW)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState<Partial<CrewMember>>({ status: 'pending' })

  const filtered = crew.filter(c => {
    if (filter !== 'all' && c.department !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const byDepartment = DEPARTMENTS.map(d => ({
    name: d,
    count: crew.filter(c => c.department === d).length,
    cost: crew.filter(c => c.department === d).reduce((a, c) => a + c.dailyRate, 0)
  })).filter(d => d.count > 0)

  const totalDaily = crew.reduce((a, c) => a + c.dailyRate, 0)
  const confirmed = crew.filter(c => c.status === 'confirmed').length

  const addMember = () => {
    if (!newMember.name || !newMember.role) return
    setCrew([...crew, { ...newMember, id: Date.now() } as CrewMember])
    setNewMember({ status: 'pending' })
    setShowAdd(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">👥 Crew & Cast</h1>
          <p className="text-gray-500 mt-1">Manage your production team</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-medium"
        >
          + Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Total Members</div>
          <div className="text-2xl font-bold text-white">{crew.length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Confirmed</div>
          <div className="text-2xl font-bold text-green-400">{confirmed}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Pending</div>
          <div className="text-2xl font-bold text-amber-400">{crew.filter(c => c.status === 'pending').length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Daily Cost</div>
          <div className="text-2xl font-bold text-cyan-400">₹{totalDaily.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search crew..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-4 py-2"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Crew Grid */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(member => (
              <div key={member.id} className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{member.name}</div>
                        <div className="text-sm text-gray-400">{member.role}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.status === 'confirmed' ? 'bg-green-600/30 text-green-300' :
                        member.status === 'pending' ? 'bg-amber-600/30 text-amber-300' :
                        'bg-red-600/30 text-red-300'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{member.department}</div>
                    <div className="text-sm text-cyan-400 mt-2">₹{member.dailyRate.toLocaleString()}/day</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700 flex gap-4 text-xs text-gray-400">
                  <span>📞 {member.phone}</span>
                  <span>📧 {member.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Summary */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-bold mb-4">By Department</h3>
          <div className="space-y-3">
            {byDepartment.map(dept => (
              <div key={dept.name} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                <div>
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-xs text-gray-400">{dept.count} members</div>
                </div>
                <div className="text-cyan-400">₹{dept.cost.toLocaleString()}/day</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-400">₹{totalDaily.toLocaleString()}/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Crew Member</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newMember.name || ''}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={newMember.role || ''}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Department</label>
                  <select
                    value={newMember.department || ''}
                    onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={newMember.dailyRate || ''}
                    onChange={(e) => setNewMember({ ...newMember, dailyRate: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newMember.phone || ''}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-700 py-2 rounded">Cancel</button>
              <button onClick={addMember} className="flex-1 bg-cyan-500 py-2 rounded text-black font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
