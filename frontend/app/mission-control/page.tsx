'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  Radar as RadarIcon, Gauge, Activity, Zap, Target, TrendingUp, 
  Clock, Film, Users, DollarSign, MapPin, Calendar, FileText,
  AlertTriangle, CheckCircle, Play, Pause, RotateCcw, Download,
  Loader2, RefreshCw, HelpCircle, X, Search, Printer, Filter,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface MissionControlData {
  production: {
    overall: number
    scenes: { total: number; completed: number; remaining: number }
    schedule: { daysTotal: number; daysElapsed: number; daysRemaining: number }
    budget: { total: number; spent: number; remaining: number; projectedTotal: number }
  }
  today: {
    scenesShot: number
    scenesPlanned: number
    crewPresent: number
    crewTotal: number
    hoursRemaining: number
  }
  weekly: Array<{ day: string; budget: number; scenes: number }>
  departments: Array<{ name: string; health: number; members: number; dailyRate: number }>
  risks: Array<{ level: string; title: string; daysLeft: number }>
  locations: Array<{ name: string; scenes: number; progress: number }>
  summary: {
    totalScripts: number
    totalCharacters: number
    totalCrew: number
    totalLocations: number
    totalShootingDays: number
  }
  _demo?: boolean
}

// Fallback data when API fails
const FALLBACK_DATA: MissionControlData = {
  production: {
    overall: 0,
    scenes: { total: 0, completed: 0, remaining: 0 },
    schedule: { daysTotal: 0, daysElapsed: 0, daysRemaining: 0 },
    budget: { total: 0, spent: 0, remaining: 0, projectedTotal: 0 },
  },
  today: {
    scenesShot: 0,
    scenesPlanned: 0,
    crewPresent: 0,
    crewTotal: 0,
    hoursRemaining: 8,
  },
  weekly: [
    { day: 'Mon', budget: 0, scenes: 0 },
    { day: 'Tue', budget: 0, scenes: 0 },
    { day: 'Wed', budget: 0, scenes: 0 },
    { day: 'Thu', budget: 0, scenes: 0 },
    { day: 'Fri', budget: 0, scenes: 0 },
    { day: 'Sat', budget: 0, scenes: 0 },
    { day: 'Sun', budget: 0, scenes: 0 },
  ],
  departments: [],
  risks: [
    { level: 'low', title: 'No production data yet', daysLeft: 0 },
  ],
  locations: [],
  summary: {
    totalScripts: 0,
    totalCharacters: 0,
    totalCrew: 0,
    totalLocations: 0,
    totalShootingDays: 0,
  },
}

function LiveTicker({ data }: { data: MissionControlData | null }) {
  const [tick, setTick] = useState(0)
  
  // Generate dynamic ticker messages based on data
  const getMessages = useCallback(() => {
    if (!data) return []
    const msgs = []
    if (data.production.scenes.completed > 0) {
      msgs.push({ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), msg: `${data.production.scenes.completed} scenes completed`, type: 'success' as const })
    }
    if (data.summary.totalCrew > 0) {
      msgs.push({ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), msg: `${data.summary.totalCrew} crew members`, type: 'info' as const })
    }
    if (data.production.budget.spent > 0) {
      msgs.push({ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), msg: `₹${(data.production.budget.spent / 100000).toFixed(1)}L spent`, type: 'info' as const })
    }
    if (data.risks.length > 0) {
      msgs.push({ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), msg: data.risks[0].title, type: 'warning' as const })
    }
    return msgs
  }, [data])
  
  useEffect(() => { 
    const i = setInterval(() => setTick(t => (t + 1) % Math.max(1, getMessages().length)), 4000)
    return () => clearInterval(i)
  }, [getMessages])
  
  const messages = getMessages()
  const m = messages[tick % messages.length] || { time: '--:--', msg: 'Loading...', type: 'info' as const }
  
  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-cyan-400 font-mono">{m.time}</span>
      </div>
      <span className="text-sm">{m.msg}</span>
    </div>
  )
}

// Calculate pie data from actual scene completion
function getScenePieData(data: MissionControlData) {
  const { completed, remaining } = data.production.scenes
  const inProgress = Math.max(0, Math.floor(completed * 0.3))
  const trulyCompleted = completed - inProgress
  
  return [
    { name: 'Completed', value: trulyCompleted, color: '#10b981' },
    { name: 'In Progress', value: inProgress, color: '#f59e0b' },
    { name: 'Pending', value: remaining, color: '#64748b' },
  ]
}

