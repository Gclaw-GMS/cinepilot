'use client'

import { useState, useEffect, useCallback } from 'react'

interface DaySceneData {
  id: string
  orderNumber: number | null
  estimatedMinutes: number | null
  scene: {
    id: string
    sceneNumber: string
    headingRaw: string | null
    intExt: string | null
    timeOfDay: string | null
    location: string | null
  }
}

interface ShootingDayData {
  id: string
  dayNumber: number
  scheduledDate: string | null
  callTime: string | null
  estimatedHours: string | null
  notes: string | null
  status: string
  dayScenes: DaySceneData[]
}

interface VersionData {
  id: string
  versionNum: number
  label: string | null
  score: number | null
  isActive: boolean
  createdAt: string
}

const MODES = [
  { key: 'balanced', label: 'Balanced', desc: 'Default optimization' },
  { key: 'fast', label: 'Fast', desc: 'Minimal optimization, quick result' },
  { key: 'cost_minimum', label: 'Cost Minimum', desc: 'Minimize location moves' },
  { key: 'travel_minimum', label: 'Travel Minimum', desc: 'Cluster by location' },
  { key: 'weather_safe', label: 'Weather Safe', desc: 'Prioritize indoor scenes' },
]

export default function SchedulePage() {
  const [shootingDays, setShootingDays] = useState<ShootingDayData[]>([])
  const [versions, setVersions] = useState<VersionData[]>([])
  const [stats, setStats] = useState({ totalDays: 0, totalHours: 0, totalScenes: 0 })
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const [mode, setMode] = useState('balanced')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      const data = await res.json()
      setShootingDays(data.shootingDays || [])
      setVersions(data.versions || [])
      setStats(data.stats || { totalDays: 0, totalHours: 0, totalScenes: 0 })
      setIsDemoMode(data.isDemoMode === true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOptimize = async () => {
    setOptimizing(true)
    setError(null)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', startDate, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOptimizing(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading schedule...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schedule Engine</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI-powered shooting schedule with TFPC compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          />
          <select value={mode} onChange={e => setMode(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
            {MODES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <button onClick={handleOptimize} disabled={optimizing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-medium text-sm">
            {optimizing ? 'Optimizing...' : 'Optimize Schedule'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{stats.totalDays}</div>
          <div className="text-xs text-gray-500">Shoot Days</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{stats.totalHours}h</div>
          <div className="text-xs text-gray-500">Total Hours</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cinepilot-accent">{stats.totalScenes}</div>
          <div className="text-xs text-gray-500">Scenes Scheduled</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{versions.length}</div>
          <div className="text-xs text-gray-500">Versions</div>
        </div>
      </div>

      {/* Schedule Version Info */}
      {versions.length > 0 && (
        <div className="flex gap-2 mb-4">
          {versions.map(v => (
            <div key={v.id} className={`px-3 py-1.5 rounded text-xs ${
              v.isActive ? 'bg-blue-900/30 border border-blue-700/50 text-blue-400' : 'bg-gray-800 text-gray-500'
            }`}>
              {v.label || `v${v.versionNum}`}
              {v.score !== null && <span className="ml-1 text-gray-600">({v.score}%)</span>}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Timeline */}
      {shootingDays.length === 0 ? (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
          <div className="text-gray-500 mb-3">No schedule generated yet</div>
          <p className="text-gray-600 text-sm mb-4">Upload a script and parse it first, then click "Optimize Schedule" to create a shooting plan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shootingDays.map(day => {
            const hours = Number(day.estimatedHours || 0);
            const utilizationPct = Math.min(100, (hours / 12) * 100);
            const isOvertime = hours > 10;

            return (
              <div key={day.id} className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-cinepilot-accent w-12">D{day.dayNumber}</span>
                    <span className="text-sm text-gray-400">{formatDate(day.scheduledDate)}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">{day.callTime || '06:00'} call</span>
                    {day.dayScenes[0]?.scene.intExt && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        day.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
                          ? 'bg-indigo-900/40 text-indigo-400' : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {day.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT') ? 'NIGHT' : 'DAY'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isOvertime ? 'text-red-400' : 'text-gray-300'}`}>
                        {hours}h
                      </div>
                      <div className="w-24 h-1.5 bg-gray-800 rounded-full">
                        <div className={`h-full rounded-full ${isOvertime ? 'bg-red-500' : 'bg-cinepilot-accent'}`}
                          style={{ width: `${utilizationPct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day.dayScenes.length} scenes</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-800/50">
                  {day.dayScenes.map(ds => (
                    <div key={ds.id} className="px-4 py-2.5 flex items-center gap-4">
                      <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded w-12 text-center">{ds.scene.sceneNumber}</span>
                      <div className="flex items-center gap-2 flex-1">
                        {ds.scene.intExt && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            ds.scene.intExt === 'INT' ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-400'
                          }`}>{ds.scene.intExt}</span>
                        )}
                        <span className="text-sm text-gray-300 truncate">{ds.scene.headingRaw || ds.scene.location || 'Untitled'}</span>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {ds.estimatedMinutes ? `${ds.estimatedMinutes}min` : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {day.notes && (
                  <div className="px-4 py-2 bg-yellow-900/10 text-yellow-400 text-xs">
                    {day.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
