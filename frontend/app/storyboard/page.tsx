'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Search, RefreshCw, HelpCircle, X } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    } catch (err) {
      console.error('Failed to load frames:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedScript])

  useEffect(() => {
    fetchFrames()
  }, [fetchFrames])

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchFrames()
    setIsRefreshing(false)
  }

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
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
        case '1':
          e.preventDefault()
          setSelectedStyle('cleanLineArt')
          break
        case '2':
          e.preventDefault()
          setSelectedStyle('pencilSketch')
          break
        case '3':
          e.preventDefault()
          setSelectedStyle('markerLine')
          break
        case '4':
          e.preventDefault()
          setSelectedStyle('blueprint')
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setSearchQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter scenes based on search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) return scenes
    const query = searchQuery.toLowerCase()
    return scenes.filter(scene => 
      scene.sceneNumber.toString().includes(query) ||
      (scene.heading?.toLowerCase().includes(query)) ||
      scene.frames.some(frame => 
        frame.shot.shotText?.toLowerCase().includes(query) ||
        frame.shot.shotSize?.toLowerCase().includes(query) ||
        frame.directorNotes?.toLowerCase().includes(query)
      )
    )
  }, [scenes, searchQuery])

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

  // Calculate filtered stats
  const filteredApprovedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
  const filteredFailedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
              &larr; Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Storyboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              AI-generated storyboard frames from your shot list
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search scenes, shots... (/)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={selectedScript}
              onChange={e => setSelectedScript(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {/* Keyboard Help Button */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Frames', value: searchQuery ? filteredScenes.reduce((sum, s) => sum + s.frames.length, 0) : totalFrames, color: 'text-violet-400' },
            { label: 'Scenes Covered', value: searchQuery ? filteredScenes.length : scenes.length, color: 'text-blue-400' },
            { label: 'Approved', value: searchQuery ? filteredApprovedCount : approvedCount, color: 'text-emerald-400' },
            { label: 'Failed', value: searchQuery ? filteredFailedCount : failedCount, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
          {searchQuery && (
            <div className="col-span-4 text-center text-sm text-gray-500">
              Showing {filteredScenes.length} of {scenes.length} scenes
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8 bg-[#141414] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Style</span>
            {STYLES.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedStyle === s.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
                }`}
                title={`Press ${idx + 1} to select`}
              >
                <span className="mr-1">{s.icon}</span>
                {s.label}
                <span className="ml-2 text-xs text-gray-600">({idx + 1})</span>
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

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading storyboard...</div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No scripts uploaded yet</p>
            <Link href="/scripts" className="text-violet-400 hover:text-violet-300 underline">
              Upload a script first
            </Link>
          </div>
        ) : filteredScenes.length === 0 && searchQuery ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No scenes match your search</p>
            <p className="text-gray-600 text-sm mb-4">
              Try searching for a different scene number, shot text, or director notes.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-violet-400 hover:text-violet-300 underline"
            >
              Clear search
            </button>
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
            {filteredScenes.map(scene => (
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

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'R', action: 'Refresh storyboard data' },
                  { key: '/', action: 'Focus search input' },
                  { key: '1', action: 'Switch to Clean Line Art style' },
                  { key: '2', action: 'Switch to Pencil Sketch style' },
                  { key: '3', action: 'Switch to Marker & Ink style' },
                  { key: '4', action: 'Switch to Blueprint style' },
                  { key: '?', action: 'Show this help modal' },
                  { key: 'Esc', action: 'Close modal / Clear search' },
                ].map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
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
