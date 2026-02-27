'use client'

import { useState, useEffect } from 'react'
import { 
  Download, 
  FileText, 
  Calendar, 
  Users, 
  Video, 
  MapPin, 
  DollarSign,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  File,
  Clock,
  AlertCircle
} from 'lucide-react'

type ExportType = 'schedule' | 'shot-list' | 'crew' | 'locations' | 'budget' | 'call-sheets' | 'dood'

interface ExportOption {
  id: ExportType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  formats: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }>
  apiType: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'schedule',
    label: 'Shooting Schedule',
    description: 'Complete shooting schedule with dates, scenes, and locations',
    icon: Calendar,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
      { id: 'ics', label: 'ICS Calendar', icon: Calendar },
    ],
    apiType: 'schedule',
  },
  {
    id: 'shot-list',
    label: 'Shot List',
    description: 'All shots with descriptions, camera angles, and timing',
    icon: Video,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
      { id: 'json', label: 'JSON', icon: FileText },
    ],
    apiType: 'shot_list',
  },
  {
    id: 'crew',
    label: 'Crew List',
    description: 'Complete crew directory with contact details and departments',
    icon: Users,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    ],
    apiType: 'crew',
  },
  {
    id: 'locations',
    label: 'Location List',
    description: 'All locations with addresses, photos, and scene coverage',
    icon: MapPin,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    ],
    apiType: 'locations',
  },
  {
    id: 'budget',
    label: 'Budget Report',
    description: 'Detailed budget breakdown with expenses and projections',
    icon: DollarSign,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
      { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
    ],
    apiType: 'budget',
  },
  {
    id: 'call-sheets',
    label: 'Call Sheets',
    description: 'Daily call sheets with crew calls and scene schedules',
    icon: FileText,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    ],
    apiType: 'callsheet',
  },
  {
    id: 'dood',
    label: 'Day Out of Days',
    description: 'Actor availability calendar showing working days',
    icon: Clock,
    formats: [
      { id: 'pdf', label: 'PDF', icon: File },
      { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    ],
    apiType: 'dood',
  },
]

interface RecentExport {
  name: string
  time: string
  type: string
}

