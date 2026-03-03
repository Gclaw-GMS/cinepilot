'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Filter, MoreHorizontal, Trash2, Edit2, 
  Eye, Calendar, DollarSign, Video, FileText, Users,
  Clock, ArrowRight, Loader2, FolderOpen
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'

interface Project {
  id: string
  name: string
  title?: string
  description: string | null
  language: string
  genre: string | null
  budget: number | null
  status: string
  createdAt: string
  updatedAt: string | null
  _count?: {
    scripts: number
    scenes: number
    characters: number
    shots: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#6366f1',
  pre_production: '#f59e0b',
  production: '#10b981',
  post_production: '#8b5cf6',
  completed: '#64748b',
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  pre_production: 'Pre-Production',
  production: 'In Production',
  post_production: 'Post-Production',
  completed: 'Completed',
}

// Demo data for when database is not available
const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Kaadhal Vartham',
    title: 'Kaadhal Vartham',
    description: 'A romantic drama set in Chennai exploring love and relationships',
    language: 'tamil',
    genre: 'Romance',
    budget: 15000000,
    status: 'pre_production',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
    _count: { scripts: 1, scenes: 6, characters: 3, shots: 0 }
  },
  {
    id: 'proj-2',
    name: 'Vikram Vedha 2',
    title: 'Vikram Vedha 2',
    description: 'Action thriller sequel with high-octane sequences',
    language: 'tamil',
    genre: 'Action Thriller',
    budget: 45000000,
    status: 'production',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-02T16:45:00Z',
    _count: { scripts: 2, scenes: 47, characters: 15, shots: 24 }
  },
  {
    id: 'proj-3',
    name: 'Thirudan Police',
    title: 'Thirudan Police',
    description: 'Comedy drama with a unique twist',
    language: 'tamil',
    genre: 'Comedy',
    budget: 8000000,
    status: 'planning',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',
    _count: { scripts: 0, scenes: 0, characters: 0, shots: 0 }
  },
]

function ProjectCard({ project }: { project: Project }) {
  const statusColor = STATUS_COLORS[project.status] || '#64748b'
  const displayTitle = project.name || project.title || 'Untitled Project'
  
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500">{project.language.toUpperCase()} • {project.genre || 'Unspecified'}</p>
          </div>
        </div>
        <button 
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className="w-3.5 h-3.5" />
          <span>{project._count?.scripts || 0} scripts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Video className="w-3.5 h-3.5" />
          <span>{project._count?.scenes || 0} scenes</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="w-3.5 h-3.5" />
          <span>{project._count?.characters || 0} chars</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <span 
          className="px-2.5 py-1 rounded-full text-xs font-medium border"
          style={{ 
            backgroundColor: `${statusColor}15`,
            borderColor: `${statusColor}30`,
            color: statusColor 
          }}
        >
          {STATUS_LABELS[project.status] || project.status}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}

function StatsCard({ title, value, subtext, color }: { title: string; value: string | number; subtext?: string; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-semibold mt-1" style={{ color }}>{value}</p>
      {subtext && <p className="text-xs text-slate-600 mt-1">{subtext}</p>}
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch projects')
      }
      
      // Check if we're in demo mode
      if (data.isDemoMode) {
        setIsDemoMode(true)
        setProjects(DEMO_PROJECTS)
      } else if (Array.isArray(data) && data.length > 0) {
        setProjects(data)
        setIsDemoMode(false)
      } else {
        // No projects, use demo
        setProjects(DEMO_PROJECTS)
        setIsDemoMode(true)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      // Use demo data on error
      setProjects(DEMO_PROJECTS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const displayTitle = p.name || p.title || ''
    const matchesSearch = !searchQuery || 
      displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: projects.length,
    inProduction: projects.filter(p => p.status === 'production').length,
    preProduction: projects.filter(p => p.status === 'pre_production').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
  }

  // Status distribution for chart
  const statusData = Object.entries(
    projects.reduce((acc, p) => {
      const status = STATUS_LABELS[p.status] || p.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-500">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">Manage your film productions</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <FolderOpen className="w-4 h-4 shrink-0" />
            Showing demo projects — Connect a PostgreSQL database to manage real productions
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Projects" value={stats.total} color="#6366f1" />
          <StatsCard title="In Production" value={stats.inProduction} color="#10b981" />
          <StatsCard title="Pre-Production" value={stats.preProduction} color="#f59e0b" />
          <StatsCard 
            title="Total Budget" 
            value={`₹${(stats.totalBudget / 10000000).toFixed(1)}Cr`} 
            color="#8b5cf6" 
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="pre_production">Pre-Production</option>
              <option value="production">In Production</option>
              <option value="post_production">Post-Production</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No projects found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your search or filters</p>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create your first project
            </button>
          </div>
        )}

        {/* Status Distribution Chart */}
        {statusData.length > 0 && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Project Status Distribution</h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} projects`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
