// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as api from '@/lib/api'
import type { Project, Scene, Location, Character, CrewMember } from '@/lib/types'

// Demo data
const DEMO_PROJECT: Project = {
  id: 1,
  name: 'இதயத்தின் ஒலி',
  description: 'A romantic thriller in modern Chennai',
  language: 'tamil',
  status: 'planning',
  budget: 2500000,
  created_at: '2026-02-01T10:00:00Z'
}

const DEMO_SCENES: Scene[] = [
  { id: 1, scene_number: 1, heading: 'EXT. CHENNAI STREET - DAY', location: 'Chennai Street', location_tamil: 'சென்னை வீதி', time_of_day: 'DAY', interior_exterior: 'EXT', description: 'Rain pours on the busy street. People rush with umbrellas.' },
  { id: 2, scene_number: 2, heading: 'INT. APARTMENT - NIGHT', location: "Priya's Apartment", location_tamil: 'பிரியாவின் அபார்ட்மென்ட்', time_of_day: 'NIGHT', interior_exterior: 'INT', description: 'Priya sits alone, looking at old photographs.' },
  { id: 3, scene_number: 3, heading: 'EXT. MADURAI TEMPLE - DAY', location: 'Meenakshi Temple', location_tamil: 'மீனாட்சி கோவில்', time_of_day: 'DAY', interior_exterior: 'EXT', description: 'Devotees gather for the evening aarti. Bells ringing.' },
  { id: 4, scene_number: 4, heading: 'INT. RESTAURANT - NIGHT', location: ' Beach Club Restaurant', location_tamil: 'பீச் கிளப் ரெஸ்டாரண்ட்', time_of_day: 'NIGHT', interior_exterior: 'INT', description: 'Arjun meets with a mysterious contact.' },
  { id: 5, scene_number: 5, heading: 'EXT. MARINA BEACH - SUNSET', location: 'Marina Beach', location_tamil: 'மரீனா கடற்கரை', time_of_day: 'SUNSET', interior_exterior: 'EXT', description: 'Priya walks alone, lost in thought.' },
]

const DEMO_LOCATIONS: Location[] = [
  { id: 1, name: 'Chennai Street', tamil: 'சென்னை வீதி', type: 'outdoor', address: 'T Nagar, Chennai' },
  { id: 2, name: "Priya's Apartment", tamil: 'பிரியாவின் அபார்ட்மென்ட்', type: 'indoor', address: 'Anna Nagar, Chennai' },
  { id: 3, name: 'Meenakshi Temple', tamil: 'மீனாட்சி கோவில்', type: 'religious', address: 'Madurai' },
  { id: 4, name: 'Beach Club Restaurant', tamil: 'பீச் கிளப் ரெஸ்டாரண்ட்', type: 'commercial', address: 'ECR, Chennai' },
  { id: 5, name: 'Marina Beach', tamil: 'மரீனா கடற்கரை', type: 'outdoor', address: 'Chennai' },
]

const DEMO_CHARACTERS: Character[] = [
  { id: 1, name: 'Arjun', tamil: 'அருஜுன்', actor: 'Vijay', role: 'Lead' },
  { id: 2, name: 'Priya', tamil: 'பிரியா', actor: 'Nayanthara', role: 'Lead' },
  { id: 3, name: 'Mahendra', tamil: 'மகேந்திரா', actor: 'Prakash Raj', role: 'Villain' },
  { id: 4, name: 'Sathya', tamil: 'சத்யா', actor: 'Siddharth', role: 'Best Friend' },
  { id: 5, name: 'Divya', tamil: 'திவ்யா', actor: 'Aishwarya Rajesh', role: 'Supporting' },
]

