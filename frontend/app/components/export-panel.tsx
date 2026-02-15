"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ExportPanelProps {
  projectId?: number
}

export default function ExportPanel({ projectId = 1 }: ExportPanelProps) {
  const [exportType, setExportType] = useState<'schedule' | 'callsheet' | 'budget' | 'shot_list' | 'crew' | 'equipment'>('schedule')
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const exportTypes = [
    { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅', description: 'Export shooting schedule as PDF' },
    { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋', description: 'Daily call sheet for cast & crew' },
    { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰', description: 'Budget breakdown and expenses' },
    { id: 'shot_list', name: 'Shot List', format: 'Excel', icon: '🎬', description: 'Detailed shot breakdown' },
    { id: 'crew', name: 'Crew List', format: 'Excel', icon: '👥', description: 'Contact and role information' },
    { id: 'equipment', name: 'Equipment', format: 'Excel', icon: '🎥', description: 'Equipment inventory' },
  ]

  const handleExport = async (type: string) => {
    setLoading(true)
    setDownloadUrl(null)
    
    try {
      let endpoint = '/api/export/pdf'
      let body = { type, project_id: projectId }
      
      if (['shot_list', 'crew', 'equipment'].includes(type)) {
        endpoint = '/api/export/excel'
      } else if (type === 'calendar') {
        endpoint = '/api/export/calendar'
      }
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      // Create download from response
      if (data.content) {
        const blob = new Blob([data.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
      }
    } catch (error) {
      console.error('Export error:', error)
      // Demo mode - create mock download
      const demoContent = `CinePilot Export - ${type}\nGenerated: ${new Date().toISOString()}`
      const blob = new Blob([demoContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
    }
    
    setLoading(false)
  }

  const calendarExport = async () => {
    setLoading(true)
    setDownloadUrl(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/export/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      })
      
      const data = await response.json()
      
      if (data.content) {
        const blob = new Blob([data.content], { type: 'text/calendar' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
      }
    } catch (error) {
      console.error('Calendar export error:', error)
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📤 Export Center</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {exportTypes.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(item.id)}
              disabled={loading}
              className={`p-4 rounded-xl text-left transition-all ${
                exportType === item.id
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-white font-medium">{item.name}</div>
              <div className="text-gray-400 text-sm">{item.format}</div>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-white font-medium mb-4">📆 Calendar Export</h4>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={calendarExport}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : '📥 Export to Calendar (ICS)'}
          </motion.button>
          <p className="text-gray-400 text-sm mt-2">
            Import shooting schedule into Google Calendar, Apple Calendar, or Outlook
          </p>
        </div>
      </div>

      {downloadUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/30 border border-green-500 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">✅</span>
            <div>
              <h4 className="text-green-400 font-semibold">Export Ready!</h4>
              <p className="text-gray-400 text-sm">Your file is ready for download</p>
            </div>
          </div>
          <a
            href={downloadUrl}
            download={`cinepilot_export_${Date.now()}`}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500"
          >
            📥 Download File
          </a>
        </motion.div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <h4 className="text-white font-medium mb-3">📌 Quick Export Links</h4>
        <div className="flex flex-wrap gap-3">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <span>📄</span> Project Summary
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <span>🎬</span> Scene Breakdown
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <span>📊</span> Daily Progress Report
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <span>💵</span> Expense Summary
          </button>
        </div>
      </div>
    </div>
  )
}
