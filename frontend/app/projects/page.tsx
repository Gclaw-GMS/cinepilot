'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { 
  Folder, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar, 
  Film, 
  Users,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  X,
  DollarSign,
  MapPin,
  RefreshCw,
  Keyboard,
  Download,
  ChevronDown,
  Filter,
  Printer
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  language?: string
  genre?: string
  budget?: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  scriptCount: number
  crewCount: number
  isDemo?: boolean
}

// Demo fallback data
const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-project-1',
    name: 'Kaathal - The Core',
    description: 'A gripping political drama set in Tamil Nadu',
    status: 'production',
    language: 'tamil',
    genre: 'Drama/Political',
    budget: '85000000',
    startDate: '2026-01-15',
    endDate: '2026-03-15',
    createdAt: '2025-12-01',
    scriptCount: 2,
    crewCount: 45,
    isDemo: true,
  },
  {
    id: 'demo-project-2',
    name: 'Vettaiyaadu',
    description: 'An investigative thriller in the hills of Ooty',
    status: 'pre_production',
    language: 'tamil',
    genre: 'Thriller/Mystery',
    budget: '42000000',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    createdAt: '2025-11-15',
    scriptCount: 1,
    crewCount: 28,
    isDemo: true,
  },
  {
    id: 'demo-project-3',
    name: 'Madras Talkies',
    description: 'A coming-of-age story about film students',
    status: 'planning',
    language: 'tamil',
    genre: 'Comedy/Drama',
    budget: '25000000',
    startDate: '2026-07-01',
    endDate: '2026-09-15',
    createdAt: '2026-01-10',
    scriptCount: 1,
    crewCount: 12,
    isDemo: true,
  },
]

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'active', label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'production', label: 'In Production', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'post_production', label: 'Post Production', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'completed', label: 'Completed', color: 'bg-slate-500/20 text-slate-400' },
]

const GENRE_OPTIONS = [
  'Drama', 'Action', 'Comedy', 'Thriller', 'Romance', 'Horror', 
  'Sci-Fi', 'Documentary', 'Musical', 'Adventure'
]

