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
  AlertTriangle,
  FileText,
  BarChart3,
  PieChart,
  Share2,
  Filter,
  Eye,
  List,
  Film,
  Search,
  Printer,
  Copy,
  CheckCircle,
  Activity,
  Zap,
  Moon,
  Sun,
  Battery,
  AlertOctagon,
  Target,
  Gauge,
  X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
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
  mainCastDays: number
  supportingCastDays: number
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
  mainCastDays: 35,
  supportingCastDays: 16,
}

const CHART_COLORS = {
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

const CATEGORY_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

// Get percentage color based on value
const getPercentageColor = (percentage: number): string => {
  if (percentage >= 70) return 'text-emerald-400'
  if (percentage >= 50) return 'text-cyan-400'
  if (percentage >= 30) return 'text-amber-400'
  return 'text-orange-400'
}

const getPercentageGradient = (percentage: number): string => {
  if (percentage >= 70) return 'from-emerald-500 to-emerald-400'
  if (percentage >= 50) return 'from-cyan-500 to-cyan-400'
  if (percentage >= 30) return 'from-amber-500 to-amber-400'
  return 'from-orange-500 to-orange-400'
}

// Detect consecutive shooting days (physically demanding)
const getConsecutiveDaysInfo = (days: number[]): { hasConsecutive: boolean; maxConsecutive: number; sequences: number[][] } => {
  if (days.length < 2) return { hasConsecutive: false, maxConsecutive: 0, sequences: [] }
  
  const sorted = [...days].sort((a, b) => a - b)
  const sequences: number[][] = []
  let currentSeq: number[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i-1] + 1) {
      currentSeq.push(sorted[i])
    } else {
      if (currentSeq.length > 1) sequences.push(currentSeq)
      currentSeq = [sorted[i]]
    }
  }
  if (currentSeq.length > 1) sequences.push(currentSeq)
  
  const maxConsecutive = Math.max(...sequences.map(s => s.length), 0)
  return { 
    hasConsecutive: maxConsecutive > 1, 
    maxConsecutive,
    sequences 
  }
}

