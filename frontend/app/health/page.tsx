'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Heart, Activity, Database, HardDrive, Cpu, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Clock, Server, 
  Zap, Thermometer, Gauge, Loader2, HelpCircle, X,
  Search, Download
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
  
  // Filtered checks based on search
  const filteredChecks = healthData?.checks.filter(check => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      check.component.toLowerCase().includes(query) ||
      check.status.toLowerCase().includes(query) ||
      (check.message?.toLowerCase().includes(query) ?? false)
    )
  }) || []

  // Export functions
  const exportToCSV = () => {
    if (!healthData) return
    const headers = ['Component', 'Status', 'Message', 'Latency (ms)']
    const rows = healthData.checks.map(c => [
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
      checks: healthData.checks,
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
          handleRefresh()
          break
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('[data-health-search]')?.focus()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setSearchQuery('')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchHealth()
  }, [fetchHealth])

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
            
            {/* Export Dropdown */}
            <div className="relative">
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
                <span className="text-slate-300">Export data</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">E</kbd>
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
