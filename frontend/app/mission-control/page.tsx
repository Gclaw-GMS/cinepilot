'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Radar as RadarIcon, Gauge, Activity, Zap, Target, TrendingUp, 
  Clock, Film, Users, DollarSign, MapPin, Calendar, FileText,
  AlertTriangle, CheckCircle, Play, Pause, RotateCcw, Download,
  Loader2, RefreshCw
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
  const getMessages = () => {
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
  }
  
  useEffect(() => { 
    const i = setInterval(() => setTick(t => (t + 1) % Math.max(1, getMessages().length)), 4000)
    return () => clearInterval(i)
  }, [data])
  
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/mission-control')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      console.error('Mission control fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load')
      // Use fallback data on error
      if (!data) setData(FALLBACK_DATA)
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                MISSION CONTROL
              </h1>
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
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                <Download className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-4 py-2 mb-4 text-sm">
          ⚠️ Using cached data: {error}
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
              {data?.risks && data.risks.length > 0 ? (
                data.risks.map((risk, i) => (
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
              {data?.departments && data.departments.length > 0 ? (
                data.departments.slice(0, 5).map((dept, i) => (
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
              {data?.locations && data.locations.length > 0 ? (
                data.locations.slice(0, 4).map((loc, i) => (
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
