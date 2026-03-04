'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Download, FileSpreadsheet, FileJson, Calendar, Loader2, 
  CheckCircle, X, RefreshCw, FileText, Package, Clock,
  CheckSquare, Square, File, Archive
} from 'lucide-react'

interface ExportType {
  id: string
  name: string
  format: string
  icon: string
  description?: string
}

interface RecentExport {
  id: string
  name: string
  type: string
  timestamp: string
  status: 'success' | 'failed'
}

const EXPORT_CATEGORIES = [
  {
    id: 'production',
    label: 'Production',
    exports: [
      { id: 'schedule', name: 'Shooting Schedule', format: 'JSON', icon: '📅', description: 'Day-by-day shooting plan' },
      { id: 'call_sheets', name: 'Call Sheets', format: 'PDF', icon: '📋', description: 'Daily call sheets for crew' },
      { id: 'shot_list', name: 'Shot List', format: 'CSV', icon: '🎬', description: 'Complete shot breakdown' },
      { id: 'storyboard', name: 'Storyboard Frames', format: 'JSON', icon: '🎞️', description: 'All storyboard frames' },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    exports: [
      { id: 'budget', name: 'Budget Report', format: 'XLSX', icon: '💰', description: 'Full budget breakdown' },
      { id: 'expenses', name: 'Expenses Log', format: 'CSV', icon: '📊', description: 'All expenses with details' },
      { id: 'crew_costs', name: 'Crew Costs', format: 'CSV', icon: '👥', description: 'Daily rates and totals' },
    ]
  },
  {
    id: 'creative',
    label: 'Creative',
    exports: [
      { id: 'scripts', name: 'Script Breakdown', format: 'PDF', icon: '📝', description: 'Scene-by-scene analysis' },
      { id: 'characters', name: 'Character Profiles', format: 'JSON', icon: '🎭', description: 'All characters with details' },
      { id: 'locations', name: 'Location Scout', format: 'PDF', icon: '📍', description: 'Location details and images' },
    ]
  },
  {
    id: 'admin',
    label: 'Administrative',
    exports: [
      { id: 'crew', name: 'Crew Directory', format: 'PDF', icon: '👨‍💼', description: 'Contact information' },
      { id: 'equipment', name: 'Equipment List', format: 'CSV', icon: '🎥', description: 'Rental inventory' },
      { id: 'full_backup', name: 'Full Backup', format: 'ZIP', icon: '📦', description: 'Complete project archive' },
    ]
  }
]

const FORMAT_INFO = [
  { 
    format: 'PDF', 
    label: 'PDF Documents', 
    desc: 'Best for printing and formal sharing',
    icon: '📄',
    color: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  { 
    format: 'XLSX', 
    label: 'Excel Spreadsheets', 
    desc: 'Best for data analysis and manipulation',
    icon: '📊',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  { 
    format: 'CSV', 
    label: 'CSV Files', 
    desc: 'Universal format for spreadsheets',
    icon: '📈',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  { 
    format: 'JSON', 
    label: 'JSON Data', 
    desc: 'For developers and API integration',
    icon: '💠',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  { 
    format: 'ZIP', 
    label: 'Archive Files', 
    desc: 'Compressed backup bundles',
    icon: '📦',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
]

export default function ExportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>('')
  const [recentExports, setRecentExports] = useState<RecentExport[]>([
    { id: '1', name: 'Schedule Report', type: 'schedule', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'success' },
    { id: '2', name: 'Shot List', type: 'shot_list', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'success' },
    { id: '3', name: 'Crew Directory', type: 'crew', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), status: 'success' },
  ])

  const handleExport = async (type: string) => {
    setLoading(type)
    setMessage(null)
    setDownloadUrl(null)

    try {
      const response = await fetch(`/api/exports?type=${type}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }
      
      const data = await response.json()
      
      // Create downloadable blob
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      setDownloadName(`${type}_${new Date().toISOString().split('T')[0]}.json`)
      setMessage({ type: 'success', text: `${type} exported successfully!` })
      
      // Add to recent exports
      const exportType = EXPORT_CATEGORIES.flatMap(c => c.exports).find(e => e.id === type)
      setRecentExports(prev => [{
        id: Date.now().toString(),
        name: exportType?.name || type,
        type,
        timestamp: new Date().toISOString(),
        status: 'success' as const
      }, ...prev].slice(0, 10))
      
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Export failed. Please try again.' 
      })
    }
    
    setLoading(null)
  }

  const toggleExportSelection = (id: string) => {
    setSelectedExports(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleBatchExport = async () => {
    if (selectedExports.length === 0) return
    setBatchLoading(true)
    setMessage(null)
    setDownloadUrl(null)
    
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
      
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      setDownloadName(`cinepilot_batch_${new Date().toISOString().split('T')[0]}.json`)
      setMessage({ type: 'success', text: `Batch export (${selectedExports.length} files) ready!` })
      
      // Add to recent exports
      setRecentExports(prev => [{
        id: Date.now().toString(),
        name: `Batch Export (${selectedExports.length} files)`,
        type: 'batch',
        timestamp: new Date().toISOString(),
        status: 'success' as const
      }, ...prev].slice(0, 10))
      
      setSelectedExports([])
      
    } catch (error) {
      console.error('Batch export error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Batch export failed' 
      })
    }
    
    setBatchLoading(false)
  }

  const selectAllInCategory = (categoryId: string) => {
    const category = EXPORT_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return
    
    const categoryIds = category.exports.map(e => e.id)
    const allSelected = categoryIds.every(id => selectedExports.includes(id))
    if (allSelected) {
      setSelectedExports(prev => prev.filter(e => !categoryIds.includes(e)))
    } else {
      setSelectedExports(prev => [...new Set([...prev, ...categoryIds])])
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Download className="w-5 h-5 text-white" />
              </div>
              Export Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Download production data in various formats
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedExports.length > 0 && (
              <button
                onClick={handleBatchExport}
                disabled={batchLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
              >
                {batchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Batch Export ({selectedExports.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <X className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Download Ready Banner */}
        {downloadUrl && (
          <div className="mb-6 p-4 rounded-xl border bg-indigo-500/10 border-indigo-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-indigo-400 font-medium">Download Ready</p>
                  <p className="text-slate-400 text-sm">{downloadName}</p>
                </div>
              </div>
              <a
                href={downloadUrl}
                download={downloadName}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Categories */}
          <div className="lg:col-span-2 space-y-6">
            {EXPORT_CATEGORIES.map((category) => (
              <div key={category.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{category.label}</h3>
                  <button
                    onClick={() => selectAllInCategory(category.id)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                  >
                    {category.exports.every(e => selectedExports.includes(e.id)) ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Select All
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {category.exports.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => handleExport(exp.id)}
                      disabled={loading === exp.id}
                      className={`p-4 rounded-xl text-left transition-all border flex items-start gap-3 ${
                        selectedExports.includes(exp.id)
                          ? 'bg-indigo-500/10 border-indigo-500/40'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-2xl shrink-0">{exp.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white text-sm">{exp.name}</span>
                          {loading === exp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          ) : selectedExports.includes(exp.id) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
                            {exp.format}
                          </span>
                          <span className="text-xs text-slate-500 truncate">{exp.description}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Format Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Export Formats
              </h3>
              <div className="space-y-3">
                {FORMAT_INFO.map((fmt) => (
                  <div key={fmt.format} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-xl">{fmt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{fmt.label}</p>
                      <p className="text-xs text-slate-500">{fmt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Exports */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Recent Exports
              </h3>
              {recentExports.length > 0 ? (
                <div className="space-y-2">
                  {recentExports.map((exp) => (
                    <div 
                      key={exp.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {exp.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-slate-300">{exp.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(exp.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">
                  No exports yet
                </p>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Use <span className="text-white">Batch Export</span> to download multiple files at once
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Export to <span className="text-white">CSV</span> for easy Excel/Numbers analysis
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-white">Full Backup</span> includes all project data in one ZIP
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-white">PDF</span> exports are print-ready
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
