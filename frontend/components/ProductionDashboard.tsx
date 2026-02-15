'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

interface ProductionMetrics {
  total_scenes: number
  completed_scenes: number
  total_shoot_days: number
  used_shoot_days: number
  budget_spent: number
  budget_remaining: number
  crew_utilization: number
  equipment_usage: number
}

interface Alert {
  type: 'warning' | 'info' | 'error'
  message: string
}

interface ProductionDashboardProps {
  projectId: number
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated data fetch
    setTimeout(() => {
      setMetrics({
        total_scenes: 45,
        completed_scenes: 28,
        total_shoot_days: 20,
        used_shoot_days: 12,
        budget_spent: 4500000,
        budget_remaining: 500000,
        crew_utilization: 85,
        equipment_usage: 72
      })
      setAlerts([
        { type: 'warning', message: '2 scenes behind schedule' },
        { type: 'info', message: 'Equipment return due tomorrow' }
      ])
      setLoading(false)
    }, 1000)
  }, [projectId])

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-gray-800 rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  const sceneProgress = (metrics.completed_scenes / metrics.total_scenes) * 100
  const dayProgress = (metrics.used_shoot_days / metrics.total_shoot_days) * 100
  const budgetUsed = (metrics.budget_spent / (metrics.budget_spent + metrics.budget_remaining)) * 100

  // Sample chart data
  const dailyProgress = [
    { day: 'Day 1', scenes: 3, budget: 150000 },
    { day: 'Day 2', scenes: 4, budget: 180000 },
    { day: 'Day 3', scenes: 2, budget: 120000 },
    { day: 'Day 4', scenes: 5, budget: 220000 },
    { day: 'Day 5', scenes: 3, budget: 160000 },
    { day: 'Day 6', scenes: 4, budget: 190000 },
  ]

  const budgetBreakdown = [
    { name: 'Pre-Production', value: 15 },
    { name: 'Production', value: 55 },
    { name: 'Post-Production', value: 20 },
    { name: 'Contingency', value: 10 },
  ]

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg flex items-center gap-2 ${
                alert.type === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                alert.type === 'error' ? 'bg-red-900/30 text-red-400' :
                'bg-blue-900/30 text-blue-400'
              }`}
            >
              <span>•</span> {alert.message}
            </motion.div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Scene Progress"
          value={`${metrics.completed_scenes}/${metrics.total_scenes}`}
          subtitle={`${sceneProgress.toFixed(0)}% complete`}
          progress={sceneProgress}
          color="indigo"
        />
        <MetricCard
          title="Shoot Days"
          value={`${metrics.used_shoot_days}/${metrics.total_shoot_days}`}
          subtitle={`${dayProgress.toFixed(0)}% used`}
          progress={dayProgress}
          color="purple"
        />
        <MetricCard
          title="Budget"
          value={`₹${(metrics.budget_spent / 100000).toFixed(1)}L`}
          subtitle={`₹${(metrics.budget_remaining / 100000).toFixed(1)}L remaining`}
          progress={budgetUsed}
          color="green"
        />
        <MetricCard
          title="Crew Utilization"
          value={`${metrics.crew_utilization}%`}
          subtitle="Active crew"
          progress={metrics.crew_utilization}
          color="pink"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Progress Chart */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="scenes" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Budget Allocation</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {budgetBreakdown.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-gray-400 text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Usage */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Equipment Usage</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Camera', usage: 85 },
            { name: 'Lighting', usage: 72 },
            { name: 'Sound', usage: 68 },
            { name: 'Grip', usage: 54 }
          ].map(item => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{item.name}</span>
                <span className="text-white">{item.usage}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${item.usage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  progress: number
  color: 'indigo' | 'purple' | 'green' | 'pink'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, progress, color }) => {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
    >
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-gray-500 text-xs mb-3">{subtitle}</p>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`h-full bg-gradient-to-r ${colors[color]}`}
        />
      </div>
    </motion.div>
  )
}

export default ProductionDashboard
