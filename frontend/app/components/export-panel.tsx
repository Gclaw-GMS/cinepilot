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

  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  const exportTypes = [
    { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅', description: 'Export shooting schedule as PDF' },
    { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋', description: 'Daily call sheet for cast & crew' },
    { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰', description: 'Budget breakdown and expenses' },
    { id: 'shot_list', name: 'Shot List', format: 'Excel', icon: '🎬', description: 'Detailed shot breakdown' },
    { id: 'crew', name: 'Crew List', format: 'Excel', icon: '👥', description: 'Contact and role information' },
    { id: 'equipment', name: 'Equipment', format: 'Excel', icon: '🎥', description: 'Equipment inventory' },
    { id: 'json', name: 'Full Project JSON', format: 'JSON', icon: '📦', description: 'Complete project data backup' },
    { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍', description: 'Location data and details' },
  ]

  const toggleExportSelection = (id: string) => {
    setSelectedExports(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleBatchExport = async () => {
    if (selectedExports.length === 0) return
    setBatchLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/export/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: selectedExports, project_id: projectId })
      })
      
      const data = await response.json()
      
      if (data.zip_base64) {
        const byteCharacters = atob(data.zip_base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `cinepilot_batch_${Date.now()}.zip`
        link.click()
      }
    } catch (error) {
      console.error('Batch export error:', error)
      alert('Batch export requires backend. Demo mode unavailable.')
    }
    
    setBatchLoading(false)
  }

  const exportToJson = async (type: string) => {
    setLoading(true)
    setDownloadUrl(null)
    
    try {
      const response = await fetch(`http://localhost:8000/api/export/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, project_id: projectId })
      })
      
      const data = await response.json()
      
      if (data.content) {
        const blob = new Blob([data.content], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
      }
    } catch (error) {
      console.error('JSON export error:', error)
      // Demo mode
      const demoContent = JSON.stringify({
        project: "Demo Project",
        exported: new Date().toISOString(),
        type,
        data: []
      }, null, 2)
      const blob = new Blob([demoContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
    }
    
    setLoading(false)
  }

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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exportTypes.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => item.id === 'json' || item.id === 'locations' ? exportToJson(item.id) : handleExport(item.id)}
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

        {/* Batch Export Section */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-white font-medium mb-4">📚 Batch Export</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {exportTypes.slice(0, 6).map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedExports.includes(item.id)
                    ? 'bg-purple-600/30 border border-purple-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedExports.includes(item.id)}
                  onChange={() => toggleExportSelection(item.id)}
                  className="w-4 h-4 accent-purple-500"
                />
                <span className="text-white text-sm">{item.icon} {item.name}</span>
              </label>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBatchExport}
            disabled={batchLoading || selectedExports.length === 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {batchLoading ? 'Creating ZIP...' : `📦 Download ${selectedExports.length || 0} Files as ZIP`}
          </motion.button>
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