export default function MissionControl() {
  const [data, setData] = useState<MissionControlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [time, setTime] = useState(new Date())
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterRiskLevel, setFilterRiskLevel] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  
  // Sort states
  const [sortBy, setSortBy] = useState<'name' | 'health' | 'members' | 'dailyRate' | 'level' | 'daysLeft' | 'scenes' | 'progress' | 'title'>('health')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [sortCategory, setSortCategory] = useState<'departments' | 'risks' | 'locations'>('departments')

  // Ref for keyboard shortcut access
  const fetchDataRef = useRef<() => void>(() => {})
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/mission-control')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setIsDemoMode(json._demo === true)
      setError(null)
    } catch (err) {
      console.error('Mission control fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load')
      // Use fallback data on error
      setData(prev => prev || FALLBACK_DATA)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Export functions
  const handleExportCSV = () => {
    if (!data) return
    
    const rows = [
      ['Category', 'Name', 'Value'],
      // Production
      ['Production', 'Overall Health', `${data.production.overall}%`],
      ['Production', 'Scenes Total', data.production.scenes.total.toString()],
      ['Production', 'Scenes Completed', data.production.scenes.completed.toString()],
      ['Production', 'Scenes Remaining', data.production.scenes.remaining.toString()],
      ['Production', 'Days Total', data.production.schedule.daysTotal.toString()],
      ['Production', 'Days Elapsed', data.production.schedule.daysElapsed.toString()],
      ['Production', 'Days Remaining', data.production.schedule.daysRemaining.toString()],
      ['Production', 'Budget Total', data.production.budget.total.toString()],
      ['Production', 'Budget Spent', data.production.budget.spent.toString()],
      ['Production', 'Budget Remaining', data.production.budget.remaining.toString()],
      // Today
      ['Today', 'Scenes Shot', data.today.scenesShot.toString()],
      ['Today', 'Scenes Planned', data.today.scenesPlanned.toString()],
      ['Today', 'Crew Present', data.today.crewPresent.toString()],
      ['Today', 'Crew Total', data.today.crewTotal.toString()],
      ['Today', 'Hours Remaining', data.today.hoursRemaining.toString()],
      // Departments (sorted)
      ...sortedDepartments.map(d => ['Department', d.name, `Health: ${d.health}%, Members: ${d.members}, Rate: ₹${d.dailyRate}/day`]),
      // Risks (sorted)
      ...sortedRisks.map(r => ['Risk', r.title, `Level: ${r.level}, Days Left: ${r.daysLeft}`]),
      // Locations (sorted)
      ...sortedLocations.map(l => ['Location', l.name, `Scenes: ${l.scenes}, Progress: ${l.progress}%`]),
    ]
    
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    if (!data) return
    
    const exportData = {
      exportDate: new Date().toISOString(),
      production: data.production,
      today: data.today,
      weekly: data.weekly,
      departments: sortedDepartments,
      risks: sortedRisks,
      locations: sortedLocations,
      summary: data.summary,
      sortInfo: {
        sortBy,
        sortOrder,
        sortCategory,
      },
      filterInfo: {
        searchQuery,
        filterDepartment,
        filterRiskLevel,
        filterLocation,
      },
      stats: {
        totalDepartments: sortedDepartments.length,
        totalRisks: sortedRisks.length,
        totalLocations: sortedLocations.length,
      }
    }
    
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Print function
  const printMissionControl = () => {
    if (!data) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const getHealthColor = (health: number) => {
      if (health >= 80) return '#10b981'
      if (health >= 60) return '#f59e0b'
      return '#ef4444'
    }
    
    const getRiskColor = (level: string) => {
      switch (level) {
        case 'high': return '#ef4444'
        case 'medium': return '#f59e0b'
        default: return '#64748b'
      }
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mission Control Report - CinePilot</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1e293b; }
    h1 { color: #1e293b; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .generated { color: #64748b; font-size: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .summary-card { padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .summary-card h3 { margin: 0; font-size: 28px; }
    .summary-card p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
    .production-health { text-align: center; padding: 30px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; color: white; margin: 20px 0; }
    .production-health h2 { color: white; border: none; margin: 0; }
    .production-health .percentage { font-size: 64px; font-weight: bold; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .health-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .health-fill { height: 100%; border-radius: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge.high { background: #fee2e2; color: #991b1b; }
    .badge.medium { background: #fef3c7; color: #92400e; }
    .badge.low { background: #f1f5f9; color: #475569; }
    .today-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
    .today-card { padding: 15px; border-radius: 8px; background: #f8fafc; text-align: center; }
    .today-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .today-card .label { font-size: 12px; color: #64748b; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Mission Control Report</h1>
    <span class="generated">Generated: ${new Date().toLocaleString()}</span>
  </div>
  
  <div class="production-health">
    <h2>Production Health</h2>
    <div class="percentage">${data.production.overall}%</div>
  </div>
  
  <div class="summary-grid">
    <div class="summary-card">
      <h3>${data.production.scenes.total}</h3>
      <p>Total Scenes</p>
    </div>
    <div class="summary-card">
      <h3>${data.production.scenes.completed}</h3>
      <p>Completed</p>
    </div>
    <div class="summary-card">
      <h3>${data.production.schedule.daysTotal}</h3>
      <p>Shooting Days</p>
    </div>
    <div class="summary-card">
      <h3>${data.summary.totalCrew}</h3>
      <p>Crew Members</p>
    </div>
  </div>
  
  <div class="today-grid">
    <div class="today-card">
      <div class="value">${data.today.scenesShot}</div>
      <div class="label">Scenes Shot</div>
    </div>
    <div class="today-card">
      <div class="value">${data.today.scenesPlanned}</div>
      <div class="label">Planned</div>
    </div>
    <div class="today-card">
      <div class="value">${data.today.crewPresent}</div>
      <div class="label">Crew Present</div>
    </div>
    <div class="today-card">
      <div class="value">${data.today.hoursRemaining}</div>
      <div class="label">Hours Left</div>
    </div>
    <div class="today-card">
      <div class="value">₹${(data.production.budget.spent / 100000).toFixed(1)}L</div>
      <div class="label">Budget Spent</div>
    </div>
  </div>
  
  <h2>📊 Budget Overview</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Budget</td>
        <td>₹${(data.production.budget.total / 10000000).toFixed(2)} Cr</td>
      </tr>
      <tr>
        <td>Spent</td>
        <td>₹${(data.production.budget.spent / 10000000).toFixed(2)} Cr</td>
      </tr>
      <tr>
        <td>Remaining</td>
        <td>₹${(data.production.budget.remaining / 10000000).toFixed(2)} Cr</td>
      </tr>
      <tr>
        <td>Projected Total</td>
        <td>₹${(data.production.budget.projectedTotal / 10000000).toFixed(2)} Cr</td>
      </tr>
    </tbody>
  </table>
  
  ${data.departments.length > 0 ? `
  <h2>🏢 Departments</h2>
  <table>
    <thead>
      <tr>
        <th>Department</th>
        <th>Health</th>
        <th>Members</th>
        <th>Daily Rate</th>
      </tr>
    </thead>
    <tbody>
      ${data.departments.map(d => `
        <tr>
          <td><strong>${d.name}</strong></td>
          <td>
            <div class="health-bar">
              <div class="health-fill" style="width: ${d.health}%; background: ${getHealthColor(d.health)}"></div>
            </div>
            ${d.health}%
          </td>
          <td>${d.members}</td>
          <td>₹${(d.dailyRate / 1000).toFixed(0)}K</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${data.risks.length > 0 ? `
  <h2>⚠️ Risks</h2>
  <table>
    <thead>
      <tr>
        <th>Level</th>
        <th>Title</th>
        <th>Days Left</th>
      </tr>
    </thead>
    <tbody>
      ${data.risks.map(r => `
        <tr>
          <td><span class="badge ${r.level}">${r.level}</span></td>
          <td>${r.title}</td>
          <td>${r.daysLeft} days</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${data.locations.length > 0 ? `
  <h2>📍 Locations</h2>
  <table>
    <thead>
      <tr>
        <th>Location</th>
        <th>Scenes</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      ${data.locations.map(l => `
        <tr>
          <td><strong>${l.name}</strong></td>
          <td>${l.scenes}</td>
          <td>
            <div class="health-bar">
              <div class="health-fill" style="width: ${l.progress}%; background: #10b981"></div>
            </div>
            ${l.progress}%
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  <div class="footer">
    Generated by CinePilot • ${new Date().toISOString()}
  </div>
</body>
</html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setShowPrintMenu(false)
  }

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = () => {
      setRefreshing(true)
      fetchData()
    }
  }, [fetchData])

  // Click outside to close export/print menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu])

  // Click outside to close filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
    }
    if (showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterPanel])

  // Active filter count
  const activeFilterCount = (filterDepartment !== 'all' ? 1 : 0) + (filterRiskLevel !== 'all' ? 1 : 0) + (filterLocation !== 'all' ? 1 : 0) + (sortBy !== 'health' || sortOrder !== 'desc' ? 1 : 0)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'f':
          e.preventDefault()
          setShowFilterPanel(prev => !prev)
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilterPanel(false)
          setSearchQuery('')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  const pieData = data ? getScenePieData(data) : [
    { name: 'Completed', value: 0, color: '#10b981' },
    { name: 'In Progress', value: 0, color: '#f59e0b' },
    { name: 'Pending', value: 100, color: '#64748b' },
  ]

  const productionHealth = data?.production.overall ?? 0

  // Sorting functions using useMemo for performance
  const sortedDepartments = useMemo(() => {
    const filtered = data?.departments.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []
    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'health':
          comparison = a.health - b.health
          break
        case 'members':
          comparison = a.members - b.members
          break
        case 'dailyRate':
          comparison = a.dailyRate - b.dailyRate
          break
        default:
          comparison = a.health - b.health
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [data?.departments, searchQuery, sortBy, sortOrder])

  const sortedRisks = useMemo(() => {
    const filtered = data?.risks.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.level.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []
    return [...filtered].sort((a, b) => {
      let comparison = 0
      const levelOrder = { high: 3, medium: 2, low: 1 }
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'level':
          comparison = (levelOrder[a.level as keyof typeof levelOrder] || 0) - (levelOrder[b.level as keyof typeof levelOrder] || 0)
          break
        case 'daysLeft':
          comparison = a.daysLeft - b.daysLeft
          break
        default:
          comparison = (levelOrder[a.level as keyof typeof levelOrder] || 0) - (levelOrder[b.level as keyof typeof levelOrder] || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [data?.risks, searchQuery, sortBy, sortOrder])

  const sortedLocations = useMemo(() => {
    const filtered = data?.locations.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []
    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'scenes':
          comparison = a.scenes - b.scenes
          break
        case 'progress':
          comparison = a.progress - b.progress
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [data?.locations, searchQuery, sortBy, sortOrder])

  const hasActiveFilters = searchQuery.trim().length > 0 || sortBy !== 'health' || sortOrder !== 'desc'
  const totalFiltered = sortedDepartments.length + sortedRisks.length + sortedLocations.length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <LiveTicker data={data} />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center">
                <RadarIcon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  MISSION CONTROL
                </h1>
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">CINE PILOT PRODUCTION HUD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-mono">CURRENT TIME</p>
              <p className="text-2xl font-mono font-bold text-cyan-400">
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </p>
              <p className="text-xs text-slate-600 font-mono">
                {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-slate-500 font-mono">PRODUCTION DAY</p>
              <p className="text-2xl font-mono font-bold text-purple-400">
                DAY {data?.production.schedule.daysElapsed ?? 0}
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
              {hasActiveFilters && (
                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-cyan-500 text-white text-[10px] font-bold rounded-full">
                  {totalFiltered}
                </div>
              )}
            </div>
            {/* Filter Toggle Button */}
            <div className="relative" ref={filterPanelRef}>
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Filters (F)"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilterPanel && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="text-sm font-medium text-white">Filter & Sort</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Sort Section */}
                    <div className="pb-4 border-b border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3" />
                          Sort By
                        </label>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-xs text-cyan-400 transition-colors"
                          title="Toggle sort order (S)"
                        >
                          {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {sortOrder.toUpperCase()}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          onClick={() => { setSortCategory('departments'); setSortBy('health'); }}
                          className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            sortCategory === 'departments' 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Depts
                        </button>
                        <button
                          onClick={() => { setSortCategory('risks'); setSortBy('level'); }}
                          className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            sortCategory === 'risks' 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Risks
                        </button>
                        <button
                          onClick={() => { setSortCategory('locations'); setSortBy('name'); }}
                          className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            sortCategory === 'locations' 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Locs
                        </button>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        {sortCategory === 'departments' && (
                          <>
                            <option value="health">Health %</option>
                            <option value="name">Name</option>
                            <option value="members">Members</option>
                            <option value="dailyRate">Daily Rate</option>
                          </>
                        )}
                        {sortCategory === 'risks' && (
                          <>
                            <option value="level">Risk Level</option>
                            <option value="title">Title</option>
                            <option value="daysLeft">Days Left</option>
                          </>
                        )}
                        {sortCategory === 'locations' && (
                          <>
                            <option value="name">Name</option>
                            <option value="scenes">Scenes</option>
                            <option value="progress">Progress %</option>
                          </>
                        )}
                      </select>
                    </div>
                    {/* Department Filter */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Department</label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="all">All Departments</option>
                        {data?.departments.map(dept => (
                          <option key={dept.name} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Risk Level Filter */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Risk Level</label>
                      <select
                        value={filterRiskLevel}
                        onChange={(e) => setFilterRiskLevel(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="all">All Risk Levels</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="low">Low Risk</option>
                      </select>
                    </div>
                    {/* Location Filter */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Location</label>
                      <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="all">All Locations</option>
                        {data?.locations.map(loc => (
                          <option key={loc.name} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
                      <button
                        onClick={() => { 
                          setFilterDepartment('all'); 
                          setFilterRiskLevel('all'); 
                          setFilterLocation('all'); 
                          setSortBy('health');
                          setSortOrder('desc');
                        }}
                        className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Clear All Filters & Sort
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all disabled:opacity-50"
                title="Refresh (R)"
              >
                <RefreshCw className={`w-5 h-5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowKeyboardHelp(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(prev => !prev)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                  title="Export (E)"
                >
                  <Download className="w-5 h-5 text-cyan-400" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-green-400" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-purple-400" />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
              <div className="relative" ref={printMenuRef}>
                <button 
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  disabled={!data}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Print (P)"
                >
                  <Printer className="w-5 h-5 text-cyan-400" />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={printMissionControl}
                      className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <Printer className="w-4 h-4 text-purple-400" />
                      Print Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Filter Status */}
      {hasActiveFilters && (
        <div className="mb-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-300">
            Filtering: <span className="font-semibold">{totalFiltered}</span> results for "<span className="font-semibold">{searchQuery}</span>"
          </span>
          <button 
            onClick={() => setSearchQuery('')}
            className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-4 py-2 mb-4 text-sm">
          ⚠️ Using cached data: {error}
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <ShortcutRow keys={['R']} description="Refresh mission data" />
              <ShortcutRow keys={['/']} description="Focus search input" />
              <ShortcutRow keys={['F']} description="Toggle filters panel" />
              <ShortcutRow keys={['S']} description="Toggle sort order (asc/desc)" />
              <ShortcutRow keys={['E']} description="Export dropdown menu" />
              <ShortcutRow keys={['P']} description="Print mission report" />
              <ShortcutRow keys={['?']} description="Show this help modal" />
              <ShortcutRow keys={['Esc']} description="Close modal / Clear search" />
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-500 text-center">Press the keys to trigger actions</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Production Health */}
        <div className="col-span-4">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              PRODUCTION HEALTH
            </h3>
            <div className="text-center py-8">
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke="url(#grad)" 
                    strokeWidth="12" 
                    fill="none" 
                    strokeDasharray="440" 
                    strokeDashoffset={440 - (440 * productionHealth / 100)} 
                    strokeLinecap="round" 
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text">
                    {productionHealth}%
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-emerald-400 font-bold">{data?.production.scenes.completed ?? 0}</p>
                  <p className="text-xs text-slate-500">Done</p>
                </div>
                <div>
                  <p className="text-amber-400 font-bold">{data?.production.scenes.total ?? 0}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">{data?.production.scenes.remaining ?? 0}</p>
                  <p className="text-xs text-slate-500">Left</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Budget Chart */}
        <div className="col-span-4">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              BUDGET BURN
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.weekly ?? FALLBACK_DATA.weekly}>
                  <defs>
                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v/1000}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="budget" stroke="#10b981" fill="url(#budgetGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <p className="text-slate-500">Spent</p>
                <p className="text-emerald-400 font-bold">{formatCurrency(data?.production.budget.spent ?? 0)}</p>
              </div>
              <div>
                <p className="text-slate-500">Remaining</p>
                <p className="text-cyan-400 font-bold">{formatCurrency(data?.production.budget.remaining ?? 0)}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Budget</p>
                <p className="text-white font-bold">{formatCurrency(data?.production.budget.total ?? 0)}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Scene Progress */}
        <div className="col-span-4">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Film className="w-5 h-5 text-violet-400" />
              SCENE PROGRESS
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Today's Stats */}
        <div className="col-span-3">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              TODAY'S PULSE
            </h3>
            <div className="space-y-3">
              <PulseItem 
                label="Scenes Shot" 
                value={`${data?.today.scenesShot ?? 0}/${data?.today.scenesPlanned ?? 0}`} 
                icon={Film} 
                color="violet" 
              />
              <PulseItem 
                label="Crew Present" 
                value={`${data?.today.crewPresent ?? 0}/${data?.today.crewTotal ?? 0}`} 
                icon={Users} 
                color="cyan" 
              />
              <PulseItem 
                label="Hours Left" 
                value={String(data?.today.hoursRemaining ?? 8)} 
                icon={Clock} 
                color="emerald" 
              />
            </div>
          </GlassCard>
        </div>

        {/* Risk Alerts */}
        <div className="col-span-5">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              RISK ALERTS
            </h3>
            <div className="space-y-2">
              {sortedRisks && sortedRisks.length > 0 ? (
                sortedRisks.map((risk, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    risk.level === 'high' ? 'bg-rose-500/10 border-rose-500/30' :
                    risk.level === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-slate-500/10 border-slate-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 ${
                          risk.level === 'high' ? 'text-rose-400' :
                          risk.level === 'medium' ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                        <span className="font-medium">{risk.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        risk.level === 'high' ? 'bg-rose-500/20 text-rose-400' :
                        risk.level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{risk.daysLeft} days</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>No active risks - production is on track!</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Department Health */}
        <div className="col-span-4">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              DEPT HEALTH
            </h3>
            <div className="space-y-2">
              {sortedDepartments && sortedDepartments.length > 0 ? (
                sortedDepartments.slice(0, 5).map((dept, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{dept.name}</span>
                      <span className={`font-bold ${
                        dept.health >= 90 ? 'text-emerald-400' :
                        dept.health >= 70 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{dept.health}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        dept.health >= 90 ? 'bg-emerald-500' :
                        dept.health >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} style={{ width: `${dept.health}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <p>No crew departments yet</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Weekly Chart */}
        <div className="col-span-8">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              WEEKLY PERFORMANCE
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weekly ?? FALLBACK_DATA.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [name === 'budget' ? formatCurrency(value) : value, name === 'budget' ? 'Budget' : 'Scenes']}
                  />
                  <Legend />
                  <Bar dataKey="scenes" fill="#8b5cf6" name="Scenes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" fill="#06b6d4" name="Budget (₹)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Locations */}
        <div className="col-span-4">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              LOCATION PROGRESS
            </h3>
            <div className="space-y-2">
              {sortedLocations && sortedLocations.length > 0 ? (
                sortedLocations.slice(0, 4).map((loc, i) => (
                  <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-cyan-400">{loc.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${loc.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{loc.scenes} scenes</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>No locations yet</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Summary Stats */}
        <div className="col-span-12">
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              PRODUCTION SUMMARY
            </h3>
            <div className="grid grid-cols-6 gap-4">
              <SummaryItem label="Scripts" value={data?.summary.totalScripts ?? 0} icon={FileText} />
              <SummaryItem label="Characters" value={data?.summary.totalCharacters ?? 0} icon={Users} />
              <SummaryItem label="Crew" value={data?.summary.totalCrew ?? 0} icon={Users} />
              <SummaryItem label="Locations" value={data?.summary.totalLocations ?? 0} icon={MapPin} />
              <SummaryItem label="Shoot Days" value={data?.summary.totalShootingDays ?? 0} icon={Calendar} />
              <SummaryItem label="Budget" value={data?.production.budget.total ?? 0} icon={DollarSign} format="currency" />
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
      {children}
    </div>
  )
}

function PulseItem({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colorMap: Record<string, string> = { violet: 'text-violet-400 bg-violet-500/20', cyan: 'text-cyan-400 bg-cyan-500/20', emerald: 'text-emerald-400 bg-emerald-500/20' }
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}><Icon className="w-4 h-4" /></div>
        <span className="text-slate-400">{label}</span>
      </div>
      <span className="font-bold text-lg">{value}</span>
    </div>
  )
}

function SummaryItem({ label, value, icon: Icon, format }: { label: string; value: number; icon: any; format?: string }) {
  const displayValue = format === 'currency' 
    ? (value >= 10000000 ? `₹${(value / 10000000).toFixed(1)}Cr` : value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${value}`)
    : value
    
  return (
    <div className="text-center p-4 bg-slate-800/50 rounded-xl">
      <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
      <p className="text-2xl font-bold">{displayValue}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string[], description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors">
      <span className="text-slate-300">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm font-mono text-cyan-400">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