export default function DOODPage() {
  const [report, setReport] = useState<DOODRow[]>([])
  const [stats, setStats] = useState<DOODStats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'analytics' | 'workload'>('analytics')
  const [filterRole, setFilterRole] = useState<'all' | 'main' | 'supporting'>('all')
  const [filterSearch, setFilterSearch] = useState('')
  
  // Sort state
  const [sortBy, setSortBy] = useState<'character' | 'actorName' | 'total_days' | 'percentage' | 'isMain'>('character')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Keyboard shortcuts
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const handlePrintRef = useRef<() => void>()
  const exportToMarkdownRef = useRef<() => void>(() => {})
  const showKeyboardHelpRef = useRef(showKeyboardHelp)
  const showFiltersRef = useRef(showFilters)
  const sortByRef = useRef(sortBy)
  const sortOrderRef = useRef(sortOrder)
  const loadDOODRef = useRef<() => Promise<void> | void>(() => {})
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)
  
  // Active filter count for badge (includes sort as active filter)
  const activeFilterCount = (filterRole !== 'all' ? 1 : 0) + (filterSearch.trim() ? 1 : 0) + (sortBy !== 'character' || sortOrder !== 'asc' ? 1 : 0)

  // Clear filters function
  const clearFilters = useCallback(() => {
    setFilterRole('all')
    setFilterSearch('')
    setSortBy('character')
    setSortOrder('asc')
  }, [])

  // Ref for keyboard shortcut access
  const clearFiltersRef = useRef(clearFilters)
  const activeFilterCountRef = useRef(0)
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])
  useEffect(() => { activeFilterCountRef.current = activeFilterCount }, [activeFilterCount])

  // Update refs when values change
  useEffect(() => {
    showKeyboardHelpRef.current = showKeyboardHelp
  }, [showKeyboardHelp])

  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    sortByRef.current = sortBy
  }, [sortBy])

  useEffect(() => {
    sortOrderRef.current = sortOrder
  }, [sortOrder])

  const loadDOOD = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dood?projectId=${selectedProject}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      
      if (data.isDemoMode) {
        setIsDemoMode(true)
      }
      
      if (data.report && data.report.length > 0) {
        setReport(data.report)
        setStats(data.stats)
      } else {
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
    setLastUpdated(new Date())
    setLoading(false)
  }, [selectedProject])

  // Set up refs for keyboard shortcuts
  useEffect(() => {
    loadDOODRef.current = loadDOOD
  }, [loadDOOD])

  // Sync auto-refresh refs with state
  useEffect(() => {
    autoRefreshRef.current = autoRefresh
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefresh, autoRefreshInterval])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshRef.current) return
    
    const interval = setInterval(() => {
      loadDOODRef.current()
    }, autoRefreshIntervalRef.current * 1000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval])

  useEffect(() => {
    loadDOOD()
  }, [loadDOOD])

  // Close export menu and filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.relative')) {
          setShowExportMenu(false)
        }
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    
    if (showExportMenu || showFilters) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu, showFilters])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          if (!autoRefreshRef.current) {
            document.querySelector<HTMLButtonElement>('[data-refresh-btn]')?.click()
          }
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters open: Show all characters
            setFilterRole('all')
          } else {
            // When filters closed: Switch to analytics view
            setViewMode('analytics')
          }
          break
        case '2':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters open: Filter by main cast
            setFilterRole(prev => prev === 'main' ? 'all' : 'main')
          } else {
            // When filters closed: Switch to calendar view
            setViewMode('calendar')
          }
          break
        case '3':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters open: Filter by supporting cast
            setFilterRole(prev => prev === 'supporting' ? 'all' : 'supporting')
          } else {
            // When filters closed: Switch to list view
            setViewMode('list')
          }
          break
        case '4':
          e.preventDefault()
          if (!showFiltersRef.current) {
            // Only when filters closed: Switch to workload view
            setViewMode('workload')
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowFilters(false)
          break
        case 'f':
          if (!showKeyboardHelpRef.current) {
            e.preventDefault()
            setShowFilters(prev => !prev)
          }
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          e.preventDefault()
          handlePrintRef.current?.()
          break
        case 'm':
          e.preventDefault()
          exportToMarkdownRef.current?.()
          break
        case 's':
          e.preventDefault()
          setSortOrder(sortOrderRef.current === 'asc' ? 'desc' : 'asc')
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current()
          }
          break
        case '0':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters open: Clear role filter
            setFilterRole('all')
          }
          break
        // Shift+Number keys for sorting options (when filters open)
        case '!':
        case '@':
        case '#':
        case '$':
        case '%':
          if (showFiltersRef.current) {
            e.preventDefault()
            const sortKeys: Record<string, 'character' | 'actorName' | 'total_days' | 'percentage' | 'isMain'> = {
              '!': 'character',
              '@': 'actorName',
              '#': 'total_days',
              '$': 'percentage',
              '%': 'isMain'
            }
            const newSort = sortKeys[e.key]
            if (newSort) {
              // If same sort key, toggle order; otherwise set new sort and asc order
              if (sortByRef.current === newSort) {
                setSortOrder(sortOrderRef.current === 'asc' ? 'desc' : 'asc')
              } else {
                setSortBy(newSort)
                setSortOrder('asc')
              }
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter and sort report based on role, search, and sort options
  const filteredReport = useMemo(() => {
    let filtered = report
    
    // Filter by role
    if (filterRole === 'main') {
      filtered = filtered.filter(r => r.isMain)
    } else if (filterRole === 'supporting') {
      filtered = filtered.filter(r => !r.isMain)
    }
    
    // Filter by search
    if (filterSearch.trim()) {
      const searchLower = filterSearch.toLowerCase()
      filtered = filtered.filter(r => 
        r.character.toLowerCase().includes(searchLower) ||
        r.characterTamil.toLowerCase().includes(searchLower) ||
        (r.actorName && r.actorName.toLowerCase().includes(searchLower))
      )
    }
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'character':
          comparison = a.character.localeCompare(b.character)
          break
        case 'actorName':
          comparison = (a.actorName || '').localeCompare(b.actorName || '')
          break
        case 'total_days':
          comparison = a.total_days - b.total_days
          break
        case 'percentage':
          comparison = a.percentage - b.percentage
          break
        case 'isMain':
          comparison = (a.isMain === b.isMain) ? 0 : a.isMain ? -1 : 1
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [report, filterRole, filterSearch, sortBy, sortOrder])

  // Chart data
  const pieChartData = useMemo(() => {
    const mainCount = report.filter(r => r.isMain).length
    const supportingCount = report.filter(r => !r.isMain).length
    return [
      { name: 'Main Cast', value: mainCount, color: CHART_COLORS.primary },
      { name: 'Supporting', value: supportingCount, color: CHART_COLORS.secondary },
    ]
  }, [report])

  const barChartData = useMemo(() => {
    return report.slice(0, 8).map(r => ({
      name: r.character.length > 10 ? r.character.slice(0, 10) + '...' : r.character,
      days: r.total_days,
      fullName: r.character,
    }))
  }, [report])

  const handleRefresh = async () => {
    if (autoRefreshRef.current) return // Don't allow manual refresh when auto-refresh is on
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

  const handleExport = (format: 'csv' | 'json') => {
    // Use filtered/sorted data for export
    const exportData = filteredReport
    
    if (format === 'csv') {
      const headers = ['Character', 'Tamil Name', 'Actor', 'Total Days', 'Days', 'Percentage', 'Role']
      const rows = exportData.map(r => [
        r.character,
        r.characterTamil,
        r.actorName || '',
        r.total_days,
        r.days.join(', '),
        `${r.percentage}%`,
        r.isMain ? 'Main' : 'Supporting'
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'json') {
      const jsonData = {
        report: exportData,
        stats: stats,
        generatedAt: new Date().toISOString(),
        projectId: selectedProject,
        filterInfo: {
          roleFilter: filterRole,
          searchQuery: filterSearch,
          sortBy,
          sortOrder,
          activeFilterCount
        }
      }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dood-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Export to Markdown
  const exportToMarkdown = useCallback(() => {
    const exportData = filteredReport
    
    // Calculate stats
    const totalCharacters = exportData.length
    const mainCast = exportData.filter(r => r.isMain)
    const supportingCast = exportData.filter(r => !r.isMain)
    const mainCastDays = mainCast.reduce((sum, r) => sum + r.total_days, 0)
    const supportingCastDays = supportingCast.reduce((sum, r) => sum + r.total_days, 0)
    
    // Build markdown content
    const markdown = `# DOOD Report - Day Out of Days

## Summary

| Metric | Value |
|--------|-------|
| Total Characters | ${totalCharacters} |
| Total Shooting Days | ${stats.totalShootingDays} |
| Total Calls | ${stats.totalCalls} |
| Avg Days/Actor | ${stats.avgDaysPerActor.toFixed(1)} |
| Main Cast Days | ${mainCastDays} |
| Supporting Cast Days | ${supportingCastDays} |

## Cast Breakdown

### Main Cast (${mainCast.length})

| Character | Tamil | Actor | Total Days | % of Shoot | Days |
|-----------|-------|-------|------------|------------|------|
${mainCast.map(r => `| ${r.character} | ${r.characterTamil} | ${r.actorName || 'TBA'} | ${r.total_days} | ${r.percentage}% | ${r.days.join(', ')} |`).join('\n')}

### Supporting Cast (${supportingCast.length})

| Character | Tamil | Actor | Total Days | % of Shoot | Days |
|-----------|-------|-------|------------|------------|------|
${supportingCast.map(r => `| ${r.character} | ${r.characterTamil} | ${r.actorName || 'TBA'} | ${r.total_days} | ${r.percentage}% | ${r.days.join(', ')} |`).join('\n')}

## Filters Applied

- Role Filter: ${filterRole === 'all' ? 'All' : filterRole === 'main' ? 'Main Cast' : 'Supporting Cast'}
- Search: ${filterSearch || 'None'}
- Sort By: ${sortBy} (${sortOrder})

---

*Generated by CinePilot on ${new Date().toLocaleString()}*
`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dood-report-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredReport, stats, filterRole, filterSearch, sortBy, sortOrder])

  // Update ref for keyboard shortcut
  useEffect(() => {
    exportToMarkdownRef.current = exportToMarkdown
  }, [exportToMarkdown])

  // Copy report to clipboard
  const handleCopyToClipboard = async () => {
    const text = `DOOD REPORT - ${new Date().toLocaleDateString()}
=====================================

SUMMARY
-------
Total Characters: ${stats.totalCharacters}
Total Shooting Days: ${stats.totalShootingDays}
Total Calls: ${stats.totalCalls}
Avg Days/Actor: ${stats.avgDaysPerActor}
Main Cast Days: ${stats.mainCastDays}
Supporting Cast Days: ${stats.supportingCastDays}

CAST SCHEDULE
-------------
${filteredReport.map(r => `${r.character} (${r.actorName || 'TBA'})
  - Total Days: ${r.total_days}
  - Days: ${r.days.join(', ')}
  - Percentage: ${r.percentage}%
  - Role: ${r.isMain ? 'Main Cast' : 'Supporting'}
`).join('\n')}

Generated by CinePilot`
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePrint = useCallback(() => {
    const printContent = document.getElementById('dood-print-area')
    if (!printContent) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const statsHtml = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1a1a2e;">Summary Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div><strong>Total Characters:</strong> ${stats.totalCharacters}</div>
          <div><strong>Total Shooting Days:</strong> ${stats.totalShootingDays}</div>
          <div><strong>Total Calls:</strong> ${stats.totalCalls}</div>
          <div><strong>Avg Days/Actor:</strong> ${stats.avgDaysPerActor}</div>
          <div><strong>Main Cast Days:</strong> ${stats.mainCastDays}</div>
          <div><strong>Supporting Days:</strong> ${stats.supportingCastDays}</div>
        </div>
      </div>
    `
    
    const tableHtml = printContent.innerHTML
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Day Out of Days Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #1a1a2e; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f8f9fa; font-weight: 600; }
            .main-cast { background: #e8f5e9; }
            .supporting { background: #fff3e0; }
            .days-cell { font-family: monospace; white-space: nowrap; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Day Out of Days Report</h1>
          <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
          ${statsHtml}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Character</th>
                <th>Tamil Name</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Total Days</th>
                <th>Days</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReport.map((r, i) => `
                <tr class="${r.isMain ? 'main-cast' : 'supporting'}">
                  <td>${i + 1}</td>
                  <td>${r.character}</td>
                  <td>${r.characterTamil}</td>
                  <td>${r.actorName || '-'}</td>
                  <td>${r.isMain ? 'Main' : 'Supporting'}</td>
                  <td>${r.total_days}</td>
                  <td class="days-cell">${r.days.join(', ')}</td>
                  <td>${r.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.print()
  }, [filteredReport, stats])

  // Update handlePrint ref
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

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

  // Render analytics view
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Days by Character - Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Days per Character
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  width={80}
                  tickFormatter={(value) => value.length > 8 ? `${value.slice(0,8)}...` : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: number) => [`${value} days`, 'Days']}
                />
                <Bar dataKey="days" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cast Distribution - Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Cast Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend 
                  formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.mainCastDays}</div>
          <div className="text-xs text-slate-500 mt-1">Main Cast Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.supportingCastDays}</div>
          <div className="text-xs text-slate-500 mt-1">Supporting Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {report.filter(r => r.percentage >= 50).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Heavy Shoot Days</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {Math.max(...report.map(r => r.days.length), 0) - Math.min(...report.map(r => r.days.length), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Day Range Spread</div>
        </div>
      </div>

      {/* Call Frequency Groups */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Cast by Call Frequency
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{callFrequencyGroups.heavy.length}</div>
            <div className="text-xs text-slate-400 mt-1">Heavy Call (70%+)</div>
            <div className="mt-2 space-y-1">
              {callFrequencyGroups.heavy.slice(0, 3).map(r => (
                <div key={r.characterId} className="text-xs text-slate-500 truncate">{r.character}</div>
              ))}
              {callFrequencyGroups.heavy.length > 3 && (
                <div className="text-xs text-slate-600">+{callFrequencyGroups.heavy.length - 3} more</div>
              )}
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{callFrequencyGroups.moderate.length}</div>
            <div className="text-xs text-slate-400 mt-1">Moderate (40-70%)</div>
            <div className="mt-2 space-y-1">
              {callFrequencyGroups.moderate.slice(0, 3).map(r => (
                <div key={r.characterId} className="text-xs text-slate-500 truncate">{r.character}</div>
              ))}
              {callFrequencyGroups.moderate.length > 3 && (
                <div className="text-xs text-slate-600">+{callFrequencyGroups.moderate.length - 3} more</div>
              )}
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">{callFrequencyGroups.light.length}</div>
            <div className="text-xs text-slate-400 mt-1">Light Call (&lt;40%)</div>
            <div className="mt-2 space-y-1">
              {callFrequencyGroups.light.slice(0, 3).map(r => (
                <div key={r.characterId} className="text-xs text-slate-500 truncate">{r.character}</div>
              ))}
              {callFrequencyGroups.light.length > 3 && (
                <div className="text-xs text-slate-600">+{callFrequencyGroups.light.length - 3} more</div>
              )}
            </div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-400">{callFrequencyGroups.unassigned.length}</div>
            <div className="text-xs text-slate-400 mt-1">Unassigned (0%)</div>
            <div className="mt-2 space-y-1">
              {callFrequencyGroups.unassigned.slice(0, 3).map(r => (
                <div key={r.characterId} className="text-xs text-slate-500 truncate">{r.character}</div>
              ))}
              {callFrequencyGroups.unassigned.length > 3 && (
                <div className="text-xs text-slate-600">+{callFrequencyGroups.unassigned.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shooting Schedule Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Daily Cast Requirements Heatmap
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {(() => {
              // Calculate cast count per day
              const dayCastCount: number[] = []
              for (let d = 1; d <= stats.totalShootingDays; d++) {
                dayCastCount[d - 1] = report.filter(r => r.days.includes(d)).length
              }
              const maxCast = Math.max(...dayCastCount, 1)
              
              return (
                <>
                  {/* Day numbers */}
                  <div className="flex flex-col gap-1 mr-2">
                    <div className="h-6"></div>
                    {dayCastCount.map((count, idx) => (
                      <div key={idx} className="h-8 flex items-center justify-end pr-2 text-xs text-slate-500 w-8">
                        Day {idx + 1}
                      </div>
                    ))}
                  </div>
                  {/* Heatmap cells */}
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1 h-6 items-center">
                      <span className="text-xs text-slate-500 mr-2">Cast:</span>
                      <div className="flex gap-1">
                        <div className="w-8 text-center text-xs text-slate-500">0</div>
                        <div className="w-8 text-center text-xs text-slate-500">{Math.ceil(maxCast / 2)}</div>
                        <div className="w-8 text-center text-xs text-slate-500">{maxCast}</div>
                      </div>
                    </div>
                    {dayCastCount.map((count, idx) => {
                      const intensity = count / maxCast
                      const getColor = (intensity: number) => {
                        if (intensity === 0) return 'bg-slate-800'
                        if (intensity < 0.25) return 'bg-emerald-900/80 border border-emerald-700'
                        if (intensity < 0.5) return 'bg-emerald-700/80 border border-emerald-500'
                        if (intensity < 0.75) return 'bg-emerald-500/80 border border-emerald-400'
                        return 'bg-emerald-400 border border-emerald-300'
                      }
                      return (
                        <div 
                          key={idx} 
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-110 ${getColor(intensity)} ${count > 0 ? 'text-white' : 'text-slate-600'}`}
                          title={`Day ${idx + 1}: ${count} actors`}
                        >
                          {count > 0 ? count : '-'}
                        </div>
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col gap-1 ml-4">
                    <div className="h-6"></div>
                    <div className="flex items-center gap-1 h-8">
                      <span className="text-xs text-slate-500 w-16">Low</span>
                      <div className="w-4 h-4 rounded bg-emerald-900/80 border border-emerald-700"></div>
                      <div className="w-4 h-4 rounded bg-emerald-700/80 border border-emerald-500"></div>
                      <div className="w-4 h-4 rounded bg-emerald-500/80 border border-emerald-400"></div>
                      <div className="w-4 h-4 rounded bg-emerald-400 border border-emerald-300"></div>
                      <span className="text-xs text-slate-500 w-12">High</span>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )

  // Stats cards
  const statCards = [
    { 
      label: 'Total Characters', 
      value: stats.totalCharacters, 
      icon: Users, 
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      subtext: `${report.filter(r => r.isMain).length} main, ${report.filter(r => !r.isMain).length} supporting`
    },
    { 
      label: 'Shooting Days', 
      value: stats.totalShootingDays, 
      icon: Calendar, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      subtext: `${totalShootingDays} days scheduled`
    },
    { 
      label: 'Total Calls', 
      value: stats.totalCalls, 
      icon: Clock, 
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      subtext: 'Actor day calls'
    },
    { 
      label: 'Avg Days/Actor', 
      value: stats.avgDaysPerActor, 
      icon: TrendingUp, 
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      subtext: 'Per actor average'
    },
  ]

  // Calculate call frequency groups
  const callFrequencyGroups = useMemo(() => {
    const heavy = report.filter(r => r.percentage >= 70) // 70%+ = heavy call
    const moderate = report.filter(r => r.percentage >= 40 && r.percentage < 70)
    const light = report.filter(r => r.percentage > 0 && r.percentage < 40)
    const unassigned = report.filter(r => r.percentage === 0)
    
    return { heavy, moderate, light, unassigned }
  }, [report])

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Film className="w-6 h-6 text-cyan-400" />
              Day Out of Days (DOOD)
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track actor availability and call days across the production schedule
            </p>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {isDemoMode ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo Data</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-sm font-medium">API Connected</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && <span className="text-emerald-400 ml-1">· Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'analytics' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics<span className="text-xs opacity-60 ml-1">(1)</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar<span className="text-xs opacity-60 ml-1">(2)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'list' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              List<span className="text-xs opacity-60 ml-1">(3)</span>
            </button>
            <button
              onClick={() => setViewMode('workload')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'workload' 
                  ? 'bg-cyan-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Workload<span className="text-xs opacity-60 ml-1">(4)</span>
            </button>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-gray-400 hover:text-white border border-slate-700 hover:border-slate-600'
            }`}
            title={`Toggle Filters (F)${activeFilterCount > 0 ? ' - X to clear all' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter & Sort Panel */}
        {showFilters && (
          <div 
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Filter & Sort:</span>
              <span className="text-xs text-cyan-400 ml-2">(1-3 for role, 0 to clear, X to clear all)</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Role:</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as 'all' | 'main' | 'supporting')}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="all">All Cast (1)</option>
                  <option value="main">Main Cast (2)</option>
                  <option value="supporting">Supporting (3)</option>
                </select>
              </div>
              {/* Search Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Search:</label>
                <input
                  type="text"
                  placeholder="Search cast..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-48"
                />
                {filterSearch && (
                  <button
                    onClick={() => setFilterSearch('')}
                    className="text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="character">Character</option>
                  <option value="actorName">Actor</option>
                  <option value="total_days">Days</option>
                  <option value="percentage">%</option>
                  <option value="isMain">Role</option>
                </select>
              </div>
              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sortBy !== 'character' || sortOrder !== 'asc'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-gray-400 border border-slate-700'
                }`}
                title="Toggle Sort Order (S)"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || autoRefresh}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            title="Refresh Data (R)"
            data-refresh-btn
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Auto-Refresh Toggle */}
          <div className="relative">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors text-sm ${
                autoRefresh 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle auto-refresh (A)"
            >
              <div className="flex items-center gap-1.5">
                {autoRefresh && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
                Auto
              </div>
            </button>
            {/* Interval Selector Dropdown */}
            {autoRefresh && (
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white cursor-pointer hover:bg-slate-700 z-10"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search cast... (/)"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm w-48 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <span className="text-xs">⌨️</span>
            Help
          </button>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600 mt-1">{stat.subtext}</div>
          </div>
        ))}
      </div>

      {/* Conflict Detection */}
      {(() => {
        const conflicts: Array<{
          type: 'overlap' | 'consecutive' | 'heavy' | 'isolated'
          severity: 'high' | 'medium' | 'low'
          actors: string[]
          days: number[]
          message: string
        }> = []
        
        const dayMap: Record<number, string[]> = {}
        report.forEach(actor => {
          actor.days.forEach(day => {
            if (!dayMap[day]) dayMap[day] = []
            dayMap[day].push(actor.character)
          })
        })
        
        Object.entries(dayMap).forEach(([day, actors]) => {
          if (actors.length > 3) {
            conflicts.push({
              type: 'overlap',
              severity: actors.length > 5 ? 'high' : 'medium',
              actors,
              days: [parseInt(day)],
              message: `${actors.length} actors called on Day ${day}`
            })
          }
        })
        
        const heavyCall = report.filter(r => r.percentage >= 70)
        if (heavyCall.length > 0) {
          conflicts.push({
            type: 'heavy',
            severity: 'medium',
            actors: heavyCall.map(r => r.character),
            days: heavyCall.flatMap(r => r.days),
            message: `${heavyCall.length} actor(s) with heavy calls (70%+)`
          })
        }
        
        report.forEach(actor => {
          if (actor.days.length > 1) {
            const sorted = [...actor.days].sort((a, b) => a - b)
            const gaps: number[] = []
            for (let i = 1; i < sorted.length; i++) {
              gaps.push(sorted[i] - sorted[i-1])
            }
            const maxGap = Math.max(...gaps)
            if (maxGap > 5) {
              conflicts.push({
                type: 'isolated',
                severity: 'low',
                actors: [actor.character],
                days: actor.days,
                message: `${actor.character} has ${maxGap} day gap`
              })
            }
          }
        })
        
        report.forEach(actor => {
          const info = getConsecutiveDaysInfo(actor.days)
          if (info.maxConsecutive >= 3) {
            conflicts.push({
              type: 'consecutive',
              severity: info.maxConsecutive >= 4 ? 'high' : 'medium',
              actors: [actor.character],
              days: info.sequences.flat(),
              message: `${actor.character}: ${info.maxConsecutive} consecutive days`
            })
          }
        })
        
        const highSeverity = conflicts.filter(c => c.severity === 'high')
        
        if (conflicts.length === 0) return null
        
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className={`w-5 h-5 ${highSeverity.length > 0 ? 'text-red-400' : 'text-amber-400'}`} />
              <h3 className="font-semibold text-white">Scheduling Conflicts</h3>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-gray-400">
                {conflicts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {conflicts.slice(0, 6).map((conflict, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    conflict.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    conflict.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      conflict.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      conflict.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-700 text-gray-400'
                    }`}>
                      {conflict.severity}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      conflict.type === 'overlap' ? 'bg-purple-500/20 text-purple-400' :
                      conflict.type === 'consecutive' ? 'bg-orange-500/20 text-orange-400' :
                      conflict.type === 'heavy' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-700 text-gray-400'
                    }`}>
                      {conflict.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2">{conflict.message}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Analytics View */}
      {viewMode === 'analytics' && renderAnalytics()}

      {/* Workload Analysis View */}
      {viewMode === 'workload' && (
        <div className="space-y-6">
          {/* Workload Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              // Calculate workload metrics
              const workloadMetrics = report.map(r => {
                const sorted = [...r.days].sort((a, b) => a - b)
                const gaps: number[] = []
                let maxConsecutive = 0
                let currentConsecutive = 1
                
                for (let i = 1; i < sorted.length; i++) {
                  const gap = sorted[i] - sorted[i-1]
                  gaps.push(gap)
                  if (gap === 1) {
                    currentConsecutive++
                    maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
                  } else {
                    currentConsecutive = 1
                  }
                }
                
                const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0
                const hasOverwork = maxConsecutive >= 5 // 5+ consecutive days = overwork warning
                const hasInsufficientRest = gaps.some(g => g < 2) // Less than 2 days rest = insufficient
                
                return {
                  ...r,
                  maxConsecutive,
                  avgGap: avgGap.toFixed(1),
                  hasOverwork,
                  hasInsufficientRest,
                  gaps
                }
              })
              
              const overworkedActors = workloadMetrics.filter(m => m.hasOverwork)
              const insufficientRest = workloadMetrics.filter(m => m.hasInsufficientRest)
              const maxConsecutiveRecord = Math.max(...workloadMetrics.map(m => m.maxConsecutive), 0)
              const avgRestDays = (workloadMetrics.reduce((acc, m) => acc + parseFloat(m.avgGap), 0) / workloadMetrics.length || 0).toFixed(1)
              
              return (
                <>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">{overworkedActors.length}</div>
                        <div className="text-xs text-slate-500">Overworked Actors</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      5+ consecutive shooting days
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Moon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-400">{insufficientRest.length}</div>
                        <div className="text-xs text-slate-500">Insufficient Rest</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Less than 2 days between calls
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{maxConsecutiveRecord}</div>
                        <div className="text-xs text-slate-500">Max Consecutive Days</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Longest continuous shoot streak
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Battery className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">{avgRestDays}</div>
                        <div className="text-xs text-slate-500">Avg Rest Days</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Average gap between calls
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
          
          {/* Workload Analysis Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Actor Workload Analysis
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Actor</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Character</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Total Days</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Max Consecutive</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Rest</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.map(row => {
                    const sorted = [...row.days].sort((a, b) => a - b)
                    const gaps: number[] = []
                    let maxConsecutive = 0
                    let currentConsecutive = 1
                    
                    for (let i = 1; i < sorted.length; i++) {
                      const gap = sorted[i] - sorted[i-1]
                      gaps.push(gap)
                      if (gap === 1) {
                        currentConsecutive++
                        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
                      } else {
                        currentConsecutive = 1
                      }
                    }
                    
                    const avgGap = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0
                    const hasOverwork = maxConsecutive >= 5
                    const hasInsufficientRest = gaps.some(g => g < 2)
                    const isLightWorkload = row.percentage <= 30
                    
                    return (
                      <tr key={row.characterId} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${row.isMain ? 'bg-cyan-400' : 'bg-purple-400'}`}></div>
                            <span className="font-medium">{row.actorName || 'TBA'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <div>{row.character}</div>
                          <div className="text-xs text-slate-600">{row.characterTamil}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold ${row.percentage >= 70 ? 'text-red-400' : row.percentage >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {row.total_days}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">/ {stats.totalShootingDays}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            maxConsecutive >= 5 ? 'bg-red-500/20 text-red-400' :
                            maxConsecutive >= 3 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            <Zap className="w-3 h-3" />
                            {maxConsecutive} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm ${avgGap < 2 ? 'text-red-400' : avgGap < 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {avgGap.toFixed(1)} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hasOverwork ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                              <AlertOctagon className="w-3 h-3" />
                              Overworked
                            </span>
                          ) : hasInsufficientRest ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                              <Moon className="w-3 h-3" />
                              Needs Rest
                            </span>
                          ) : isLightWorkload ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-medium">
                              Light
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {hasOverwork && (
                              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                ⚠️ {maxConsecutive} consecutive days
                              </span>
                            )}
                            {hasInsufficientRest && gaps.filter(g => g < 2).length > 0 && (
                              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                ⚠️ {gaps.filter(g => g < 2).length}x insufficient rest
                              </span>
                            )}
                            {!hasOverwork && !hasInsufficientRest && (
                              <span className="text-xs text-slate-500">No warnings</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Rest Days Distribution Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-400" />
              Rest Days Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  // Calculate rest day distribution
                  const restDistribution: Record<number, number> = {}
                  report.forEach(r => {
                    const sorted = [...r.days].sort((a, b) => a - b)
                    for (let i = 1; i < sorted.length; i++) {
                      const gap = sorted[i] - sorted[i-1] - 1 // Rest days = gap - 1
                      restDistribution[gap] = (restDistribution[gap] || 0) + 1
                    }
                  })
                  
                  return Object.entries(restDistribution)
                    .map(([days, count]) => ({ days: parseInt(days), count }))
                    .sort((a, b) => a.days - b.days)
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="days" 
                    stroke="#64748b" 
                    fontSize={11}
                    label={{ value: 'Rest Days', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                  />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value: number, name: string) => [`${value} instances`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Workload Balance Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Workload Balance (Days vs Percentage)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.map(r => ({
                  name: r.character.length > 10 ? r.character.slice(0, 10) + '...' : r.character,
                  days: r.total_days,
                  percentage: r.percentage,
                  isMain: r.isMain
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="days" fill="#06b6d4" name="Shooting Days" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="percentage" fill="#8b5cf6" name="Percentage %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Table View */}
      {(viewMode === 'calendar' || viewMode === 'list') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold">Cast Schedule</h2>
              <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredReport.length} actors
              </span>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => { handleCopyToClipboard(); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-cyan-400" />
                      )}
                      {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                      onClick={() => { handleExport('csv'); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                      CSV
                    </button>
                    <button
                      onClick={() => { handleExport('json'); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                      JSON
                    </button>
                    <button
                      onClick={() => { exportToMarkdown(); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Markdown
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                title="Print DOOD report (P)"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {/* Table */}
          <div id="dood-print-area" className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
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
              {/* Empty State */}
              {filteredReport.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                          <Search className="w-8 h-8 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-slate-300">No cast members found</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {filterRole !== 'all' || filterSearch.trim() 
                              ? 'Try adjusting your filters or search query'
                              : 'No cast data available for this project'}
                          </p>
                          {(filterRole !== 'all' || filterSearch.trim()) && (
                            <button
                              onClick={() => { setFilterRole('all'); setFilterSearch(''); }}
                              className="mt-3 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
              <tbody className="divide-y divide-slate-800">
                {filteredReport.length > 0 && filteredReport.map((row, idx) => (
                  <tr 
                    key={row.characterId} 
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-gray-500 text-sm">{idx + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          row.isMain 
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black' 
                            : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
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
                            {(() => {
                              const info = getConsecutiveDaysInfo(row.days)
                              return info.maxConsecutive >= 3 ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded" title={`${info.maxConsecutive} consecutive days`}>
                                  ⚠️ HARD
                                </span>
                              ) : info.maxConsecutive >= 2 ? (
                                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded" title={`${info.maxConsecutive} consecutive days`}>
                                  ⚠️ CONSEC
                                </span>
                              ) : null
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {row.characterTamil} • {row.actorName || 'TBA'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-2xl font-bold ${getPercentageColor(row.percentage)}`}>
                        {row.total_days}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getPercentageGradient(row.percentage)} rounded-full transition-all duration-500`}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getPercentageColor(row.percentage)} w-12 text-right`}>
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
      )}

      {/* Legend & Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-400 rounded"></div>
            <span>Working Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-800 rounded"></div>
            <span>Off Day</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Keyboard Help Dialog */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-xl">⌨️</span> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Refresh data</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">R</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Toggle auto-refresh</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">A</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Export menu</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">E</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Print report</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">P</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Export Markdown</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">M</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Focus search</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">/</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">F</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">S</kbd>
              </div>
              
              {/* View Mode Shortcuts (When filters closed) */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <p className="text-xs text-amber-400 mb-2">When filters closed:</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Analytics view</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-amber-400">1</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Calendar view</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-amber-400">2</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">List view</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-amber-400">3</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Workload view</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-amber-400">4</kbd>
              </div>
              
              {/* Filter Shortcuts (When filters open) */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <p className="text-xs text-cyan-400 mb-2">When filters open:</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Show all cast</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">1</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Filter main cast (toggle)</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">2</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Filter supporting (toggle)</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">3</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Clear role filter</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">0</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Clear all filters</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">X</kbd>
              </div>
              
              {/* Sort Shortcuts (When filters open) */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <p className="text-xs text-emerald-400 mb-2">When filters open, sort by:</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sort by character</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">⇧+1</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sort by actor</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">⇧+2</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sort by days</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">⇧+3</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sort by %</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">⇧+4</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sort by role</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-emerald-400">⇧+5</kbd>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Show help</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">?</kbd>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Close dialog</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-cyan-400">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
