'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Lock, Unlock } from 'lucide-react'

interface ShotData {
  id: string
  shotIndex: number
  beatIndex: number
  shotText: string
  characters: string[]
  shotSize: string | null
  cameraAngle: string | null
  cameraMovement: string | null
  focalLengthMm: number | null
  lensType: string | null
  keyStyle: string | null
  colorTemp: string | null
  durationEstSec: number | null
  confidenceCamera: number | null
  confidenceLens: number | null
  confidenceLight: number | null
  confidenceDuration: number | null
  isLocked: boolean
  userEdited: boolean
  scene: {
    id: string
    sceneNumber: string
    headingRaw: string | null
    intExt: string | null
    timeOfDay: string | null
    location: string | null
  }
}

interface SceneInfo {
  id: string
  sceneNumber: string
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  _count: { shots: number }
}

const STYLE_PRESETS = [
  { key: 'maniRatnam', label: 'Mani Ratnam', desc: 'Elegant, motivated movement, longer takes, warm palette' },
  { key: 'vetrimaaran', label: 'Vetrimaaran', desc: 'Grounded realism, handheld, documentary feel' },
  { key: 'lokeshKanagaraj', label: 'Lokesh Kanagaraj', desc: 'Stylized, kinetic camera, fast action grammar' },
  { key: 'custom', label: 'Custom', desc: 'Define your own style' },
] as const

const SHOT_SIZES = ['ECU', 'CU', 'MCU', 'MS', 'MWS', 'WS', 'VWS', 'EWS']
const ANGLES = ['high', 'low', 'eye', 'dutch', 'bird', 'worm']
const MOVEMENTS = ['static', 'pan', 'tilt', 'dolly', 'track', 'crane', 'handheld', 'steadicam', 'drone']
const LENSES = [16, 24, 35, 50, 85, 100, 135, 200]

