'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  StickyNote, Plus, Search, Edit2, Trash2, X, Save, 
  Calendar, Tag, User, Clock, CheckCircle, AlertCircle,
  FolderOpen, Filter, RefreshCw, Loader2, BarChart3, TrendingUp, Download, HelpCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

type Note = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  isPinned?: boolean
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { value: 'production', label: 'Production', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'creative', label: 'Creative', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'technical', label: 'Technical', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'logistics', label: 'Logistics', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'budget', label: 'Budget', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
]

const CHART_COLORS = {
  general: '#64748b',
  production: '#3b82f6',
  creative: '#8b5cf6',
  technical: '#10b981',
  logistics: '#f59e0b',
  budget: '#22c55e',
}

const CATEGORY_PALETTE = Object.values(CHART_COLORS)

// Helper function to highlight search terms in text
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>
  
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

const DEMO_NOTES: Note[] = [
  { 
    id: '1', 
    title: 'Day 1 Shoot - Factory Sequence', 
    content: 'Key points:\n- 200 extras confirmed\n- Safety officer on set\n- Backup generator arranged\n- Weather contingency: indoor warehouse shots', 
    category: 'production', 
    tags: ['shoot', 'action', 'extras'], 
    createdAt: '2024-02-10T10:00:00Z', 
    updatedAt: '2024-02-12T14:30:00Z',
    isPinned: true
  },
  { 
    id: '2', 
    title: 'Camera Equipment Backup List', 
    content: 'Primary: ARRI Alexa Mini LF\nBackup: RED Komodo\nLenses: Cooke S7/i Full Frame Plus\nStabilizer: DJI Ronin RS3 Pro', 
    category: 'technical', 
    tags: ['camera', 'equipment', 'backup'], 
    createdAt: '2024-02-08T09:00:00Z', 
    updatedAt: '2024-02-08T09:00:00Z' 
  },
  { 
    id: '3', 
    title: 'Location Change - Song Sequence', 
    content: 'Original: Marina Beach\nChanged to: EVP Studios ( Indoor )\nReason: Weather forecast shows rain\nBudget impact: +₹2L for studio rental', 
    category: 'logistics', 
    tags: ['location', 'weather', 'budget'], 
    createdAt: '2024-02-05T16:00:00Z', 
    updatedAt: '2024-02-06T11:00:00Z' 
  },
  { 
    id: '4', 
    title: 'Actor Schedule Conflict', 
    content: 'Ajith sir has a clash with another project on Feb 20th.\nNeed to reschedule temple shoot to Feb 18th or 19th.\nDiscuss with director and producer.', 
    category: 'production', 
    tags: ['schedule', 'cast', 'urgent'], 
    createdAt: '2024-02-03T08:00:00Z', 
    updatedAt: '2024-02-04T10:00:00Z',
    isPinned: true
  },
  { 
    id: '5', 
    title: 'VFX Shot Requirements', 
    content: 'Scene 12: Explosion - 45 frames\nScene 23: Glow effect - 30 frames\nScene 31: Blood removal - 15 frames\nTotal VFX shots: 90 frames estimated', 
    category: 'creative', 
    tags: ['vfx', 'shots', 'planning'], 
    createdAt: '2024-01-28T14:00:00Z', 
    updatedAt: '2024-01-30T09:00:00Z' 
  },
  { 
    id: '6', 
    title: 'Catering Budget Allocation', 
    content: 'Per day: ₹50,000\nTotal shoot days: 20\nBuffer (10%): ₹1,00,000\nTotal budget: ₹11,00,000', 
    category: 'budget', 
    tags: ['catering', 'budget', 'expenses'], 
    createdAt: '2024-01-25T11:00:00Z', 
    updatedAt: '2024-01-25T11:00:00Z' 
  },
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Refs for keyboard shortcuts and click outside
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    isPinned: false
  })

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes')
      if (!res.ok) {
        // Fall back to demo data
        setNotes(DEMO_NOTES)
        setIsDemoMode(true)
        return
      }
      const data = await res.json()
      setNotes(data.notes || DEMO_NOTES)
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      console.warn('Using demo notes:', err)
      setNotes(DEMO_NOTES)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Refs for keyboard shortcuts
  const selectedNoteRef = useRef<Note | null>(null)
  const handleTogglePinRef = useRef<((note: Note) => Promise<void>) | null>(null)

  // Update refs when values change
  useEffect(() => {
    selectedNoteRef.current = selectedNote
  }, [selectedNote])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          if (showForm) {
            setShowForm(false)
            setEditingId(null)
          } else if (search || filterCategory !== 'all') {
            setSearch('')
            setFilterCategory('all')
          } else {
            setShowKeyboardHelp(false)
          }
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefresh()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          setShowForm(true)
          setEditingId(null)
          setFormData({ title: '', content: '', category: 'general', tags: '', isPinned: false })
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(!showExportMenu)
          break
        case 'p':
          e.preventDefault()
          if (selectedNoteRef.current && handleTogglePinRef.current) {
            handleTogglePinRef.current(selectedNoteRef.current)
          }
          break
        case 'escape':
          e.preventDefault()
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false)
          } else if (showForm) {
            setShowForm(false)
            setEditingId(null)
          } else if (showExportMenu) {
            setShowExportMenu(false)
          } else {
            setSearch('')
            setFilterCategory('all')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showKeyboardHelp, search, filterCategory, showExportMenu])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotes()
    setRefreshing(false)
  }, [fetchNotes])

  const filteredNotes = notes.filter(note => {
    const matchSearch = !search.trim() || 
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = filterCategory === 'all' || note.category === filterCategory
    return matchSearch && matchCategory
  })

  const pinnedNotes = filteredNotes.filter(n => n.isPinned)
  const regularNotes = filteredNotes.filter(n => !n.isPinned)

  // Chart data computation
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    notes.forEach(note => {
      counts[note.category] = (counts[note.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: CATEGORIES.find(c => c.value === name)?.label || name,
      value,
      color: CHART_COLORS[name as keyof typeof CHART_COLORS] || '#64748b'
    }))
  }, [notes])

  const timelineData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    notes.forEach(note => {
      const date = new Date(note.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] || 0) + 1
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        month,
        notes: count
      }))
  }, [notes])

  const tagData = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [notes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    const noteData = {
      ...formData,
      tags,
      id: editingId
    }

    try {
      const res = await fetch('/api/notes', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      })

      if (res.ok) {
        await fetchNotes()
        setShowForm(false)
        setEditingId(null)
        setFormData({ title: '', content: '', category: 'general', tags: '', isPinned: false })
      }
    } catch (err) {
      console.error('Failed to save note:', err)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingId(note.id)
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', '),
      isPinned: note.isPinned || false
    })
    setShowForm(true)
  }

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    setShowExportMenu(false)
    
    // Simulate small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const data = filteredNotes.map(note => ({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', '),
      pinned: note.isPinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }))
    
    // Calculate summary stats
    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    notes.forEach(note => {
      categoryCounts[note.category] = (categoryCounts[note.category] || 0) + 1
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        summary: {
          totalNotes: notes.length,
          filteredNotes: filteredNotes.length,
          pinnedNotes: pinnedNotes.length,
          categories: Object.keys(categoryCounts).length,
          uniqueTags: Object.keys(tagCounts).length,
          categoryBreakdown: categoryCounts,
          topTags: Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((acc, [tag, count]) => ({ ...acc, [tag]: count }), {})
        },
        notes: data
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `production-notes-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const csv = ['Title,Content,Category,Tags,Pinned,Created,Updated']
        .concat(data.map(n => `"${n.title}","${n.content.replace(/"/g, '""')}","${n.category}","${n.tags}","${n.pinned}","${n.createdAt}","${n.updatedAt}"`))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `production-notes-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      fetchNotes()
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const handleTogglePin = useCallback(async (note: Note) => {
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned })
      })
      fetchNotes()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    }
  }, [fetchNotes])

  // Update ref when handleTogglePin changes
  useEffect(() => {
    handleTogglePinRef.current = handleTogglePin
  }, [handleTogglePin])

  // Refs for keyboard shortcuts

  const getCategoryStyle = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || CATEGORIES[0].color
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Production Notes</h1>
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                    Demo Data
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">Keep track of important production details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Shortcuts
            </button>
            {selectedNote && (
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <StickyNote className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">"{selectedNote.title.slice(0, 20)}{selectedNote.title.length > 20 ? '...' : ''}" selected</span>
                <button
                  onClick={() => handleTogglePin(selectedNote)}
                  className="ml-1 p-1 hover:bg-cyan-500/20 rounded"
                  title={selectedNote.isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <StickyNote className={`w-3.5 h-3.5 ${selectedNote.isPinned ? 'text-amber-400' : 'text-slate-400'}`} />
                </button>
              </div>
            )}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10 min-w-[140px]">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingId(null)
                setFormData({ title: '', content: '', category: 'general', tags: '', isPinned: false })
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes... (/)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {(search || filterCategory !== 'all') && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setSearch(''); setFilterCategory('all') }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Notes</p>
            <p className="text-2xl font-semibold text-white mt-1">{notes.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Pinned</p>
            <p className="text-2xl font-semibold text-amber-400 mt-1">{notes.filter(n => n.isPinned).length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Categories</p>
            <p className="text-2xl font-semibold text-indigo-400 mt-1">{new Set(notes.map(n => n.category)).size}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Tags Used</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">
              {new Set(notes.flatMap(n => n.tags)).size}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {notes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Notes by Category - Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Notes by Category
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155', 
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Notes Timeline - Area Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Notes Over Time
              </h3>
              <div className="h-48">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="notes" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorNotes)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    Not enough data
                  </div>
                )}
              </div>
            </div>

            {/* Top Tags - Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Top Tags
              </h3>
              <div className="h-48">
                {tagData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#64748b" 
                        fontSize={10} 
                        width={60}
                        tickFormatter={(value) => value.length > 8 ? `${value.slice(0,8)}...` : value}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No tags yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No notes found. Create your first note!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-amber-400 flex items-center gap-2 mb-4">
                  <StickyNote className="w-4 h-4" />
                  Pinned Notes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      getCategoryStyle={getCategoryStyle}
                      formatDate={formatDate}
                      searchTerm={search}
                      isSelected={selectedNote?.id === note.id}
                      onSelect={setSelectedNote}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-slate-500 mb-4">All Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      getCategoryStyle={getCategoryStyle}
                      formatDate={formatDate}
                      searchTerm={search}
                      isSelected={selectedNote?.id === note.id}
                      onSelect={setSelectedNote}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Note' : 'New Note'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                <label htmlFor="isPinned" className="text-sm text-slate-300">Pin this note</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'R', action: 'Refresh notes' },
                { key: '/', action: 'Focus search' },
                { key: 'N', action: 'Create new note' },
                { key: 'P', action: 'Pin/unpin selected note' },
                { key: 'E', action: 'Export notes' },
                { key: '?', action: 'Show shortcuts' },
                { key: 'Esc', action: 'Close modal / Clear filters' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin,
  getCategoryStyle,
  formatDate,
  searchTerm = '',
  isSelected = false,
  onSelect
}: { 
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (note: Note) => void
  getCategoryStyle: (category: string) => string
  formatDate: (date: string) => string
  searchTerm?: string
  isSelected?: boolean
  onSelect?: (note: Note) => void
}) {
  return (
    <div 
      className={`bg-slate-900 border rounded-xl p-4 transition-colors group cursor-pointer ${
        isSelected 
          ? 'border-cyan-500 ring-1 ring-cyan-500/30' 
          : 'border-slate-800 hover:border-slate-600'
      }`}
      onClick={() => onSelect?.(note)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(note.category)}`}>
          {note.category}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(note)}
            className="p-1 hover:bg-slate-800 rounded"
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <StickyNote className={`w-3.5 h-3.5 ${note.isPinned ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      <h3 className="text-white font-medium mb-2 line-clamp-1">
        <HighlightedText text={note.title} highlight={searchTerm} />
      </h3>
      <p className="text-slate-400 text-sm mb-3 line-clamp-3 whitespace-pre-wrap">
        <HighlightedText text={note.content} highlight={searchTerm} />
      </p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-slate-500">+{note.tags.length - 3}</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock className="w-3 h-3" />
        {formatDate(note.updatedAt)}
      </div>
    </div>
  )
}
