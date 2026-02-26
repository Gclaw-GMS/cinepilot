// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'
import Link from 'next/link'

const DEMO_DOOD = [
  { character: 'Arjun', total_days: 15, days: [1,2,3,5,6,7,9,10,11,12,14,15,16,18,20] },
  { character: 'Priya', total_days: 12, days: [1,2,4,5,6,8,9,10,12,13,14,15] },
  { character: 'Mahendra', total_days: 8, days: [3,7,11,15,16,17,18,19] },
  { character: 'Sathya', total_days: 10, days: [1,4,5,9,10,14,15,16,20,21] },
  { character: 'Divya', total_days: 6, days: [2,3,8,12,13,19] },
]

export default function DOODPage() {
  const [report, setReport] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(1)

  useEffect(() => {
    loadDOOD()
  }, [selectedProject])

  const loadDOOD = async () => {
    setLoading(true)
    try {
      const data = await api.dood.getReport(selectedProject)
      setReport((data as any).report || [])
    } catch (e) {
      setReport(DEMO_DOOD)
    }
    setLoading(false)
  }

  const totalShootingDays = Math.max(...report.map(r => Math.max(...r.days)), 0)

  // Generate calendar grid
  const renderCalendar = (days: number[]) => {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Array.from({ length: totalShootingDays }, (_, i) => {
          const dayNum = i + 1
          const isWorking = days.includes(dayNum)
          return (
            <div
              key={dayNum}
              className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                isWorking
                  ? 'bg-cinepilot-accent text-black font-medium'
                  : 'bg-gray-800 text-gray-600'
              }`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    )
  }

  // Stats
  const totalCalls = report.reduce((sum, r) => sum + r.total_days, 0)
  const avgDaysPerActor = report.length > 0 ? (totalCalls / report.length).toFixed(1) : 0

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">←</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">📊 Day Out of Days (DOOD)</h1>
          <p className="text-gray-500 text-sm mt-1">Track actor availability across shooting schedule</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded"
        >
          <option value={1}>இதயத்தின் ஒலி</option>
          <option value={2}>Veera's Journey</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-cinepilot-accent">{report.length}</div>
          <div className="text-xs text-gray-500">Total Characters</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{totalShootingDays}</div>
          <div className="text-xs text-gray-500">Shooting Days</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{totalCalls}</div>
          <div className="text-xs text-gray-500">Total Calls</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{avgDaysPerActor}</div>
          <div className="text-xs text-gray-500">Avg Days/Actor</div>
        </div>
      </div>

      {/* DOOD Table */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-400">Character</th>
              <th className="text-center p-4 font-medium text-gray-400">Total Days</th>
              <th className="text-center p-4 font-medium text-gray-400">% of Shoot</th>
              <th className="text-left p-4 font-medium text-gray-400">Shooting Schedule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {report.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30">
                <td className="p-4">
                  <div className="font-medium">{row.character}</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-cinepilot-accent font-bold text-lg">{row.total_days}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cinepilot-accent rounded-full"
                        style={{ width: `${(row.total_days / totalShootingDays) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12">
                      {((row.total_days / totalShootingDays) * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {renderCalendar(row.days)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cinepilot-accent rounded"></div>
          <span>Working Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 rounded"></div>
          <span>Off Day</span>
        </div>
      </div>

      {/* Export */}
      <div className="mt-6 flex gap-4">
        <button className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium hover:bg-cyan-400">
          📤 Export DOOD Report
        </button>
        <button className="px-4 py-2 bg-gray-700 rounded font-medium hover:bg-gray-600">
          📅 Sync with Schedule
        </button>
      </div>
    </div>
  )
}
