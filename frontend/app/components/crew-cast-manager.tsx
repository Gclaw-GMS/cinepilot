"use client"

import { useState } from 'react'
import { crew } from '../lib/api'

interface CrewMember {
  id: number
  name: string
  department: string
  role: string
  daily_rate: number
  phone?: string
  email?: string
  status?: string
}

interface CastMember {
  id: number
  name: string
  role: string
  actor?: string
  daily_rate?: number
  phone?: string
  email?: string
  status?: string
}

export default function CrewCastManager({ projectId }: { projectId?: number }) {
  const [activeTab, setActiveTab] = useState<'crew' | 'cast'>('crew')
  const [crewList, setCrewList] = useState<CrewMember[]>([
    { id: 1, name: 'Lokesh', department: 'Direction', role: 'Director', daily_rate: 50000, status: 'confirmed' },
    { id: 2, name: 'Santosh', department: 'Camera', role: 'Cinematographer', daily_rate: 45000, status: 'confirmed' },
    { id: 3, name: 'Anirudh', department: 'Music', role: 'Music Director', daily_rate: 75000, status: 'confirmed' },
    { id: 4, name: 'Vijay', department: 'Post', role: 'Editor', daily_rate: 35000, status: 'confirmed' },
    { id: 5, name: 'Ravi', department: 'Art', role: 'Art Director', daily_rate: 30000, status: 'pending' },
    { id: 6, name: 'Gautam', department: 'Costume', role: 'Costume Designer', daily_rate: 25000, status: 'pending' },
  ])
  
  const [castList, setCastList] = useState<CastMember[]>([
    { id: 1, name: 'Arjun', role: 'Lead', actor: 'Vijay', daily_rate: 1500000, status: 'confirmed' },
    { id: 2, name: 'Priya', role: 'Lead', actor: 'Nayanthara', daily_rate: 1200000, status: 'confirmed' },
    { id: 3, name: 'Mahendra', role: 'Villain', actor: 'Prakash Raj', daily_rate: 500000, status: 'confirmed' },
    { id: 4, name: 'Sarath', role: 'Friend', actor: 'Yogi Babu', daily_rate: 150000, status: 'confirmed' },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState<Partial<CrewMember>>({})

  const departments = ['Direction', 'Camera', 'Lighting', 'Sound', 'Art', 'Costume', 'Makeup', 'Production', 'Post']

  const handleAddCrew = () => {
    if (newMember.name && newMember.role) {
      const member: CrewMember = {
        id: Date.now(),
        name: newMember.name,
        role: newMember.role,
        department: newMember.department || 'Production',
        daily_rate: newMember.daily_rate || 0,
        status: 'pending'
      }
      setCrewList([...crewList, member])
      setNewMember({})
      setShowAddForm(false)
    }
  }

  const deleteMember = (id: number, type: 'crew' | 'cast') => {
    if (type === 'crew') {
      setCrewList(crewList.filter(m => m.id !== id))
    } else {
      setCastList(castList.filter(m => m.id !== id))
    }
  }

  const totalCrewCost = crewList.reduce((sum, m) => sum + (m.daily_rate || 0), 0)
  const totalCastCost = castList.reduce((sum, m) => sum + (m.daily_rate || 0), 0)

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">👥 Crew & Cast Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span> Add {activeTab === 'crew' ? 'Crew' : 'Cast'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('crew')}
          className={`px-4 py-2 rounded-t-lg ${activeTab === 'crew' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
        >
          🎬 Crew ({crewList.length})
        </button>
        <button
          onClick={() => setActiveTab('cast')}
          className={`px-4 py-2 rounded-t-lg ${activeTab === 'cast' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
        >
          🎭 Cast ({castList.length})
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newMember.name || ''}
              onChange={e => setNewMember({...newMember, name: e.target.value})}
              className="bg-gray-700 px-3 py-2 rounded text-white"
            />
            <input
              type="text"
              placeholder="Role"
              value={newMember.role || ''}
              onChange={e => setNewMember({...newMember, role: e.target.value})}
              className="bg-gray-700 px-3 py-2 rounded text-white"
            />
            {activeTab === 'crew' && (
              <select
                value={newMember.department || ''}
                onChange={e => setNewMember({...newMember, department: e.target.value})}
                className="bg-gray-700 px-3 py-2 rounded text-white"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <input
              type="number"
              placeholder="Daily Rate (₹)"
              value={newMember.daily_rate || ''}
              onChange={e => setNewMember({...newMember, daily_rate: parseInt(e.target.value)})}
              className="bg-gray-700 px-3 py-2 rounded text-white"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAddCrew} className="bg-green-600 px-4 py-2 rounded text-white">Add</button>
            <button onClick={() => setShowAddForm(false)} className="bg-gray-600 px-4 py-2 rounded text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Crew Daily Total</div>
          <div className="text-2xl font-bold text-blue-400">₹{(totalCrewCost / 100000).toFixed(1)}L</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Cast Daily Total</div>
          <div className="text-2xl font-bold text-purple-400">₹{(totalCastCost / 100000).toFixed(1)}L</div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeTab === 'crew' ? (
          crewList.map(member => (
            <div key={member.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-sm text-gray-400">{member.role} • {member.department}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs ${member.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                  {member.status}
                </span>
                <span className="text-blue-400">₹{member.daily_rate.toLocaleString()}</span>
                <button onClick={() => deleteMember(member.id, 'crew')} className="text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          ))
        ) : (
          castList.map(member => (
            <div key={member.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-sm text-gray-400">{member.role} • {member.actor}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs ${member.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                  {member.status}
                </span>
                <span className="text-purple-400">₹{((member.daily_rate || 0) / 100000).toFixed(1)}L</span>
                <button onClick={() => deleteMember(member.id, 'cast')} className="text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
