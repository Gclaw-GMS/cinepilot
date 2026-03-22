'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  StickyNote, Plus, Search, Edit2, Trash2, X, Save, 
  Calendar, Tag, User, Clock, CheckCircle, AlertCircle,
  FolderOpen, Filter, RefreshCw, Loader2, BarChart3, TrendingUp, Download, HelpCircle, Copy, Printer, ChevronDown, AlertTriangle
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
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'category'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds
  
  // Calculate active filter count (including sort state and search) - MUST be before refs that use it
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterCategory !== 'all') count++
    if (sortBy !== 'updatedAt' || sortOrder !== 'desc') count++
    if (search.trim()) count++
    return count
  }, [filterCategory, sortBy, sortOrder, search])
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }
  
  // Clear filters - MUST be before refs that use it
  const clearFilters = useCallback(() => {
    setFilterCategory('all')
    setSortBy('updatedAt')
    setSortOrder('desc')
    setSearch('')
  }, [])
  
  // Refs for keyboard shortcuts (to avoid dependency issues)
  const showFilterPanelRef = useRef(showFilterPanel)
  const filterCategoryRef = useRef(filterCategory)
  const searchRef = useRef(search)
  const clearFiltersRef = useRef(clearFilters)
  const activeFilterCountRef = useRef(activeFilterCount)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)
  
  // Keep refs in sync with state for keyboard shortcuts
  useEffect(() => {
    showFilterPanelRef.current = showFilterPanel
  }, [showFilterPanel])

  useEffect(() => {
    filterCategoryRef.current = filterCategory
  }, [filterCategory])

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])
  
  // Tab state for view switching
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'recent' | 'analytics'>('all')
  const activeTabRef = useRef(activeTab)
  
  // Keep activeTab ref in sync
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Bulk selection state
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Refs for keyboard shortcuts and click outside
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const bulkCategoryMenuRef = useRef<HTMLDivElement>(null)
  
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
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchNotes()
    }, autoRefreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, fetchNotes])

  // Refs for keyboard shortcuts
  const selectedNoteRef = useRef<Note | null>(null)
  const handleTogglePinRef = useRef<((note: Note) => Promise<void>) | null>(null)
  const handleDuplicateRef = useRef<((note: Note) => Promise<void>) | null>(null)
  const handleRefreshRef = useRef<() => void>(() => {})
  const handleExportRef = useRef<((format: 'csv' | 'json' | 'markdown') => Promise<void>) | null>(null)
  const printNotesReportRef = useRef<() => void>(() => {})
  const notesLengthRef = useRef(0)
  const notesRef = useRef<Note[]>([])
  const filteredNotesRef = useRef<Note[]>([])
  const selectedNotesRef = useRef<Set<string>>(new Set())
  const showBulkActionsRef = useRef<boolean>(false)
  const selectedNotesSetRef = useRef<Set<string>>(new Set())
  
  // Refs for clear filters (already declared earlier)
  const handleSelectAllRef = useRef<() => void>(() => {})

  // Update refs when values change
  useEffect(() => {
    selectedNoteRef.current = selectedNote
  }, [selectedNote])

  useEffect(() => {
    selectedNotesRef.current = selectedNotes
    showBulkActionsRef.current = showBulkActions
  }, [selectedNotes, showBulkActions])

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

      // Ctrl+A: Select all notes
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault()
          handleSelectAllRef.current()
          return
        }
        // Ctrl+D: Delete selected notes
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault()
          if (selectedNotes.size > 0) {
            setShowDeleteConfirm(true)
          }
          return
        }
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefreshRef.current?.()
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'f':
          e.preventDefault()
          setShowFilterPanel(prev => !prev)
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
        case 'm':
          e.preventDefault()
          if (notesLengthRef.current > 0) {
            handleExportRef.current?.('markdown')
          }
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        case 'x':
          e.preventDefault()
          if (showFilterPanelRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current()
          }
          break
        case 'p':
          e.preventDefault()
          if (selectedNoteRef.current && handleTogglePinRef.current) {
            handleTogglePinRef.current(selectedNoteRef.current)
          }
          break
        case 'o':
          e.preventDefault()
          if (notesLengthRef.current > 0) {
            printNotesReportRef.current?.()
          }
          break
        case 'd':
          e.preventDefault()
          if (selectedNoteRef.current && handleDuplicateRef.current) {
            handleDuplicateRef.current(selectedNoteRef.current)
          }
          break
        // Context-aware number keys
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '0':
          e.preventDefault()
          const num = parseInt(e.key)
          
          if (showFilterPanelRef.current) {
            // When filters panel OPEN: number keys filter by category (toggle behavior)
            if (num === 0) {
              setFilterCategory('all')
            } else {
              const categoryKeys = ['general', 'production', 'creative', 'technical', 'logistics', 'budget']
              const numIndex = num - 1
              if (numIndex >= 0 && numIndex < categoryKeys.length) {
                // Toggle behavior: if same category already selected, clear it
                setFilterCategory(filterCategoryRef.current === categoryKeys[numIndex] ? 'all' : categoryKeys[numIndex])
              }
            }
          } else {
            // When filters panel CLOSED: number keys switch tabs
            if (num >= 1 && num <= 4) {
              const tabs: Array<'all' | 'pinned' | 'recent' | 'analytics'> = ['all', 'pinned', 'recent', 'analytics']
              setActiveTab(tabs[num - 1])
            } else if (num === 0) {
              // 0 clears category filter
              setFilterCategory('all')
            }
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
          } else if (showPrintMenu) {
            setShowPrintMenu(false)
          } else if (showFilterPanel) {
            setShowFilterPanel(false)
          } else if (showBulkActions) {
            setSelectedNotes(new Set())
            setShowBulkActions(false)
          } else if (selectedNotes.size > 0) {
            setSelectedNotes(new Set())
          } else {
            setSearch('')
            setFilterCategory('all')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showKeyboardHelp, search, filterCategory, showExportMenu, showFilterPanel, showPrintMenu, showBulkActions, selectedNotes])

  // Click outside to close export, print menus, and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button
        const filterButton = document.querySelector('[data-filter-toggle]')
        if (filterButton && filterButton.contains(e.target as Node)) return
        setShowFilterPanel(false)
      }
    }
    if (showExportMenu || showPrintMenu || showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu, showPrintMenu, showFilterPanel])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotes()
    setRefreshing(false)
  }, [fetchNotes])

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => {
      const matchSearch = !search.trim() || 
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      const matchCategory = filterCategory === 'all' || note.category === filterCategory
      
      // Apply tab filter
      let matchTab = true
      if (activeTab === 'pinned') {
        matchTab = note.isPinned === true
      } else if (activeTab === 'recent') {
        // Show notes from last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        matchTab = new Date(note.updatedAt) >= sevenDaysAgo
      }
      // 'all' and 'analytics' tabs don't filter
      
      return matchSearch && matchCategory && matchTab
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [notes, search, filterCategory, sortBy, sortOrder, activeTab])

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

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'markdown') => {
    setExporting(true)
    setShowExportMenu(false)
    
    // Simulate small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const data = filteredNotesRef.current.map(note => ({
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
    
    if (format === 'markdown') {
      // Generate Markdown format
      let markdown = `# Production Notes Report\n\n`
      markdown += `**Export Date:** ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`
      markdown += `## Summary\n\n`
      markdown += `- **Total Notes:** ${notes.length}\n`
      markdown += `- **Filtered Notes:** ${filteredNotes.length}\n`
      markdown += `- **Pinned Notes:** ${pinnedNotes.length}\n`
      markdown += `- **Categories:** ${Object.keys(categoryCounts).length}\n`
      markdown += `- **Unique Tags:** ${Object.keys(tagCounts).length}\n\n`
      
      if (Object.keys(categoryCounts).length > 0) {
        markdown += `## Category Breakdown\n\n`
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          markdown += `- **${cat}:** ${count} notes\n`
        })
        markdown += `\n`
      }
      
      if (Object.keys(tagCounts).length > 0) {
        markdown += `## Top Tags\n\n`
        const topTags = Object.entries(tagCounts).sort(([,a], [,b]) => b - a).slice(0, 10)
        topTags.forEach(([tag, count]) => {
          markdown += `- \`${tag}\`: ${count}\n`
        })
        markdown += `\n`
      }
      
      markdown += `---\n\n`
      markdown += `## Notes\n\n`
      
      filteredNotesRef.current.forEach((note, idx) => {
        if (note.isPinned) markdown += `📌 **PINNED**\n\n`
        markdown += `### ${idx + 1}. ${note.title}\n\n`
        markdown += `**Category:** ${note.category}  \n`
        markdown += `**Tags:** ${note.tags.join(', ') || 'None'}  \n`
        markdown += `**Created:** ${new Date(note.createdAt).toLocaleDateString('en-IN')}  \n`
        markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleDateString('en-IN')}\n\n`
        markdown += `${note.content}\n\n`
        markdown += `---\n\n`
      })
      
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `production-notes-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'json') {
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
  }, [notes, filteredNotes, pinnedNotes])

  // Print Notes Report
  const printNotesReport = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width:900,height=700');
    if (!printWindow) return;
    
    const categoryColors: Record<string, string> = {
      general: '#64748b',
      production: '#3b82f6',
      creative: '#8b5cf6',
      technical: '#10b981',
      logistics: '#f59e0b',
      budget: '#22c55e',
    };
    
    const categoryLabels: Record<string, string> = {
      general: 'General',
      production: 'Production',
      creative: 'Creative',
      technical: 'Technical',
      logistics: 'Logistics',
      budget: 'Budget',
    };
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Production Notes Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
    .summary-card.pinned .value { color: #f59e0b; }
    .summary-card.category .value { color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; }
    .pinned-row { background: #fffbeb; }
    .pinned-icon { color: #f59e0b; margin-right: 5px; }
    .category-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .category-general { background: #f1f5f9; color: #64748b; }
    .category-production { background: #dbeafe; color: #3b82f6; }
    .category-creative { background: #ede9fe; color: #8b5cf6; }
    .category-technical { background: #d1fae5; color: #10b981; }
    .category-logistics { background: #fef3c7; color: #f59e0b; }
    .category-budget { background: #dcfce7; color: #22c55e; }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .tag { background: #e2e8f0; color: #475569; padding: 1px 6px; border-radius: 3px; font-size: 10px; }
    .note-content { white-space: pre-wrap; color: #444; font-size: 13px; }
    .note-date { color: #888; font-size: 11px; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Production Notes Report</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Notes</div>
      <div class="value">${notesRef.current.length}</div>
    </div>
    <div class="summary-card pinned">
      <div class="label">Pinned</div>
      <div class="value">${notesRef.current.filter(n => n.isPinned).length}</div>
    </div>
    <div class="summary-card category">
      <div class="label">Categories</div>
      <div class="value">${new Set(notesRef.current.map(n => n.category)).size}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Tags</div>
      <div class="value">${new Set(notesRef.current.flatMap(n => n.tags)).size}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 30px;"></th>
        <th style="width: 150px;">Title</th>
        <th>Content</th>
        <th style="width: 90px;">Category</th>
        <th style="width: 120px;">Tags</th>
        <th style="width: 100px;">Date</th>
      </tr>
    </thead>
    <tbody>
      ${filteredNotesRef.current.map(note => `
        <tr class="${note.isPinned ? 'pinned-row' : ''}">
          <td>${note.isPinned ? '📌' : ''}</td>
          <td><strong>${note.title}</strong></td>
          <td class="note-content">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</td>
          <td><span class="category-badge category-${note.category}">${categoryLabels[note.category] || note.category}</span></td>
          <td><div class="tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></td>
          <td class="note-date">${new Date(note.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    Generated by CinePilot - Production Notes
  </div>
</body>
</html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    setShowPrintMenu(false);
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      fetchNotes()
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  // Bulk selection handlers
  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const handleSelectAll = useCallback(() => {
    const allIds = filteredNotes.map(n => n.id)
    setSelectedNotes(new Set(allIds))
    setShowBulkActions(true)
  }, [filteredNotes])

  // Update ref for keyboard shortcuts
  useEffect(() => {
    handleSelectAllRef.current = handleSelectAll
  }, [handleSelectAll])

  const handleDeselectAll = useCallback(() => {
    setSelectedNotes(new Set())
    setShowBulkActions(false)
  }, [])

  const handleBulkDelete = async () => {
    if (selectedNotes.size === 0) return
    if (!confirm(`Delete ${selectedNotes.size} selected notes?`)) return
    
    try {
      const deletePromises = Array.from(selectedNotes).map(id => 
        fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      setSelectedNotes(new Set())
      setShowBulkActions(false)
      setShowDeleteConfirm(false)
      fetchNotes()
    } catch (err) {
      console.error('Failed to delete notes:', err)
    }
  }

  const handleBulkChangeCategory = async (category: string) => {
    if (selectedNotes.size === 0) return
    
    try {
      const updatePromises = Array.from(selectedNotes).map(id => 
        fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, category })
        })
      )
      await Promise.all(updatePromises)
      setSelectedNotes(new Set())
      setShowBulkActions(false)
      setShowBulkCategoryMenu(false)
      fetchNotes()
    } catch (err) {
      console.error('Failed to update notes:', err)
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

  const handleDuplicate = useCallback(async (note: Note) => {
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${note.title} (Copy)`,
          content: note.content,
          category: note.category,
          tags: note.tags.join(', '),
          isPinned: false
        })
      })
      fetchNotes()
    } catch (err) {
      console.error('Failed to duplicate note:', err)
    }
  }, [fetchNotes])

  // Update ref when handleTogglePin changes
  useEffect(() => {
    handleTogglePinRef.current = handleTogglePin
  }, [handleTogglePin])

  // Update ref when handleDuplicate changes
  useEffect(() => {
    handleDuplicateRef.current = handleDuplicate
  }, [handleDuplicate])

  // Update ref when handleRefresh changes
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  // Update ref when handleExport changes
  useEffect(() => {
    handleExportRef.current = handleExport
  }, [handleExport])

  // Update ref when printNotesReport changes
  useEffect(() => {
    printNotesReportRef.current = printNotesReport
  }, [printNotesReport])

  // Update ref when notes.length changes
  useEffect(() => {
    notesLengthRef.current = notes.length
  }, [notes.length])

  // Update refs when notes or filteredNotes changes
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    filteredNotesRef.current = filteredNotes
  }, [filteredNotes])

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
          <div className="flex items-center gap-6">
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
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {autoRefresh && <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}</span>}
                Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing || autoRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {/* Auto-Refresh Toggle */}
            <div className="relative flex items-center">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  autoRefresh 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                }`}
                title="Auto-Refresh (A)"
              >
                <div className="relative flex items-center">
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                <span>Auto</span>
              </button>
              {autoRefresh && (
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="ml-2 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              )}
            </div>
            {/* Filter Toggle Button */}
            <div className="relative" ref={filterPanelRef}>
              <button
                data-filter-toggle
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                }`}
                title="Filter (F)"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilterPanel && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Filter & Sort</span>
                      <span className="text-xs text-amber-400">(X to clear)</span>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors"
                      >
                        Clear ({activeFilterCount})
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Sort Options */}
                    <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-purple-300 font-medium">Sort By</label>
                        <button
                          onClick={toggleSortOrder}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white transition-colors"
                          title="Toggle sort order (S)"
                        >
                          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="updatedAt">Last Updated</option>
                        <option value="createdAt">Created Date</option>
                        <option value="title">Title</option>
                        <option value="category">Category</option>
                      </select>
                    </div>
                    
                    {/* Category Filter */}
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((cat, idx) => (
                          <option key={cat.value} value={cat.value}>{cat.label} ({idx + 1})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  title={selectedNote.isPinned ? 'Unpin note (P)' : 'Pin note (P)'}
                >
                  <StickyNote className={`w-3.5 h-3.5 ${selectedNote.isPinned ? 'text-amber-400' : 'text-slate-400'}`} />
                </button>
                <button
                  onClick={() => handleDuplicate(selectedNote)}
                  className="p-1 hover:bg-cyan-500/20 rounded"
                  title="Duplicate note"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
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
                  <button
                    onClick={() => handleExport('markdown')}
                    disabled={exporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export as Markdown
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={notes.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-slate-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
                <ChevronDown className={`w-3 h-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10 min-w-[160px]">
                  <button
                    onClick={printNotesReport}
                    disabled={notes.length === 0}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Printer className="w-3 h-3 text-purple-400" />
                    Print Notes Report
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
          {[
            { id: 'all', label: 'All Notes', icon: StickyNote },
            { id: 'pinned', label: 'Pinned', icon: AlertCircle },
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'pinned' && pinnedNotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  {pinnedNotes.length}
                </span>
              )}
            </button>
          ))}
          {!showFilterPanel && (
            <span className="ml-3 text-xs text-cyan-400">(1-4 to switch tabs)</span>
          )}
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
              {CATEGORIES.map((cat, idx) => (
                <option key={cat.value} value={cat.value}>{cat.label} ({idx + 1})</option>
              ))}
            </select>
            <span className="text-xs text-amber-400">{showFilterPanel ? '(1-6 to filter, 0 to clear)' : '(F to open filters)'}</span>
          </div>
          {/* Bulk Selection Buttons */}
          <div className="flex items-center gap-2">
            {selectedNotes.size > 0 ? (
              <>
                <span className="text-sm text-indigo-400 font-medium">
                  {selectedNotes.size} selected
                </span>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500 rounded-lg transition-colors"
              >
                <input type="checkbox" className="w-4 h-4 rounded" readOnly />
                Select All
              </button>
            )}
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && !loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">Total Notes</span>
                  <StickyNote className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-white">{notes.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">Pinned</span>
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-amber-400">{pinnedNotes.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">Categories</span>
                  <Tag className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold text-indigo-400">{categoryData.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">Total Tags</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">{tagData.length}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Timeline Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="notes"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorNotes)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Top Tags */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tagData.map((tag, idx) => (
                  <span
                    key={tag.name}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag.name}
                    <span className="text-xs text-indigo-300">{tag.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Notes List (for non-analytics tabs) */}
        {activeTab !== 'analytics' && (
          <>
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
                      isNoteSelected={selectedNotes.has(note.id)}
                      onNoteSelect={handleSelectNote}
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
                      isNoteSelected={selectedNotes.has(note.id)}
                      onNoteSelect={handleSelectNote}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
          </>
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

      {/* Bulk Actions Floating Toolbar */}
      {showBulkActions && selectedNotes.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3 bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 shadow-2xl shadow-indigo-500/20">
            <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full">
              {selectedNotes.size} selected
            </span>
            
            {/* Change Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkCategoryMenu(!showBulkCategoryMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                Change Category
                <ChevronDown className="w-3 h-3" />
              </button>
              {showBulkCategoryMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-lg py-2 min-w-[160px] shadow-xl">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => handleBulkChangeCategory(cat.value)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-700" />

            {/* Clear Selection */}
            <button
              onClick={handleDeselectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-slate-900 border border-red-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete {selectedNotes.size} Notes?</h3>
                <p className="text-sm text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Delete {selectedNotes.size} Notes
              </button>
            </div>
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
              {/* Tabs Section (when filters closed) */}
              <div className="mb-4">
                <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">When Filters Closed</span>
              </div>
              {[
                { key: '1', action: 'All Notes tab' },
                { key: '2', action: 'Pinned tab' },
                { key: '3', action: 'Recent tab' },
                { key: '4', action: 'Analytics tab' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-amber-600/20 border border-amber-600/30 rounded text-xs font-mono text-amber-400">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
              
              {/* Filter Section (when filters open) */}
              <div className="mb-4 mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">When Filters Open</span>
              </div>
              {[
                { key: '1-6', action: 'Filter by category (toggle)', color: 'cyan' },
                { key: '0', action: 'Clear category filter', color: 'cyan' },
                { key: 'X', action: 'Clear all filters', color: 'cyan' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-cyan-600/20 border border-cyan-600/30 rounded text-xs font-mono text-cyan-400">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
              
              {/* General Shortcuts */}
              <div className="mb-4 mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">General</span>
              </div>
              {[
                { key: 'R', action: 'Refresh notes' },
                { key: 'A', action: 'Toggle auto-refresh' },
                { key: '/', action: 'Focus search' },
                { key: 'F', action: 'Toggle filters' },
                { key: 'S', action: 'Toggle sort order' },
                { key: 'N', action: 'Create new note' },
                { key: 'P', action: 'Pin/unpin selected note' },
                { key: 'D', action: 'Duplicate selected note' },
                { key: 'E', action: 'Export notes' },
                { key: 'M', action: 'Export as Markdown' },
                { key: 'O', action: 'Print notes report' },
                { key: '?', action: 'Show shortcuts' },
                { key: 'Ctrl+A', action: 'Select all notes' },
                { key: 'Ctrl+D', action: 'Delete selected notes' },
                { key: 'Esc', action: 'Close modal / Clear selection' },
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
  onSelect,
  isNoteSelected,
  onNoteSelect
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
  isNoteSelected?: boolean
  onNoteSelect?: (noteId: string) => void
}) {
  return (
    <div 
      className={`bg-slate-900 border rounded-xl p-4 transition-colors group cursor-pointer ${
        isNoteSelected
          ? 'border-indigo-500 ring-1 ring-indigo-500/30' 
          : isSelected 
            ? 'border-cyan-500 ring-1 ring-cyan-500/30' 
            : 'border-slate-800 hover:border-slate-600'
      }`}
      onClick={() => onSelect?.(note)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNoteSelected || false}
            onChange={(e) => {
              e.stopPropagation()
              onNoteSelect?.(note.id)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
          />
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(note.category)}`}>
            {note.category}
          </span>
        </div>
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
