'use client'

import { useState, useEffect, useCallback } from 'react'
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
  MapPin
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
}

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

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setProjects(data)
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.genre?.toLowerCase().includes(search.toLowerCase())
  )

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
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

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
            type="text"
            placeholder="Search projects by name, description, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600"
          />
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
                    {project.createdAt}
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
    </div>
  )
}
