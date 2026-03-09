'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Shirt, Palette, Sparkles, Plus, Edit2, Trash2, 
  Users, Calendar, Download, Filter, Search, Loader2,
  Image, MessageSquare, TrendingUp, Save, X, Copy,
  Palette as PaletteIcon, Crown, Heart, Zap, Shield, Star,
  DollarSign, RefreshCw, HelpCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const PERSONALITY_COLORS: Record<string, string> = {
  protagonist: '#3b82f6',
  antagonist: '#ef4444',
  supporting: '#10b981',
  comic: '#f59e0b',
  romantic: '#ec4899',
  mentor: '#8b5cf6',
  tragic: '#6366f1',
}

const AGE_GROUPS = [
  'Child (5-12)', 'Teen (13-19)', 'Young Adult (20-35)', 
  'Adult (36-50)', 'Middle Age (51-65)', 'Senior (65+)'
]

const APPEARANCE_TRAITS = [
  'Tall', 'Short', 'Athletic', 'Slim', 'Curvy', 'Muscular',
  'Pale', 'Tan', 'Fair', 'Dark', 'Scarred', 'Tattooed',
  'Long Hair', 'Short Hair', 'Bald', 'Curly Hair', 'Straight Hair'
]

const PERSONALITY_TRAITS = [
  'Brave', 'Cowardly', 'Intelligent', 'Naive', 'Charismatic', 'Silent',
  'Humorous', 'Serious', 'Romantic', 'Cynical', 'Loyal', 'Treacherous',
  'Kind', 'Cruel', 'Ambitions', 'Peaceful', 'Rebellious', 'Traditional'
]

const COSTUME_STYLES = [
  'Traditional', 'Modern', 'Formal', 'Casual', 'Period', 'Fantasy',
  'Action', 'Romantic', 'Comedy', 'Historical', 'Futuristic', 'Rural'
]

const FABRIC_OPTIONS = [
  'Cotton', 'Silk', 'Linen', 'Velvet', 'Leather', 'Denim', 
  'Wool', 'Chiffon', 'Satin', 'Georgette', 'Kanjivaram', 'Banarasi'
]

const COLORS_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  '#FFD700', '#C0C0C0', '#8B4513', '#4A4A4A', '#E6E6FA', '#F5DEB3'
]

interface Character {
  id: string
  name: string
  age: string
  ageNumber?: number
  gender: string
  role: string
  appearance: string[]
  personality: string[]
  costumeStyle: string[]
  fabrics: string[]
  colorPalette: string[]
  description: string
  moodBoardImages: string[]
  costumeNotes: string
  designer?: string
  estimatedBudget?: number
  status: string
}

interface CostumeSummary {
  totalCharacters: number
  byRole: Record<string, number>
  byAgeGroup: Record<string, number>
  totalBudget: number
}

const DEMO_PROJECT_ID = 'demo-project'