export default function ShotHubPage() {
  const [shots, setShots] = useState<ShotData[]>([])
  const [scenes, setScenes] = useState<SceneInfo[]>([])
  const [stats, setStats] = useState({ totalShots: 0, totalDuration: 0, missingFields: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState('')

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [directorStyle, setDirectorStyle] = useState<string>('maniRatnam')
  const [sceneFilter, setSceneFilter] = useState('')

  const [scriptId, setScriptId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchScriptId = useCallback(async () => {
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      if (data.scripts?.[0]?.id) {
        setScriptId(data.scripts[0].id)
        return data.scripts[0].id
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }, [])

  const fetchShots = useCallback(async (sId: string) => {
    try {
      const res = await fetch(`/api/shots?scriptId=${sId}`)
      const data = await res.json()
      setShots(data.shots || [])
      setScenes(data.scenes || [])
      setStats(data.stats || { totalShots: 0, totalDuration: 0, missingFields: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      const id = await fetchScriptId()
      if (id) await fetchShots(id)
      else setLoading(false)
    })()
  }, [fetchScriptId, fetchShots])

  const handleGenerateAll = async () => {
    if (!scriptId) return
    setGenerating(true)
    setError(null)
    setGenProgress('Generating shots for all scenes...')

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScript', scriptId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenProgress(`Generated ${data.totalShots} shots!`)
      await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateScene = async (sceneId: string) => {
    setGenerating(true)
    setError(null)
    setGenProgress(`Generating shots for scene...`)

    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateScene', sceneId, directorStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenProgress(`Generated ${data.shotCount} shots`)
      if (scriptId) await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleFillNull = async (shotId: string) => {
    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fillNull', shotId, directorStyle }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      if (scriptId) await fetchShots(scriptId)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleUpdateShot = async (shotId: string, field: string, value: string | number | boolean) => {
    try {
      await fetch('/api/shots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId, [field]: value }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const filteredScenes = scenes.filter(s => {
    if (!sceneFilter) return true
    return s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
  })

  const activeSceneShots = selectedSceneId
    ? shots.filter(s => s.scene.id === selectedSceneId)
    : shots

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading Shot Hub...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">&#8592;</Link>
          <div>
            <h1 className="text-2xl font-bold">Shot Hub</h1>
            <p className="text-gray-500 text-sm mt-0.5">AI-powered shot breakdown engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={directorStyle}
            onChange={e => setDirectorStyle(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          >
            {STYLE_PRESETS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerateAll}
            disabled={generating || !scriptId}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium text-sm"
          >
            {generating ? genProgress : 'Generate All Shots'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{stats.totalShots}</div>
          <div className="text-xs text-gray-500">Total Shots</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{formatDuration(stats.totalDuration)}</div>
          <div className="text-xs text-gray-500">Est. Runtime</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.missingFields}</div>
          <div className="text-xs text-gray-500">Missing Fields</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{scenes.length}</div>
          <div className="text-xs text-gray-500">Scenes</div>
        </div>
      </div>

      {!scriptId ? (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
          <div className="text-gray-500 mb-2">No script found</div>
          <Link href="/scripts" className="text-cinepilot-accent hover:underline text-sm">Upload a script first</Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {/* Left Panel: Scene List */}
          <div className="col-span-1 space-y-3">
            <input
              type="text"
              placeholder="Filter scenes..."
              value={sceneFilter}
              onChange={e => setSceneFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-cinepilot-accent"
            />
            <button
              onClick={() => setSelectedSceneId(null)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                !selectedSceneId ? 'bg-cinepilot-accent/20 text-cinepilot-accent border border-cinepilot-accent/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Scenes ({shots.length} shots)
            </button>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredScenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedSceneId === scene.id
                      ? 'bg-cinepilot-accent/20 text-cinepilot-accent border border-cinepilot-accent/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">{scene.sceneNumber}</span>
                    <span className="text-xs text-gray-600">
                      {scene._count.shots > 0 ? `${scene._count.shots} shots` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {scene.headingRaw || scene.location || 'Untitled'}
                  </div>
                  {scene._count.shots === 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); handleGenerateScene(scene.id) }}
                      disabled={generating}
                      className="mt-1 text-xs px-2 py-0.5 bg-purple-600/30 text-purple-400 rounded hover:bg-purple-600/50"
                    >
                      Generate
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Panel: Shot Table */}
          <div className="col-span-3">
            {activeSceneShots.length === 0 ? (
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
                <div className="text-gray-500 mb-2">
                  {selectedSceneId ? 'No shots generated for this scene' : 'No shots generated yet'}
                </div>
                <p className="text-gray-600 text-sm">Click "Generate All Shots" or generate per scene</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSceneShots.map(shot => (
                  <ShotRow
                    key={shot.id}
                    shot={shot}
                    onUpdate={handleUpdateShot}
                    onFillNull={handleFillNull}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ShotRow({
  shot,
  onUpdate,
  onFillNull,
}: {
  shot: ShotData
  onUpdate: (id: string, field: string, value: string | number | boolean) => void
  onFillNull: (id: string) => void
}) {
  const hasMissing = !shot.shotSize || !shot.focalLengthMm || !shot.keyStyle || !shot.durationEstSec
  const avgConfidence = (
    (shot.confidenceCamera || 0) +
    (shot.confidenceLens || 0) +
    (shot.confidenceLight || 0) +
    (shot.confidenceDuration || 0)
  ) / 4

  const confidenceColor =
    avgConfidence >= 0.7 ? 'text-green-400' :
    avgConfidence >= 0.4 ? 'text-yellow-400' :
    'text-red-400'

  return (
    <div className={`bg-cinepilot-card border rounded-lg p-3 ${shot.isLocked ? 'border-blue-700/50' : 'border-cinepilot-border'}`}>
      <div className="flex items-start gap-3">
        {/* Shot Number */}
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold text-cinepilot-accent">{shot.shotIndex}</span>
          <span className="text-[10px] text-gray-600">B{shot.beatIndex}</span>
        </div>

        {/* Shot Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {shot.scene && (
              <span className="text-[10px] font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                {shot.scene.sceneNumber}
              </span>
            )}
            {shot.characters.length > 0 && (
              <div className="flex gap-1">
                {shot.characters.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded">{c}</span>
                ))}
                {shot.characters.length > 3 && (
                  <span className="text-[10px] text-gray-600">+{shot.characters.length - 3}</span>
                )}
              </div>
            )}
            <span className={`text-[10px] ${confidenceColor}`}>{Math.round(avgConfidence * 100)}%</span>
          </div>
          <p className="text-sm text-gray-300 leading-tight">{shot.shotText}</p>
        </div>

        {/* Controls Grid */}
        <div className="flex gap-2 items-center shrink-0">
          <select
            value={shot.shotSize || ''}
            onChange={e => onUpdate(shot.id, 'shotSize', e.target.value)}
            className={`w-16 text-xs py-1 px-1 rounded border ${
              shot.shotSize ? 'bg-gray-800 border-gray-700' : 'bg-yellow-900/20 border-yellow-700/50'
            }`}
          >
            <option value="">Size</option>
            {SHOT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={shot.cameraAngle || ''}
            onChange={e => onUpdate(shot.id, 'cameraAngle', e.target.value)}
            className="w-16 text-xs py-1 px-1 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="">Angle</option>
            {ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={shot.cameraMovement || ''}
            onChange={e => onUpdate(shot.id, 'cameraMovement', e.target.value)}
            className="w-20 text-xs py-1 px-1 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="">Movement</option>
            {MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={shot.focalLengthMm ?? ''}
            onChange={e => onUpdate(shot.id, 'focalLengthMm', parseInt(e.target.value))}
            className={`w-16 text-xs py-1 px-1 rounded border ${
              shot.focalLengthMm ? 'bg-gray-800 border-gray-700' : 'bg-yellow-900/20 border-yellow-700/50'
            }`}
          >
            <option value="">Lens</option>
            {LENSES.map(l => <option key={l} value={l}>{l}mm</option>)}
          </select>

          <div className="text-xs text-gray-500 w-10 text-right">
            {shot.durationEstSec ? `${Math.round(shot.durationEstSec)}s` : '—'}
          </div>

          {hasMissing && (
            <button
              onClick={() => onFillNull(shot.id)}
              className="text-[10px] px-2 py-1 bg-purple-600/30 text-purple-400 rounded hover:bg-purple-600/50"
              title="AI fill missing fields"
            >
              Fill
            </button>
          )}

          <button
            onClick={() => onUpdate(shot.id, 'isLocked', !shot.isLocked)}
            className={`p-1 rounded ${shot.isLocked ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
            title={shot.isLocked ? 'Unlock' : 'Lock'}
          >
            {shot.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
