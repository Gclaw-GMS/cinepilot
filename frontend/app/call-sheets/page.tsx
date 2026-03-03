'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Trash2, Calendar, Edit2, Save, X, Printer, Download, Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react'

// Weather types for call sheet
type WeatherInfo = {
  temp: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy'
  humidity: number
  wind: number
  sunrise: string
  sunset: string
}

type CallSheetContent = {
  callTime?: string
  wrapTime?: string
  location?: string
  locationAddress?: string
  scenes?: string[]
  crewCalls?: Array<{
    name: string
    role: string
    department?: string
    callTime?: string
  }>
  weather?: string
}

type CallSheet = {
  id: string
  projectId: string
  shootingDayId: string | null
  title: string | null
  date: string
  content: CallSheetContent | null
  notes: string | null
  createdAt: string
  shootingDay?: {
    id: string
    dayNumber: number
    scheduledDate: string | null
    callTime: string | null
    locationId: string | null
  } | null
}

type CrewMember = {
  id: string
  name: string
  role: string
  department: string | null
  dailyRate: string | number | null
  phone?: string
}

// Emergency contacts for production
const EMERGENCY_CONTACTS = [
  { role: 'Unit Production Manager', name: 'Producer', phone: '+91 98765 43210' },
  { role: 'First AD', name: 'First Assistant Director', phone: '+91 98765 43211' },
  { role: 'Location Manager', name: 'Location Manager', phone: '+91 98765 43212' },
  { role: 'Police', name: 'Emergency', phone: '100' },
  { role: 'Ambulance', name: 'Medical Emergency', phone: '108' },
]

