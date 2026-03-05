"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, FileJson, Calendar, Loader2, CheckCircle, FileText } from 'lucide-react'

interface ExportType {
  id: string
  name: string
  format: string
  icon: string
  description?: string
}

interface ExportPanelProps {
  projectId?: string
}

export default function ExportPanel({ projectId = 'default-project' }: ExportPanelProps) {
  const [exportTypes, setExportTypes] = useState<ExportType[]>([])
  const [selectedType, setSelectedType] = useState<string>('schedule')
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  // Fetch available export types on mount
  useEffect(() => {
    fetch('/api/exports')
      .then(res => res.json())
      .then(data => {
        if (data.exportTypes) {
          setExportTypes(data.exportTypes)
        }
      })
      .catch(err => console.error('Failed to load export types:', err))
  }, [])

  const defaultExportTypes: ExportType[] = [
    { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅', description: 'Export shooting schedule' },
    { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰', description: 'Budget breakdown and expenses' },
    { id: 'shot_list', name: 'Shot List', format: 'PDF', icon: '🎬', description: 'Detailed shot breakdown' },
    { id: 'crew', name: 'Crew List', format: 'PDF', icon: '👥', description: 'Contact and role information' },
    { id: 'equipment', name: 'Equipment', format: 'CSV', icon: '🎥', description: 'Equipment inventory' },
    { id: 'full_json', name: 'Full Project', format: 'JSON', icon: '📦', description: 'Complete project data' },
    { id: 'locations', name: 'Locations', format: 'PDF', icon: '📍', description: 'Location data and details' },
  ]

  const types = exportTypes.length > 0 ? exportTypes : defaultExportTypes

  const toggleExportSelection = (id: string) => {
    setSelectedExports(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleSingleExport = async (type: string, format?: string) => {
    setLoading(true)
    setDownloadUrl(null)
    setMessage(null)

    const exportFormat = format || selectedFormat

    try {
      const response = await fetch(`/api/exports?type=${type}&format=${exportFormat}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }
      
      // Handle PDF response
      if (exportFormat === 'pdf') {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        setDownloadUrl(url)
        setDownloadName(`${type}_${new Date().toISOString().split('T')[0]}.pdf`)
        setMessage({ type: 'success', text: `${type} exported as PDF!` })
        setLoading(false)
        return
      }
      
      // Handle JSON response
      const data = await response.json()
      
      // Create downloadable blob
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      setDownloadName(`${type}_${new Date().toISOString().split('T')[0]}.json`)
      setMessage({ type: 'success', text: `${type} exported successfully!` })
      
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Export failed. Please try again.' 
      })
    }
    
    setLoading(false)
  }

  const handleBatchExport = async () => {
    if (selectedExports.length === 0) return
    setBatchLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: selectedExports })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Batch export failed')
      }
      
      const data = await response.json()
      
      // Create downloadable JSON file with all exports
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      setDownloadName(`cinepilot_batch_${new Date().toISOString().split('T')[0]}.json`)
      setMessage({ type: 'success', text: `Batch export (${selectedExports.length} files) ready!` })
      
    } catch (error) {
      console.error('Batch export error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Batch export failed' 
      })
    }
    
    setBatchLoading(false)
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-400" />
      case 'json':
        return <FileJson className="w-5 h-5 text-yellow-400" />
      case 'ics':
      case 'calendar':
        return <Calendar className="w-5 h-5 text-blue-400" />
      default:
        return '📄'
    }
  }

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Export Format
        </h3>
        
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedFormat('pdf')}
            className={`flex-1 p-4 rounded-xl text-center transition-all border ${
              selectedFormat === 'pdf'
                ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-400/50'
                : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="text-white font-medium">PDF Document</div>
            <div className="text-slate-400 text-xs mt-1">Best for printing & sharing</div>
          </button>
          
          <button
            onClick={() => setSelectedFormat('json')}
            className={`flex-1 p-4 rounded-xl text-center transition-all border ${
              selectedFormat === 'json'
                ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-400/50'
                : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="text-white font-medium">JSON Data</div>
            <div className="text-slate-400 text-xs mt-1">Best for automation & APIs</div>
          </button>
        </div>
      </div>

      {/* Export Types Grid */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-400" />
          Available Exports ({selectedFormat.toUpperCase()})
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSingleExport(item.id)}
              disabled={loading}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedType === item.id
                  ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-400/50'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-white font-medium text-sm">{item.name}</div>
              <div className="text-slate-400 text-xs mt-1">{selectedFormat.toUpperCase()}</div>
            </motion.button>
          ))}
        </div>

        {/* Quick Export Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            {selectedFormat === 'pdf' ? (
              <FileText className="w-4 h-4 text-red-400" />
            ) : (
              <FileJson className="w-4 h-4 text-yellow-400" />
            )}
            Quick {selectedFormat.toUpperCase()} Exports
          </h4>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'schedule', label: 'Schedule', icon: '📅' },
              { id: 'budget', label: 'Budget', icon: '💰' },
              { id: 'shot_list', label: 'Shots', icon: '🎬' },
              { id: 'crew', label: 'Crew', icon: '👥' },
              { id: 'locations', label: 'Locations', icon: '📍' },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSingleExport(item.id)}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{item.icon}</span>
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Batch Export Section */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" />
            Batch Export
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {types.slice(0, 6).map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedExports.includes(item.id)
                    ? 'bg-indigo-600/30 border border-indigo-500'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedExports.includes(item.id)}
                  onChange={() => toggleExportSelection(item.id)}
                  className="w-4 h-4 accent-indigo-500 rounded"
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {batchLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                📦 Export {selectedExports.length || 0} Files
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${
            message.type === 'success' 
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <span className="text-2xl">⚠️</span>
            )}
            <div>
              <h4 className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {message.type === 'success' ? 'Export Ready!' : 'Export Error'}
              </h4>
              <p className="text-slate-300 text-sm">{message.text}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Download Button */}
      {downloadUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6 text-indigo-400" />
              <div>
                <h4 className="text-indigo-400 font-semibold">Download Ready!</h4>
                <p className="text-slate-400 text-sm">{downloadName}</p>
              </div>
            </div>
            <a
              href={downloadUrl}
              download={downloadName}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mr-3" />
          <span className="text-slate-300">Generating export...</span>
        </div>
      )}

      {/* Format Info */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-400 text-sm">
          <span className="text-slate-300 font-medium">💡 Tip:</span> All exports are in JSON format by default. 
          Use the data with your preferred tool (Excel, Numbers, Python, etc.) for further processing.
        </p>
      </div>
    </div>
  )
}
