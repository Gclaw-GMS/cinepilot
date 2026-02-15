"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ProductionReportProps {
  projectId?: number
}

export default function ProductionReport({ projectId = 1 }: ProductionReportProps) {
  const [reportType, setReportType] = useState<'summary' | 'daily' | 'budget' | 'schedule'>('summary')
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const reportTypes = [
    { id: 'summary', name: 'Production Summary', icon: '📋', description: 'Overall project status' },
    { id: 'daily', name: 'Daily Report', icon: '📅', description: 'Daily progress breakdown' },
    { id: 'budget', name: 'Budget Report', icon: '💰', description: 'Financial overview' },
    { id: 'schedule', name: 'Schedule Report', icon: '🎬', description: 'Timeline analysis' },
  ]

  const generateReport = async (type: string) => {
    setGenerating(true)
    setReportType(type as any)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setReportData({
      generated_at: new Date().toISOString(),
      project_id: projectId,
      type,
      summary: {
        total_scenes: 45,
        completed_scenes: 28,
        shooting_days: 12,
        remaining_days: 8,
        budget_spent: 4500000,
        budget_total: 8000000,
        crew_count: 35,
        cast_count: 12,
        locations: 8,
      },
      daily_stats: [
        { date: '2026-02-14', scenes_shot: 5, pages: 3.2, budget_spent: 85000 },
        { date: '2026-02-13', scenes_shot: 4, pages: 2.8, budget_spent: 72000 },
        { date: '2026-02-12', scenes_shot: 6, pages: 4.1, budget_spent: 95000 },
        { date: '2026-02-11', scenes_shot: 3, pages: 2.0, budget_spent: 65000 },
        { date: '2026-02-10', scenes_shot: 5, pages: 3.5, budget_spent: 88000 },
      ],
      budget_breakdown: {
        pre_production: { spent: 800000, total: 1000000 },
        production: { spent: 3200000, total: 5000000 },
        post_production: { spent: 500000, total: 1500000 },
        contingency: { spent: 0, total: 500000 },
      },
      schedule_timeline: {
        start_date: '2026-02-01',
        end_date: '2026-03-15',
        total_days: 43,
        elapsed_days: 12,
        upcoming_milestones: [
          { name: 'Scene 30 Complete', date: '2026-02-18' },
          { name: 'Location Change', date: '2026-02-20' },
          { name: 'Mid-production Review', date: '2026-02-25' },
        ]
      }
    })
    
    setGenerating(false)
  }

  const progressPercent = (spent: number, total: number) => Math.round((spent / total) * 100)

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📊 Production Reports</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {reportTypes.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateReport(type.id)}
              disabled={generating}
              className={`p-4 rounded-xl text-center transition-all ${
                reportType === type.id
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="text-white font-medium">{type.name}</div>
              <div className="text-gray-400 text-xs">{type.description}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {generating ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-6xl mb-4"
          >
            ⚙️
          </motion.div>
          <p className="text-white text-lg">Generating report...</p>
          <p className="text-gray-400">Compiling production data</p>
        </div>
      ) : reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">Production Report</h3>
                <p className="text-white/80">{reportTypes.find(r => r.id === reportType)?.name}</p>
                <p className="text-white/60 text-sm mt-1">
                  Generated: {new Date(reportData.generated_at).toLocaleString()}
                </p>
              </div>
              <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100">
                📥 Export PDF
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Scenes Completed</div>
              <div className="text-3xl font-bold text-white mt-1">
                {reportData.summary.completed_scenes}
                <span className="text-gray-500 text-lg">/{reportData.summary.total_scenes}</span>
              </div>
              <div className="text-green-400 text-sm mt-1">
                {Math.round(reportData.summary.completed_scenes / reportData.summary.total_scenes * 100)}%
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Shooting Days</div>
              <div className="text-3xl font-bold text-white mt-1">
                {reportData.summary.shooting_days}
                <span className="text-gray-500 text-lg">/{reportData.summary.shooting_days + reportData.summary.remaining_days}</span>
              </div>
              <div className="text-yellow-400 text-sm mt-1">
                {reportData.summary.remaining_days} remaining
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Budget Spent</div>
              <div className="text-3xl font-bold text-white mt-1">
                ₹{(reportData.summary.budget_spent / 100000).toFixed(1)}L
              </div>
              <div className="text-gray-400 text-sm mt-1">
                of ₹{(reportData.summary.budget_total / 100000).toFixed(0)}L
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Crew & Cast</div>
              <div className="text-3xl font-bold text-white mt-1">
                {reportData.summary.crew_count}
                <span className="text-gray-500 text-lg">+{reportData.summary.cast_count}</span>
              </div>
              <div className="text-blue-400 text-sm mt-1">
                {reportData.summary.locations} locations
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          {reportType === 'summary' || reportType === 'budget' ? (
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-4">💰 Budget Breakdown</h4>
              <div className="space-y-4">
                {Object.entries(reportData.budget_breakdown).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-white">
                        ₹{(value.spent / 100000).toFixed(1)}L / ₹{(value.total / 100000).toFixed(1)}L
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent(value.spent, value.total)}%` }}
                        className={`h-full ${
                          key === 'contingency' ? 'bg-red-500' :
                          progressPercent(value.spent, value.total) > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Daily Stats */}
          {reportType === 'summary' || reportType === 'daily' ? (
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-4">📅 Recent Daily Stats</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-700">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Scenes</th>
                      <th className="text-right py-2">Pages</th>
                      <th className="text-right py-2">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.daily_stats.map((day: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-white">{day.date}</td>
                        <td className="py-3 text-right text-white">{day.scenes_shot}</td>
                        <td className="py-3 text-right text-white">{day.pages}</td>
                        <td className="py-3 text-right text-green-400">₹{day.budget_spent.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Schedule Timeline */}
          {reportType === 'summary' || reportType === 'schedule' ? (
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-4">🎬 Schedule Timeline</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Start Date</div>
                  <div className="text-white font-medium">{reportData.schedule_timeline.start_date}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">End Date</div>
                  <div className="text-white font-medium">{reportData.schedule_timeline.end_date}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Days Elapsed</div>
                  <div className="text-white font-medium">{reportData.schedule_timeline.elapsed_days} / {reportData.schedule_timeline.total_days}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Progress</div>
                  <div className="text-purple-400 font-medium">
                    {Math.round(reportData.schedule_timeline.elapsed_days / reportData.schedule_timeline.total_days * 100)}%
                  </div>
                </div>
              </div>
              
              <h5 className="text-white font-medium mb-3">Upcoming Milestones</h5>
              <div className="space-y-2">
                {reportData.schedule_timeline.upcoming_milestones.map((milestone: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                    <span className="text-purple-400">📌</span>
                    <span className="text-white flex-1">{milestone.name}</span>
                    <span className="text-gray-400 text-sm">{milestone.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  )
}