export default function CallSheetsPage() {
  const [callSheets, setCallSheets] = useState<CallSheet[]>([])
  const [selected, setSelected] = useState<CallSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState<CallSheetContent>({})
  const [editingNotes, setEditingNotes] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Crew for adding to call sheet
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [showAddCrew, setShowAddCrew] = useState(false)
  const [newScene, setNewScene] = useState('')
  
  // Weather state
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)

  // Fetch weather for the call sheet date
  const fetchWeather = useCallback(async (date: string) => {
    if (!date) return
    setLoadingWeather(true)
    try {
      // Try to fetch from API (if weather service is configured)
      const res = await fetch(`/api/weather?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        if (data.temp) {
          setWeather(data)
          return
        }
      }
    } catch {
      // Weather API not available
    }
    
    // Generate realistic demo weather data
    const demoWeather: WeatherInfo = {
      temp: Math.round(24 + Math.random() * 10),
      condition: (['sunny', 'cloudy', 'rainy', 'windy'] as const)[Math.floor(Math.random() * 4)],
      humidity: Math.round(50 + Math.random() * 30),
      wind: Math.round(5 + Math.random() * 15),
      sunrise: '06:12',
      sunset: '18:35',
    }
    setWeather(demoWeather)
    setLoadingWeather(false)
  }, [])

  // Load weather when selected call sheet changes
  useEffect(() => {
    if (selected?.date) {
      fetchWeather(selected.date)
    }
  }, [selected?.date, fetchWeather])

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-amber-400" />
      case 'cloudy': return <Cloud className="w-6 h-6 text-slate-400" />
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-400" />
      case 'windy': return <Wind className="w-6 h-6 text-cyan-400" />
      default: return <Sun className="w-6 h-6 text-amber-400" />
    }
  }

  // Print function
  const handlePrint = () => {
    window.print()
  }

  // ICS Export function - generates calendar file
  const handleExportICS = () => {
    if (!selected || !selected.content) return
    
    const formatDate = (d: string) => {
      try {
        return new Date(d).toISOString().split('T')[0].replace(/-/g, '')
      } catch {
        return d.replace(/-/g, '')
      }
    }
    
    const callTime = selected.content.callTime || '06:00'
    const [hours, minutes] = callTime.split(':').map(Number)
    const startDate = new Date(selected.date)
    startDate.setHours(hours, minutes, 0, 0)
    
    const wrapTime = selected.content.wrapTime || '19:00'
    const [wrapHours, wrapMinutes] = wrapTime.split(':').map(Number)
    const endDate = new Date(selected.date)
    endDate.setHours(wrapHours, wrapMinutes, 0, 0)
    
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const location = selected.content.location || 'TBD'
    const scenes = (selected.content.scenes || []).join(', ')
    const crewCalls = (selected.content.crewCalls || []).map(c => `${c.callTime || callTime} - ${c.role}: ${c.name}`).join('\\n')
    
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CinePilot//Call Sheet//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:call-sheet-${selected.id}@cinepilot.ai`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:🎬 ${selected.title || 'Call Sheet'} - Day ${selected.date}`,
      `LOCATION:${location}`,
      `DESCRIPTION:Scenes: ${scenes}\\n\\nCrew Calls:\\n${crewCalls}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-sheet-${selected.date}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  // PDF Export function - generates clean HTML for printing/PDF
  const handleExportPDF = () => {
    if (!selected) return
    
    const formatDate = (d: string) => {
      try {
        return new Date(d).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      } catch {
        return d
      }
    }

    const weatherHtml = weather ? `
      <div style="margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 6px; display: inline-flex; gap: 15px; align-items: center;">
        <span style="font-weight: bold; font-size: 18px;">${weather.temp}°C</span>
        <span style="color: #6b7280;">💧 ${weather.humidity}%</span>
        <span style="color: #6b7280;">🌬️ ${weather.wind} km/h</span>
        <span style="color: #6b7280;">🌅 ${weather.sunrise}</span>
      </div>
    ` : ''

    const crewRows = (selected.content?.crewCalls ?? []).map(c => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.role}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${c.callTime ?? selected.content?.callTime ?? 'TBD'}</td>
      </tr>
    `).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Call Sheet - ${formatDate(selected.date)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; background: white; }
    .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 32px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .header .date { font-size: 20px; color: #444; margin-top: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
    .info-box .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 5px; }
    .info-box .value { font-size: 18px; font-weight: bold; }
    .section { margin-bottom: 25px; }
    .section h3 { font-size: 14px; text-transform: uppercase; background: #111; color: white; padding: 10px 15px; margin-bottom: 0; }
    .scenes { display: flex; flex-wrap: wrap; gap: 8px; padding: 15px; border: 1px solid #e5e7eb; border-top: none; }
    .scene-tag { background: #e5e7eb; padding: 5px 12px; border-radius: 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .notes { background: #fefce8; border: 1px solid #fde047; padding: 15px; border-radius: 6px; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      @page { size: A4; margin: 0.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${selected.title ?? 'Call Sheet'}</h1>
    <div class="date">${formatDate(selected.date)}</div>
    ${weatherHtml}
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Date</div>
      <div class="value">${formatDate(selected.date)}</div>
    </div>
    <div class="info-box">
      <div class="label">Call Time</div>
      <div class="value" style="font-size: 24px; color: #059669;">${selected.content?.callTime ?? 'TBD'}</div>
    </div>
    <div class="info-box">
      <div class="label">Wrap Time</div>
      <div class="value">${selected.content?.wrapTime ?? 'TBD'}</div>
    </div>
    <div class="info-box">
      <div class="label">Location</div>
      <div class="value" style="font-size: 16px;">${selected.content?.location ?? 'TBD'}</div>
    </div>
  </div>

  <div class="section">
    <h3>Scenes</h3>
    <div class="scenes">
      ${(selected.content?.scenes ?? []).length > 0 
        ? (selected.content?.scenes ?? []).map(s => `<span class="scene-tag">${s}</span>`).join('')
        : '<span style="color: #666;">TBD</span>'}
    </div>
  </div>

  <div class="section">
    <h3>Crew Calls</h3>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Name</th>
          <th style="text-align: right;">Call Time</th>
        </tr>
      </thead>
      <tbody>
        ${crewRows || '<tr><td colspan="3" style="text-align: center; color: #666; padding: 20px;">No crew assigned</td></tr>'}
      </tbody>
    </table>
  </div>

  ${selected.notes ? `
  <div class="section">
    <h3>Notes</h3>
    <div class="notes">${selected.notes}</div>
  </div>
  ` : ''}

  <div class="section">
    <h3>🚨 Emergency Contacts</h3>
    <table style="margin-top: 10px;">
      <thead>
        <tr>
          <th>Role</th>
          <th>Contact Person</th>
          <th>Phone</th>
        </tr>
      </thead>
      <tbody>
        ${EMERGENCY_CONTACTS.map(c => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.role}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${c.phone}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by CinePilot • Film Production Management
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-sheet-${selected.date}-${(selected.title || 'production').replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchCallSheets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/call-sheets')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to fetch call sheets')
      }
      const data = await res.json()
      // Handle both array response and object response with callSheets property
      const sheets = data.callSheets ?? data
      setCallSheets(Array.isArray(sheets) ? sheets : [])
      // Detect demo mode from API response
      setIsDemoMode(!!data.isDemoMode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCrew = useCallback(async () => {
    try {
      const res = await fetch('/api/crew')
      if (!res.ok) return
      const data = await res.json()
      setCrew(Array.isArray(data) ? data : data.crew || [])
    } catch {
      // Ignore crew fetch errors
    }
  }, [])

  useEffect(() => {
    fetchCallSheets()
    fetchCrew()
  }, [fetchCallSheets, fetchCrew])

  const createNew = async () => {
    try {
      setCreating(true)
      const res = await fetch('/api/call-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          title: 'New Call Sheet',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create call sheet')
      }
      const created = await res.json()
      setCallSheets((prev) => [created, ...prev])
      setSelected(created)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const deleteSheet = async (id: string) => {
    try {
      setDeleting(id)
      const res = await fetch('/api/call-sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete call sheet')
      }
      setCallSheets((prev) => prev.filter((s) => s.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const startEditing = () => {
    if (!selected) return
    setEditingContent(selected.content || {})
    setEditingNotes(selected.notes || '')
    setEditingTitle(selected.title || '')
    setEditingDate(selected.date.split('T')[0])
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditingContent({})
    setEditingNotes('')
    setEditingTitle('')
    setEditingDate('')
    setShowAddCrew(false)
    setNewScene('')
  }

  const saveChanges = async () => {
    if (!selected) return
    try {
      setSaving(true)
      const res = await fetch('/api/call-sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          title: editingTitle,
          date: editingDate,
          content: editingContent,
          notes: editingNotes,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save')
      }
      const updated = await res.json()
      setCallSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setSelected(updated)
      setIsEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addScene = () => {
    if (!newScene.trim()) return
    const scenes = editingContent.scenes || []
    if (!scenes.includes(newScene.trim())) {
      setEditingContent({
        ...editingContent,
        scenes: [...scenes, newScene.trim()],
      })
    }
    setNewScene('')
  }

  const removeScene = (scene: string) => {
    setEditingContent({
      ...editingContent,
      scenes: (editingContent.scenes || []).filter((s) => s !== scene),
    })
  }

  const addCrewMember = (member: CrewMember) => {
    const currentCalls = editingContent.crewCalls || []
    if (!currentCalls.find((c) => c.name === member.name)) {
      setEditingContent({
        ...editingContent,
        crewCalls: [
          ...currentCalls,
          {
            name: member.name,
            role: member.role,
            department: member.department || undefined,
            callTime: editingContent.callTime || '06:00',
          },
        ],
      })
    }
    setShowAddCrew(false)
  }

  const removeCrewMember = (name: string) => {
    setEditingContent({
      ...editingContent,
      crewCalls: (editingContent.crewCalls || []).filter((c) => c.name !== name),
    })
  }

  const updateCrewCallTime = (name: string, callTime: string) => {
    setEditingContent({
      ...editingContent,
      crewCalls: (editingContent.crewCalls || []).map((c) =>
        c.name === name ? { ...c, callTime } : c
      ),
    })
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
    catch {
      return d
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">Call Sheets</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Generate and manage daily call sheets
            </p>
          </div>
        </div>
        {isDemoMode && (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Demo Data
          </span>
        )}
        <div className="flex items-center gap-2">
          {selected && !isEditing && (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
              <button
                onClick={handleExportICS}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
              >
                <Calendar className="h-4 w-4" />
                ICS
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded font-medium"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          <button
            onClick={createNew}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded font-medium"
          >
            <Plus className="h-4 w-4" />
            New Call Sheet
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-950/50 border border-red-800 rounded text-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Sidebar - Call Sheet List */}
        <div className="col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            Recent Call Sheets
          </h3>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : callSheets.length === 0 ? (
            <p className="text-slate-400 text-sm">No call sheets yet</p>
          ) : (
            <div className="space-y-2">
              {callSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`flex items-center justify-between gap-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selected?.id === sheet.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelected(sheet)
                      setIsEditing(false)
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">
                      {formatDate(sheet.date)}
                    </div>
                    <div className="text-sm text-slate-400 truncate">
                      {sheet.title ?? 'Untitled'}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSheet(sheet.id)
                    }}
                    disabled={deleting === sheet.id}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Preview/Edit */}
        <div className="col-span-2">
          {selected ? (
            <div className="bg-white text-black rounded-lg overflow-hidden print:shadow-none">
              {/* View Mode */}
              {!isEditing ? (
                <div className="p-8">
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h2 className="text-2xl font-bold">
                      {selected.title ?? 'CALL SHEET'}
                    </h2>
                    <p className="text-lg mt-1">{formatDate(selected.date)}</p>

                    {/* Weather Widget */}
                    {weather && (
                      <div className="mt-4 flex items-center justify-center gap-6 bg-gray-100 rounded-lg p-3 inline-flex">
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(weather.condition)}
                          <span className="font-bold text-lg">{weather.temp}°C</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Droplets className="w-4 h-4" />
                          {weather.humidity}%
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Wind className="w-4 h-4" />
                          {weather.wind} km/h
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Thermometer className="w-4 h-4" />
                          🌅 {weather.sunrise} 🌇 {weather.sunset}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="font-bold bg-gray-200 p-2">DATE</div>
                      <div className="p-2 border border-t-0 border-gray-300">
                        {formatDate(selected.date)}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold bg-gray-200 p-2">CALL TIME</div>
                      <div className="p-2 border border-t-0 border-gray-300 text-xl font-bold">
                        {selected.content?.callTime ?? 'TBD'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-bold bg-gray-200 p-2">LOCATION</div>
                      <div className="p-2 border border-t-0 border-gray-300">
                        {selected.content?.location ?? 'TBD'}
                        {selected.content?.locationAddress && (
                          <span className="block text-sm text-gray-600 mt-1">
                            {selected.content.locationAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2">SCENES</div>
                    <div className="p-2 border border-t-0 border-gray-300 flex gap-2 flex-wrap">
                      {(selected.content?.scenes ?? []).length > 0
                        ? (selected.content?.scenes ?? []).map((s) => (
                            <span
                              key={s}
                              className="px-3 py-1 bg-gray-200 rounded"
                            >
                              {s}
                            </span>
                          ))
                        : 'TBD'}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2">CREW CALLS</div>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-400">
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-right p-2">Call Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.content?.crewCalls ?? []).length > 0
                          ? (selected.content?.crewCalls ?? []).map((c, i) => (
                              <tr
                                key={i}
                                className="border-b border-gray-200"
                              >
                                <td className="p-2">{c.role}</td>
                                <td className="p-2">{c.name}</td>
                                <td className="p-2 text-right font-bold">
                                  {c.callTime ?? selected.content?.callTime ?? 'TBD'}
                                </td>
                              </tr>
                            ))
                          : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="p-2 text-gray-500"
                                >
                                  No crew assigned
                                </td>
                              </tr>
                            )}
                      </tbody>
                    </table>
                  </div>

                  {selected.notes && (
                    <div className="mb-6">
                      <div className="font-bold bg-gray-200 p-2">NOTES</div>
                      <div className="p-2 border border-t-0 border-gray-300 whitespace-pre-wrap">
                        {selected.notes}
                      </div>
                    </div>
                  )}

                  {/* Emergency Contacts */}
                  <div className="mb-6">
                    <div className="font-bold bg-red-100 p-2 text-red-800">🚨 EMERGENCY CONTACTS</div>
                    <div className="p-2 border border-t-0 border-gray-300">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-2 text-sm">Role</th>
                            <th className="text-left p-2 text-sm">Contact</th>
                            <th className="text-right p-2 text-sm">Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {EMERGENCY_CONTACTS.map((contact, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="p-2 text-sm">{contact.role}</td>
                              <td className="p-2 text-sm">{contact.name}</td>
                              <td className="p-2 text-sm text-right font-bold">{contact.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    Generated by CinePilot
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="p-8">
                  {/* Title & Date */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Call Sheet Title"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  {/* Call Time */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Call Time</label>
                      <input
                        type="time"
                        value={editingContent.callTime || ''}
                        onChange={(e) => setEditingContent({ ...editingContent, callTime: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Wrap Time</label>
                      <input
                        type="time"
                        value={editingContent.wrapTime || ''}
                        onChange={(e) => setEditingContent({ ...editingContent, wrapTime: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingContent.location || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Shooting Location"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Location Address</label>
                    <input
                      type="text"
                      value={editingContent.locationAddress || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, locationAddress: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Full Address"
                    />
                  </div>

                  {/* Scenes */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Scenes</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newScene}
                        onChange={(e) => setNewScene(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addScene()}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="Scene number (e.g., 1A)"
                      />
                      <button
                        onClick={addScene}
                        className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(editingContent.scenes || []).map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-gray-200 rounded flex items-center gap-2"
                        >
                          {s}
                          <button
                            onClick={() => removeScene(s)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Crew Calls */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-700">Crew Calls</label>
                      <button
                        onClick={() => setShowAddCrew(!showAddCrew)}
                        className="text-sm text-cyan-600 hover:text-cyan-800"
                      >
                        + Add Crew
                      </button>
                    </div>
                    
                    {showAddCrew && (
                      <div className="bg-gray-100 p-3 rounded mb-3">
                        <p className="text-sm text-gray-600 mb-2">Available crew:</p>
                        <div className="flex flex-wrap gap-2">
                          {crew.filter((c) => !(editingContent.crewCalls || []).find((ec) => ec.name === c.name)).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => addCrewMember(c)}
                              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                            >
                              {c.name} ({c.role})
                            </button>
                          ))}
                          {crew.length === 0 && (
                            <p className="text-sm text-gray-500">No crew members found. Add crew first.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-400">
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-right p-2">Call Time</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editingContent.crewCalls || []).length > 0
                          ? (editingContent.crewCalls || []).map((c, i) => (
                              <tr key={i} className="border-b border-gray-200">
                                <td className="p-2">{c.role}</td>
                                <td className="p-2">{c.name}</td>
                                <td className="p-2 text-right">
                                  <input
                                    type="time"
                                    value={c.callTime || ''}
                                    onChange={(e) => updateCrewCallTime(c.name, e.target.value)}
                                    className="p-1 border border-gray-300 rounded text-sm w-24"
                                  />
                                </td>
                                <td className="p-2">
                                  <button
                                    onClick={() => removeCrewMember(c.name)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))
                          : (
                              <tr>
                                <td colSpan={4} className="p-2 text-gray-500 text-center">
                                  No crew assigned
                                </td>
                              </tr>
                            )}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded h-24"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                Select a call sheet to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-break-before {
            page-break-before: always;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  )
}
