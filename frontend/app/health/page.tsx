'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Activity, Server, Database, Wifi, WifiOff, 
  Clock, CheckCircle, XCircle, AlertTriangle, 
  RefreshCw, Cpu, HardDrive, Globe, Zap,
  Package, Calendar, FileText, Code
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  database: {
    status: 'connected' | 'disconnected'
    latencyMs?: number
    error?: string
    records?: number
  }
  services: {
    name: string
    status: 'up' | 'down'
    latencyMs?: number
    details?: string
  }[]
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      loadAverage: number[]
    }
    nodeVersion: string
    platform: string
  }
  endpoints: {
    name: string
    status: 'reachable' | 'unreachable'
    latencyMs?: number
  }[]
  responseTimeMs: number
}

interface EndpointStatus {
  name: string
  path: string
  status: 'checking' | 'up' | 'down'
  latencyMs?: number
  error?: string
}

const CORE_ENDPOINTS = [
  { name: 'Projects', path: '/api/projects' },
  { name: 'Scripts', path: '/api/scripts' },
  { name: 'Schedule', path: '/api/schedule' },
  { name: 'Budget', path: '/api/budget' },
  { name: 'Crew', path: '/api/crew' },
  { name: 'Weather', path: '/api/weather' },
  { name: 'WhatsApp', path: '/api/whatsapp' },
  { name: 'Analytics', path: '/api/analytics' },
  { name: 'Reports', path: '/api/reports' },
  { name: 'Health', path: '/api/health' },
]

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>(
    CORE_ENDPOINTS.map(ep => ({ ...ep, status: 'checking' as const }))
  )
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [history, setHistory] = useState<{time: string, responseTime: number, status: string}[]>([])

  const fetchHealth = useCallback(async () => {
    setRefreshing(true)
    try {
      const startTime = Date.now()
      const res = await fetch('/api/health')
      const data: HealthResponse = await res.json()
      const responseTime = Date.now() - startTime
      
      setHealth(data)
      setLastRefresh(new Date())
      
      // Add to history
      setHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          responseTime,
          status: data.status
        }
        const updated = [...prev, newEntry].slice(-20) // Keep last 20 entries
        return updated
      })
    } catch (error) {
      console.error('Failed to fetch health:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  const checkEndpoints = useCallback(async () => {
    setEndpoints(prev => prev.map(ep => ({ ...ep, status: 'checking' as const })))
    
    for (let i = 0; i < CORE_ENDPOINTS.length; i++) {
      const ep = CORE_ENDPOINTS[i]
      const startTime = Date.now()
      try {
        const res = await fetch(ep.path, { method: 'HEAD' })
        const latency = Date.now() - startTime
        
        setEndpoints(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: res.ok ? 'up' : 'down', latencyMs: latency } : e
        ))
      } catch (error) {
        setEndpoints(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'down', error: 'Connection failed' } : e
        ))
      }
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    checkEndpoints()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth()
      checkEndpoints()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchHealth, checkEndpoints])

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'reachable':
      case 'connected':
        return 'text-green-400'
      case 'degraded':
        return 'text-yellow-400'
      case 'unhealthy':
      case 'down':
      case 'disconnected':
      case 'unreachable':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'reachable':
      case 'connected':
        return 'bg-green-400/10 border-green-400/30'
      case 'degraded':
        return 'bg-yellow-400/10 border-yellow-400/30'
      case 'unhealthy':
      case 'down':
      case 'disconnected':
      case 'unreachable':
        return 'bg-red-400/10 border-red-400/30'
      default:
        return 'bg-gray-800/50 border-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'reachable':
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'unhealthy':
      case 'down':
      case 'disconnected':
      case 'unreachable':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking system health...</p>
        </div>
      </div>
    )
  }

  const healthyCount = endpoints.filter(e => e.status === 'up').length
  const totalEndpoints = endpoints.length
  const healthPercentage = Math.round((healthyCount / totalEndpoints) * 100)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${getStatusBg(health?.status || 'unhealthy')}`}>
            <Activity className={`w-6 h-6 ${getStatusColor(health?.status || 'unhealthy')}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              System Health
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(health?.status || 'unhealthy')} ${getStatusColor(health?.status || 'unhealthy')}`}>
                {health?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time system monitoring and endpoint status
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            fetchHealth()
            checkEndpoints()
          }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Uptime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {health ? formatUptime(health.uptime) : '--'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Since last restart</div>
        </div>

        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Response Time</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {health?.responseTimeMs || '--'}ms
          </div>
          <div className="text-xs text-gray-500 mt-1">API response</div>
        </div>

        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Endpoints</span>
            <Globe className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {healthyCount}/{totalEndpoints}
          </div>
          <div className="text-xs text-gray-500 mt-1">{healthPercentage}% healthy</div>
        </div>

        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Database</span>
            <Database className={`w-4 h-4 ${getStatusColor(health?.database?.status || 'unknown')}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {health?.database?.latencyMs || '--'}ms
          </div>
          <div className="text-xs text-gray-500 mt-1">{health?.database?.status || 'unknown'}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            System Resources
          </h3>
          
          <div className="space-y-4">
            {/* Memory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Memory</span>
                </div>
                <span className="text-sm text-gray-400">
                  {health?.system?.memory?.used || 0}MB / {health?.system?.memory?.total || 0}MB
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${health?.system?.memory?.percentage || 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{health?.system?.memory?.percentage || 0}% used</div>
            </div>

            {/* CPU */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">CPU Load</span>
                </div>
                <span className="text-sm text-gray-400">
                  {health?.system?.cpu?.loadAverage?.map(l => l.toFixed(2)).join(' / ') || '0.00'}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((health?.system?.cpu?.loadAverage?.[0] || 0) * 33, 100)}%` }}
                />
              </div>
            </div>

            {/* Environment Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs text-gray-500">Node.js</div>
                  <div className="text-sm text-white">{health?.system?.nodeVersion || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-xs text-gray-500">Platform</div>
                  <div className="text-sm text-white">{health?.system?.platform || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-400" />
            Database Status
          </h3>
          
          <div className={`p-4 rounded-lg border ${getStatusBg(health?.database?.status || 'unknown')}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(health?.database?.status || 'unknown')}
                <span className="font-medium text-white">PostgreSQL</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(health?.database?.status || 'unknown')}`}>
                {health?.database?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            
            {health?.database?.status === 'connected' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Latency</div>
                  <div className="text-lg font-bold text-white">{health.database.latencyMs}ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Records</div>
                  <div className="text-lg font-bold text-white">{health.database.records?.toLocaleString() || 'N/A'}</div>
                </div>
              </div>
            )}
            
            {health?.database?.error && (
              <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                <div className="text-sm text-red-400">{health.database.error}</div>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">External Services</h4>
            <div className="space-y-2">
              {health?.services?.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="text-sm text-white">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </div>
                    {service.latencyMs && (
                      <div className="text-xs text-gray-500">{service.latencyMs}ms</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Status */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          API Endpoints
          <span className="ml-auto text-sm font-normal text-gray-500">
            {healthyCount} of {totalEndpoints} operational
          </span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {endpoints.map((endpoint, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-lg border ${getStatusBg(endpoint.status)} transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-1">
                {endpoint.status === 'checking' ? (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                ) : endpoint.status === 'up' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                {endpoint.latencyMs && (
                  <span className="text-xs text-gray-500">{endpoint.latencyMs}ms</span>
                )}
              </div>
              <div className="text-sm font-medium text-white truncate">{endpoint.name}</div>
              <div className="text-xs text-gray-500 truncate">{endpoint.path}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Time History */}
      {history.length > 1 && (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Response Time History
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}ms`, 'Response Time']}
                />
                <Area 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#06b6d4" 
                  fillOpacity={1} 
                  fill="url(#colorResponse)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastRefresh ? lastRefresh.toLocaleString() : 'Never'}
        <span className="mx-2">•</span>
        Auto-refreshes every 30 seconds
        <span className="mx-2">•</span>
        Version: {health?.version || 'N/A'}
      </div>
    </div>
  )
}
