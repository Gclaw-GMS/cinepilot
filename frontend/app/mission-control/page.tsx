'use client'

import { useState, useEffect } from 'react'
import { 
  Radar as RadarIcon, Gauge, Activity, Zap, Target, TrendingUp, 
  Clock, Film, Users, DollarSign, MapPin, Calendar,
  AlertTriangle, CheckCircle, Play, Pause, RotateCcw, Download
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// Live ticker messages
const TICKER_MESSAGES = [
  { time: '14:32', msg: 'Scene 23B completed - Ooty Hill', type: 'success' },
  { time: '14:28', msg: 'Lunch break started - 1hr', type: 'info' },
  { time: '14:15', msg: 'Equipment check-in: Camera Dept', type: 'info' },
  { time: '14:02', msg: 'Weather alert: Rain expected 16:00', type: 'warning' },
]

function LiveTicker() {
  const [tick, setTick] = useState(0)
  
  useEffect(() => { 
    const i = setInterval(() => setTick(t => (t + 1) % 4), 4000)
    return () => clearInterval(i)
  }, [])
  
  const m = TICKER_MESSAGES[tick]
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

// Mock data
const MOCK_DATA = {
  production: {
    overall: 73,
    scenes: { total: 156, completed: 98, remaining: 58 },
    schedule: { daysTotal: 45, daysElapsed: 28, daysRemaining: 17 },
    budget: { total: 50000000, spent: 32000000, remaining: 18000000 },
  },
  today: {
    scenesShot: 4,
    scenesPlanned: 8,
    crewPresent: 45,
    crewTotal: 52,
    hoursRemaining: 6,
  },
  weekly: [
    { day: 'Mon', budget: 120000, scenes: 5 },
    { day: 'Tue', budget: 95000, scenes: 4 },
    { day: 'Wed', budget: 140000, scenes: 6 },
    { day: 'Thu', budget: 80000, scenes: 3 },
    { day: 'Fri', budget: 110000, scenes: 5 },
    { day: 'Sat', budget: 135000, scenes: 6 },
    { day: 'Sun', budget: 90000, scenes: 4 },
  ],
  departments: [
    { name: 'Camera', health: 92, members: 12 },
    { name: 'Lighting', health: 88, members: 8 },
    { name: 'Sound', health: 95, members: 6 },
    { name: 'Art', health: 76, members: 15 },
    { name: 'Makeup', health: 84, members: 4 },
  ],
  risks: [
    { level: 'high', title: 'Weather - Rain predicted', daysLeft: 2 },
    { level: 'medium', title: 'Equipment delay', daysLeft: 5 },
    { level: 'low', title: 'Cast availability', daysLeft: 12 },
  ],
  locations: [
    { name: 'Chennai Studio', scenes: 45, progress: 78 },
    { name: 'Ooty Hill', scenes: 32, progress: 45 },
    { name: 'Madurai Temple', scenes: 21, progress: 90 },
  ],
}

const PIE_DATA = [
  { name: 'Completed', value: 63, color: '#10b981' },
  { name: 'In Progress', value: 22, color: '#f59e0b' },
  { name: 'Pending', value: 15, color: '#64748b' },
]

export default function MissionControl() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <LiveTicker />
      
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
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-slate-500 font-mono">PRODUCTION DAY</p>
              <p className="text-2xl font-mono font-bold text-purple-400">
                DAY {MOCK_DATA.production.schedule.daysElapsed}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                <Play className="w-5 h-5 text-emerald-400" />
              </button>
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                <Download className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                  <circle cx="80" cy="80" r="70" stroke="url(#grad)" strokeWidth="12" fill="none" 
                    strokeDasharray="440" strokeDashoffset="120" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text">
                    {MOCK_DATA.production.overall}%
                  </span>
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
                <AreaChart data={MOCK_DATA.weekly}>
                  <defs>
                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v/1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="budget" stroke="#10b981" fill="url(#budgetGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
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
              <PulseItem label="Scenes Shot" value={`${MOCK_DATA.today.scenesShot}/${MOCK_DATA.today.scenesPlanned}`} icon={Film} color="violet" />
              <PulseItem label="Crew Present" value={`${MOCK_DATA.today.crewPresent}/${MOCK_DATA.today.crewTotal}`} icon={Users} color="cyan" />
              <PulseItem label="Hours Left" value={MOCK_DATA.today.hoursRemaining.toString()} icon={Clock} color="emerald" />
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
              {MOCK_DATA.risks.map((risk, i) => (
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
              ))}
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
              {MOCK_DATA.departments.map((dept, i) => (
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
              ))}
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
                <BarChart data={MOCK_DATA.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="scenes" fill="#8b5cf6" name="Scenes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" fill="#06b6d4" name="Budget (₹K)" radius={[4, 4, 0, 0]} />
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
              {MOCK_DATA.locations.map((loc, i) => (
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
              ))}
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
