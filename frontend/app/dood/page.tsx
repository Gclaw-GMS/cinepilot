'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  RefreshCw,
  AlertCircle,
  FileText,
  Filter,
  CheckCircle,
  XCircle,
  Search,
  Keyboard,
  X,
  BarChart3,
  Workflow
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

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
  { characterId: '6', character: 'Raghav', characterTamil: 'ராகவ்', actorName: 'Karthi', isMain: true, total_days: 14, days: [1,2,3,4,5,6,7,9,10,11,12,14,15,16], percentage: 70 },
  { characterId: '7', character: 'Meera', characterTamil: 'மீரா', actorName: 'Nithya Menen', isMain: false, total_days: 9, days: [2,4,5,8,9,10,13,14,18], percentage: 45 },
  { characterId: '8', character: 'Vikram', characterTamil: 'விக்னேஷ்', actorName: 'Vijay', isMain: true, total_days: 11, days: [1,3,5,7,9,11,13,15,17,19,20], percentage: 55 },
]

const DEMO_STATS: DOODStats = {
  totalCharacters: 8,
  totalShootingDays: 20,
  totalCalls: 85,
  avgDaysPerActor: 10.6,
}

export default function DOODPage() {
  const [report, setReport] = useState<DOODRow[]>([])
  const [stats, setStats] = useState<DOODStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'heatmap'>('calendar')
  const [filterMain, setFilterMain] = useState<'all' | 'main' | 'supporting'>('all')
  const [sortBy, setSortBy] = useState<'days' | 'name' | 'percentage'>('days')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [hasUnlinkedCharacters, setHasUnlinkedCharacters] = useState(false)
  const [hasAnyData, setHasAnyData] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showLinkGuide, setShowLinkGuide] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const filteredReportLength = useRef(0)

  const loadDOOD = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsDemoMode(false)
    try {
      const res = await fetch(`/api/dood?projectId=${selectedProject}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      
      // Check if API returned demo data
      setIsDemoMode(data.isDemoMode === true)
      
      // Check for unlinked characters state
      setHasUnlinkedCharacters(data.hasUnlinkedCharacters === true)
      setHasAnyData(data.hasAnyData === true)
      
      if (data.report && data.report.length > 0) {
        setReport(data.report)
        setStats(data.stats)
        setIsDataLoaded(true)
        // Show link guide if characters exist but aren't linked
        if (data.hasUnlinkedCharacters) {
          setShowLinkGuide(true)
        }
      } else {
        // Use demo data if no real data
        setReport(DEMO_DOOD)
        setStats(DEMO_STATS)
        setIsDataLoaded(false)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.warn('Using demo DOOD data:', e)
      setReport(DEMO_DOOD)
      setStats(DEMO_STATS)
      setIsDataLoaded(false)
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

  const handleExtractCharacters = async () => {
    setRefreshing(true)
    try {
      // Call the scripts API to run character extraction
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze', 
          projectId: selectedProject 
        })
      })
      const data = await res.json()
      console.log('Character extraction result:', data)
      // Reload DOOD after extraction
      await loadDOOD()
      setShowLinkGuide(false)
    } catch (e) {
      console.warn('Character extraction failed:', e)
    }
    setRefreshing(false)
  }

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    const maxIndex = filteredReportLength.current - 1
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.min(prev + 1, maxIndex))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedRowIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setSelectedRowIndex(0)
        break
      case 'End':
        e.preventDefault()
        setSelectedRowIndex(maxIndex)
        break
      case 'Escape':
        setSelectedRowIndex(-1)
        break
      case '?':
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
        break
      case 'c':
        if (!e.ctrlKey && !e.metaKey) {
          // Toggle calendar view
          setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar')
        }
        break
      case 'f':
        if (!e.ctrlKey && !e.metaKey) {
          // Focus search
          const searchInput = document.querySelector('input[placeholder="Search character..."]') as HTMLInputElement
          searchInput?.focus()
        }
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    if (format === 'json') {
      const exportData = {
        project: selectedProject,
        generatedAt: new Date().toISOString(),
        stats: stats,
        report: report.map(r => ({
          character: r.character,
          tamilName: r.characterTamil,
          actor: r.actorName,
          isMainCast: r.isMain,
          totalDays: r.total_days,
          workingDays: r.days,
          percentageOfShoot: r.percentage
        })),
        heatmap: heatmapData,
        summary: {
          peakDay: heatmapData.sort((a, b) => b.count - a.count)[0]?.day || 0,
          peakCount: heatmapData.sort((a, b) => b.count - a.count)[0]?.count || 0,
          avgCallsPerDay: Math.round(heatmapData.reduce((s, d) => s + d.count, 0) / Math.max(heatmapData.length, 1) * 10) / 10
        }
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    
    if (format === 'csv') {
      // CSV Export
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
      URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      // PDF Export using print-friendly HTML
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      
      // Build the calendar grids for each character
      const calendarGrid = (days: number[]) => {
        return Array.from({ length: Math.max(totalShootingDays, 1) }, (_, i) => {
          const dayNum = i + 1
          const isWorking = days.includes(dayNum)
          return isWorking ? '■' : '□'
        }).join(' ')
      }

      // Generate HTML for the PDF
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Day Out of Days Report - ${date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a2e; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #06b6d4; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #06b6d4; }
    .stat-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #06b6d4; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
    tr:nth-child(even) { background: #f9fafb; }
    .character-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #06b6d4; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
    .main-badge { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
    .calendar { font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #666; }
    .calendar span { color: #06b6d4; font-weight: bold; }
    .percentage-bar { width: 60px; height: 8px; background: #e5e5e5; border-radius: 4px; overflow: hidden; }
    .percentage-fill { height: 100%; background: #06b6d4; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Day Out of Days Report</h1>
    <div class="subtitle">Generated on ${date}</div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${stats.totalCharacters}</div>
      <div class="stat-label">Total Characters</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.totalShootingDays}</div>
      <div class="stat-label">Shooting Days</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.totalCalls}</div>
      <div class="stat-label">Total Calls</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.avgDaysPerActor}</div>
      <div class="stat-label">Avg Days/Actor</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Character</th>
        <th>Actor</th>
        <th>Total Days</th>
        <th>Calendar</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      ${report.map((row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div class="character-cell">
              <div class="avatar">${row.character.substring(0, 2).toUpperCase()}</div>
              <div>
                <div>${row.character}</div>
                ${row.characterTamil ? `<div style="font-size:10px;color:#666">${row.characterTamil}</div>` : ''}
              </div>
            </div>
          </td>
          <td>${row.actorName || '-'}</td>
          <td style="text-align:center">${row.total_days}</td>
          <td class="calendar">${calendarGrid(row.days)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="percentage-bar"><div class="percentage-fill" style="width:${row.percentage}%"></div></div>
              ${row.percentage}%
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Generated by CinePilot • Film Production Management
  </div>
</body>
</html>`

      // Create blob and open in new window for printing
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        // Fallback: download as HTML that can be printed to PDF
        const a = document.createElement('a')
        a.href = url
        a.download = `dood-report-${new Date().toISOString().split('T')[0]}.html`
        a.click()
      }
    }
  }

  const totalShootingDays = stats.totalShootingDays

  // Generate calendar grid
  const renderCalendar = (days: number[], isCompact = false) => {
    const size = isCompact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs sm:w-5 sm:h-5 sm:text-[10px]'
    return (
      <div className={`flex flex-wrap gap-1 mt-2 ${isCompact ? 'gap-0.5' : ''}`}>
        {Array.from({ length: Math.max(totalShootingDays, 1) }, (_, i) => {
          const dayNum = i + 1
          const isWorking = days.includes(dayNum)
          return (
            <div
              key={dayNum}
              className={`${size} rounded flex items-center justify-center transition-all hover:scale-110 ${
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

  // Generate heatmap data - actor count per day
  const heatmapData = useMemo(() => {
    const data: { day: number; count: number; actors: string[] }[] = []
    for (let d = 1; d <= totalShootingDays; d++) {
      const actorsOnDay = report.filter(r => r.days.includes(d)).map(r => r.character)
      data.push({ day: d, count: actorsOnDay.length, actors: actorsOnDay })
    }
    return data
  }, [report, totalShootingDays])

  // Bar chart data for actor calls per day
  const actorCallsChartData = useMemo(() => {
    return heatmapData.map(d => ({
      day: `D${d.day}`,
      calls: d.count,
      actors: d.actors
    }))
  }, [heatmapData])

  // Render heatmap view
  const renderHeatmap = () => {
    const maxCount = Math.max(...heatmapData.map(d => d.count), 1)
    const sortedDays = [...heatmapData].sort((a, b) => b.count - a.count)
    
    return (
      <div className="space-y-6">
        {/* Bar Chart Visualization */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Actor Calls Per Day - Distribution
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actorCallsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="day" stroke="#6b7280" fontSize={11} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} actors`, 'Calls']}
                />
                <Bar dataKey="calls" radius={[0, 4, 4, 0]} barSize={20}>
                  {actorCallsChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.calls === maxCount ? '#06b6d4' : entry.calls > maxCount * 0.7 ? '#0891b2' : '#164e63'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid Heatmap */}
        <div className="grid grid-cols-[100px_1fr] gap-4">
          <div></div>
          <div className="flex">
            {heatmapData.slice(0, 10).map(d => (
              <div key={d.day} className="flex-1 text-center text-xs text-gray-500">
                D{d.day}
              </div>
            ))}
          </div>
        </div>
        {['Main Cast', 'Supporting Cast'].map(castType => {
          const isMain = castType === 'Main Cast'
          const filteredActors = report.filter(r => r.isMain === isMain)
          return (
            <div key={castType} className="grid grid-cols-[100px_1fr] gap-4 items-center">
              <div className="text-sm font-medium text-gray-400">{castType}</div>
              <div className="flex">
                {heatmapData.slice(0, 10).map(d => {
                  const actorsOnDay = filteredActors.filter(r => r.days.includes(d.day))
                  const intensity = actorsOnDay.length / Math.max(filteredActors.length, 1)
                  const bgColor = intensity > 0.5 
                    ? 'bg-cyan-500' 
                    : intensity > 0.25 
                      ? 'bg-cyan-700' 
                      : 'bg-cyan-900/50'
                  return (
                    <div 
                      key={d.day} 
                      className={`flex-1 h-10 ${bgColor} rounded mx-0.5 flex items-end justify-center pb-1`}
                      title={`Day ${d.day}: ${actorsOnDay.map(a => a.character).join(', ')}`}
                    >
                      {actorsOnDay.length > 0 && (
                        <span className="text-xs text-cyan-200">{actorsOnDay.length}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {/* Day Summary with better visualization */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Peak Call Days Analysis
          </h4>
          
          {/* Top 5 Peak Days as Cards */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {sortedDays.slice(0, 5).map((d, idx) => (
              <div 
                key={d.day} 
                className={`p-3 rounded-lg text-center ${
                  idx === 0 
                    ? 'bg-gradient-to-br from-cyan-500/30 to-cyan-600/10 border border-cyan-500/30' 
                    : 'bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {idx === 0 && <span className="text-xs">🔥</span>}
                  <div className="text-lg font-bold text-cyan-400">Day {d.day}</div>
                </div>
                <div className="text-xs text-gray-500">{d.count} actors</div>
                <div className="text-[10px] text-gray-600 mt-1 truncate">{d.actors.slice(0, 2).join(', ')}</div>
              </div>
            ))}
          </div>

          {/* Distribution Stats */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {Math.round(sortedDays.reduce((s, d) => s + d.count, 0) / Math.max(sortedDays.length, 1) * 10) / 10}
              </div>
              <div className="text-xs text-gray-500">Avg Calls/Day</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {sortedDays[0]?.count || 0}
              </div>
              <div className="text-xs text-gray-500">Peak Day Calls</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {sortedDays.filter(d => d.count >= stats.totalCharacters * 0.5).length} days
              </div>
              <div className="text-xs text-gray-500">Heavy Call Days</div>
            </div>
          </div>
        </div>
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

  // Filter and sort the report data
  const filteredReport = useMemo(() => {
    let filtered = [...report]
    
    // Apply search filter (by character name or actor name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.character.toLowerCase().includes(query) ||
        r.characterTamil.includes(query) ||
        (r.actorName && r.actorName.toLowerCase().includes(query))
      )
    }
    
    // Apply filter
    if (filterMain === 'main') {
      filtered = filtered.filter(r => r.isMain)
    } else if (filterMain === 'supporting') {
      filtered = filtered.filter(r => !r.isMain)
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'days') return b.total_days - a.total_days
      if (sortBy === 'name') return a.character.localeCompare(b.character)
      if (sortBy === 'percentage') return b.percentage - a.percentage
      return 0
    })
    
    // Update the ref for keyboard navigation
    filteredReportLength.current = filtered.length
    
    return filtered
  }, [report, filterMain, sortBy, searchQuery])

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

  // Empty state when no data
  if (!report || report.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Actors Scheduled</h3>
          <p className="text-gray-400 mb-6">
            Add characters to your script to start tracking their shooting days. 
            The DOOD report will show actor availability across the production schedule.
          </p>
          <Link 
            href="/scripts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Go to Script Breakdown
          </Link>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                📊 Day Out of Days (DOOD)
              </h1>
              {isDemoMode && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                  Demo
                </span>
              )}
              {isDataLoaded ? (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Live Data
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Track actor availability across the shooting schedule
            </p>
          </div>
        </div>
        
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
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'heatmap' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Heatmap
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

      {/* Unlinked Characters Warning Banner */}
      {showLinkGuide && hasUnlinkedCharacters && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-400 mb-1">
                Characters Not Linked to Scenes
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Your {report.length} characters exist but aren't linked to any scenes. 
                Run script analysis to extract and link characters from your screenplay.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExtractCharacters}
                  disabled={refreshing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Extract & Link Characters
                </button>
                <Link
                  href="/scripts"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Go to Script Breakdown
                </Link>
                <button
                  onClick={() => setShowLinkGuide(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Keyboard Help Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded transition-colors"
        >
          <Keyboard className="w-3 h-3" />
          Keyboard shortcuts
        </button>
        {selectedRowIndex >= 0 && (
          <span className="text-xs text-cyan-400">
            Row {selectedRowIndex + 1} of {filteredReport.length} selected
          </span>
        )}
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Keyboard className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
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
                { keys: ['↑', '↓'], desc: 'Navigate rows', category: 'Navigation' },
                { keys: ['Home'], desc: 'Go to first row', category: 'Navigation' },
                { keys: ['End'], desc: 'Go to last row', category: 'Navigation' },
                { keys: ['Esc'], desc: 'Clear selection', category: 'Navigation' },
                { keys: ['C'], desc: 'Toggle calendar/list view', category: 'View' },
                { keys: ['F'], desc: 'Focus search', category: 'Search' },
                { keys: ['?'], desc: 'Toggle this help', category: 'Help' },
              ].map((shortcut, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider w-16">
                      {shortcut.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <kbd 
                          key={i} 
                          className="px-2.5 py-1.5 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-md text-xs font-mono text-cyan-300 shadow-sm"
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
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-400">?</kbd> 
                  anytime to toggle
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide hidden sm:inline">{stat.label}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide sm:hidden">{stat.label.split(' ')[0]}</span>
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
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
              {searchQuery || filterMain !== 'all' ? `${filteredReport.length} / ${report.length}` : report.length} actors
            </span>
          </div>
          
          {/* Filter & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm w-full sm:w-40 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterMain}
                  onChange={(e) => setFilterMain(e.target.value as typeof filterMain)}
                  className="px-2 py-1.5 sm:px-3 sm:py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                >
                  <option value="all">All Cast</option>
                  <option value="main">Main Cast</option>
                  <option value="supporting">Supporting</option>
                </select>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1.5 sm:px-3 sm:py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
              >
                <option value="days">Sort by Days</option>
                <option value="name">Sort by Name</option>
                <option value="percentage">Sort by %</option>
              </select>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-purple-400/10 hover:bg-purple-400/20 text-purple-400 rounded-lg text-sm transition-colors"
                title="Export as JSON"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400 w-12 sm:w-16">#</th>
                <th className="text-left p-4 font-medium text-gray-400">Character</th>
                <th className="text-center p-4 font-medium text-gray-400 w-16 sm:w-24 hidden sm:table-cell">Total Days</th>
                <th className="text-center p-4 font-medium text-gray-400 w-24 sm:w-32 hidden md:table-cell">% of Shoot</th>
                <th className="text-left p-4 font-medium text-gray-400">
                  {viewMode === 'calendar' ? 'Shooting Calendar' : 'Working Days'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredReport.map((row, idx) => (
                <tr 
                  key={row.characterId} 
                  className={`transition-colors cursor-pointer ${
                    selectedRowIndex === idx 
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' 
                      : 'hover:bg-gray-800/30'
                  }`}
                  onClick={() => setSelectedRowIndex(idx)}
                >
                  <td className="p-4">
                    <span className="text-gray-500 text-sm">{idx + 1}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        row.isMain 
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {row.character[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          <span className="truncate">{row.character}</span>
                          {row.isMain && (
                            <span className="text-[10px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded shrink-0">
                              MAIN
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 hidden sm:block">
                          {row.characterTamil} • {row.actorName || 'TBA'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell">
                    <span className="text-cyan-400 font-bold text-lg sm:text-xl">{row.total_days}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 sm:h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-10 sm:w-12 text-right">
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {viewMode === 'calendar' ? (
                      renderCalendar(row.days, true)
                    ) : viewMode === 'heatmap' ? (
                      <div className="flex flex-wrap gap-1">
                        {row.days.map(d => {
                          const dayData = heatmapData.find(hd => hd.day === d)
                          const intensity = dayData ? dayData.count / Math.max(stats.totalCharacters, 1) : 0
                          const bgColor = intensity > 0.5 
                            ? 'bg-cyan-500' 
                            : intensity > 0.25 
                              ? 'bg-cyan-700' 
                              : 'bg-cyan-900'
                          return (
                            <span 
                              key={d}
                              className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 ${bgColor} text-white rounded text-[10px] sm:text-xs`}
                            >
                              D{d}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.days.length > 0 ? row.days.map(d => (
                          <span 
                            key={d}
                            className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-[10px] sm:text-xs"
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
        
        {/* Heatmap View Panel */}
        {viewMode === 'heatmap' && (
          <div className="p-6 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Actor Call Density Heatmap
            </h3>
            {renderHeatmap()}
          </div>
        )}
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
