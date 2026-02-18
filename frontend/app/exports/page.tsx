"use client"

import { useState } from 'react'
import ExportPanel from '../components/export-panel'

export default function ExportsPage() {
  return (
    <div className="p-8">
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">📤 Export Center</h1>
            <p className="text-gray-400 mt-2">Download production data in various formats</p>
          </header>

          <ExportPanel />

          {/* Format Info */}
          <div className="mt-8 bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">📄 Export Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl mb-2">📄</div>
                <div className="text-white font-medium">PDF</div>
                <p className="text-gray-400 text-sm mt-1">
                  Best for printing and sharing formal documents like call sheets and budgets
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-white font-medium">Excel/CSV</div>
                <p className="text-gray-400 text-sm mt-1">
                  Best for further analysis and manipulation in spreadsheet applications
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl mb-2">📆</div>
                <div className="text-white font-medium">ICS Calendar</div>
                <p className="text-gray-400 text-sm mt-1">
                  Import shooting dates directly into Google Calendar, Outlook, or Apple Calendar
                </p>
              </div>
            </div>
          </div>

          {/* Recent Exports */}
          <div className="mt-6 bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">🕐 Recent Exports</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span>📄</span>
                  <span className="text-white">Schedule Report</span>
                </div>
                <span className="text-gray-400 text-sm">Today, 2:30 AM</span>
              </div>
              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span>📊</span>
                  <span className="text-white">Shot List</span>
                </div>
                <span className="text-gray-400 text-sm">Yesterday</span>
              </div>
              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span>📆</span>
                  <span className="text-white">Shooting Calendar</span>
                </div>
                <span className="text-gray-400 text-sm">Feb 13, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
