'use client'

import { useState, useEffect, useCallback } from 'react'

interface SceneWithIntent {
  id: string
  sceneNumber: string
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  locationIntents: {
    id: string
    keywords: string[]
    terrainType: string | null
    _count: { candidates: number }
  }[]
}

interface CandidateData {
  id: string
  name: string | null
  latitude: string
  longitude: string
  placeType: string | null
  scoreTotal: number
  scoreAccess: number | null
  scoreLocality: number | null
  riskFlags: string[]
  explanation: string | null
}

export default function LocationsPage() {
  const [scenes, setScenes] = useState<SceneWithIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [scouting, setScouting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScenes = useCallback(async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setScenes(data.scenes || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScenes() }, [fetchScenes])

  const handleSelectScene = async (sceneId: string) => {
    setSelectedSceneId(sceneId)
    setCandidates([])
    try {
      const res = await fetch(`/api/locations?sceneId=${sceneId}`)
      const data = await res.json()
      setCandidates(data.intent?.candidates || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleScout = async () => {
    if (!selectedSceneId) return
    setScouting(true)
    setError(null)
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scout', sceneId: selectedSceneId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCandidates(data.candidates || [])
      await fetchScenes()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setScouting(false)
    }
  }

  const selectedScene = scenes.find(s => s.id === selectedSceneId)
  const extScenes = scenes.filter(s => s.intExt === 'EXT')
  const intScenes = scenes.filter(s => s.intExt !== 'EXT')

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading locations...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Location Scouter</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI-powered script-aware location discovery</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center text-gray-500">
          No scenes found. Upload and parse a script first.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Scene List Panel */}
          <div className="col-span-1 space-y-4">
            {extScenes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-amber-400 mb-2 uppercase">Exterior Scenes</h3>
                <div className="space-y-1">
                  {extScenes.map(scene => (
                    <SceneButton key={scene.id} scene={scene} selected={selectedSceneId === scene.id} onClick={handleSelectScene} />
                  ))}
                </div>
              </div>
            )}
            {intScenes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-blue-400 mb-2 uppercase">Interior Scenes</h3>
                <div className="space-y-1">
                  {intScenes.map(scene => (
                    <SceneButton key={scene.id} scene={scene} selected={selectedSceneId === scene.id} onClick={handleSelectScene} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Panel */}
          <div className="col-span-2 space-y-4">
            {!selectedSceneId ? (
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center text-gray-500">
                Select a scene to scout locations
              </div>
            ) : (
              <>
                {/* Scene Header */}
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">{selectedScene?.sceneNumber}</span>
                      {selectedScene?.intExt && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          selectedScene.intExt === 'EXT' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'
                        }`}>{selectedScene.intExt}</span>
                      )}
                      {selectedScene?.timeOfDay && (
                        <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">{selectedScene.timeOfDay}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">{selectedScene?.headingRaw || selectedScene?.location || 'Unknown'}</div>
                    {selectedScene?.locationIntents?.[0]?.keywords && (
                      <div className="flex gap-1 mt-2">
                        {selectedScene.locationIntents[0].keywords.map((k, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-cinepilot-accent/20 text-cinepilot-accent rounded">{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleScout} disabled={scouting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded font-medium text-sm">
                    {scouting ? 'Scouting...' : 'Scout Locations'}
                  </button>
                </div>

                {/* Candidates */}
                {candidates.length === 0 ? (
                  <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
                    {scouting ? 'Searching for locations...' : 'Click "Scout Locations" to find candidates'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((c, idx) => (
                      <div key={c.id || idx} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-cinepilot-accent">#{idx + 1}</span>
                              <span className="font-medium text-gray-200">{c.name || 'Unnamed Location'}</span>
                              {c.placeType && (
                                <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded">{c.placeType}</span>
                              )}
                            </div>
                            {c.explanation && (
                              <p className="text-xs text-gray-400 mt-1">{c.explanation}</p>
                            )}
                            {c.riskFlags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {c.riskFlags.map((f, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 bg-red-900/30 text-red-400 rounded">{f}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center">
                              <div className="text-xl font-bold text-cinepilot-accent">{c.scoreTotal}</div>
                              <div className="text-[10px] text-gray-600">Score</div>
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
                            >
                              Map
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2 text-[10px] text-gray-600">
                          {c.scoreAccess !== null && <span>Access: {c.scoreAccess}</span>}
                          {c.scoreLocality !== null && <span>Locality: {c.scoreLocality}</span>}
                          <span>{Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneButton({
  scene,
  selected,
  onClick,
}: {
  scene: SceneWithIntent
  selected: boolean
  onClick: (id: string) => void
}) {
  const candidateCount = scene.locationIntents?.[0]?._count?.candidates || 0

  return (
    <button
      onClick={() => onClick(scene.id)}
      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
        selected
          ? 'bg-cinepilot-accent/20 text-cinepilot-accent border border-cinepilot-accent/30'
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs">{scene.sceneNumber}</span>
        {candidateCount > 0 && (
          <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
            {candidateCount} spots
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 truncate mt-0.5">
        {scene.location || scene.headingRaw || 'Untitled'}
      </div>
    </button>
  )
}
