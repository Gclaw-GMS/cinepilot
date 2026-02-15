// CinePilot - Production Analytics Dashboard Component
// Enhanced analytics with charts and insights

'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

interface ProductionAnalyticsProps {
  projectId?: number
}

// Demo data
const BUDGET_DATA = [
  { name: 'Pre-Production', estimated: 300000, actual: 280000 },
  { name: 'Production', estimated: 1800000, actual: 1650000 },
  { name: 'Post-Production', estimated: 600000, actual: 550000 },
  { name: 'Contingency', estimated: 300000, actual: 0 },
]

const SCENE_DISTRIBUTION = [
  { name: 'Day/Ext', value: 25, color: '#22c55e' },
  { name: 'Day/Int', value: 15, color: '#f59e0b' },
  { name: 'Night/Ext', value: 10, color: '#6366f1' },
  { name: 'Night/Int', value: 20, color: '#8b5cf6' },
]

const WEEKLY_PROGRESS = [
  { week: 'Week 1', scenes: 5, budget: 150000 },
  { week: 'Week 2', scenes: 8, budget: 280000 },
  { week: 'Week 3', scenes: 12, budget: 420000 },
  { week: 'Week 4', scenes: 8, budget: 350000 },
]

const LOCATION_USAGE = [
  { location: 'Temple', days: 5, scenes: 8, cost: 150000 },
  { location: 'Studio', days: 10, scenes: 20, cost: 500000 },
  { location: 'Street', days: 4, scenes: 6, cost: 80000 },
  { location: 'Beach', days: 2, scenes: 4, cost: 60000 },
  { location: 'Office', days: 4, scenes: 7, cost: 120000 },
]

const CREW_DEPARTMENT_COSTS = [
  { department: 'Cast', cost: 1500000, percentage: 50 },
  { department: 'Camera', cost: 450000, percentage: 15 },
  { department: 'Direction', cost: 300000, percentage: 10 },
  { department: 'Art', cost: 200000, percentage: 7 },
  { department: 'Music', cost: 150000, percentage: 5 },
  { department: 'Other', cost: 400000, percentage: 13 },
]

const SHOOTING_PROGRESS = [
  { day: 1, completed: 3, planned: 4 },
  { day: 2, completed: 4, planned: 4 },
  { day: 3, completed: 2, planned: 5 },
  { day: 4, completed: 5, planned: 5 },
  { day: 5, completed: 4, planned: 6 },
  { day: 6, completed: 0, planned: 4 },
  { day: 7, completed: 6, planned: 6 },
]

const COLORS = ['#22c55e', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6']

export default function ProductionAnalytics({ projectId = 1 }: ProductionAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'scenes' | 'crew'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/4"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    )
  }

  const totalEstimated = BUDGET_DATA.reduce((sum, item) => sum + item.estimated, 0)
  const totalActual = BUDGET_DATA.reduce((sum, item) => sum + item.actual, 0)
  const budgetVariance = totalEstimated - totalActual

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Production Analytics</h2>
          <p className="text-gray-500 text-sm">Detailed insights and metrics</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'budget', 'scenes', 'crew'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-cinepilot-accent text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Key Metrics */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-cinepilot-accent">45</div>
            <div className="text-sm text-gray-400">Total Scenes</div>
            <div className="text-xs text-green-400 mt-1">+5 this week</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-purple-400">70%</div>
            <div className="text-sm text-gray-400">Budget Utilized</div>
            <div className="text-xs text-gray-500 mt-1">₹{totalActual.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-green-400">18</div>
            <div className="text-sm text-gray-400">Shooting Days</div>
            <div className="text-xs text-gray-500 mt-1">of 25 planned</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400">8</div>
            <div className="text-sm text-gray-400">Locations</div>
            <div className="text-xs text-gray-500 mt-1">3 pending permits</div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={WEEKLY_PROGRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="scenes" stroke="#22c55e" strokeWidth={2} name="Scenes" />
                <Line type="monotone" dataKey="budget" stroke="#8b5cf6" strokeWidth={2} name="Budget (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Scene Distribution Pie */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Scene Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={SCENE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {SCENE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          {/* Budget Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400">Total Budget</div>
              <div className="text-2xl font-bold">₹{totalEstimated.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400">Spent</div>
              <div className="text-2xl font-bold text-yellow-400">₹{totalActual.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400">Remaining</div>
              <div className="text-2xl font-bold text-green-400">₹{budgetVariance.toLocaleString()}</div>
            </div>
          </div>

          {/* Budget Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Budget by Phase</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={BUDGET_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="estimated" fill="#6366f1" name="Estimated (₹)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#22c55e" name="Actual (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {CREW_DEPARTMENT_COSTS.map((item, index) => (
                <div key={item.department} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-300">{item.department}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm">
                    <span className="text-gray-300">₹{(item.cost / 100000).toFixed(1)}L</span>
                    <span className="text-gray-500 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scenes Tab */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          {/* Location Usage */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Location Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={LOCATION_USAGE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="location" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'cost') return `₹${value.toLocaleString()}`
                    return value
                  }}
                />
                <Bar dataKey="days" fill="#22c55e" name="Days" radius={[0, 4, 4, 0]} />
                <Bar dataKey="scenes" fill="#8b5cf6" name="Scenes" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Progress */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Daily Shooting Progress</h3>
            <div className="grid grid-cols-7 gap-2">
              {SHOOTING_PROGRESS.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Day {day.day}</div>
                  <div className="flex flex-col gap-1">
                    <div 
                      className="bg-green-500 rounded text-xs py-1"
                      style={{ height: `${day.completed * 8}px`, minHeight: '8px' }}
                    />
                    <div 
                      className="bg-gray-600 rounded text-xs py-1"
                      style={{ height: `${(day.planned - day.completed) * 8}px`, minHeight: '8px' }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{day.completed}/{day.planned}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                <span className="text-xs text-gray-400">Remaining</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew Tab */}
      {activeTab === 'crew' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-3xl font-bold text-purple-400">8</div>
              <div className="text-sm text-gray-400">Cast Members</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-3xl font-bold text-blue-400">25</div>
              <div className="text-sm text-gray-400">Crew Members</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-3xl font-bold text-green-400">₹1.5L</div>
              <div className="text-sm text-gray-400">Daily Cost</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-3xl font-bold text-yellow-400">33</div>
              <div className="text-sm text-gray-400">Total Team</div>
            </div>
          </div>

          {/* Crew Cost Distribution */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-4">Crew Cost Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={CREW_DEPARTMENT_COSTS}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="cost"
                  label={({ department, percentage }) => `${department} ${percentage}%`}
                  labelLine={true}
                >
                  {CREW_DEPARTMENT_COSTS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
