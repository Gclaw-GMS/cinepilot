'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react'

interface DOODRow {
  characterId: string
  character: string
  characterTamil: string
  actorName?: string
  isMain: boolean
  total_days: number
  days: number[]
  percentage: number
}

interface DOODStats {
  totalCharacters: number
  totalShootingDays: number
  totalCalls: number
  avgDaysPerActor: number
}

const DEMO_DOOD: DOODRow[] = [
  { characterId: '1', character: 'Arjun', characterTamil: 'அர்ஜுன்', actorName: 'Ajith Kumar', isMain: true, total_days: 15, days: [1,2,3,5,6,7,9,10,11,12,14,15,16,18,20], percentage: 75 },
  { characterId: '2', character: 'Priya', characterTamil: 'பிரியா', actorName: 'Sai Pallavi', isMain: true, total_days: 12, days: [1,2,4,5,6,8,9,10,12,13,14,15], percentage: 60 },
  { characterId: '3', character: 'Mahendra', characterTamil: 'மகேந்திரா', actorName: 'Vijay Sethupathi', isMain: true, total_days: 8, days: [3,7,11,15,16,17,18,19], percentage: 40 },
  { characterId: '4', character: 'Sathya', characterTamil: 'சத்யா', actorName: 'Nivin Pauly', isMain: false, total_days: 10, days: [1,4,5,9,10,14,15,16,20,21], percentage: 50 },
  { characterId: '5', character: 'Divya', characterTamil: 'திவ்யா', actorName: 'Aishwarya Rajesh', isMain: false, total_days: 6, days: [2,3,8,12,13,19], percentage: 30 },
]

const DEMO_STATS: DOODStats = {
  totalCharacters: 5,
  totalShootingDays: 20,
  totalCalls: 51,
  avgDaysPerActor: 10.2,
}

export default function DOODPage() {
  const [report, setReport] = useState<DOODRow[]>([])
  const [stats, setStats] = useState<DOODStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const loadDOOD = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dood?projectId=${selectedProject}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      
      // Check for demo mode
      if (data.isDemoMode) {
        setIsDemoMode(true)
      }
      
      if (data.report && data.report.length > 0) {
        setReport(data.report)
        setStats(data.stats)
      } else {
        // Use demo data if no real data
        setReport(DEMO_DOOD)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.warn('Using demo DOOD data:', e)
      setReport(DEMO_DOOD)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    }
    setLoading(false)
  }, [selectedProject])

  useEffect(() => {
    loadDOOD()
  }, [loadDOOD])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/dood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', projectId: selectedProject })
      })
      if (!res.ok) {
        console.warn('Generate API error:', res.status)
      }
      await loadDOOD()
    } catch (e) {
      console.warn('Refresh failed, using cached data')
    }
    setRefreshing(false)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    // Generate export
    if (format === 'csv') {
      const headers = ['Character', 'Tamil Name', 'Actor', 'Total Days', 'Days', 'Percentage']
      const rows = report.map(r => [
        r.character,
        r.characterTamil,
        r.actorName || '',
        r.total_days,
        r.days.join(', '),
        `${r.percentage}%`
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  const totalShootingDays = stats.totalShootingDays

  // Generate calendar grid
  const renderCalendar = (days: number[], isCompact = false) => {
    const size = isCompact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
    return (
      <div className={`flex flex-wrap gap-1 mt-2 ${isCompact ? 'gap-0.5' : ''}`}>
        {Array.from({ length: Math.max(totalShootingDays, 1) }, (_, i) => {
          const dayNum = i + 1
          const isWorking = days.includes(dayNum)
          return (
            <div
              key={dayNum}
              className={`${size} rounded flex items-center justify-center transition-all ${
                isWorking
                  ? 'bg-cyan-400 text-black font-semibold shadow-md shadow-cyan-400/30'
                  : 'bg-gray-800/60 text-gray-600'
              }`}
              title={`Day ${dayNum}: ${isWorking ? 'Working' : 'Off'}`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    )
  }

  // Stats cards
  const statCards = [
    { 
      label: 'Total Characters', 
      value: stats.totalCharacters, 
      icon: Users, 
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10'
    },
    { 
      label: 'Shooting Days', 
      value: stats.totalShootingDays, 
      icon: Calendar, 
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    { 
      label: 'Total Calls', 
      value: stats.totalCalls, 
      icon: Clock, 
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    { 
      label: 'Avg Days/Actor', 
      value: stats.avgDaysPerActor, 
      icon: TrendingUp, 
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10'
    },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading DOOD Report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📊 Day Out of Days (DOOD)
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track actor availability across the shooting schedule
            </p>
          </div>
        </div>
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Demo Data</span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="default-project">இதயத்தின் ஒலி</option>
            <option value="project-2">Veera's Journey</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold">Cast Schedule</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {report.length} actors
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400 w-16">#</th>
                <th className="text-left p-4 font-medium text-gray-400">Character</th>
                <th className="text-center p-4 font-medium text-gray-400 w-24">Total Days</th>
                <th className="text-center p-4 font-medium text-gray-400 w-32">% of Shoot</th>
                <th className="text-left p-4 font-medium text-gray-400">
                  {viewMode === 'calendar' ? 'Shooting Calendar' : 'Working Days'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {report.map((row, idx) => (
                <tr 
                  key={row.characterId} 
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="p-4">
                    <span className="text-gray-500 text-sm">{idx + 1}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        row.isMain 
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {row.character[0]}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {row.character}
                          {row.isMain && (
                            <span className="text-[10px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded">
                              MAIN
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {row.characterTamil} • {row.actorName || 'TBA'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-cyan-400 font-bold text-xl">{row.total_days}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {viewMode === 'calendar' ? (
                      renderCalendar(row.days)
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.days.length > 0 ? row.days.map(d => (
                          <span 
                            key={d}
                            className="px-2 py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-xs"
                          >
                            Day {d}
                          </span>
                        )) : (
                          <span className="text-gray-500 text-sm">No calls</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Info */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-400 rounded"></div>
            <span>Working Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 rounded"></div>
            <span>Off Day</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )
}
