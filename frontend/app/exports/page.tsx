"use client"

import { useState, useEffect } from 'react'
import ExportPanel from '../components/export-panel'

interface RecentExport {
  id: string
  name: string
  icon: string
  timestamp: string
}

export default function ExportsPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [recentExports, setRecentExports] = useState<RecentExport[]>([
    { id: '1', name: 'Schedule Report', icon: '📄', timestamp: 'Today, 2:30 AM' },
    { id: '2', name: 'Shot List', icon: '📊', timestamp: 'Yesterday' },
    { id: '3', name: 'Shooting Calendar', icon: '📆', timestamp: 'Feb 13, 2026' },
  ])

  useEffect(() => {
    // Check if we're in demo mode
    fetch('/api/exports')
      .then(res => res.json())
      .then(data => {
        if (data.isDemoMode) {
          setIsDemoMode(true)
        }
      })
      .catch(() => setIsDemoMode(true))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Export Center</h1>
              <p className="text-slate-400 mt-2">Download production data in various formats</p>
            </div>
            {isDemoMode && (
              <span className="ml-auto px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          {isDemoMode && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 text-sm">
                ⚠️ Database unavailable. Showing demo data.
              </p>
            </div>
          )}
        </header>

        <ExportPanel />

        {/* Format Info */}
        <div className="mt-8 bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Export Formats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-white font-medium">PDF</div>
              <p className="text-slate-400 text-sm mt-1">
                Best for printing and sharing formal documents like call sheets and budgets
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white font-medium">Excel/CSV</div>
              <p className="text-slate-400 text-sm mt-1">
                Best for further analysis and manipulation in spreadsheet applications
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl mb-2">📆</div>
              <div className="text-white font-medium">ICS Calendar</div>
              <p className="text-slate-400 text-sm mt-1">
                Import shooting dates directly into Google Calendar, Outlook, or Apple Calendar
              </p>
            </div>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="mt-6 bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Exports</h3>
          <div className="space-y-2">
            {recentExports.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="text-white">{item.name}</span>
                </div>
                <span className="text-slate-500 text-sm">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