const DEMO_CREW: CrewMember[] = [
  { id: 1, name: 'Lokesh', role: 'Director', department: 'Direction' },
  { id: 2, name: 'Santosh', role: 'Cinematographer', department: 'Camera' },
  { id: 3, name: 'Anirudh', role: 'Music Director', department: 'Music' },
  { id: 4, name: 'Vijay', role: 'Editor', department: 'Post' },
  { id: 5, name: 'Ravi', role: 'Art Director', department: 'Art' },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = parseInt(params.id as string)
  
  const [project, setProject] = useState<Project | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [activeTab, setActiveTab] = useState('scenes')
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    setLoading(true)
    const projectIdStr = String(projectId)
    try {
      const [projectData, scenesData, locationsData, charactersData, crewData] = await Promise.all([
        api.projects.get(projectIdStr).catch(() => DEMO_PROJECT),
        api.scenes.list(projectIdStr).catch(() => DEMO_SCENES),
        api.locations.list().catch(() => ({ locations: DEMO_LOCATIONS })),
        Promise.resolve({ characters: DEMO_CHARACTERS }).catch(() => ({ characters: DEMO_CHARACTERS })),
        api.crew.list(projectIdStr).catch(() => ({ crew: DEMO_CREW })),
      ])
      
      setProject(projectData)
      setScenes(scenesData)
      setLocations(locationsData.locations || [])
      setCharacters(charactersData.characters || [])
      setCrew(crewData.crew || [])
      setIsDemoMode(false)
    } catch (e) {
      // Use demo data
      setProject(DEMO_PROJECT)
      setScenes(DEMO_SCENES)
      setLocations(DEMO_LOCATIONS)
      setCharacters(DEMO_CHARACTERS)
      setCrew(DEMO_CREW)
      setIsDemoMode(true)
    }
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    'planning': 'bg-blue-900 text-blue-400',
    'pre-production': 'bg-yellow-900 text-yellow-400',
    'shooting': 'bg-green-900 text-green-400',
    'post-production': 'bg-purple-900 text-purple-400',
    'completed': 'bg-gray-700 text-gray-400',
  }

  const exportProject = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const result: any = await api.exportProject.export(projectId, format)
      if (result.success) {
        alert(`Export ready: ${result.download_url}`)
      }
    } catch (e) {
      // Fallback: create downloadable file client-side
      const data = { project, scenes, locations, characters, crew }
      const blob = format === 'json' 
        ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        : new Blob([JSON.stringify(data)], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project_${projectId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-cinepilot-accent animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Link href="/" className="text-cinepilot-accent hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'scenes', label: 'Scenes', count: scenes.length, icon: '🎬' },
    { id: 'locations', label: 'Locations', count: locations.length, icon: '📍' },
    { id: 'characters', label: 'Cast', count: characters.length, icon: '👤' },
    { id: 'crew', label: 'Crew', count: crew.length, icon: '👥' },
  ]

  return (
    <div className="p-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-sm flex items-center gap-2">
            <span>ℹ️</span>
            Running in demo mode with sample project data. Connect your database for your own projects.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/" 
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          ←
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className={`px-2 py-1 text-xs rounded ${statusColors[project.status] || 'bg-gray-700'}`}>
              {project.status}
            </span>
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors flex items-center gap-2">
              📥 Export
            </button>
            {/* Export dropdown */}
            <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button 
                onClick={() => exportProject('pdf')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
              >
                📄 PDF
              </button>
              <button 
                onClick={() => exportProject('json')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                📋 JSON
              </button>
              <button 
                onClick={() => exportProject('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
              >
                📊 CSV
              </button>
            </div>
          </div>
          <Link 
            href="/scripts"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
          >
            🤖 Analyze
          </Link>
          <Link 
            href="/schedule"
            className="px-4 py-2 bg-cinepilot-accent text-black hover:bg-cyan-400 rounded text-sm font-medium transition-colors"
          >
            📅 Schedule
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-cinepilot-accent">{scenes.length}</div>
          <div className="text-xs text-gray-500">Scenes</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{locations.length}</div>
          <div className="text-xs text-gray-500">Locations</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{characters.length}</div>
          <div className="text-xs text-gray-500">Cast</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{crew.length}</div>
          <div className="text-xs text-gray-500">Crew</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">₹{((project.budget || 0) / 100000).toFixed(0)}L</div>
          <div className="text-xs text-gray-500">Budget</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cinepilot-accent text-cinepilot-accent'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg">
        {activeTab === 'scenes' && (
          <div className="divide-y divide-gray-800">
            {scenes.map((scene) => (
              <div key={scene.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cinepilot-accent font-mono text-sm">Scene {scene.scene_number}</span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{scene.interior_exterior}</span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{scene.time_of_day}</span>
                    </div>
                    <div className="text-sm font-medium mb-1">{scene.heading}</div>
                    <div className="text-gray-400 text-sm">
                      📍 {scene.location} 
                      {scene.location_tamil && <span className="text-purple-400 ml-2">({scene.location_tamil})</span>}
                    </div>
                    {scene.description && (
                      <div className="text-gray-500 text-sm mt-2">{scene.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="divide-y divide-gray-800">
            {locations.map((loc) => (
              <div key={loc.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{loc.name}</span>
                      <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">{loc.type}</span>
                    </div>
                    {loc.tamil && (
                      <div className="text-purple-400 text-sm mb-1">{loc.tamil}</div>
                    )}
                    <div className="text-gray-500 text-sm">📍 {loc.address}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="divide-y divide-gray-800">
            {characters.map((char) => (
              <div key={char.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{char.name}</span>
                      {char.tamil && <span className="text-purple-400 text-sm">({char.tamil})</span>}
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">{char.role}</span>
                    </div>
                    {char.actor && (
                      <div className="text-gray-400 text-sm">🎭 Actor: {char.actor}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'crew' && (
          <div className="divide-y divide-gray-800">
            {crew.map((member) => (
              <div key={member.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{member.name}</span>
                      <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded text-xs">{member.department}</span>
                    </div>
                    <div className="text-gray-400 text-sm">{member.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {activeTab === 'scenes' && scenes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🎬</div>
          <p>No scenes yet</p>
          <Link href="/scripts" className="text-cinepilot-accent hover:underline">
            Upload a script to generate scenes
          </Link>
        </div>
      )}
    </div>
  )
}
