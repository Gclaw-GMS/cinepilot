'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  Calendar, RefreshCw, AlertTriangle, CheckCircle, Clock, 
  MapPin, Sun, Moon, Film, Zap, TrendingUp, LayoutGrid, Search, Keyboard, Copy, Check, Download, Filter, Printer, AlertCircle
} from 'lucide-react'

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
  locationId: string | null
  location?: { name: string } | null
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

interface ScheduleStats {
  totalDays: number
  totalHours: number
  totalScenes: number
}

// Demo data for when no real data exists
const DEMO_SHOOTING_DAYS: ShootingDayData[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    scheduledDate: '2026-03-15',
    callTime: '06:00',
    estimatedHours: '11',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-1',
    location: { name: 'KAPALEESHWARAR TEMPLE' },
    dayScenes: [
      { id: 'ds-1', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's1', sceneNumber: '1', headingRaw: 'EXT. TEMPLE - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'KAPALEESHWARAR TEMPLE' }},
      { id: 'ds-2', orderNumber: 2, estimatedMinutes: 30, scene: { id: 's2', sceneNumber: '2', headingRaw: 'EXT. TEMPLE COURTYARD - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'KAPALEESHWARAR TEMPLE' }},
      { id: 'ds-3', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's3', sceneNumber: '3', headingRaw: 'INT. TEMPLE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'KAPALEESHWARAR TEMPLE' }},
    ]
  },
  {
    id: 'day-2',
    dayNumber: 2,
    scheduledDate: '2026-03-16',
    callTime: '07:00',
    estimatedHours: '10',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-2',
    location: { name: 'MARINA BEACH' },
    dayScenes: [
      { id: 'ds-4', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's4', sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNRISE', intExt: 'EXT', timeOfDay: 'DAWN', location: 'MARINA BEACH' }},
      { id: 'ds-5', orderNumber: 2, estimatedMinutes: 30, scene: { id: 's5', sceneNumber: '6', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'MARINA BEACH' }},
      { id: 'ds-6', orderNumber: 3, estimatedMinutes: 90, scene: { id: 's6', sceneNumber: '7', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'MARINA BEACH' }},
    ]
  },
  {
    id: 'day-3',
    dayNumber: 3,
    scheduledDate: '2026-03-17',
    callTime: '18:00',
    estimatedHours: '8',
    notes: 'Night shoot - pack warm',
    status: 'scheduled',
    locationId: 'loc-3',
    location: { name: 'CHENNAI POLICE STATION' },
    dayScenes: [
      { id: 'ds-7', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's7', sceneNumber: '12', headingRaw: 'EXT. POLICE STATION - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'CHENNAI POLICE STATION' }},
      { id: 'ds-8', orderNumber: 2, estimatedMinutes: 45, scene: { id: 's8', sceneNumber: '13', headingRaw: 'INT. POLICE STATION - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'CHENNAI POLICE STATION' }},
    ]
  },
  {
    id: 'day-4',
    dayNumber: 4,
    scheduledDate: '2026-03-18',
    callTime: '06:00',
    estimatedHours: '12',
    notes: 'CRITICAL: Major action sequence',
    status: 'scheduled',
    locationId: 'loc-4',
    location: { name: 'WAREHOUSE DISTRICT' },
    dayScenes: [
      { id: 'ds-9', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's9', sceneNumber: '15', headingRaw: 'EXT. WAREHOUSE - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
      { id: 'ds-10', orderNumber: 2, estimatedMinutes: 120, scene: { id: 's10', sceneNumber: '16', headingRaw: 'INT. WAREHOUSE - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
      { id: 'ds-11', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's11', sceneNumber: '17', headingRaw: 'EXT. WAREHOUSE ROOFTOP - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'WAREHOUSE DISTRICT' }},
    ]
  },
  {
    id: 'day-5',
    dayNumber: 5,
    scheduledDate: '2026-03-19',
    callTime: '08:00',
    estimatedHours: '9',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-5',
    location: { name: 'RAVI\'S HOUSE' },
    dayScenes: [
      { id: 'ds-12', orderNumber: 1, estimatedMinutes: 45, scene: { id: 's12', sceneNumber: '20', headingRaw: 'INT. RAVI\'S HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
      { id: 'ds-13', orderNumber: 2, estimatedMinutes: 60, scene: { id: 's13', sceneNumber: '21', headingRaw: 'EXT. RAVI\'S HOUSE - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
      { id: 'ds-14', orderNumber: 3, estimatedMinutes: 30, scene: { id: 's14', sceneNumber: '22', headingRaw: 'INT. RAVI\'S BEDROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'RAVI\'S HOUSE' }},
    ]
  },
  {
    id: 'day-6',
    dayNumber: 6,
    scheduledDate: '2026-03-20',
    callTime: '19:00',
    estimatedHours: '7',
    notes: 'Emotional scene - allow extra time',
    status: 'scheduled',
    locationId: 'loc-6',
    location: { name: 'DIVYA\'S APARTMENT' },
    dayScenes: [
      { id: 'ds-15', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's15', sceneNumber: '25', headingRaw: 'INT. DIVYA\'S APARTMENT - NIGHT', intExt: 'INT', timeOfDay: 'NIGHT', location: 'DIVYA\'S APARTMENT' }},
      { id: 'ds-16', orderNumber: 2, estimatedMinutes: 45, scene: { id: 's16', sceneNumber: '26', headingRaw: 'EXT. DIVYA\'S BALCONY - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'DIVYA\'S APARTMENT' }},
    ]
  },
  {
    id: 'day-7',
    dayNumber: 7,
    scheduledDate: '2026-03-21',
    callTime: '06:00',
    estimatedHours: '10',
    notes: null,
    status: 'scheduled',
    locationId: 'loc-7',
    location: { name: 'COURTROOM' },
    dayScenes: [
      { id: 'ds-17', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's17', sceneNumber: '30', headingRaw: 'INT. COURTROOM - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURTROOM' }},
      { id: 'ds-18', orderNumber: 2, estimatedMinutes: 60, scene: { id: 's18', sceneNumber: '31', headingRaw: 'EXT. COURTROOM - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'COURTROOM' }},
    ]
  },
  {
    id: 'day-8',
    dayNumber: 8,
    scheduledDate: '2026-03-22',
    callTime: '18:00',
    estimatedHours: '9',
    notes: 'Final climax - critical day',
    status: 'scheduled',
    locationId: 'loc-8',
    location: { name: 'STADIUM' },
    dayScenes: [
      { id: 'ds-19', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's19', sceneNumber: '40', headingRaw: 'EXT. STADIUM - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'STADIUM' }},
      { id: 'ds-20', orderNumber: 2, estimatedMinutes: 120, scene: { id: 's20', sceneNumber: '41', headingRaw: 'EXT. STADIUM - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'STADIUM' }},
      { id: 'ds-21', orderNumber: 3, estimatedMinutes: 60, scene: { id: 's21', sceneNumber: '42', headingRaw: 'EXT. STADIUM - DAWN', intExt: 'EXT', timeOfDay: 'DAWN', location: 'STADIUM' }},
    ]
  },
]

const DEMO_VERSIONS: VersionData[] = [
  { id: 'v3', versionNum: 3, label: 'Final', score: 94, isActive: true, createdAt: '2026-02-28T10:00:00Z' },
  { id: 'v2', versionNum: 2, label: 'Weather Backup', score: 88, isActive: false, createdAt: '2026-02-25T14:30:00Z' },
  { id: 'v1', versionNum: 1, label: 'Initial', score: 76, isActive: false, createdAt: '2026-02-20T09:15:00Z' },
]

const DEMO_STATS: ScheduleStats = { totalDays: 8, totalHours: 76, totalScenes: 21 }

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

const MODES = [
  { key: 'balanced', label: 'Balanced', desc: 'Default optimization' },
  { key: 'fast', label: 'Fast', desc: 'Minimal optimization, quick result' },
  { key: 'cost_minimum', label: 'Cost Minimum', desc: 'Minimize location moves' },
  { key: 'travel_minimum', label: 'Travel Minimum', desc: 'Cluster by location' },
  { key: 'weather_safe', label: 'Weather Safe', desc: 'Prioritize indoor scenes' },
]

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400', icon: Calendar },
  'in-progress': { label: 'In Progress', color: 'bg-amber-500/20 text-amber-400', icon: Zap },
  completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  delayed: { label: 'Delayed', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
}

interface SchedulePageProps {
  initialData?: {
    shootingDays: ShootingDayData[]
    versions: VersionData[]
    stats: ScheduleStats
  }
}

export default function SchedulePage() {
  const [shootingDays, setShootingDays] = useState<ShootingDayData[]>([])
  const [versions, setVersions] = useState<VersionData[]>([])
  const [stats, setStats] = useState<ScheduleStats>({ totalDays: 0, totalHours: 0, totalScenes: 0 })
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'chart' | 'conflicts'>('timeline')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'dayNumber' | 'date' | 'location' | 'status' | 'scenes' | 'hours'>('dayNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Sort options
  const sortOptions = [
    { value: 'dayNumber', label: 'Day Number' },
    { value: 'date', label: 'Date' },
    { value: 'location', label: 'Location' },
    { value: 'status', label: 'Status' },
    { value: 'scenes', label: 'Scenes' },
    { value: 'hours', label: 'Hours' },
  ]
  
  // Calculate active filter count (including sort)
  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (filterLocation !== 'all' ? 1 : 0) + (sortBy !== 'dayNumber' || sortOrder !== 'asc' ? 1 : 0)
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const handlePrintRef = useRef<() => void>(() => {})
  const handleOptimizeRef = useRef<() => void>(() => {})
  const fetchDataRef = useRef<() => void>(() => {})
  const shootingDaysRef = useRef<ShootingDayData[]>([])
  const filteredShootingDaysRef = useRef<ShootingDayData[]>([])
  const handleExportMarkdownRef = useRef<() => void>(() => {})
  const filterStatusRef = useRef<string>('all')
  const filterLocationRef = useRef<string>('all')
  const uniqueLocationsRef = useRef<string[]>([])

  const [mode, setMode] = useState('balanced')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/schedule')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      
      // Use real data if available, otherwise use demo data
      if (data.shootingDays && data.shootingDays.length > 0) {
        setShootingDays(data.shootingDays || [])
        setVersions(data.versions || [])
        setStats(data.stats || { totalDays: 0, totalHours: 0, totalScenes: 0 })
        setIsDemoMode(false)
      } else {
        // Use demo data when no real data exists
        setShootingDays(DEMO_SHOOTING_DAYS)
        setVersions(DEMO_VERSIONS)
        setStats(DEMO_STATS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.error('Schedule fetch error:', e)
      // Use demo data on error for better UX
      setShootingDays(DEMO_SHOOTING_DAYS)
      setVersions(DEMO_VERSIONS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchData() 
  }, [fetchData])

  // Update refs when functions change
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  // Update data refs when they change
  useEffect(() => {
    shootingDaysRef.current = shootingDays
  }, [shootingDays])

  // Update filtered ref when shooting days change (filtered is derived from shootingDays)
  useEffect(() => {
    filteredShootingDaysRef.current = filteredShootingDays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shootingDays])

  // Keep filter refs in sync with state for keyboard shortcuts
  useEffect(() => {
    filterStatusRef.current = filterStatus
  }, [filterStatus])

  useEffect(() => {
    filterLocationRef.current = filterLocation
  }, [filterLocation])

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
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '0':
          e.preventDefault()
          setFilterStatus('all')
          break
        case '1':
          e.preventDefault()
          setFilterStatus(filterStatusRef.current === 'scheduled' ? 'all' : 'scheduled')
          break
        case '2':
          e.preventDefault()
          setFilterStatus(filterStatusRef.current === 'in-progress' ? 'all' : 'in-progress')
          break
        case '3':
          e.preventDefault()
          setFilterStatus(filterStatusRef.current === 'completed' ? 'all' : 'completed')
          break
        case '4':
          e.preventDefault()
          setFilterStatus(filterStatusRef.current === 'delayed' ? 'all' : 'delayed')
          break
        case 't':
          e.preventDefault()
          setViewMode('timeline')
          break
        case 'c':
          if (!e.shiftKey) {
            e.preventDefault()
            setViewMode('chart')
          }
          break
        case 'k':
          e.preventDefault()
          setViewMode('conflicts')
          break
        case 'o':
          e.preventDefault()
          handleOptimizeRef.current?.()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setSearchQuery('')
          setShowFilters(false)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          handleExportMarkdownRef.current?.()
          break
        case 'p':
          e.preventDefault()
          handlePrintRef.current?.()
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
      }
      
      // Shift + number keys for location filter
      if (e.shiftKey) {
        const locationIndex = parseInt(e.key) - 1
        if (locationIndex >= 0 && locationIndex <= 9) {
          e.preventDefault()
          const locations = uniqueLocationsRef.current
          if (locations && locations.length > locationIndex) {
            const selectedLocation = locations[locationIndex]
            setFilterLocation(filterLocationRef.current === selectedLocation ? 'all' : selectedLocation)
          } else if (locationIndex === 0) {
            setFilterLocation('all')
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu, print menu, and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showExportMenu && !target.closest('.export-menu')) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    
    if (showExportMenu || showPrintMenu || showFilters) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu, showPrintMenu, showFilters])

  // Export functions
  const handleExportCSV = () => {
    setExporting(true)
    setShowExportMenu(false)
    
    const headers = ['Day', 'Date', 'Location', 'Status', 'Scenes', 'Call Time', 'Hours']
    const rows = filteredShootingDays.map(day => [
      day.dayNumber,
      day.scheduledDate || '',
      day.location?.name || 'TBD',
      day.status,
      day.dayScenes.map(ds => ds.scene.sceneNumber).join('; '),
      day.callTime || '',
      day.estimatedHours || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleExportJSON = () => {
    setExporting(true)
    setShowExportMenu(false)
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalDays: shootingDays.length,
      stats,
      sortInfo: {
        sortBy,
        sortOrder,
      },
      filterInfo: {
        filterStatus,
        filterLocation,
        searchQuery,
      },
      shootingDays: filteredShootingDays.map(day => ({
        dayNumber: day.dayNumber,
        date: day.scheduledDate,
        callTime: day.callTime,
        estimatedHours: day.estimatedHours,
        status: day.status,
        location: day.location?.name,
        scenes: day.dayScenes.map(ds => ({
          sceneNumber: ds.scene.sceneNumber,
          heading: ds.scene.headingRaw,
          intExt: ds.scene.intExt,
          timeOfDay: ds.scene.timeOfDay,
          location: ds.scene.location,
          duration: ds.estimatedMinutes
        }))
      }))
    }
    
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  // Markdown export function
  const handleExportMarkdown = useCallback(() => {
    const currentShootingDays = shootingDaysRef.current
    const currentFilteredDays = filteredShootingDaysRef.current
    
    if (currentFilteredDays.length === 0) return

    // Build summary statistics
    const byStatus: Record<string, number> = {}
    const byLocation: Record<string, number> = {}
    const totalScenes = currentFilteredDays.reduce((sum, d) => sum + d.dayScenes.length, 0)
    const totalHours = currentFilteredDays.reduce((sum, d) => sum + parseFloat(d.estimatedHours || '0'), 0)
    
    currentFilteredDays.forEach(day => {
      byStatus[day.status] = (byStatus[day.status] || 0) + 1
      const loc = day.location?.name || 'TBD'
      byLocation[loc] = (byLocation[loc] || 0) + 1
    })

    // Build markdown content
    let markdown = `# CinePilot Schedule Report

**Generated:** ${new Date().toISOString().split('T')[0]}

## Summary

- **Total Shooting Days:** ${currentShootingDays.length}
- **Filtered Days:** ${currentFilteredDays.length}
- **Total Scenes:** ${totalScenes}
- **Total Estimated Hours:** ${totalHours}
- **Completed:** ${byStatus.completed || 0}
- **In Progress:** ${byStatus.in_progress || 0}
- **Scheduled:** ${byStatus.scheduled || 0}
- **Delayed:** ${byStatus.delayed || 0}

### By Status

| Status | Count |
|--------|-------|
`
    Object.entries(byStatus).forEach(([status, count]) => {
      const emoji = status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : status === 'delayed' ? '⚠️' : '📅'
      markdown += `| ${emoji} ${status.replace('_', ' ')} | ${count} |\n`
    })

    markdown += `
### By Location

| Location | Days |
|----------|------|
`
    Object.entries(byLocation).forEach(([location, count]) => {
      markdown += `| ${location} | ${count} |\n`
    })

    markdown += `
---

## Shooting Days Detail

| Day | Date | Location | Call Time | Hours | Status | Scenes |
|-----|------|----------|-----------|-------|--------|--------|
`
    currentFilteredDays.forEach(day => {
      const statusEmoji = day.status === 'completed' ? '✅' : day.status === 'in_progress' ? '🔄' : day.status === 'delayed' ? '⚠️' : '📅'
      const sceneNumbers = day.dayScenes.map(ds => ds.scene.sceneNumber).join(', ')
      markdown += `| ${day.dayNumber} | ${day.scheduledDate || '-'} | ${day.location?.name || 'TBD'} | ${day.callTime || '-'} | ${day.estimatedHours || '-'} | ${statusEmoji} ${day.status.replace('_', ' ')} | ${sceneNumbers} |\n`
    })

    markdown += `
---

## Scene Details

`
    currentFilteredDays.forEach(day => {
      if (day.dayScenes.length > 0) {
        markdown += `### Day ${day.dayNumber} - ${day.location?.name || 'TBD'} (${day.scheduledDate || 'TBD'})\n\n`
        markdown += `| Scene | Heading | INT/EXT | Time | Duration |\n`
        markdown += `|-------|---------|---------|------|----------|\n`
        day.dayScenes.forEach(ds => {
          const duration = ds.estimatedMinutes ? `${ds.estimatedMinutes} min` : '-'
          markdown += `| ${ds.scene.sceneNumber} | ${ds.scene.headingRaw || '-'} | ${ds.scene.intExt || '-'} | ${ds.scene.timeOfDay || '-'} | ${duration} |\n`
        })
        markdown += '\n'
      }
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schedule-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [])

  const handlePrint = useCallback(() => {
    const currentShootingDays = shootingDaysRef.current
    const currentFilteredDays = filteredShootingDaysRef.current
    
    const stats = {
      totalDays: currentShootingDays.length,
      completed: currentShootingDays.filter(d => d.status === 'completed').length,
      inProgress: currentShootingDays.filter(d => d.status === 'in_progress').length,
      scheduled: currentShootingDays.filter(d => d.status === 'scheduled').length,
      delayed: currentShootingDays.filter(d => d.status === 'delayed').length,
      totalScenes: currentShootingDays.reduce((sum, d) => sum + d.dayScenes.length, 0),
    }

    const statsHtml = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1a1a2e;">Schedule Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
          <div><strong>Total Days:</strong> ${stats.totalDays}</div>
          <div><strong>Total Scenes:</strong> ${stats.totalScenes}</div>
          <div><strong>Completed:</strong> ${stats.completed}</div>
          <div><strong>Scheduled:</strong> ${stats.scheduled}</div>
        </div>
      </div>
    `
    
    const tableRows = currentFilteredDays.map((day, i) => {
      const statusColors: Record<string, string> = {
        completed: '#22c55e',
        in_progress: '#3b82f6',
        scheduled: '#f59e0b',
        delayed: '#ef4444',
      }
      const statusColor = statusColors[day.status] || '#64748b'
      
      return `
        <tr style="${i % 2 === 0 ? 'background: #f9fafb;' : ''}">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.dayNumber}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.scheduledDate ? new Date(day.scheduledDate).toLocaleDateString('en-IN') : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.location?.name || 'TBD'}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.callTime || '-'}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.estimatedHours || '-'}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${day.dayScenes.length}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;"><span style="background: ${statusColor}20; color: ${statusColor}; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${day.status.replace('_', ' ').toUpperCase()}</span></td>
        </tr>
        ${day.dayScenes.length > 0 ? `
          <tr>
            <td colspan="7" style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #f8fafc;">
              <strong>Scenes:</strong> ${day.dayScenes.map(ds => `${ds.scene.sceneNumber}: ${ds.scene.headingRaw || 'Unknown'}`).join(', ')}
            </td>
          </tr>
        ` : ''}
      `
    }).join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shooting Schedule - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #1a1a2e; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f8f9fa; font-weight: 600; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Shooting Schedule</h1>
          <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
          ${statsHtml}
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Location</th>
                <th>Call Time</th>
                <th>Est. Hours</th>
                <th>Scenes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.print()
    
    setShowPrintMenu(false)
  }, [])

  const handleOptimize = useCallback(async () => {
    setOptimizing(true)
    setError(null)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', startDate, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Optimization failed')
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOptimizing(false)
    }
  }, [fetchData, startDate, mode])

  // Update refs when functions change
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  useEffect(() => {
    handleOptimizeRef.current = handleOptimize
  }, [handleOptimize])

  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  // Copy schedule to clipboard
  const handleCopyToClipboard = async () => {
    if (shootingDays.length === 0) return
    
    const scheduleText = shootingDays.map(day => {
      const date = day.scheduledDate ? new Date(day.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${day.dayNumber}`
      const scenes = day.dayScenes.map(ds => `  ${ds.orderNumber}. ${ds.scene.sceneNumber}: ${ds.scene.headingRaw || 'Unknown'} (${ds.scene.timeOfDay || '?'}) - ${ds.scene.location || 'Unknown Location'}`).join('\n')
      return `DAY ${day.dayNumber} - ${date}\nLocation: ${day.location?.name || 'TBD'}\nCall Time: ${day.callTime || 'TBD'}\nEst. Hours: ${day.estimatedHours || '?'}\n\nScenes:\n${scenes}\n`
    }).join('\n' + '='.repeat(50) + '\n\n')

    const header = `SHOOTING SCHEDULE - ${isDemoMode ? 'DEMO' : 'CinePilot'}\nGenerated: ${new Date().toLocaleString()}\nTotal Days: ${shootingDays.length}\n\n${'='.repeat(50)}\n\n`
    
    try {
      await navigator.clipboard.writeText(header + scheduleText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      setError('Failed to copy to clipboard')
    }
  }

  // Compute chart data
  const chartData = useMemo(() => {
    return shootingDays.map(day => {
      const hours = Number(day.estimatedHours || 0)
      const scenes = day.dayScenes.length
      const intScenes = day.dayScenes.filter(ds => ds.scene.intExt === 'INT').length
      const extScenes = day.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length
      const nightScenes = day.dayScenes.filter(ds => ds.scene.timeOfDay === 'NIGHT').length
      
      return {
        day: `D${day.dayNumber}`,
        fullDate: day.scheduledDate,
        scenes,
        hours: Math.round(hours * 10) / 10,
        intScenes,
        extScenes,
        nightScenes,
        utilization: Math.round((hours / 12) * 100),
      }
    })
  }, [shootingDays])

  // Pie chart data for int/ext
  const pieData = useMemo(() => {
    const intCount = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'INT').length, 0)
    const extCount = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length, 0)
    return [
      { name: 'Interior', value: intCount, color: COLORS.info },
      { name: 'Exterior', value: extCount, color: COLORS.warning },
    ].filter(d => d.value > 0)
  }, [shootingDays])

  // Location breakdown
  const locationData = useMemo(() => {
    const locMap = new Map<string, { scenes: number; hours: number; days: number }>()
    shootingDays.forEach(day => {
      const locName = day.location?.name || 'Unknown'
      const existing = locMap.get(locName) || { scenes: 0, hours: 0, days: 0 }
      existing.scenes += day.dayScenes.length
      existing.hours += Number(day.estimatedHours || 0)
      existing.days += 1
      locMap.set(locName, existing)
    })
    return Array.from(locMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.scenes - a.scenes)
  }, [shootingDays])

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    shootingDays.forEach(day => {
      if (day.location?.name) {
        locations.add(day.location.name)
      }
    })
    return Array.from(locations).sort()
  }, [shootingDays])

  // Keep unique locations ref in sync for keyboard shortcuts
  useEffect(() => {
    uniqueLocationsRef.current = uniqueLocations
  }, [uniqueLocations])

  // Filter shooting days by search query and filters
  const filteredShootingDays = useMemo(() => {
    let days = shootingDays
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      days = days.filter(day => 
        day.location?.name?.toLowerCase().includes(query) ||
        day.dayScenes.some(ds => 
          ds.scene.sceneNumber.toLowerCase().includes(query) ||
          ds.scene.headingRaw?.toLowerCase().includes(query) ||
          ds.scene.location?.toLowerCase().includes(query)
        )
      )
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      days = days.filter(day => day.status === filterStatus)
    }
    
    // Apply location filter
    if (filterLocation !== 'all') {
      days = days.filter(day => day.location?.name === filterLocation)
    }
    
    // Apply sorting
    const sortedDays = [...days].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'dayNumber':
          comparison = a.dayNumber - b.dayNumber
          break
        case 'date':
          const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
          const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
          comparison = dateA - dateB
          break
        case 'location':
          comparison = (a.location?.name || '').localeCompare(b.location?.name || '')
          break
        case 'status':
          const statusOrder = { delayed: 0, 'in-progress': 1, scheduled: 2, completed: 3 }
          comparison = (statusOrder[a.status as keyof typeof statusOrder] ?? 4) - (statusOrder[b.status as keyof typeof statusOrder] ?? 4)
          break
        case 'scenes':
          comparison = a.dayScenes.length - b.dayScenes.length
          break
        case 'hours':
          comparison = (Number(a.estimatedHours) || 0) - (Number(b.estimatedHours) || 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sortedDays
  }, [shootingDays, searchQuery, filterStatus, filterLocation, sortBy, sortOrder])

  // Night vs Day breakdown
  const dayNightData = useMemo(() => {
    const dayShoots = shootingDays.filter(d => 
      !d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
    ).length
    const nightShoots = shootingDays.filter(d => 
      d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
    ).length
    return [
      { name: 'Day Shoots', value: dayShoots, color: COLORS.warning },
      { name: 'Night Shoots', value: nightShoots, color: COLORS.secondary },
    ]
  }, [shootingDays])

  // Stats computation
  const computedStats = useMemo(() => {
    const totalHours = shootingDays.reduce((sum, d) => sum + Number(d.estimatedHours || 0), 0)
    const totalScenes = shootingDays.reduce((sum, d) => sum + d.dayScenes.length, 0)
    const avgHoursPerDay = shootingDays.length > 0 ? totalHours / shootingDays.length : 0
    const overtimeDays = shootingDays.filter(d => Number(d.estimatedHours || 0) > 10).length
    const nightShootDays = shootingDays.filter(d => 
      d.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')).length
    const intScenes = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'INT').length, 0)
    const extScenes = shootingDays.reduce((sum, d) => 
      sum + d.dayScenes.filter(ds => ds.scene.intExt === 'EXT').length, 0)
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      overtimeDays,
      nightShootDays,
      intScenes,
      extScenes,
    }
  }, [shootingDays])

  // Conflict detection logic
  interface ScheduleConflict {
    id: string
    type: 'overtime' | 'location' | 'day_change' | 'scene_gap' | 'late_call' | 'early_call'
    severity: 'high' | 'medium' | 'low'
    dayNumber: number
    title: string
    description: string
    recommendation: string
  }

  const scheduleConflicts = useMemo((): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = []
    
    shootingDays.forEach(day => {
      // Overtime detection (>10 hours)
      const hours = Number(day.estimatedHours || 0)
      if (hours > 10) {
        conflicts.push({
          id: `overtime-${day.id}`,
          type: 'overtime',
          severity: hours > 12 ? 'high' : 'medium',
          dayNumber: day.dayNumber,
          title: 'Overtime Scheduled',
          description: `Day ${day.dayNumber} is scheduled for ${hours} hours, which exceeds the standard 10-hour workday.`,
          recommendation: 'Consider splitting scenes across multiple days or hiring additional crew for support.'
        })
      }

      // Late call time detection (after 10 AM)
      if (day.callTime) {
        const [hours] = day.callTime.split(':').map(Number)
        if (hours >= 14) { // 2 PM or later
          conflicts.push({
            id: `late-call-${day.id}`,
            type: 'late_call',
            severity: 'low',
            dayNumber: day.dayNumber,
            title: 'Late Call Time',
            description: `Day ${day.dayNumber} call time is ${day.callTime}, which may impact the shooting schedule.`,
            recommendation: 'Ensure equipment is prepped the night before to maximize shooting time.'
          })
        }
        if (hours < 5) { // Before 5 AM
          conflicts.push({
            id: `early-call-${day.id}`,
            type: 'early_call',
            severity: hours < 4 ? 'high' : 'medium',
            dayNumber: day.dayNumber,
            title: 'Early Morning Call',
            description: `Day ${day.dayNumber} call time is ${day.callTime}, requiring early crew call.`,
            recommendation: 'Ensure crew accommodation is close to location or arrange transport.'
          })
        }
      }

      // Location change detection (multiple locations in one day)
      const locations = new Set(day.dayScenes.map(ds => ds.scene.location).filter(Boolean))
      if (locations.size > 2) {
        conflicts.push({
          id: `location-${day.id}`,
          type: 'location',
          severity: locations.size > 3 ? 'high' : 'medium',
          dayNumber: day.dayNumber,
          title: 'Multiple Location Changes',
          description: `Day ${day.dayNumber} has scenes at ${locations.size} different locations.`,
          recommendation: 'Group scenes by location and shoot in geographic order to minimize travel time.'
        })
      }

      // Night-to-day transition detection
      const timeOfDaySet = new Set(day.dayScenes.map(ds => ds.scene.timeOfDay).filter(Boolean))
      if (timeOfDaySet.has('NIGHT') && timeOfDaySet.has('DAY')) {
        conflicts.push({
          id: `day-change-${day.id}`,
          type: 'day_change',
          severity: 'medium',
          dayNumber: day.dayNumber,
          title: 'Day/Night Transition',
          description: `Day ${day.dayNumber} has both DAY and NIGHT scenes, requiring lighting changes.`,
          recommendation: 'Schedule DAY scenes first, then break for NIGHT setup to maximize efficiency.'
        })
      }

      // Scene gap detection
      const totalMinutes = day.dayScenes.reduce((sum, ds) => sum + (ds.estimatedMinutes || 0), 0)
      if (totalMinutes > hours * 50) { // More scenes than reasonable hours can accommodate
        conflicts.push({
          id: `scene-gap-${day.id}`,
          type: 'scene_gap',
          severity: 'high',
          dayNumber: day.dayNumber,
          title: 'Unrealistic Schedule',
          description: `Day ${day.dayNumber} has ${day.dayScenes.length} scenes totaling ~${totalMinutes} minutes (${Math.round(totalMinutes/60)} hours), but only ${hours} hours allocated.`,
          recommendation: 'Reduce scene count or extend the estimated hours for this day.'
        })
      }
    })

    // Check for consecutive night shoots (crew fatigue)
    let nightStreak = 0
    shootingDays.forEach(day => {
      const hasNight = day.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT')
      if (hasNight) {
        nightStreak++
        if (nightStreak >= 3) {
          conflicts.push({
            id: `fatigue-${day.id}`,
            type: 'overtime',
            severity: 'high',
            dayNumber: day.dayNumber,
            title: 'Crew Fatigue Risk',
            description: `This is the ${nightStreak}th consecutive night shoot, increasing fatigue risk.`,
            recommendation: 'Consider scheduling a rest day or daytime-only shoot after 3 consecutive night shoots.'
          })
        }
      } else {
        nightStreak = 0
      }
    })

    return conflicts
  }, [shootingDays])

  // Conflict stats
  const conflictStats = useMemo(() => {
    return {
      total: scheduleConflicts.length,
      high: scheduleConflicts.filter(c => c.severity === 'high').length,
      medium: scheduleConflicts.filter(c => c.severity === 'medium').length,
      low: scheduleConflicts.filter(c => c.severity === 'low').length,
    }
  }, [scheduleConflicts])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getStatusConfig = (status: string) => STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400">Loading schedule...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-400" />
              Schedule Engine
            </h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">AI-powered shooting schedule with TFPC compliance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 inline-block mr-1.5" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'chart' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline-block mr-1.5" />
              Analytics
            </button>
            <button
              onClick={() => setViewMode('conflicts')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'conflicts' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline-block mr-1.5" />
              Conflicts
              {conflictStats.high > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {conflictStats.high}
                </span>
              )}
            </button>
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Toggle Filters (F)"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Copy to Clipboard Button */}
          <button
            onClick={handleCopyToClipboard}
            disabled={shootingDays.length === 0}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title="Copy Schedule to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm text-white flex items-center gap-2 transition-colors"
              title="Export Schedule (E)"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
            {/* Export Dropdown */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={handleExportMarkdownRef.current}
                  className="w-full px-4 py-2 text-left text-sm text-cyan-400 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Markdown
                </button>
              </div>
            )}
          </div>
          {/* Print Button */}
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 flex items-center gap-2 transition-colors"
              title="Print Schedule (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {/* Print Dropdown */}
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Schedule
                </button>
              </div>
            )}
          </div>
          {/* Keyboard Help Button */}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Sort Panel */}
      {showFilters && (
        <div 
          ref={filterPanelRef}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-gray-300">Filters & Sort:</span>
            </div>
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                sortBy !== 'dayNumber' || sortOrder !== 'asc'
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Sort Order (S)"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
            <div className="w-px h-6 bg-gray-600" />
            {/* Filter Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Status (0)</option>
                <option value="scheduled">Scheduled (1)</option>
                <option value="in-progress">In Progress (2)</option>
                <option value="completed">Completed (3)</option>
                <option value="delayed">Delayed (4)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Location:</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Locations (⇧0)</option>
                {uniqueLocations.map((loc, idx) => (
                  <option key={loc} value={loc}>{loc} (⇧{idx + 1})</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { 
                setFilterStatus('all'); 
                setFilterLocation('all');
                setSortBy('dayNumber');
                setSortOrder('asc');
              }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters & Sort
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-red-400 font-medium">Schedule Error</div>
            <div className="text-red-300/70 text-sm mt-0.5">{error}</div>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Mode:</label>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)} 
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {MODES.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleOptimize} 
            disabled={optimizing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-white flex items-center gap-2 transition-colors"
          >
            {optimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Schedule
              </>
            )}
          </button>
          <button 
            onClick={fetchData}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Shoot Days
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalDays}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Total Hours
          </div>
          <div className="text-2xl font-bold text-indigo-400">{computedStats.totalHours}h</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Film className="w-3.5 h-3.5" />
            Scenes
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalScenes}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Avg/Day
          </div>
          <div className="text-2xl font-bold text-amber-400">{computedStats.avgHoursPerDay}h</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Sun className="w-3.5 h-3.5" />
            Day Shoots
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalDays - computedStats.nightShootDays}</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Moon className="w-3.5 h-3.5" />
            Night Shoots
          </div>
          <div className="text-2xl font-bold text-purple-400">{computedStats.nightShootDays}</div>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && filteredShootingDays.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenes per Day Bar Chart */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Scenes & Hours per Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="scenes" name="Scenes" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="hours" name="Hours" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interior/Exterior Pie */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Interior vs Exterior</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Day vs Night Pie */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Day vs Night Shoots</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dayNightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} days`}
                >
                  {dayNightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Location Breakdown */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Location Breakdown</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {locationData.map((loc, idx) => (
                <div key={loc.name} className="flex items-center gap-3">
                  <div className="w-8 text-center text-xs font-bold text-indigo-400">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300 truncate">{loc.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{loc.days} days</span>
                      <span className="text-gray-600">•</span>
                      <span>{loc.scenes} scenes</span>
                      <span className="text-gray-600">•</span>
                      <span>{loc.hours}h</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(loc.scenes / Math.max(...locationData.map(l => l.scenes))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day Utilization Chart */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Day Utilization (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Utilization']}
                />
                <Bar dataKey="utilization" name="Utilization" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.utilization > 80 ? COLORS.danger : entry.utilization > 60 ? COLORS.warning : COLORS.success} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conflicts View */}
      {viewMode === 'conflicts' && (
        <div className="space-y-6">
          {/* Conflict Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Issues</p>
                  <p className="text-2xl font-semibold text-white mt-1">{conflictStats.total}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400 uppercase tracking-wider">High Priority</p>
                  <p className="text-2xl font-semibold text-red-400 mt-1">{conflictStats.high}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-400 uppercase tracking-wider">Medium</p>
                  <p className="text-2xl font-semibold text-amber-400 mt-1">{conflictStats.medium}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Low</p>
                  <p className="text-2xl font-semibold text-gray-400 mt-1">{conflictStats.low}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* All Clear State */}
          {scheduleConflicts.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">All Clear!</h3>
              <p className="text-gray-400">No scheduling conflicts detected. Your schedule looks good!</p>
            </div>
          ) : (
            /* Conflict List */
            <div className="space-y-4">
              {scheduleConflicts.map((conflict, idx) => (
                <div 
                  key={conflict.id}
                  className={`rounded-xl border p-4 ${
                    conflict.severity === 'high' 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : conflict.severity === 'medium'
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-gray-500/10 border-gray-500/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      conflict.severity === 'high' 
                        ? 'bg-red-500/20' 
                        : conflict.severity === 'medium'
                          ? 'bg-amber-500/20'
                          : 'bg-gray-500/20'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        conflict.severity === 'high' 
                          ? 'text-red-400' 
                          : conflict.severity === 'medium'
                            ? 'text-amber-400'
                            : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          conflict.severity === 'high' 
                            ? 'bg-red-500/20 text-red-400' 
                            : conflict.severity === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {conflict.severity}
                        </span>
                        <span className="text-xs text-gray-500">Day {conflict.dayNumber}</span>
                      </div>
                      <h4 className="text-white font-medium mb-1">{conflict.title}</h4>
                      <p className="text-sm text-gray-400 mb-2">{conflict.description}</p>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Recommendation:</p>
                        <p className="text-sm text-gray-300">{conflict.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version Info */}
      {versions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Versions:</span>
          {versions.map(v => (
            <div 
              key={v.id} 
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                v.isActive 
                  ? 'bg-indigo-900/40 border border-indigo-700/50 text-indigo-400' 
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {v.label || `v${v.versionNum}`}
              {v.score !== null && <span className="ml-1.5 text-gray-600">• {v.score}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        filteredShootingDays.length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? 'No Matching Days' : 'No Schedule Generated'}
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {searchQuery 
                ? 'No shooting days match your search. Try a different query.' 
                : 'Upload and parse a script first, then click "Optimize Schedule" to create your shooting plan with AI-powered scene clustering and TFPC compliance.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShootingDays.map(day => {
              const hours = Number(day.estimatedHours || 0)
              const utilizationPct = Math.min(100, (hours / 12) * 100)
              const isOvertime = hours > 10
              const isLight = hours < 6
              const StatusIcon = getStatusConfig(day.status).icon

              return (
                <div 
                  key={day.id} 
                  className="bg-gray-800/40 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
                >
                  {/* Day Header */}
                  <div className="px-5 py-4 bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-indigo-400 w-12">D{day.dayNumber}</span>
                        <div className="w-px h-6 bg-gray-700" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">{formatDate(day.scheduledDate)}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {day.callTime || '06:00'} call
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Time badges */}
                      <div className="flex items-center gap-2">
                        {day.dayScenes.some(ds => ds.scene.timeOfDay === 'NIGHT') ? (
                          <span className="px-2 py-1 bg-indigo-900/40 text-indigo-400 rounded text-xs flex items-center gap-1">
                            <Moon className="w-3 h-3" />
                            Night
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs flex items-center gap-1">
                            <Sun className="w-3 h-3" />
                            Day
                          </span>
                        )}
                      </div>

                      {/* Utilization bar */}
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Utilization</span>
                            <span className={isOvertime ? 'text-red-400' : isLight ? 'text-gray-400' : 'text-emerald-400'}>
                              {Math.round(utilizationPct)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isOvertime ? 'bg-red-500' : isLight ? 'bg-gray-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${utilizationPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className={`text-lg font-bold ${isOvertime ? 'text-red-400' : 'text-white'}`}>
                            {hours}h
                          </div>
                          <div className="text-xs text-gray-500">{day.dayScenes.length} scenes</div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                        getStatusConfig(day.status).color
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {getStatusConfig(day.status).label}
                      </div>
                    </div>
                  </div>

                  {/* Scenes List */}
                  <div className="divide-y divide-gray-800/50">
                    {day.dayScenes.map((ds, idx) => (
                      <div 
                        key={ds.id} 
                        className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors"
                      >
                        <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded w-14 text-center text-gray-300">
                          {ds.scene.sceneNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {ds.scene.intExt && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              ds.scene.intExt === 'INT' 
                                ? 'bg-blue-900/40 text-blue-400' 
                                : 'bg-amber-900/40 text-amber-400'
                            }`}>
                              {ds.scene.intExt}
                            </span>
                          )}
                          {ds.scene.timeOfDay && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              ds.scene.timeOfDay === 'NIGHT'
                                ? 'bg-indigo-900/40 text-indigo-400'
                                : 'bg-yellow-900/40 text-yellow-400'
                            }`}>
                              {ds.scene.timeOfDay}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-300 flex-1 truncate">
                          {ds.scene.headingRaw || ds.scene.location || 'Untitled Scene'}
                        </span>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {ds.estimatedMinutes ? `${ds.estimatedMinutes}m` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {day.notes && (
                    <div className="px-5 py-2.5 bg-yellow-900/10 text-yellow-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {day.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'R', desc: 'Refresh schedule data' },
                { key: '/', desc: 'Focus search input' },
                { key: 'F', desc: 'Toggle filters & sort panel' },
                { key: 'S', desc: 'Toggle sort order (asc/desc)' },
                { key: '0', desc: 'Clear status filter (show all)' },
                { key: '1', desc: 'Filter by Scheduled status (toggle)' },
                { key: '2', desc: 'Filter by In Progress status (toggle)' },
                { key: '3', desc: 'Filter by Completed status (toggle)' },
                { key: '4', desc: 'Filter by Delayed status (toggle)' },
                { key: '⇧0', desc: 'Clear location filter (show all)' },
                { key: '⇧1-9', desc: 'Filter by location (toggle)' },
                { key: 'T', desc: 'Switch to Timeline view' },
                { key: 'C', desc: 'Switch to Analytics view' },
                { key: 'K', desc: 'Switch to Conflicts view' },
                { key: 'O', desc: 'Open optimize schedule' },
                { key: 'E', desc: 'Open export menu (CSV/JSON/Markdown)' },
                { key: 'M', desc: 'Direct export to Markdown' },
                { key: 'P', desc: 'Print schedule report' },
                { key: '?', desc: 'Show this help modal' },
                { key: 'Esc', desc: 'Close modal / Clear search / Close filters' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <span className="text-gray-300">{desc}</span>
                  <span className="text-sm font-mono bg-gray-900 px-3 py-1.5 rounded text-indigo-400 border border-gray-700">{key}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-700 text-center">
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
