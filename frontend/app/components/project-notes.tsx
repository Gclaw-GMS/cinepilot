/**
 * Project Notes Component - PERFECTED VERSION
 * CinePilot Phase 28
 * Professional implementation with full features
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
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
  TrendingUp,
  Sparkles,
  Send
} from 'lucide-react'
import { ProjectNote, getNotes, createNote, deleteNote } from '../lib/api-phase28'

interface ProjectNotesProps {
  projectId: string | number
  currentUser?: string
}

interface NewNoteData {
  content: string
  category: 'general' | 'idea' | 'feedback' | 'decision' | 'todo'
  isPinned?: boolean
}

const CATEGORIES = [
  { key: 'all', label: 'All Notes', icon: StickyNote, color: '#64748b' },
  { key: 'todo', label: 'To-Do', icon: CheckSquare, color: '#f59e0b' },
  { key: 'decision', label: 'Decisions', icon: FileText, color: '#10b981' },
  { key: 'idea', label: 'Ideas', icon: Lightbulb, color: '#8b5cf6' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#06b6d4' },
  { key: 'general', label: 'General', icon: StickyNote, color: '#64748b' },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  todo: CheckSquare,
  decision: FileText,
  idea: Lightbulb,
  feedback: MessageSquare,
  general: StickyNote,
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  todo: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500' },
  decision: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500' },
  idea: { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500' },
  feedback: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500' },
  general: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500' },
}

export default function ProjectNotes({ projectId, currentUser = 'You' }: ProjectNotesProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'pinned'>('newest')
  const [newNote, setNewNote] = useState<NewNoteData>({ 
    content: '', 
    category: 'general',
    isPinned: false 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Stats calculation
  const stats = useMemo(() => {
    const total = notes.length
    const pinned = notes.filter(n => n.isPinned).length
    const byCategory = notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total, pinned, byCategory }
  }, [notes])

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = [...notes]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.content.toLowerCase().includes(query) ||
        n.author.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Pinned always first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return 0
    })
    
    return filtered
  }, [notes, searchQuery, selectedCategory, sortBy])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await getNotes(projectId)
      setNotes(data)
      setError(null)
    } catch (err) {
      setError('Failed to load notes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [projectId])

  const handleCreate = async () => {
    if (!newNote.content.trim()) return
    
    setIsSubmitting(true)
    try {
      await createNote(projectId, {
        content: newNote.content,
        category: newNote.category,
        isPinned: newNote.isPinned || false,
        author: currentUser
      })
      setNewNote({ content: '', category: 'general', isPinned: false })
      setShowForm(false)
      loadNotes()
    } catch (err) {
      console.error('Failed to create note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (noteId: number) => {
    try {
      await deleteNote(projectId, noteId)
      setDeleteConfirm(null)
      loadNotes()
    } catch (err) {
      console.error('Failed to delete note')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || StickyNote
    return Icon
  }

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <StickyNote className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project Notes</h3>
              <p className="text-xs text-slate-500">{stats.total} notes • {stats.pinned} pinned</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Note
              </>
            )}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Category:</span>
              <div className="flex gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory === cat.key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="pinned">Pinned First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="space-y-3">
            <textarea
              placeholder="Write your note..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value as NewNoteData['category'] })}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                >
                  {CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNote.isPinned}
                    onChange={(e) => setNewNote({ ...newNote, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <Pin className="w-4 h-4" />
                  Pin note
                </label>
              </div>
              <button
                onClick={handleCreate}
                disabled={isSubmitting || !newNote.content.trim()}
                className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      {stats.total > 0 && (
        <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-800 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <BarChart3 className="w-3 h-3 text-slate-500" />
            <span className="text-slate-500">Quick stats:</span>
          </div>
          <div className="flex gap-3">
            {Object.entries(stats.byCategory).map(([cat, count]) => {
              const catInfo = CATEGORIES.find(c => c.key === cat)
              return (
                <span key={cat} className="text-xs text-slate-400">
                  <span className="text-white font-medium">{count}</span> {catInfo?.label.toLowerCase()}
                </span>
              )
            })}
          </div>
          <span className="ml-auto text-xs text-slate-600">
            {filteredNotes.length} of {stats.total} notes
          </span>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <StickyNote className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No notes match your filters' 
                : 'No notes yet. Create one to get started!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredNotes.map(note => {
              const CategoryIcon = getCategoryIcon(note.category)
              const colors = CATEGORY_COLORS[note.category] || CATEGORY_COLORS.general
              
              return (
                <div 
                  key={note.id} 
                  className={`p-4 hover:bg-slate-800/30 transition-colors ${note.isPinned ? 'bg-cyan-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <CategoryIcon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${colors.bg} ${colors.text}`}>
                          {note.category}
                        </span>
                        {note.isPinned && (
                          <Pin className="w-3 h-3 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-sm text-white mb-2 break-words">{note.content}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {deleteConfirm === note.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                            title="Confirm delete"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(note.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            {searchQuery || selectedCategory !== 'all' ? ' shown' : ' total'}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by CinePilot
          </span>
        </div>
      </div>
    </div>
  )
}
