'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Folder, Plus, Search, MoreHorizontal, Calendar, Film, Users } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  createdAt: string
  scriptCount: number
  crewCount: number
}

const DEMO_PROJECTS: Project[] = [
  { id: '1', name: 'Kaadhal Enbadhu', description: 'Romantic Drama', status: 'active', createdAt: '2026-01-15', scriptCount: 1, crewCount: 45 },
  { id: '2', name: 'Vikram Vedha 2', description: 'Action Thriller', status: 'planning', createdAt: '2026-02-01', scriptCount: 1, crewCount: 32 },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Load demo projects initially
    setProjects(DEMO_PROJECTS)
    setLoading(false)
  }, [])

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

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
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {search ? 'No projects match your search' : 'No projects yet. Create your first project!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600/20 to-orange-600/20">
                  <Film className="w-5 h-5 text-orange-400" />
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  project.status === 'planning' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{project.description || 'No description'}</p>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
