'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
interface Project {
  id: number
  name: string
  description: string
  language: string
  status: string
  budget: number
  created_at: string
}
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Film, Clapperboard, Calendar, DollarSign, Users, TrendingUp, 
  Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
  FolderOpen, Plus, RefreshCw
} from 'lucide-react'

// Professional color palette
const COLORS = {
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Violet
  success: '#10b981',      // Emerald
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  info: '#06b6d4',         // Cyan
  muted: '#64748b',       // Slate
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899']

// Demo data for visualization
const BUDGET_DATA = [
  { month: 'Jan', budget: 4500000, spent: 3200000 },
  { month: 'Feb', budget: 4800000, spent: 4100000 },
  { month: 'Mar', budget: 5200000, spent: 3800000 },
  { month: 'Apr', budget: 5500000, spent: 4900000 },
  { month: 'May', budget: 6000000, spent: 5200000 },
  { month: 'Jun', budget: 6500000, spent: 5800000 },
]

const SCENE_DATA = [
  { name: ' INT', count: 156, color: '#6366f1' },
  { name: 'EXT', count: 89, color: '#8b5cf6' },
  { name: 'Day', count: 178, color: '#10b981' },
  { name: 'Night', count: 67, color: '#f59e0b' },
]

const CREW_DATA = [
  { dept: 'Camera', assigned: 12, needed: 15 },
  { dept: 'Lights', assigned: 8, needed: 10 },
  { dept: 'Sound', assigned: 6, needed: 8 },
  { dept: 'Art', assigned: 10, needed: 12 },
  { dept: 'Makeup', assigned: 4, needed: 5 },
]

const PROGRESS_DATA = [
  { phase: 'Pre-Pro', complete: 85 },
  { phase: 'Production', complete: 45 },
  { phase: 'Post-Pro', complete: 20 },
]

const STATUS_DATA = [
  { name: 'Planning', value: 3, color: '#6366f1' },
  { name: 'In Progress', value: 5, color: '#f59e0b' },
  { name: 'Completed', value: 2, color: '#10b981' },
  { name: 'On Hold', value: 1, color: '#ef4444' },
]

const RECENT_ACTIVITY = [
  { id: 1, action: 'Scene 12.3 completed', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'Budget updated (+$50K)', time: '4 hours ago', type: 'info' },
  { id: 3, action: 'New crew member added', time: '6 hours ago', type: 'success' },
  { id: 4, action: 'Location permit pending', time: '1 day ago', type: 'warning' },
]

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setProjects(DEMO_PROJECTS)
    setLoading(false)
  }, [])

  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0)
  const totalSpent = totalBudget * 0.72 // Simulated
  const activeProjects = projects.filter(p => p.status === 'shooting').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Production Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time overview of all productions</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Total Budget"
            value={`₹${(totalBudget / 10000000).toFixed(1)}Cr`}
            change="+12.5%"
            trend="up"
            icon={DollarSign}
          />
          <KpiCard
            title="Spent"
            value={`₹${(totalSpent / 10000000).toFixed(1)}Cr`}
            change="+8.2%"
            trend="up"
            icon={TrendingUp}
          />
          <KpiCard
            title="Active Projects"
            value={activeProjects.toString()}
            change="+2"
            trend="up"
            icon={Film}
          />
          <KpiCard
            title="Completion"
            value="68%"
            change="+5%"
            trend="up"
            icon={CheckCircle}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Budget vs Spending</h3>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Last 6 months</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={BUDGET_DATA}>
                  <defs>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v/1000000}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [`₹${(value/1000000).toFixed(1)}M`, '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="budget" stroke={COLORS.primary} fill="url(#budgetGradient)" strokeWidth={2} name="Budget" />
                  <Area type="monotone" dataKey="spent" stroke={COLORS.success} fill="url(#spentGradient)" strokeWidth={2} name="Spent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Project Status</h3>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Distribution</span>
            </div>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {STATUS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scene Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Scene Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCENE_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={50} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Crew Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Crew Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CREW_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dept" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="assigned" fill={COLORS.success} name="Assigned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="needed" fill={COLORS.muted} name="Needed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Phase Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PROGRESS_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="phase" type="category" stroke="#64748b" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Complete']}
                  />
                  <Bar dataKey="complete" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                    {PROGRESS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.primary : index === 1 ? COLORS.warning : COLORS.success} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-emerald-500' : 
                  item.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                }`} />
                <span className="flex-1 text-slate-300">{item.action}</span>
                <span className="text-slate-500 text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// KPI Card Component
function KpiCard({ title, value, change, trend, icon: Icon }: { 
  title: string; value: string; change: string; trend: 'up' | 'down'; icon: any 
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold mt-2">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <Icon className={`w-5 h-5 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3">
        {trend === 'up' ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>{change}</span>
        <span className="text-slate-500 text-sm ml-1">vs last month</span>
      </div>
    </div>
  )
}

const DEMO_PROJECTS: Project[] = [
  { id: 1, name: 'Vaalimai', description: 'Drama', language: 'tamil', status: 'shooting', budget: 50000000, created_at: '2026-01-15' },
  { id: 2, name: 'Kadhal Try Pannala Da', description: 'Rom-Com', language: 'tamil', status: 'planning', budget: 35000000, created_at: '2026-02-01' },
  { id: 3, name: 'Project Phoenix', description: 'Action', language: 'telugu', status: 'completed', budget: 75000000, created_at: '2025-11-20' },
]
