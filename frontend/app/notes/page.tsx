'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  StickyNote,
  Plus,
  Edit2,
  Trash2,
  Pin,
  PinOff,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  FileText,
  Clock,
  ChevronDown,
  BarChart3,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface Note {
  id: string
  projectId: string
  content: string
  category: string
  author: string
  isPinned: boolean
  createdAt: string
  updatedAt?: string
}

const CATEGORIES = [
  { key: 'all', label: 'All Notes', icon: StickyNote, color: '#64748b' },
  { key: 'todo', label: 'To-Do', icon: CheckSquare, color: '#f59e0b' },
  { key: 'decision', label: 'Decisions', icon: FileText, color: '#10b981' },
  { key: 'idea', label: 'Ideas', icon: Lightbulb, color: '#8b5cf6' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#06b6d4' },
  { key: 'general', label: 'General', icon: StickyNote, color: '#64748b' },
]

const CATEGORY_COLORS: Record<string, string> = {
  todo: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  decision: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  idea: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  feedback: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  general: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const DEMO_PROJECT_ID = 'default-project'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    content: '',
    category: 'general',
    author: '',
    isPinned: false,
  })

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('projectId', DEMO_PROJECT_ID)
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      
      const res = await fetch(`/api/notes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      const data = await res.json()
      // API returns { notes: [...], isDemoMode: true/false }
      setNotes(data.notes || data)
      // Use isDemoMode from API response
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Compute chart data for notes distribution
  const categoryChartData = useMemo(() => {
    const categoryMap = new Map<string, { name: string; count: number; color: string }>()
    
    CATEGORIES.filter(c => c.key !== 'all').forEach(cat => {
      categoryMap.set(cat.key, { name: cat.label, count: 0, color: cat.color })
    })
    
    notes.forEach(note => {
      const cat = categoryMap.get(note.category)
      if (cat) cat.count++
    })
    
    return Array.from(categoryMap.values())
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [notes])

  const pinnedNotes = filteredNotes.filter(n => n.isPinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) return

    // Optimistic update in demo mode
    const newNoteId = `local-${Date.now()}`
    const optimisticNote: Note = {
      id: newNoteId,
      projectId: DEMO_PROJECT_ID,
      content: formData.content.trim(),
      category: formData.category,
      author: formData.author || 'You',
      isPinned: formData.isPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (!editingNote) {
      setNotes(prev => [optimisticNote, ...prev])
    }

    try {
      const method = editingNote ? 'PUT' : 'POST'
      const body = editingNote
        ? { id: editingNote.id, ...formData }
        : { ...formData, projectId: DEMO_PROJECT_ID }

      const res = await fetch('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save note')

      setShowForm(false)
      setEditingNote(null)
      setFormData({ content: '', category: 'general', author: '', isPinned: false })
      fetchNotes()
    } catch (err) {
      // In demo mode, keep the optimistic update
      if (!editingNote) {
        // Already added optimistically, just clear form
      } else {
        // Revert for edit
        fetchNotes()
      }
      setShowForm(false)
      setEditingNote(null)
      setFormData({ content: '', category: 'general', author: '', isPinned: false })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    
    // Optimistic update
    const originalNotes = [...notes]
    setNotes(prev => prev.filter(n => n.id !== id))
    
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}&projectId=${DEMO_PROJECT_ID}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
    } catch (err) {
      // In demo mode, keep the deletion
      console.log('Demo mode: note deleted locally')
    }
  }

  const handleTogglePin = async (note: Note) => {
    // Optimistic update in demo mode
    const originalNotes = [...notes]
    setNotes(prev => prev.map(n => 
      n.id === note.id ? { ...n, isPinned: !n.isPinned } : n
    ))
    
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchNotes()
    } catch (err) {
      // Revert on error
      setNotes(originalNotes)
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const openEditForm = (note: Note) => {
    setEditingNote(note)
    setFormData({
      content: note.content,
      category: note.category,
      author: note.author,
      isPinned: note.isPinned,
    })
    setShowForm(true)
  }

  const openNewForm = () => {
    setEditingNote(null)
    setFormData({ content: '', category: 'general', author: '', isPinned: false })
    setShowForm(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const NoteCard = ({ note }: { note: Note }) => (
    <div className={`bg-slate-900 border rounded-xl p-4 transition-all hover:shadow-lg group ${
      note.isPinned 
        ? 'border-amber-500/30 shadow-amber-500/10 shadow-lg' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${CATEGORY_COLORS[note.category] || CATEGORY_COLORS.general}`}>
            {CATEGORIES.find(c => c.key === note.category)?.label || note.category}
          </span>
          {note.isPinned && (
            <Pin className="w-3 h-3 text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleTogglePin(note)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            {note.isPinned ? (
              <PinOff className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Pin className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={() => openEditForm(note)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => handleDelete(note.id)}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-200 whitespace-pre-wrap mb-3 line-clamp-4">
        {note.content}
      </p>
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" />
          <span>{note.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{formatDate(note.createdAt)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <StickyNote className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">Production Notes</h1>
                  {isDemoMode && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-1">Capture ideas, decisions, and to-dos</p>
              </div>
            </div>
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {CATEGORIES.map((cat) => {
            const count = cat.key === 'all' 
              ? notes.length 
              : notes.filter(n => n.category === cat.key).length
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`bg-slate-900 border rounded-xl p-4 text-left transition-all hover:shadow-lg ${
                  selectedCategory === cat.key
                    ? 'border-indigo-500/50 shadow-indigo-500/10 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                  <span className="text-xs text-slate-500">{cat.label}</span>
                </div>
                <p className="text-2xl font-semibold text-white">{count}</p>
              </button>
            )
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notes Distribution Chart */}
        {notes.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-300">Notes Distribution</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <StickyNote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No notes yet</h3>
            <p className="text-slate-500 mb-4">Start capturing your production ideas</p>
            <button
              onClick={openNewForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first note
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {pinnedNotes.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-amber-400 mb-4">
                  <Pin className="w-4 h-4" />
                  Pinned ({pinnedNotes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
            
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 className="text-sm font-medium text-slate-500 mb-4">All Notes</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unpinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Note Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter(c => c.key !== 'all').map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-400">Pin this note to top</span>
              </label>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.content.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