const LANGUAGE_OPTIONS = [
  { value: 'tamil', label: 'Tamil' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'english', label: 'English' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState({
    status: [] as string[],
    language: [] as string[],
    genre: [] as string[],
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'tamil',
    genre: '',
    budget: '',
    startDate: '',
    endDate: '',
    status: 'planning',
  })

  const [isDemoMode, setIsDemoMode] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      
      // Handle demo mode from API response
      if (data.demoData && Array.isArray(data.demoData)) {
        setProjects(data.demoData)
        setIsDemoMode(true)
      } else if (Array.isArray(data)) {
        setProjects(data)
        // Check if any project is demo
        setIsDemoMode(data.some((p: Project) => p.isDemo))
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
      // Use demo fallback on error
      setProjects(DEMO_PROJECTS)
      setIsDemoMode(true)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // R: Refresh projects
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault()
      loadProjects()
    }
    // /: Focus search
    else if (e.key === '/') {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    // N: New project
    else if (e.key.toLowerCase() === 'n') {
      e.preventDefault()
      setShowCreateModal(true)
    }
    // ?: Show keyboard help
    else if (e.key === '?') {
      e.preventDefault()
      setShowKeyboardHelp(prev => !prev)
    }
    // P: Toggle print menu
    else if (e.key.toLowerCase() === 'p') {
      e.preventDefault()
      setShowPrintMenu(prev => !prev)
    }
    // E: Toggle export dropdown
    else if (e.key.toLowerCase() === 'e') {
      e.preventDefault()
      setShowExportDropdown(prev => !prev)
    }
    // F: Toggle filters
    else if (e.key.toLowerCase() === 'f') {
      e.preventDefault()
      setShowFilters(prev => !prev)
    }
    // Escape: Close modal / Clear search / Close export / Close filters
    else if (e.key === 'Escape') {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false)
      } else if (showExportDropdown) {
        setShowExportDropdown(false)
      } else if (showFilters) {
        setShowFilters(false)
      } else if (showPrintMenu) {
        setShowPrintMenu(false)
      } else if (search) {
        setSearch('')
      }
    }
  }, [loadProjects, search, showKeyboardHelp, showExportDropdown, showFilters, showPrintMenu])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false)
      }
    }
    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportDropdown])

  // Click outside to close filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Only close if clicking outside the filter panel and not on the filter toggle button
        const filterButton = document.querySelector('[title="Toggle filters (F)"]')
        if (filterButton && filterButton.contains(e.target as Node)) {
          return
        }
        setShowFilters(false)
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Click outside to close print menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrintMenu])

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return
    
    const timestamp = new Date().toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    
    const statusColors: Record<string, string> = {
      planning: '#3b82f6',
      active: '#10b981',
      production: '#f59e0b',
      post_production: '#a855f7',
      completed: '#64748b'
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Projects Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 24px; color: #0f172a; }
    .header .timestamp { font-size: 12px; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; text-transform: uppercase; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 CinePilot - Projects Report</h1>
    <div class="timestamp">Generated: ${timestamp}</div>
  </div>
  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total Projects</div>
      <div class="stat-value">${filtered.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">In Production</div>
      <div class="stat-value">${filtered.filter(p => p.status === 'production').length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Planning</div>
      <div class="stat-value">${filtered.filter(p => p.status === 'planning').length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Budget</div>
      <div class="stat-value">₹${(filtered.reduce((sum, p) => sum + (parseInt(p.budget || '0')), 0) / 10000000).toFixed(1)}Cr</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Project Name</th>
        <th>Status</th>
        <th>Language</th>
        <th>Genre</th>
        <th>Budget</th>
        <th>Start Date</th>
        <th>End Date</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map(p => `
        <tr>
          <td><strong>${p.name}</strong>${p.description ? `<br><small style="color:#64748b">${p.description}</small>` : ''}</td>
          <td><span class="status" style="background:${statusColors[p.status] || '#64748b'}20;color:${statusColors[p.status] || '#64748b'}">${p.status.replace('_', ' ')}</span></td>
          <td>${p.language || '-'}</td>
          <td>${p.genre || '-'}</td>
          <td>${p.budget ? '₹' + (parseInt(p.budget) / 10000000).toFixed(1) + 'Cr' : '-'}</td>
          <td>${p.startDate || '-'}</td>
          <td>${p.endDate || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    CinePilot - Film Production Management System
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
    setShowPrintMenu(false)
  }

  const handleExport = (format: 'csv' | 'json') => {
    const exportData = filtered
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (format === 'csv') {
      const headers = ['Name', 'Description', 'Status', 'Language', 'Genre', 'Budget', 'Start Date', 'End Date', 'Scripts', 'Crew']
      const rows = exportData.map(p => [
        p.name,
        p.description || '',
        p.status,
        p.language || '',
        p.genre || '',
        p.budget || '',
        p.startDate || '',
        p.endDate || '',
        p.scriptCount,
        p.crewCount
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `projects-${timestamp}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalProjects: exportData.length,
        summary: {
          byStatus: exportData.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          byLanguage: exportData.reduce((acc, p) => {
            if (p.language) {
              acc[p.language] = (acc[p.language] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>),
          totalBudget: exportData.reduce((sum, p) => sum + (parseFloat(p.budget || '0') || 0), 0),
        },
        projects: exportData
      }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `projects-${timestamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowExportDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...(editingProject ? { id: editingProject.id } : {}),
        name: formData.name,
        description: formData.description || undefined,
        language: formData.language,
        genre: formData.genre || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        ...(editingProject ? { status: formData.status } : {}),
      }

      const method = editingProject ? 'PATCH' : 'POST'
      const res = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${editingProject ? 'update' : 'create'} project`)
      }

      const result = await res.json()
      
      if (editingProject) {
        setProjects(prev => prev.map(p => p.id === editingProject.id ? result : p))
        setEditingProject(null)
      } else {
        setProjects(prev => [result, ...prev])
      }
      
      setShowCreateModal(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${editingProject ? 'update' : 'create'} project`)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        throw new Error('Failed to delete project')
      }

      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete project')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      language: 'tamil',
      genre: '',
      budget: '',
      startDate: '',
      endDate: '',
      status: 'planning',
    })
    setEditingProject(null)
  }

  const openEditModal = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      language: project.language || 'tamil',
      genre: project.genre || '',
      budget: project.budget || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status,
    })
    setEditingProject(project)
  }

  // Count active filters
  const activeFilterCount = filters.status.length + filters.language.length + filters.genre.length

  const filtered = projects.filter(p => {
    // Search filter
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.genre?.toLowerCase().includes(search.toLowerCase())
    
    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(p.status)
    
    // Language filter
    const matchesLanguage = filters.language.length === 0 || (p.language && filters.language.includes(p.language))
    
    // Genre filter (partial match)
    const matchesGenre = filters.genre.length === 0 || filters.genre.some(g => p.genre?.toLowerCase().includes(g.toLowerCase()))
    
    return matchesSearch && matchesStatus && matchesLanguage && matchesGenre
  })

  const toggleFilter = (type: 'status' | 'language' | 'genre', value: string) => {
    setFilters(prev => {
      const current = prev[type]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [type]: updated }
    })
  }

  const clearFilters = () => {
    setFilters({ status: [], language: [], genre: [] })
  }

  const getStatusStyle = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status)
    return option?.color || 'bg-slate-500/20 text-slate-400'
  }

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status)
    return option?.label || status
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-200">
            Demo mode active. Create a project to save to database.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600">
              <Folder className="w-5 h-5 text-white" />
            </div>
            Projects
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your film productions</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadProjects}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title="Toggle filters (F)"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              title="Export (E)"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={printMenuRef}>
            <button 
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              title="Print (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Report
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div ref={filterPanelRef} className="mb-6 bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Filter Projects</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleFilter('status', opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      filters.status.includes(opt.value)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Language</label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleFilter('language', opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      filters.language.includes(opt.value)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Genre</label>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_OPTIONS.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleFilter('genre', genre)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      filters.genre.includes(genre)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm flex-1">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search projects by name, description, or genre... (/)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-16 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">/</span>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-400">Loading projects...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
          <Folder className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">
            {search ? 'No projects match your search' : 'No projects yet'}
          </p>
          <p className="text-slate-600 text-sm mb-6">
            {search ? 'Try a different search term' : 'Create your first project to get started'}
          </p>
          {!search && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all group relative"
            >
              {/* Actions Menu */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openEditModal(project)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>

              <Link href={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600/20 to-orange-600/20">
                    <Film className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.genre && (
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                      {project.genre}
                    </span>
                  )}
                  {project.language && (
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 uppercase">
                      {project.language}
                    </span>
                  )}
                  {project.budget && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-xs text-emerald-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {parseFloat(project.budget).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    {project.scriptCount} scripts
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.crewCount} crew
                  </div>
                </div>

                {/* Dates if available */}
                {(project.startDate || project.endDate) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3 h-3" />
                    {project.startDate && (
                      <span>{new Date(project.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    )}
                    {project.startDate && project.endDate && <span>→</span>}
                    {project.endDate && (
                      <span>{new Date(project.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button 
                onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the project"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Language & Genre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {LANGUAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Genre
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select genre</option>
                    {GENRE_OPTIONS.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="e.g., 5000000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status (for editing) */}
              {editingProject && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {editingProject ? 'Update Project' : 'Create Project'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh projects' },
                { key: '/', description: 'Focus search input' },
                { key: 'F', description: 'Toggle filters' },
                { key: 'P', description: 'Print projects report' },
                { key: 'N', description: 'Create new project' },
                { key: 'E', description: 'Export projects' },
                { key: '?', description: 'Show this help' },
                { key: 'Esc', description: 'Close modal / Clear search / Close filters / Close print menu' },
              ].map(({ key, description }) => (
                <div 
                  key={key}
                  className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <span className="text-slate-400 text-sm">{description}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">?</kbd> anytime to show/hide this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
