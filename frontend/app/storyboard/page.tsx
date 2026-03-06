'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Keyboard, X, Download, RefreshCw, BarChart3, PieChart, CheckCircle,
  AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff
} from 'lucide-react'
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface FrameData {
  id: string
  imageUrl: string | null
  prompt: string | null
  style: string
  status: string
  directorNotes: string | null
  isApproved: boolean
  shot: {
    id: string
    shotIndex: number
    shotText: string
    shotSize: string | null
    characters: string[]
    scene: {
      id: string
      sceneNumber: number
      headingRaw: string | null
      intExt: string | null
      timeOfDay: string | null
    }
  }
}

interface SceneGroup {
  sceneId: string
  sceneNumber: number
  heading: string
  frames: FrameData[]
}

interface ScriptOption {
  id: string
  title: string
}

const STYLES = [
  { key: 'cleanLineArt', label: 'Clean Line Art', icon: '✏' },
  { key: 'pencilSketch', label: 'Pencil Sketch', icon: '✎' },
  { key: 'markerLine', label: 'Marker & Ink', icon: '✒' },
  { key: 'blueprint', label: 'Blueprint', icon: '▦' },
]

const COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1']

export default function StoryboardPage() {
  const [scripts, setScripts] = useState<ScriptOption[]>([])
  const [selectedScript, setSelectedScript] = useState<string>('')
  const [scenes, setScenes] = useState<SceneGroup[]>([])
  const [totalFrames, setTotalFrames] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('cleanLineArt')
  const [generatingScene, setGeneratingScene] = useState<string | null>(null)
  const [generatingShot, setGeneratingShot] = useState<string | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null)
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [maxFrames, setMaxFrames] = useState(3)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0)
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid')
  const scenesRef = useRef<HTMLDivElement>(null)

  // Compute analytics data
  const analyticsData = useMemo(() => {
    const approvedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
    const failedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)
    const pendingCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'generating').length, 0)
    const generatingCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'generating').length, 0)
    const totalFrames = scenes.reduce((sum, s) => sum + s.frames.length, 0)
    
    // Style distribution
    const styleCounts: Record<string, number> = {}
    scenes.forEach(s => {
      s.frames.forEach(f => {
        styleCounts[f.style] = (styleCounts[f.style] || 0) + 1
      })
    })
    const styleData = Object.entries(styleCounts).map(([name, value]) => ({ name, value }))
    
    // Scene progress
    const sceneProgress = scenes.map(s => ({
      scene: `S${s.sceneNumber}`,
      frames: s.frames.length,
      approved: s.frames.filter(f => f.isApproved).length,
    }))
    
    return {
      totalFrames,
      approvedCount,
      failedCount,
      pendingCount,
      generatingCount,
      styleData,
      sceneProgress,
      approvalRate: totalFrames > 0 ? Math.round((approvedCount / totalFrames) * 100) : 0,
    }
  }, [scenes])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
    
    switch (e.key) {
      case '?':
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
        break
      case 's':
        if (!e.ctrlKey && !e.metaKey) {
          setShowStats(prev => !prev)
        }
        break
      case 'v':
        if (!e.ctrlKey && !e.metaKey) {
          setViewMode(prev => prev === 'grid' ? 'slideshow' : 'grid')
        }
        break
      case 'ArrowRight':
        if (scenes.length > 0) {
          e.preventDefault()
          const currentScene = scenes[selectedSceneIndex]
          const maxFrame = currentScene ? currentScene.frames.length - 1 : 0
          if (selectedFrameIndex < maxFrame) {
            setSelectedFrameIndex(prev => prev + 1)
          } else if (selectedSceneIndex < scenes.length - 1) {
            setSelectedSceneIndex(prev => prev + 1)
            setSelectedFrameIndex(0)
          }
        }
        break
      case 'ArrowLeft':
        if (scenes.length > 0) {
          e.preventDefault()
          if (selectedFrameIndex > 0) {
            setSelectedFrameIndex(prev => prev - 1)
          } else if (selectedSceneIndex > 0) {
            setSelectedSceneIndex(prev => prev - 1)
            const prevScene = scenes[selectedSceneIndex - 1]
            setSelectedFrameIndex(prevScene ? prevScene.frames.length - 1 : 0)
          }
        }
        break
      case 'ArrowDown':
        if (scenes.length > 0) {
          e.preventDefault()
          const currentScene = scenes[selectedSceneIndex]
          const framesPerRow = viewMode === 'slideshow' ? 1 : 3
          const newIndex = selectedFrameIndex + framesPerRow
          if (newIndex < currentScene.frames.length) {
            setSelectedFrameIndex(newIndex)
          } else if (selectedSceneIndex < scenes.length - 1) {
            setSelectedSceneIndex(prev => prev + 1)
            setSelectedFrameIndex(0)
          }
        }
        break
      case 'ArrowUp':
        if (scenes.length > 0) {
          e.preventDefault()
          const framesPerRow = viewMode === 'slideshow' ? 1 : 3
          const newIndex = selectedFrameIndex - framesPerRow
          if (newIndex >= 0) {
            setSelectedFrameIndex(newIndex)
          } else if (selectedSceneIndex > 0) {
            setSelectedSceneIndex(prev => prev - 1)
            const prevScene = scenes[selectedSceneIndex - 1]
            setSelectedFrameIndex(prevScene ? prevScene.frames.length - 1 : 0)
          }
        }
        break
      case 'a':
        if (!e.ctrlKey && !e.metaKey && scenes.length > 0) {
          const currentScene = scenes[selectedSceneIndex]
          const frame = currentScene?.frames[selectedFrameIndex]
          if (frame) {
            e.preventDefault()
            handleApprove(frame.id, !frame.isApproved)
          }
        }
        break
      case 'r':
        if (!e.ctrlKey && !e.metaKey && scenes.length > 0) {
          const currentScene = scenes[selectedSceneIndex]
          const frame = currentScene?.frames[selectedFrameIndex]
          if (frame && frame.status !== 'generating') {
            e.preventDefault()
            handleRegenerateFrame(frame.shot.id)
          }
        }
        break
      case 'n':
        if (!e.ctrlKey && !e.metaKey && scenes.length > 0) {
          const currentScene = scenes[selectedSceneIndex]
          const frame = currentScene?.frames[selectedFrameIndex]
          if (frame) {
            e.preventDefault()
            setSelectedFrame(frame)
            setNoteText(frame.directorNotes || '')
          }
        }
        break
      case 'Escape':
        setSelectedFrame(null)
        setShowKeyboardHelp(false)
        break
    }
  }, [scenes, selectedSceneIndex, selectedFrameIndex, viewMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Export functionality
  const handleExport = (format: 'json' | 'csv') => {
    const exportData = {
      project: selectedScript,
      exportedAt: new Date().toISOString(),
      summary: {
        totalFrames: analyticsData.totalFrames,
        approved: analyticsData.approvedCount,
        failed: analyticsData.failedCount,
        approvalRate: analyticsData.approvalRate,
      },
      scenes: scenes.map(s => ({
        sceneNumber: s.sceneNumber,
        heading: s.heading,
        frames: s.frames.map(f => ({
          shotIndex: f.shot.shotIndex,
          shotSize: f.shot.shotSize,
          shotText: f.shot.shotText,
          style: f.style,
          status: f.status,
          approved: f.isApproved,
          directorNotes: f.directorNotes,
          imageUrl: f.imageUrl,
        })),
      })),
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storyboard-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV format
      const rows = [['Scene', 'Shot', 'Size', 'Style', 'Status', 'Approved', 'Notes']]
      scenes.forEach(s => {
        s.frames.forEach(f => {
          rows.push([
            s.sceneNumber.toString(),
            (f.shot.shotIndex + 1).toString(),
            f.shot.shotSize || '',
            f.style,
            f.status,
            f.isApproved ? 'Yes' : 'No',
            f.directorNotes || '',
          ])
        })
      })
      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storyboard-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    fetch('/api/scripts')
      .then(r => r.json())
      .then(data => {
        const s = (data.scripts || []).map((sc: { id: string; title: string }) => ({
          id: sc.id,
          title: sc.title,
        }))
        setScripts(s)
        if (s.length > 0 && !selectedScript) setSelectedScript(s[0].id)
      })
      .catch(console.error)
  }, [])

  const fetchFrames = useCallback(async () => {
    if (!selectedScript) return
    setLoading(true)
    try {
      const res = await fetch(`/api/storyboard?scriptId=${selectedScript}`)
      const data = await res.json()
      setScenes(data.scenes || [])
      setTotalFrames(data.totalFrames || 0)
      // Detect demo mode from API response
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      console.error('Failed to load frames:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedScript])

  useEffect(() => {
    fetchFrames()
  }, [fetchFrames])

  const handleGenerateScene = async (sceneId: string) => {
    setGeneratingScene(sceneId)
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateScene',
          sceneId,
          style: selectedStyle,
          maxFrames,
        }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Generate scene failed:', err)
    } finally {
      setGeneratingScene(null)
    }
  }

  const handleRegenerateFrame = async (shotId: string) => {
    setGeneratingShot(shotId)
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateFrame',
          shotId,
          style: selectedStyle,
          regenerate: true,
        }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Regenerate failed:', err)
    } finally {
      setGeneratingShot(null)
    }
  }

  const handleApprove = async (frameId: string, approved: boolean) => {
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', frameId, approved }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  const handleSaveNote = async (frameId: string) => {
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addNote', frameId, note: noteText }),
      })
      await fetchFrames()
      setSelectedFrame(null)
      setNoteText('')
    } catch (err) {
      console.error('Save note failed:', err)
    }
  }

  const approvedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
  const failedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)
  const sceneIds = scenes.map(s => s.sceneId)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
              &larr; Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-3">
              Storyboard
              {isDemoMode && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                  Demo
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              AI-generated storyboard frames from your shot list
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedScript}
              onChange={e => setSelectedScript(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            
            {/* View Toggle */}
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('slideshow')}
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  viewMode === 'slideshow' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Slideshow
              </button>
            </div>

            {/* Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-lg border transition-all ${
                showStats ? 'bg-violet-600 border-violet-500 text-white' : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:text-white'
              }`}
              title="Toggle Statistics (S)"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Export Menu */}
            <div className="relative group">
              <button className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[140px]">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#252525] rounded-t-lg"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#252525] rounded-b-lg"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Keyboard Help */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Frames', value: totalFrames, color: 'text-violet-400' },
            { label: 'Scenes Covered', value: scenes.length, color: 'text-blue-400' },
            { label: 'Approved', value: approvedCount, color: 'text-emerald-400' },
            { label: 'Failed', value: failedCount, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8 bg-[#141414] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Style</span>
            {STYLES.map(s => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedStyle === s.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
                }`}
              >
                <span className="mr-1">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Max Frames/Scene</label>
            <select
              value={maxFrames}
              onChange={e => setMaxFrames(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Analytics Panel */}
        {showStats && scenes.length > 0 && (
          <div className="mb-8 bg-[#141414] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Storyboard Analytics
              <span className="ml-auto text-xs text-gray-500 font-normal">Press S to toggle</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Approval Status Pie */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4">Approval Status</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={[
                          { name: 'Approved', value: analyticsData.approvedCount, color: '#10b981' },
                          { name: 'Pending', value: analyticsData.pendingCount + analyticsData.generatingCount, color: '#f59e0b' },
                          { name: 'Failed', value: analyticsData.failedCount, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[...Array(3)].map((_, i) => (
                          <Cell key={i} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Legend
                        formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Style Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4">Style Distribution</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.styleData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#666" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#666" fontSize={10} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {analyticsData.styleData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scene Progress */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4">Frames per Scene</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.sceneProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="scene" stroke="#666" fontSize={10} />
                      <YAxis stroke="#666" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Bar dataKey="frames" name="Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading storyboard...</div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No scripts uploaded yet</p>
            <Link href="/scripts" className="text-violet-400 hover:text-violet-300 underline">
              Upload a script first
            </Link>
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No storyboard frames yet</p>
            <p className="text-gray-600 text-sm mb-4">
              Generate shots from the Shot Hub first, then come here to create storyboard frames.
            </p>
            <Link href="/shot-list" className="text-violet-400 hover:text-violet-300 underline">
              Go to Shot Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {scenes.map(scene => (
              <div key={scene.sceneId} className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden">
                {/* Scene Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Scene {scene.sceneNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{scene.heading}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {scene.frames.length} frame{scene.frames.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleGenerateScene(scene.sceneId)}
                      disabled={generatingScene === scene.sceneId}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm rounded-lg transition-colors"
                    >
                      {generatingScene === scene.sceneId ? 'Generating...' : 'Generate Frames'}
                    </button>
                  </div>
                </div>

                {/* Frames Grid */}
                {scene.frames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {scene.frames.map(frame => (
                      <div
                        key={frame.id}
                        className={`relative bg-[#0d0d0d] border rounded-xl overflow-hidden group transition-all ${
                          frame.isApproved ? 'border-emerald-600/50' : 'border-gray-700'
                        }`}
                      >
                        {/* Image */}
                        <div className="aspect-video bg-[#111] flex items-center justify-center relative overflow-hidden">
                          {frame.status === 'generating' ? (
                            <div className="text-gray-500 text-sm animate-pulse">
                              Generating...
                            </div>
                          ) : frame.status === 'failed' ? (
                            <div className="text-red-500 text-sm">Generation failed</div>
                          ) : frame.imageUrl ? (
                            <img
                              src={frame.imageUrl}
                              alt={`Shot ${frame.shot.shotIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-600 text-sm">No image</div>
                          )}

                          {/* Overlay controls */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleRegenerateFrame(frame.shot.id)}
                              disabled={generatingShot === frame.shot.id}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs disabled:bg-gray-700"
                            >
                              {generatingShot === frame.shot.id ? '...' : 'Regenerate'}
                            </button>
                            <button
                              onClick={() => handleApprove(frame.id, !frame.isApproved)}
                              className={`px-3 py-1.5 rounded-lg text-xs ${
                                frame.isApproved
                                  ? 'bg-gray-600 hover:bg-gray-500'
                                  : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              {frame.isApproved ? 'Unapprove' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFrame(frame)
                                setNoteText(frame.directorNotes || '')
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs"
                            >
                              Notes
                            </button>
                          </div>

                          {frame.isApproved && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                              Approved
                            </div>
                          )}
                        </div>

                        {/* Shot Info */}
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-violet-400">
                              Shot {frame.shot.shotIndex + 1}
                            </span>
                            {frame.shot.shotSize && (
                              <span className="text-xs bg-[#1a1a1a] text-gray-400 px-1.5 py-0.5 rounded">
                                {frame.shot.shotSize}
                              </span>
                            )}
                            <span className="text-xs text-gray-600 capitalize">{frame.style}</span>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{frame.shot.shotText}</p>
                          {frame.directorNotes && (
                            <p className="text-xs text-amber-400/70 mt-1 italic line-clamp-1">
                              Note: {frame.directorNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-600 text-sm">
                    No frames generated yet. Click &quot;Generate Frames&quot; above.
                  </div>
                )}
              </div>
            ))}

            {/* Empty scenes (that have shots but no frames) */}
            {selectedScript && (
              <SceneSelector
                scriptId={selectedScript}
                existingSceneIds={sceneIds}
                onGenerate={handleGenerateScene}
                generating={generatingScene}
              />
            )}
          </div>
        )}

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-violet-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-violet-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Keyboard className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Keyboard Shortcuts
                  </span>
                </h3>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { keys: ['↑', '↓', '←', '→'], desc: 'Navigate frames', category: 'Navigation' },
                  { keys: ['A'], desc: 'Approve/unapprove selected frame', category: 'Actions' },
                  { keys: ['R'], desc: 'Regenerate selected frame', category: 'Actions' },
                  { keys: ['N'], desc: 'Add notes to selected frame', category: 'Actions' },
                  { keys: ['S'], desc: 'Toggle statistics panel', category: 'View' },
                  { keys: ['V'], desc: 'Toggle grid/slideshow view', category: 'View' },
                  { keys: ['?'], desc: 'Toggle this help', category: 'Help' },
                  { keys: ['Esc'], desc: 'Close modal / clear selection', category: 'Navigation' },
                ].map((shortcut, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wider w-20">
                        {shortcut.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {shortcut.keys.map((key, i) => (
                          <kbd 
                            key={i} 
                            className="px-2.5 py-1.5 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-md text-xs font-mono text-violet-300 shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                    <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Quick reference for power users</span>
                  <span className="flex items-center gap-2">
                    Press 
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-violet-400">?</kbd> 
                    anytime to toggle
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Director Notes Modal */}
        {selectedFrame && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-1">Director Notes</h3>
              <p className="text-xs text-gray-500 mb-4">
                Shot {selectedFrame.shot.shotIndex + 1} &mdash; Scene {selectedFrame.shot.scene.sceneNumber}
              </p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={4}
                placeholder="Add production notes, revision feedback, or framing guidance..."
                className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setSelectedFrame(null); setNoteText(''); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveNote(selectedFrame.id)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SceneSelector({
  scriptId,
  existingSceneIds,
  onGenerate,
  generating,
}: {
  scriptId: string
  existingSceneIds: string[]
  onGenerate: (sceneId: string) => void
  generating: string | null
}) {
  const [availableScenes, setAvailableScenes] = useState<{ id: string; sceneNumber: number; headingRaw: string | null; _count: { shots: number } }[]>([])

  useEffect(() => {
    fetch(`/api/shots?scriptId=${scriptId}&scenesOnly=true`)
      .then(r => r.json())
      .then(data => {
        const allScenes = data.scenes || []
        const ungenerated = allScenes.filter((s: { id: string; _count: { shots: number } }) =>
          !existingSceneIds.includes(s.id) && s._count.shots > 0
        )
        setAvailableScenes(ungenerated)
      })
      .catch(console.error)
  }, [scriptId, existingSceneIds])

  if (availableScenes.length === 0) return null

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Scenes Without Storyboard
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableScenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => onGenerate(scene.id)}
            disabled={generating === scene.id}
            className="text-left bg-[#0d0d0d] border border-gray-700 hover:border-violet-600 rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            <p className="text-sm font-medium text-white">Scene {scene.sceneNumber}</p>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{scene.headingRaw || 'Untitled'}</p>
            <p className="text-xs text-gray-600 mt-1">{scene._count.shots} shots</p>
          </button>
        ))}
      </div>
    </div>
  )
}
