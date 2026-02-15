'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as api from '@/lib/api'
import type { Project } from '@/lib/types'
import ConnectionStatus from '@/components/ConnectionStatus'

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await api.projects.list()
      setProjects(data)
    } catch (e) {
      console.log('API unavailable, using demo data')
      setProjects(DEMO_PROJECTS)
    }
    setLoading(false)
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    const newProject: Project = {
      id: Date.now(),
      name: newProjectName,
      description: 'New project',
      language: 'tamil',
      status: 'planning',
      budget: 0,
      created_at: new Date().toISOString()
    }
    
    // Try to save to backend
    try {
      const saved = await api.projects.create({
        name: newProjectName,
        description: 'New project',
        language: 'tamil',
        budget: 0
      })
      if (saved && saved.id) {
        setProjects([...projects, saved])
      } else {
        setProjects([...projects, newProject])
      }
    } catch (e) {
      // Fallback to local
      setProjects([...projects, newProject])
    }
    
    setNewProjectName('')
    setShowNewProject(false)
  }

  const DEMO_PROJECTS: Project[] = [
    { 
      id: 1, 
      name: 'இதயத்தின் ஒலி', 
      description: 'A romantic thriller in modern Chennai', 
      language: 'tamil', 
      status: 'planning', 
      budget: 2500000, 
      created_at: '2026-02-01T10:00:00Z' 
    },
    { 
      id: 2, 
      name: "Veera's Journey", 
      description: 'Action drama set in Madurai', 
      language: 'tamil', 
      status: 'shooting', 
      budget: 5000000, 
      created_at: '2026-01-15T10:00:00Z' 
    },
  ]

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s your production overview.</p>
        </div>
        <button 
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium text-sm hover:bg-cyan-400 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Connection Status */}
      <ConnectionStatus />

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded mb-4 focus:border-cinepilot-accent focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium text-sm hover:bg-cyan-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={projects.length.toString()} />
        <StatCard 
          label="In Production" 
          value={projects.filter(p => p.status === 'shooting').length.toString()} 
          color="green" 
        />
        <StatCard 
          label="Estimated Budget" 
          value={`₹${(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 10000000).toFixed(1)}Cr`} 
          color="blue" 
        />
        <StatCard label="AI Analyses" value="48" color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <QuickAction 
          icon="🤖" 
          label="AI Script Analysis" 
          href="/ai-tools"
          description="Analyze scripts with AI"
        />
        <QuickAction 
          icon="🎥" 
          label="Shot List" 
          href="/shot-list"
          description="Generate shot suggestions"
        />
        <QuickAction 
          icon="📋" 
          label="Generate Call Sheet" 
          href="/call-sheets"
          description="Create bilingual call sheets"
        />
        <QuickAction 
          icon="📊" 
          label="DOOD Report" 
          href="/dood"
          description="Track actor availability"
        />
        <QuickAction 
          icon="📅" 
          label="Shooting Schedule" 
          href="/schedule"
          description="Plan your shoot days"
        />
        <QuickAction 
          icon="💰" 
          label="Budget Planning" 
          href="/budget"
          description="Estimate and track costs"
        />
      </div>

      {/* Projects Grid */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Your Projects</h2>
        <span className="text-sm text-gray-500">{projects.length} projects</span>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-cinepilot-accent animate-pulse">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <NewProjectCard onClick={() => setShowNewProject(true)} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color = 'cyan' }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cinepilot-accent',
    green: 'text-cinepilot-success',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
  }
  return (
    <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function QuickAction({ icon, label, href, description }: { icon: string; label: string; href: string; description: string }) {
  return (
    <Link href={href}>
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 hover:border-cinepilot-accent transition-colors cursor-pointer">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      </div>
    </Link>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    'planning': 'bg-blue-900 text-blue-400',
    'pre-production': 'bg-yellow-900 text-yellow-400',
    'shooting': 'bg-green-900 text-green-400',
    'post-production': 'bg-purple-900 text-purple-400',
    'completed': 'bg-gray-700 text-gray-400',
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-5 hover:border-cinepilot-accent transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <span className={`px-2 py-1 text-xs rounded ${statusColors[project.status] || 'bg-gray-700'}`}>
            {project.status}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4">{project.description}</p>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Budget: ₹{project.budget ? (project.budget / 100000).toFixed(1) + 'L' : 'N/A'}</span>
          <span className="uppercase">{project.language}</span>
        </div>
      </div>
    </Link>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-cinepilot-card border border-dashed border-gray-700 rounded-lg p-5 flex flex-col items-center justify-center min-h-[150px] cursor-pointer hover:border-cinepilot-accent transition-colors"
    >
      <div className="text-4xl mb-2">+</div>
      <span className="text-gray-400">Create New Project</span>
    </div>
  )
}
