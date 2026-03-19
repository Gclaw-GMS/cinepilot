'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  Heart, Activity, Database, HardDrive, Cpu, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Clock, Server, 
  Zap, Thermometer, Gauge, Loader2, HelpCircle, X,
  Search, Download, Printer, Filter
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface HealthCheck {
  component: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  details?: Record<string, unknown>
  latencyMs?: number
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: HealthCheck[]
  version: string
  isDemo?: boolean
}

interface HealthHistory {
  timestamp: string
  database: number
  disk: number
  memory: number
}

const STATUS_COLORS = {
  healthy: '#10b981',
  degraded: '#f59e0b',
  unhealthy: '#ef4444',
}

const COMPONENT_ICONS: Record<string, typeof Database> = {
  database: Database,
  disk: HardDrive,
  memory: Cpu,
  environment: Zap,
  api: Activity,
  'event-loop': Activity,
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [healthHistory, setHealthHistory] = useState<HealthHistory[]>([])
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'degraded' | 'unhealthy'>('all')
  const [sortBy, setSortBy] = useState<'component' | 'status' | 'latency'>('component')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts
  const filterStatusRef = useRef(filterStatus)
  const showFiltersRef = useRef(showFilters)
  
  // Keep refs in sync
  useEffect(() => { filterStatusRef.current = filterStatus }, [filterStatus])
  useEffect(() => { showFiltersRef.current = showFilters }, [showFilters])
  
  // Calculate active filter count (includes sort state)
  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (sortBy !== 'component' || sortOrder !== 'asc' ? 1 : 0)
  
  // Clear all filters and sort
  const clearFilters = useCallback(() => {
    setFilterStatus('all')
    setSearchQuery('')
    setSortBy('component')
    setSortOrder('asc')
  }, [])
  
  // Filtered and sorted checks
  const filteredChecks = useMemo(() => {
    if (!healthData?.checks) return []
    
    let result = healthData.checks.filter(check => {
      // Apply status filter
      if (filterStatus !== 'all' && check.status !== filterStatus) {
        return false
      }
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          check.component.toLowerCase().includes(query) ||
          check.status.toLowerCase().includes(query) ||
          (check.message?.toLowerCase().includes(query) ?? false)
        )
      }
      return true
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'component':
          comparison = a.component.localeCompare(b.component)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'latency':
          comparison = (a.latencyMs || 0) - (b.latencyMs || 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [healthData?.checks, filterStatus, searchQuery, sortBy, sortOrder])

  // Export functions
  const exportToCSV = () => {
    if (!healthData) return
    const headers = ['Component', 'Status', 'Message', 'Latency (ms)']
    // Use sorted/filtered data for export
    const rows = filteredChecks.map(c => [
      c.component,
      c.status,
      c.message || '',
      c.latencyMs?.toString() || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const exportToJSON = () => {
    if (!healthData) return
    const data = {
      exportDate: new Date().toISOString(),
      status: healthData.status,
      timestamp: healthData.timestamp,
      uptime: healthData.uptime,
      version: healthData.version,
      checks: filteredChecks,
      filterMetadata: {
        filterStatus,
        searchQuery,
        sortBy,
        sortOrder,
        totalFiltered: filteredChecks.length,
        totalRecords: healthData.checks.length
      },
      history: healthHistory
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Markdown Export
  const exportToMarkdown = useCallback(() => {
    if (!healthData) return

    // Calculate stats
    const healthyCount = filteredChecks.filter(c => c.status === 'healthy').length
    const degradedCount = filteredChecks.filter(c => c.status === 'degraded').length
    const unhealthyCount = filteredChecks.filter(c => c.status === 'unhealthy').length
    const avgLatency = filteredChecks.length > 0 
      ? Math.round(filteredChecks.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / filteredChecks.length)
      : 0

    // Format uptime
    const formatUptime = (ms: number) => {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      if (days > 0) return `${days}d ${hours % 24}h`
      if (hours > 0) return `${hours}h ${minutes % 60}m`
      return `${minutes}m`
    }

    let markdown = `# CinePilot Health Report

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Status** | ${healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)} |
| **Timestamp** | ${new Date(healthData.timestamp).toLocaleString()} |
| **Version** | ${healthData.version} |
| **Uptime** | ${formatUptime(healthData.uptime)} |
| **Total Components** | ${healthData.checks.length} |
| **Healthy** | ${healthyCount} |
| **Degraded** | ${degradedCount} |
| **Unhealthy** | ${unhealthyCount} |
| **Average Latency** | ${avgLatency}ms |

## Component Status

| Component | Status | Latency | Message |
|-----------|--------|---------|---------|
`

    // Add each component
    filteredChecks.forEach(check => {
      const statusIcon = check.status === 'healthy' ? '✅' : check.status === 'degraded' ? '⚠️' : '❌'
      markdown += `| ${check.component} | ${statusIcon} ${check.status} | ${check.latencyMs || 'N/A'}ms | ${check.message || '-'} |\n`
    })

    // Add filter metadata if filters are active
    if (filterStatus !== 'all' || searchQuery || sortBy !== 'component' || sortOrder !== 'asc') {
      markdown += `
## Filters Applied

| Filter | Value |
|--------|-------|
| **Status Filter** | ${filterStatus} |
| **Search Query** | ${searchQuery || '(none)'} |
| **Sort By** | ${sortBy} |
| **Sort Order** | ${sortOrder} |
| **Filtered Count** | ${filteredChecks.length} of ${healthData.checks.length} |
`
    }

    // Add footer
    markdown += `
---
*Generated by CinePilot on ${new Date().toLocaleString()}*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [healthData, filteredChecks, filterStatus, searchQuery, sortBy, sortOrder])

  // Print function
  const handlePrint = () => {
    if (!healthData) return
    
    // Use sorted/filtered data for print
    const healthyCount = filteredChecks.filter(c => c.status === 'healthy').length
    const degradedCount = filteredChecks.filter(c => c.status === 'degraded').length
    const unhealthyCount = filteredChecks.filter(c => c.status === 'unhealthy').length
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot Health Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
    .header .subtitle { color: #64748b; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .stat-card .value.healthy { color: #10b981; }
    .stat-card .value.degraded { color: #f59e0b; }
    .stat-card .value.unhealthy { color: #ef4444; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge.healthy { background: #d1fae5; color: #065f46; }
    .status-badge.degraded { background: #fef3c7; color: #92400e; }
    .status-badge.unhealthy { background: #fee2e2; color: #991b1b; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 CinePilot Health Report</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Overall Status</div>
      <div class="value ${healthData.status}">${healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Healthy</div>
      <div class="value healthy">${healthyCount}</div>
    </div>
    <div class="stat-card">
      <div class="label">Degraded</div>
      <div class="value degraded">${degradedCount}</div>
    </div>
    <div class="stat-card">
      <div class="label">Unhealthy</div>
      <div class="value unhealthy">${unhealthyCount}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Component Status</h2>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>Message</th>
          <th>Latency</th>
        </tr>
      </thead>
      <tbody>
        ${filteredChecks.map(check => `
          <tr>
            <td style="text-transform: capitalize; font-weight: 500;">${check.component}</td>
            <td><span class="status-badge ${check.status}">${check.status}</span></td>
            <td>${check.message || '-'}</td>
            <td>${check.latencyMs !== undefined ? check.latencyMs + 'ms' : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>System Information</h2>
    <table>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Version</td>
        <td>${healthData.version}</td>
      </tr>
      <tr>
        <td>Uptime</td>
        <td>${Math.floor(healthData.uptime / 3600)}h ${Math.floor((healthData.uptime % 3600) / 60)}m</td>
      </tr>
      <tr>
        <td>Timestamp</td>
        <td>${new Date(healthData.timestamp).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Demo Mode</td>
        <td>${healthData.isDemo ? 'Yes' : 'No'}</td>
      </tr>
    </table>
  </div>
  
  <div class="footer">
    CinePilot • Film Production Management System
  </div>
  
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
`
    
    printWindow.document.write(html)
    printWindow.document.close()
    setShowPrintMenu(false)
  }

  const fetchHealth = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: HealthResponse = await res.json()
      setHealthData(data)
      setLastRefresh(new Date())
      
      // Add to history for charts
      setHealthHistory(prev => {
        const newEntry: HealthHistory = {
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          database: data.checks.find(c => c.component === 'database')?.status === 'healthy' ? 100 : 
                   data.checks.find(c => c.component === 'database')?.status === 'degraded' ? 50 : 0,
          disk: data.checks.find(c => c.component === 'disk')?.status === 'healthy' ? 100 : 
                data.checks.find(c => c.component === 'disk')?.status === 'degraded' ? 50 : 0,
          memory: data.checks.find(c => c.component === 'memory')?.status === 'healthy' ? 100 : 
                  data.checks.find(c => c.component === 'memory')?.status === 'degraded' ? 50 : 0,
        }
        const updated = [...prev, newEntry].slice(-20)
        return updated
      })
    } catch (e) {
      console.error('Health check failed:', e)
      setError(e instanceof Error ? e.message : 'Failed to fetch health data')
      // Fallback demo data
      setHealthData({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        version: '1.0.0',
        checks: [
          { component: 'database', status: 'healthy', message: 'Connected', latencyMs: 12 },
          { component: 'disk', status: 'healthy', message: '450GB free of 500GB', details: { totalGB: 500, freeGB: 450, usedPercent: 10 }, latencyMs: 5 },
          { component: 'memory', status: 'healthy', message: '256MB heap used of 512MB', details: { heapUsedMB: 256, heapTotalMB: 512, heapPercent: 50 }, latencyMs: 2 },
          { component: 'environment', status: 'healthy', message: 'All required variables set', latencyMs: 1 },
        ]
      })
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefreshRef.current?.()
          break
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('[data-health-search]')?.focus()
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          exportToMarkdownRef.current?.()
          break
        case 'p':
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        // Number keys for status filtering (context-aware)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          e.preventDefault()
          const num = parseInt(e.key)
          if (num === 0) {
            // 0 clears status filter
            setFilterStatus('all')
          } else if (num >= 1 && num <= 4) {
            const statusOptions: Array<'all' | 'healthy' | 'degraded' | 'unhealthy'> = ['all', 'healthy', 'degraded', 'unhealthy']
            const newStatus = statusOptions[num - 1]
            if (showFiltersRef.current) {
              // When filters panel OPEN: toggle behavior
              setFilterStatus(filterStatusRef.current === newStatus ? 'all' : newStatus)
            } else {
              // When filters panel CLOSED: open panel and set filter
              setFilterStatus(newStatus)
              setShowFilters(true)
            }
          }
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearchQuery('')
          setSortBy('component')
          setSortOrder('asc')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) && 
          !(e.target as Element).closest('.filter-toggle')) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchHealth()
  }, [fetchHealth])

  // Ref for keyboard shortcut access
  const handleRefreshRef = useRef(handleRefresh)
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  // Ref for exportToMarkdown keyboard shortcut
  const exportToMarkdownRef = useRef(exportToMarkdown)
  useEffect(() => {
    exportToMarkdownRef.current = exportToMarkdown
  }, [exportToMarkdown])

  useEffect(() => { 
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [fetchHealth])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-6 h-6 text-emerald-500" />
      case 'degraded': return <AlertTriangle className="w-6 h-6 text-amber-500" />
      case 'unhealthy': return <XCircle className="w-6 h-6 text-red-500" />
      default: return <Activity className="w-6 h-6 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#64748b'
  }

  const getMemoryData = () => {
    const memCheck = healthData?.checks.find(c => c.component === 'memory')
    if (!memCheck?.details) return []
    const details = memCheck.details as { heapUsedMB?: number; heapTotalMB?: number; heapPercent?: number }
    return [
      { name: 'Used', value: details.heapUsedMB || 0 },
      { name: 'Free', value: (details.heapTotalMB || 512) - (details.heapUsedMB || 0) },
    ]
  }

  const getDiskData = () => {
    const diskCheck = healthData?.checks.find(c => c.component === 'disk')
    if (!diskCheck?.details) return []
    const details = diskCheck.details as { totalGB?: number; freeGB?: number; usedPercent?: number }
    return [
      { name: 'Used', value: ((details.totalGB || 500) - (details.freeGB || 450)) },
      { name: 'Free', value: details.freeGB || 0 },
    ]
  }

  const pieColors = ['#6366f1', '#10b981']

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              healthData?.status === 'healthy' ? 'bg-emerald-500/20' :
              healthData?.status === 'degraded' ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <Heart className={`w-8 h-8 ${
                healthData?.status === 'healthy' ? 'text-emerald-500' :
                healthData?.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
              }`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">System Health</h1>
              <p className="text-slate-400">Monitor database, disk, memory, and environment</p>
            </div>
            {healthData?.isDemo && (
              <span className="ml-4 px-3 py-1 bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-full border border-indigo-500/30">
                Demo Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                data-health-search
                placeholder="Search components (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 transition-colors"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`filter-toggle flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
                title="Toggle filters (F)"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              {/* Filter & Sort Panel */}
              {showFilters && (
                <div className="filter-menu absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">Filter & Sort</h3>
                    <span className="text-xs text-cyan-400">(1-4 to filter, 0 to clear)</span>
                  </div>
                  <div className="p-3 border-b border-slate-700">
                    <label className="block text-xs text-slate-400 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="healthy">Healthy</option>
                      <option value="degraded">Degraded</option>
                      <option value="unhealthy">Unhealthy</option>
                    </select>
                  </div>
                  <div className="p-3 border-b border-slate-700">
                    <label className="block text-xs text-slate-400 mb-2">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="component">Component</option>
                        <option value="status">Status</option>
                        <option value="latency">Latency</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortOrder === 'asc' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title="Toggle sort order (S)"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="p-3 border-t border-slate-700">
                      <button
                        onClick={clearFilters}
                        className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
                title="Export (E)"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                  <button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export JSON
                  </button>
                  <button
                    onClick={exportToMarkdown}
                    className="w-full px-4 py-2 text-left text-sm text-cyan-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export Markdown
                  </button>
                </div>
              )}
            </div>
            
            {/* Print Button */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
                title="Print (P)"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-3 h-3" />
                    Print Health Report
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Status Overview Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Overall Status */}
        <div className={`bg-slate-900 rounded-xl p-6 border ${
          healthData?.status === 'healthy' ? 'border-emerald-500/30' :
          healthData?.status === 'degraded' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Overall Status</span>
            {getStatusIcon(healthData?.status || 'unknown')}
          </div>
          <div className={`text-3xl font-bold ${
            healthData?.status === 'healthy' ? 'text-emerald-500' :
            healthData?.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
          }`}>
            {healthData?.status?.toUpperCase() || 'UNKNOWN'}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {healthData?.checks.filter(c => c.status === 'healthy').length} of {healthData?.checks.length} components healthy
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Uptime</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {formatUptime(healthData?.uptime || 0)}
          </div>
          <div className="text-sm text-slate-500 mt-1">Server running time</div>
        </div>

        {/* Version */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Version</span>
            <Server className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {healthData?.version || '1.0.0'}
          </div>
          <div className="text-sm text-slate-500 mt-1">CinePilot API</div>
        </div>

        {/* Last Refresh */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Last Check</span>
            <Activity className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {lastRefresh?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
          </div>
          <div className="text-sm text-slate-500 mt-1">Auto-refresh: 30s</div>
        </div>
      </div>

      {/* Component Health Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Component Status</h2>
          {searchQuery && (
            <span className="text-sm text-slate-400">
              Showing {filteredChecks.length} of {healthData?.checks.length} components
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredChecks.length > 0 ? filteredChecks.map((check) => {
            const IconComponent = COMPONENT_ICONS[check.component] || Activity
            return (
              <div 
                key={check.component}
                className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${getStatusColor(check.status)}20` }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: getStatusColor(check.status) }} 
                      />
                    </div>
                    <span className="font-medium capitalize">{check.component}</span>
                  </div>
                  {getStatusIcon(check.status)}
                </div>
                <div className="text-sm text-slate-400 mb-2">{check.message}</div>
                {check.latencyMs !== undefined && (
                  <div className="text-xs text-slate-500">
                    Latency: {check.latencyMs}ms
                  </div>
                )}
                {/* Memory details */}
                {check.component === 'memory' && check.details && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Heap Usage</span>
                      <span>{(check.details as { heapPercent?: number }).heapPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(check.details as { heapPercent?: number }).heapPercent}%`,
                          backgroundColor: getStatusColor(check.status)
                        }}
                      />
                    </div>
                  </div>
                )}
                {/* Disk details */}
                {check.component === 'disk' && check.details && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Disk Usage</span>
                      <span>{(check.details as { usedPercent?: number }).usedPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(check.details as { usedPercent?: number }).usedPercent}%`,
                          backgroundColor: getStatusColor(check.status)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="col-span-full text-center py-8 text-slate-400">
              No components match your search.
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health History Chart */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Health History</h3>
          <div className="h-64">
            {healthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthHistory}>
                  <defs>
                    <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="database" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorDb)" 
                    name="Database"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="#6366f1" 
                    fillOpacity={1} 
                    fill="url(#colorDisk)" 
                    name="Disk"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#f59e0b" 
                    fillOpacity={1} 
                    fill="url(#colorMem)" 
                    name="Memory"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Collecting health data...
              </div>
            )}
          </div>
        </div>

        {/* Memory Usage Pie */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Memory Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getMemoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getMemoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk Usage Pie */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Disk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getDiskData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getDiskData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Latency */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Response Latency (ms)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={healthData?.checks.map(c => ({
                  component: c.component,
                  latency: c.latencyMs || 0
                })) || []}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="component" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Bar dataKey="latency" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-slate-500 text-sm">
        Last updated: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Never'}
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Search components</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">F</kbd>
              </div>
              {/* Number key shortcuts - context-aware */}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="text-xs text-amber-400 mb-2">Number Keys 1-4: Filter by status (auto-opens filter panel)</p>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                  <span className="text-slate-300 text-sm">Show all (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">1</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                  <span className="text-emerald-400 text-sm">Healthy (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">2</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                  <span className="text-amber-400 text-sm">Degraded (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">3</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg mb-2">
                  <span className="text-red-400 text-sm">Unhealthy (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">4</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg mb-2">
                  <span className="text-slate-300 text-sm">Clear filter</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">0</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300 text-sm">Show all</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">1</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                <span className="text-emerald-400 text-sm">Healthy only</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                <span className="text-amber-400 text-sm">Degraded only</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">3</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                <span className="text-red-400 text-sm">Unhealthy only</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg mb-2">
                <span className="text-slate-300 text-sm">Clear filter</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">0</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">S</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Export data</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">E</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-cyan-400">Export Markdown</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">M</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Print health report</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">P</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Refresh health data</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">R</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Show keyboard shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">?</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">Close modal / Clear search</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Esc</kbd>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-6 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