export default function CharacterCostumePage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [summary, setSummary] = useState<CostumeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    ageNumber: 25,
    gender: 'Male',
    role: 'supporting',
    appearance: [] as string[],
    personality: [] as string[],
    costumeStyle: [] as string[],
    fabrics: [] as string[],
    colorPalette: [] as string[],
    description: '',
    moodBoardImages: [] as string[],
    costumeNotes: '',
    designer: '',
    estimatedBudget: 0,
    status: 'planning'
  })

  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()

  const fetchCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/character-costume?projectId=${DEMO_PROJECT_ID}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCharacters(data.characters || [])
      setSummary(data.summary || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = async () => {
      setRefreshing(true)
      await fetchCharacters()
      setRefreshing(false)
    }
  }, [fetchCharacters])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          if (!showForm) {
            resetForm()
            setEditingId(null)
            setShowForm(true)
          }
          break
        case 'd':
          e.preventDefault()
          // Focus the role filter dropdown
          const roleSelect = document.querySelector('select') as HTMLSelectElement
          roleSelect?.focus()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setSearchTerm('')
          setFilterRole('all')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    try {
      const res = await fetch('/api/character-costume', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingId,
          projectId: DEMO_PROJECT_ID
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setShowForm(false)
      setEditingId(null)
      resetForm()
      fetchCharacters()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleEdit = (char: Character) => {
    setFormData({
      name: char.name,
      age: char.age,
      ageNumber: char.ageNumber || 25,
      gender: char.gender,
      role: char.role,
      appearance: char.appearance,
      personality: char.personality,
      costumeStyle: char.costumeStyle,
      fabrics: char.fabrics,
      colorPalette: char.colorPalette,
      description: char.description,
      moodBoardImages: char.moodBoardImages,
      costumeNotes: char.costumeNotes,
      designer: char.designer || '',
      estimatedBudget: char.estimatedBudget || 0,
      status: char.status
    })
    setEditingId(char.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character?')) return
    try {
      const res = await fetch(`/api/character-costume?id=${id}&projectId=${DEMO_PROJECT_ID}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchCharacters()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      ageNumber: 25,
      gender: 'Male',
      role: 'supporting',
      appearance: [],
      personality: [],
      costumeStyle: [],
      fabrics: [],
      colorPalette: [],
      description: '',
      moodBoardImages: [],
      costumeNotes: '',
      designer: '',
      estimatedBudget: 0,
      status: 'planning'
    })
  }

  const toggleArrayField = (field: keyof typeof formData, value: string) => {
    const current = formData[field] as string[]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    setFormData({ ...formData, [field]: updated })
  }

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || char.role === filterRole
    return matchesSearch && matchesRole
  })

  const roleData = summary ? Object.entries(summary.byRole).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : []

  const ageData = summary ? Object.entries(summary.byAgeGroup).map(([name, value]) => ({
    name,
    value
  })) : []

  // Calculate fabric distribution
  const fabricData = characters.length > 0 ? characters.flatMap(c => c.fabrics || []).reduce((acc, fabric) => {
    acc[fabric] = (acc[fabric] || 0) + 1
    return acc
  }, {} as Record<string, number>) : {}

  const fabricChartData = Object.entries(fabricData).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Calculate budget by character
  const budgetByCharacter = characters.map(char => ({
    name: char.name.length > 12 ? char.name.slice(0, 12) + '...' : char.name,
    budget: char.estimatedBudget || 0,
    role: char.role
  })).sort((a, b) => b.budget - a.budget)

  // Calculate costume style distribution
  const styleData = characters.length > 0 ? characters.flatMap(c => c.costumeStyle || []).reduce((acc, style) => {
    acc[style] = (acc[style] || 0) + 1
    return acc
  }, {} as Record<string, number>) : {}

  const styleChartData = Object.entries(styleData).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 6)

  // Status breakdown
  const statusData = characters.reduce((acc, char) => {
    acc[char.status || 'planning'] = (acc[char.status || 'planning'] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const STATUS_COLORS: Record<string, string> = {
    planning: '#f59e0b',
    'in-progress': '#3b82f6',
    completed: '#10b981',
    reviewed: '#8b5cf6'
  }

  const FABRIC_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#f59e0b']
  const STYLE_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shirt className="w-8 h-8 text-purple-400" />
              Character Costume
            </h1>
            <p className="text-slate-400 mt-1">Design and track character costumes for your film</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDataRef.current?.()}
              disabled={refreshing}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Character
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-xl font-bold text-white">{summary.totalCharacters}</p>
                  <p className="text-slate-400 text-xs">Total Characters</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <PaletteIcon className="w-6 h-6 text-pink-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {Object.keys(summary.byRole).length}
                  </p>
                  <p className="text-slate-400 text-xs">Role Types</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {summary.byRole['protagonist'] || 0}
                  </p>
                  <p className="text-slate-400 text-xs">Protagonists</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    ₹{(summary.totalBudget / 100000).toFixed(1)}L
                  </p>
                  <p className="text-slate-400 text-xs">Total Budget</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {fabricChartData.length}
                  </p>
                  <p className="text-slate-400 text-xs">Fabric Types</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {characters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">By Role</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PERSONALITY_COLORS[entry.name.toLowerCase()] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">By Age Group</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Fabric Usage</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={fabricChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Budget by Character</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={budgetByCharacter.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `₹${(v/1000)}k`} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} width={70} />
                  <Tooltip formatter={(value: number) => [`₹${(value/1000).toFixed(0)}k`, 'Budget']} />
                  <Bar dataKey="budget" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Additional Analytics Row */}
        {characters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Costume Style Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={styleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Status Overview</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search characters... (/)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Roles</option>
            <option value="protagonist">Protagonist</option>
            <option value="antagonist">Antagonist</option>
            <option value="supporting">Supporting</option>
            <option value="comic">Comic</option>
            <option value="romantic">Romantic</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>

        {/* Characters Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No characters found. Add your first character!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedCharacter(char)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{char.name}</h3>
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${PERSONALITY_COLORS[char.role]}20`,
                          color: PERSONALITY_COLORS[char.role]
                        }}
                      >
                        {char.role}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(char) }}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(char.id) }}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{char.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {char.appearance.slice(0, 3).map((trait) => (
                      <span key={trait} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {trait}
                      </span>
                    ))}
                    {char.appearance.length > 3 && (
                      <span className="text-xs text-slate-500">+{char.appearance.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{char.age}</span>
                    {char.colorPalette.length > 0 && (
                      <div className="flex gap-0.5">
                        {char.colorPalette.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-slate-600"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? 'Edit Character' : 'Add Character'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingId(null) }}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Character Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Age Group</label>
                    <select
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      {AGE_GROUPS.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      {Object.keys(PERSONALITY_COLORS).map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Character Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Describe the character's background, arc, and key traits..."
                  />
                </div>

                {/* Appearance Traits */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Appearance Traits</label>
                  <div className="flex flex-wrap gap-2">
                    {APPEARANCE_TRAITS.map(trait => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleArrayField('appearance', trait)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          formData.appearance.includes(trait)
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                        }`}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Personality Traits</label>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALITY_TRAITS.map(trait => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleArrayField('personality', trait)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          formData.personality.includes(trait)
                            ? 'bg-pink-600 border-pink-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-pink-500'
                        }`}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Costume Style */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Costume Style</label>
                  <div className="flex flex-wrap gap-2">
                    {COSTUME_STYLES.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleArrayField('costumeStyle', style)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          formData.costumeStyle.includes(style)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabrics */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Fabrics</label>
                  <div className="flex flex-wrap gap-2">
                    {FABRIC_OPTIONS.map(fabric => (
                      <button
                        key={fabric}
                        type="button"
                        onClick={() => toggleArrayField('fabrics', fabric)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          formData.fabrics.includes(fabric)
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-green-500'
                        }`}
                      >
                        {fabric}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Color Palette</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS_PALETTE.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleArrayField('colorPalette', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.colorPalette.includes(color)
                            ? 'border-white scale-110'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget & Designer */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Estimated Budget (₹)</label>
                    <input
                      type="number"
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Costume Designer</label>
                    <input
                      type="text"
                      value={formData.designer}
                      onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      placeholder="Designer name"
                    />
                  </div>
                </div>

                {/* Costume Notes */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Costume Notes</label>
                  <textarea
                    value={formData.costumeNotes}
                    onChange={(e) => setFormData({ ...formData, costumeNotes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Special requirements, references, etc..."
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null) }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Save'} Character
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Character Detail Modal */}
        {selectedCharacter && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between p-4 border-b border-slate-700">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCharacter.name}</h2>
                  <span 
                    className="text-sm px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${PERSONALITY_COLORS[selectedCharacter.role]}20`,
                      color: PERSONALITY_COLORS[selectedCharacter.role]
                    }}
                  >
                    {selectedCharacter.role}
                  </span>
                </div>
                <button onClick={() => setSelectedCharacter(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Age Group</p>
                    <p className="text-white font-medium">{selectedCharacter.age}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Gender</p>
                    <p className="text-white font-medium">{selectedCharacter.gender}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Budget</p>
                    <p className="text-white font-medium">₹{selectedCharacter.estimatedBudget?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Designer</p>
                    <p className="text-white font-medium">{selectedCharacter.designer || 'TBD'}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedCharacter.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Character Description</h3>
                    <p className="text-slate-300">{selectedCharacter.description}</p>
                  </div>
                )}

                {/* Appearance */}
                {selectedCharacter.appearance.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Appearance</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.appearance.map(trait => (
                        <span key={trait} className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personality */}
                {selectedCharacter.personality.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Personality</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.personality.map(trait => (
                        <span key={trait} className="bg-pink-600/20 text-pink-300 px-3 py-1 rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Costume Style & Fabrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCharacter.costumeStyle.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Costume Style</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.costumeStyle.map(style => (
                          <span key={style} className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCharacter.fabrics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Fabrics</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.fabrics.map(fabric => (
                          <span key={fabric} className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm">
                            {fabric}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Color Palette */}
                {selectedCharacter.colorPalette.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Color Palette</h3>
                    <div className="flex gap-2">
                      {selectedCharacter.colorPalette.map((color, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-lg border-2 border-slate-600"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedCharacter.costumeNotes && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Costume Notes</h3>
                    <p className="text-slate-300">{selectedCharacter.costumeNotes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => { handleEdit(selectedCharacter); setSelectedCharacter(null) }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { handleDelete(selectedCharacter.id); setSelectedCharacter(null) }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowKeyboardHelp(false)}
          >
            <div 
              className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                <button onClick={() => setShowKeyboardHelp(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Refresh data</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Focus search</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">/</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Add new character</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">N</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Filter by role</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">D</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">?</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Close modal / Clear</span>
                  <kbd className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-sm">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