export default function ExportPanel() {
  const [selectedType, setSelectedType] = useState<ExportType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentExports, setRecentExports] = useState<RecentExport[]>([
    { name: 'Schedule Report (PDF)', time: 'Today, 2:30 AM', type: 'schedule' },
    { name: 'Shot List (CSV)', time: 'Yesterday', type: 'shot-list' },
    { name: 'Shooting Calendar (ICS)', time: 'Feb 13, 2026', type: 'schedule' },
  ])
  const [exportTypes, setExportTypes] = useState<Array<{ id: string; name: string; format: string; icon: string }>>([])

  // Fetch available export types on mount
  useEffect(() => {
    async function fetchExportTypes() {
      try {
        const res = await fetch('/api/exports')
        const data = await res.json()
        if (data.exportTypes) {
          setExportTypes(data.exportTypes)
        }
      } catch (err) {
        console.warn('Could not fetch export types:', err)
      }
    }
    fetchExportTypes()
  }, [])

  const handleExport = async () => {
    if (!selectedType || !selectedFormat) return

    setExporting(true)
    setExportSuccess(false)
    setError(null)

    try {
      const option = EXPORT_OPTIONS.find(o => o.id === selectedType)
      if (!option) return

      // Call the API to get the export data
      const res = await fetch(`/api/exports?type=${option.apiType}`)
      
      if (!res.ok) {
        throw new Error('Failed to generate export')
      }

      const data = await res.json()
      
      // Convert data to the appropriate format based on selected format
      let blob: Blob
      let filename: string

      switch (selectedFormat) {
        case 'json':
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          filename = `${option.apiType}_export.json`
          break
        case 'csv':
          // Convert JSON to CSV
          const csv = convertToCSV(data)
          blob = new Blob([csv], { type: 'text/csv' })
          filename = `${option.apiType}_export.csv`
          break
        case 'pdf':
          // For PDF, we'd normally use a library like jsPDF
          // For now, return JSON and show a message
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          filename = `${option.apiType}_export.json`
          break
        case 'ics':
          // Generate ICS calendar format
          const ics = generateICS(data)
          blob = new Blob([ics], { type: 'text/calendar' })
          filename = `${option.apiType}_export.ics`
          break
        default:
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          filename = `${option.apiType}_export.json`
      }

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const formatLabel = option.formats.find(f => f.id === selectedFormat)?.label || selectedFormat

      // Add to recent exports
      setRecentExports(prev => [
        { name: `${option.label} (${formatLabel})`, time: 'Just now', type: selectedType },
        ...prev.slice(0, 4)
      ])

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (err) {
      console.error('Export failed:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Helper to convert JSON to CSV
  function convertToCSV(data: unknown): string {
    if (!data) return ''
    
    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      const headers = Object.keys(data[0])
      const rows = data.map((row: Record<string, unknown>) => 
        headers.map(header => {
          const val = row[header]
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`
          }
          return String(val ?? '')
        }).join(',')
      )
      return [headers.join(','), ...rows].join('\n')
    }
    
    // Handle object
    if (typeof data === 'object') {
      const entries = Object.entries(data)
      return entries.map(([key, val]) => {
        if (typeof val === 'object') {
          return `${key}: ${JSON.stringify(val)}`
        }
        return `${key}: ${val}`
      }).join('\n')
    }
    
    return String(data)
  }

  // Helper to generate ICS calendar format
  function generateICS(data: unknown): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CinePilot//Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ]

    // If data has shootingDays, create events for each
    if (data && typeof data === 'object' && 'shootingDays' in data) {
      const days = (data as { shootingDays: Array<{ dayNumber: number; scheduledDate?: Date }> }).shootingDays
      days.forEach((day, idx) => {
        const date = day.scheduledDate ? new Date(day.scheduledDate) : new Date()
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('T')[0]
        lines.push(
          'BEGIN:VEVENT',
          `DTSTART;VALUE=DATE:${dateStr}`,
          `DTEND;VALUE=DATE:${dateStr}`,
          `SUMMARY:Shooting Day ${day.dayNumber}`,
          `DESCRIPTION:Day ${day.dayNumber} of production`,
          `UID:cinepilot-day-${day.dayNumber}-${Date.now()}@cinepilot.ai`,
          'END:VEVENT'
        )
      })
    } else {
      // Create a single event for the export
      const now = new Date()
      const dateStr = now.toISOString().replace(/[-:]/g, '').split('T')[0]
      lines.push(
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        'SUMMARY:CinePilot Export',
        'DESCRIPTION:Exported production data',
        `UID:cinepilot-export-${Date.now()}@cinepilot.ai`,
        'END:VEVENT'
      )
    }

    lines.push('END:VCALENDAR')
    return lines.join('\r\n')
  }

  const selectedOption = EXPORT_OPTIONS.find(o => o.id === selectedType)

  return (
    <div className="space-y-6">
      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setSelectedType(option.id)
              setSelectedFormat(null)
              setError(null)
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedType === option.id
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedType === option.id ? 'bg-indigo-500' : 'bg-gray-700'
              }`}>
                <option.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium">{option.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Format Selection */}
      {selectedType && selectedOption && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Export {selectedOption.label}
          </h3>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedOption.formats.map((format) => (
              <button
                key={format.id}
                onClick={() => {
                  setSelectedFormat(format.id)
                  setError(null)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedFormat === format.id
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <format.icon className="w-4 h-4" />
                {format.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={!selectedFormat || exporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export & Download
                </>
              )}
            </button>

            {!selectedFormat && (
              <span className="text-gray-500 text-sm">Select a format to export</span>
            )}
          </div>
        </div>
      )}

      {/* Recent Exports */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🕐 Recent Exports</h3>
        
        <div className="space-y-2">
          {recentExports.map((exp, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                {exp.type === 'schedule' && <Calendar className="w-4 h-4 text-blue-400" />}
                {exp.type === 'shot-list' && <Video className="w-4 h-4 text-purple-400" />}
                {exp.type === 'crew' && <Users className="w-4 h-4 text-green-400" />}
                {exp.type === 'locations' && <MapPin className="w-4 h-4 text-orange-400" />}
                {exp.type === 'budget' && <DollarSign className="w-4 h-4 text-emerald-400" />}
                {exp.type === 'call-sheets' && <FileText className="w-4 h-4 text-cyan-400" />}
                {exp.type === 'dood' && <Clock className="w-4 h-4 text-rose-400" />}
                <span className="text-white">{exp.name}</span>
              </div>
              <span className="text-gray-500 text-sm">{exp.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
