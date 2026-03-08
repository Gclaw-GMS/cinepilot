'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  FileText, Plus, Trash2, Calendar, Save, X, Edit2, 
  Clock, MapPin, CloudSun, Users, Film, ChevronDown, ChevronUp,
  Printer, Download, RefreshCw, AlertCircle, BarChart3, TrendingUp, Building2,
  Keyboard, Search
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

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
}

const DEPARTMENTS = [
  'Camera', 'Lighting', 'Sound', 'Art', 'Makeup', 'Costume', 
  'Direction', 'Production', 'VFX', 'Stunts', 'Catering', 'Transport'
]

export default function CallSheetsPage() {
  const [callSheets, setCallSheets] = useState<CallSheet[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [selected, setSelected] = useState<CallSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<CallSheetContent>({})
  const [editNotes, setEditNotes] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [newScene, setNewScene] = useState('')
  const [newCrewMember, setNewCrewMember] = useState('')
  const [showAddCrew, setShowAddCrew] = useState(false)

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
      // Handle both old format (array) and new format ({ data, isDemoMode })
      const sheets = Array.isArray(data) ? data : (data.data || [])
      setCallSheets(sheets)
      // Check if we're in demo mode
      setIsDemoMode(data.isDemoMode === true || sheets.some((s: CallSheet) => s.id.startsWith('demo-')))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchCrew = useCallback(async () => {
    try {
      const res = await fetch('/api/crew')
      if (res.ok) {
        const data = await res.json()
        setCrew(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to fetch crew:', e)
    }
  }, [])

  useEffect(() => {
    fetchCallSheets()
    fetchCrew()
  }, [fetchCallSheets, fetchCrew])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          setRefreshing(true)
          fetchCallSheets()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          if (!creating && !isEditing) {
            createNew()
          }
          break
        case 'e':
          e.preventDefault()
          if (selected && !isEditing) {
            startEditing()
          }
          break
        case 'd':
          e.preventDefault()
          if (selected && !isEditing && !deleting) {
            deleteSheet(selected.id)
          }
          break
        case 'p':
          e.preventDefault()
          if (selected && !isEditing) {
            handlePrint()
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false)
          } else if (isEditing) {
            cancelEditing()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, isEditing, creating, deleting, showKeyboardHelp, fetchCallSheets])

  // Filter call sheets by search
  const filteredCallSheets = useMemo(() => {
    if (!searchQuery) return callSheets
    const query = searchQuery.toLowerCase()
    return callSheets.filter(sheet => 
      (sheet.title?.toLowerCase() || '').includes(query) ||
      sheet.date?.toLowerCase().includes(query) ||
      (sheet.content?.location?.toLowerCase() || '').includes(query)
    )
  }, [callSheets, searchQuery])

  const createNew = async () => {
    try {
      setCreating(true)
      const res = await fetch('/api/call-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          title: 'New Call Sheet',
          content: {
            callTime: '06:00',
            wrapTime: '19:00',
            location: '',
            locationAddress: '',
            scenes: [],
            crewCalls: [],
            weather: '',
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create call sheet')
      }
      const created = await res.json()
      setCallSheets((prev) => [created, ...prev])
      setSelected(created)
      // Start editing immediately
      setEditForm(created.content || {
        callTime: '06:00',
        wrapTime: '19:00',
        location: '',
        locationAddress: '',
        scenes: [],
        crewCalls: [],
        weather: '',
      })
      setEditNotes(created.notes || '')
      setEditTitle(created.title || '')
      setEditDate(created.date ? created.date.split('T')[0] : '')
      setIsEditing(true)
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
      if (selected?.id === id) {
        setSelected(null)
        setIsEditing(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const selectSheet = (sheet: CallSheet) => {
    setSelected(sheet)
    setIsEditing(false)
    setEditForm(sheet.content || {})
    setEditNotes(sheet.notes || '')
    setEditTitle(sheet.title || '')
    setEditDate(sheet.date ? sheet.date.split('T')[0] : '')
  }

  const startEditing = () => {
    if (!selected) return
    setEditForm(selected.content || {
      callTime: '06:00',
      wrapTime: '19:00',
      location: '',
      locationAddress: '',
      scenes: [],
      crewCalls: [],
      weather: '',
    })
    setEditNotes(selected.notes || '')
    setEditTitle(selected.title || '')
    setEditDate(selected.date ? selected.date.split('T')[0] : '')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    if (selected) {
      setEditForm(selected.content || {})
      setEditNotes(selected.notes || '')
    }
  }

  const saveChanges = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/call-sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          title: editTitle || null,
          date: editDate || null,
          content: editForm,
          notes: editNotes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save')
      }
      const updated = await res.json()
      setCallSheets((prev) => prev.map((s) => s.id === updated.id ? updated : s))
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
    setEditForm((prev) => ({
      ...prev,
      scenes: [...(prev.scenes || []), newScene.trim()],
    }))
    setNewScene('')
  }

  const removeScene = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      scenes: (prev.scenes || []).filter((_, i) => i !== idx),
    }))
  }

  const addCrewCall = () => {
    if (!newCrewMember.trim()) return
    const parts = newCrewMember.trim().split(':')
    const name = parts[0].trim()
    const role = parts[1]?.trim() || 'Cast'
    setEditForm((prev) => ({
      ...prev,
      crewCalls: [
        ...(prev.crewCalls || []),
        { name, role, department: undefined, callTime: editForm.callTime || '06:00' }
      ],
    }))
    setNewCrewMember('')
    setShowAddCrew(false)
  }

  const addCrewFromList = (member: CrewMember) => {
    setEditForm((prev) => ({
      ...prev,
      crewCalls: [
        ...(prev.crewCalls || []),
        { 
          name: member.name, 
          role: member.role, 
          department: member.department || undefined, 
          callTime: editForm.callTime || '06:00' 
        }
      ],
    }))
    setShowAddCrew(false)
  }

  const removeCrewCall = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      crewCalls: (prev.crewCalls || []).filter((_, i) => i !== idx),
    }))
  }

  const updateCrewCall = (idx: number, field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      crewCalls: (prev.crewCalls || []).map((c, i) => 
        i === idx ? { ...c, [field]: value } : c
      ),
    }))
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  // Computed stats from all call sheets
  const stats = useMemo(() => {
    if (callSheets.length === 0) return null
    
    const totalSheets = callSheets.length
    const totalCrewCalls = callSheets.reduce((sum, sheet) => 
      sum + (sheet.content?.crewCalls?.length || 0), 0
    )
    const totalScenes = callSheets.reduce((sum, sheet) => 
      sum + (sheet.content?.scenes?.length || 0), 0
    )
    
    // Crew by department
    const deptCounts: Record<string, number> = {}
    callSheets.forEach(sheet => {
      sheet.content?.crewCalls?.forEach(crew => {
        const dept = crew.department || 'Other'
        deptCounts[dept] = (deptCounts[dept] || 0) + 1
      })
    })
    
    const deptData = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    
    // Call time distribution
    const callTimeBuckets: Record<string, number> = { '05:00': 0, '05:30': 0, '06:00': 0, '06:30': 0, '07:00': 0, '07:30+': 0 }
    callSheets.forEach(sheet => {
      const time = sheet.content?.callTime || '06:00'
      if (time <= '05:30') callTimeBuckets['05:30']++
      else if (time <= '06:00') callTimeBuckets['06:00']++
      else if (time <= '06:30') callTimeBuckets['06:30']++
      else if (time <= '07:00') callTimeBuckets['07:00']++
      else callTimeBuckets['07:30+']++
    })
    
    const callTimeData = Object.entries(callTimeBuckets)
      .filter(([_, v]) => v > 0)
      .map(([time, count]) => ({ time, count }))
    
    // Unique locations
    const locations = [...new Set(callSheets.map(s => s.content?.location).filter(Boolean))]
    
    return {
      totalSheets,
      totalCrewCalls,
      totalScenes,
      avgCrewPerSheet: totalSheets > 0 ? Math.round(totalCrewCalls / totalSheets) : 0,
      deptData,
      callTimeData,
      locations: locations.length,
    }
  }, [callSheets])

  // Export to CSV
  const handleExportCSV = () => {
    if (!selected) return
    const crew = selected.content?.crewCalls || []
    const rows = [['Role', 'Name', 'Department', 'Call Time']]
    crew.forEach(c => {
      rows.push([c.role || '', c.name || '', c.department || '', c.callTime || selected.content?.callTime || ''])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `callsheet-${selected.date?.split('T')[0] || 'export'}.csv`
    a.click()
  }

  // Group crew by department for display
  const crewByDepartment = useMemo(() => {
    if (!selected?.content?.crewCalls) return {}
    const grouped: Record<string, typeof selected.content.crewCalls> = {}
    selected.content.crewCalls.forEach(crew => {
      const dept = crew.department || 'Other'
      if (!grouped[dept]) grouped[dept] = []
      grouped[dept].push(crew)
    })
    return grouped
  }, [selected])

  // Print functionality
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Call Sheets</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Generate and manage daily call sheets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true)
              fetchCallSheets()
            }}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={createNew}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {creating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Call Sheet
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isDemoMode && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Preview mode — Connect a PostgreSQL database to save call sheets permanently
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && (
        <div className="mx-6 mt-4 grid grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Sheets</p>
                <p className="text-2xl font-bold text-white">{stats.totalSheets}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Crew Calls</p>
                <p className="text-2xl font-bold text-white">{stats.totalCrewCalls}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Scenes</p>
                <p className="text-2xl font-bold text-white">{stats.totalScenes}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Locations Used</p>
                <p className="text-2xl font-bold text-white">{stats.locations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {stats && stats.deptData.length > 0 && (
        <div className="mx-6 mt-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Crew by Department
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.deptData.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={70} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Call Time Distribution
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.callTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Sidebar - Call Sheet List */}
        <div className="col-span-1 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Call Sheets
            </h3>
            <span className="text-xs text-slate-500">{filteredCallSheets.length}</span>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search... (/)"
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : filteredCallSheets.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'No matching call sheets' : 'No call sheets yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCallSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`flex items-center justify-between gap-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selected?.id === sheet.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => selectSheet(sheet)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate text-slate-200">
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

        {/* Main Content */}
        <div className="col-span-2">
          {selected ? (
            <div className="space-y-4">
              {/* Header with actions */}
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-lg font-semibold text-white focus:outline-none focus:border-cyan-500 flex-1 mr-4"
                    placeholder="Call Sheet Title"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-white">
                    {selected.title ?? 'Call Sheet'}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handlePrint}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                        title="Export CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Date picker (edit mode) */}
              {isEditing && (
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* Call Sheet Preview / Edit Form */}
              <div className="bg-white text-black rounded-xl overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl font-bold text-center bg-transparent border-b border-gray-300 focus:outline-none w-full"
                        placeholder="CALL SHEET"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">
                        {selected.title ?? 'CALL SHEET'}
                      </h2>
                    )}
                    <p className="text-lg mt-1">{formatDate(selected.date)}</p>
                  </div>

                  {/* Times & Location */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="font-bold bg-gray-200 p-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> CALL TIME
                      </div>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editForm.callTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, callTime: e.target.value })}
                          className="w-full p-2 border border-gray-300 text-xl font-bold"
                        />
                      ) : (
                        <div className="p-2 border border-t-0 border-gray-300 text-xl font-bold">
                          {selected.content?.callTime ?? 'TBD'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold bg-gray-200 p-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> WRAP TIME
                      </div>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editForm.wrapTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, wrapTime: e.target.value })}
                          className="w-full p-2 border border-gray-300"
                        />
                      ) : (
                        <div className="p-2 border border-t-0 border-gray-300">
                          {selected.content?.wrapTime ?? 'TBD'}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="font-bold bg-gray-200 p-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> LOCATION
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.location || ''}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="Location name"
                            className="w-full p-2 border border-gray-300"
                          />
                          <input
                            type="text"
                            value={editForm.locationAddress || ''}
                            onChange={(e) => setEditForm({ ...editForm, locationAddress: e.target.value })}
                            placeholder="Address"
                            className="w-full p-2 border border-gray-300 text-sm"
                          />
                        </div>
                      ) : (
                        <div className="p-2 border border-t-0 border-gray-300">
                          {selected.content?.location ?? 'TBD'}
                          {selected.content?.locationAddress && (
                            <span className="block text-sm text-gray-600 mt-1">
                              {selected.content.locationAddress}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="font-bold bg-gray-200 p-2 flex items-center gap-2">
                        <CloudSun className="w-4 h-4" /> WEATHER
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.weather || ''}
                          onChange={(e) => setEditForm({ ...editForm, weather: e.target.value })}
                          placeholder="Weather forecast"
                          className="w-full p-2 border border-gray-300"
                        />
                      ) : (
                        <div className="p-2 border border-t-0 border-gray-300">
                          {selected.content?.weather ?? 'TBD'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scenes */}
                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4" /> SCENES
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newScene}
                            onChange={(e) => setNewScene(e.target.value)}
                            placeholder="Add scene #"
                            className="px-2 py-0.5 text-sm border border-gray-400"
                            onKeyDown={(e) => e.key === 'Enter' && addScene()}
                          />
                          <button
                            onClick={addScene}
                            className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded hover:bg-gray-500"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-2 border border-t-0 border-gray-300 flex gap-2 flex-wrap">
                      {(isEditing ? editForm.scenes : selected.content?.scenes)?.length ?? 0 > 0 ? (
                        (isEditing ? editForm.scenes : selected.content?.scenes)?.map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-200 rounded flex items-center gap-1"
                          >
                            {s}
                            {isEditing && (
                              <button
                                onClick={() => removeScene(i)}
                                className="text-red-500 hover:text-red-700 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">TBD</span>
                      )}
                    </div>
                  </div>

                  {/* Crew Calls */}
                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> CREW CALLS
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => setShowAddCrew(!showAddCrew)}
                          className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded hover:bg-gray-500 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                    
                    {/* Add crew dropdown */}
                    {isEditing && showAddCrew && (
                      <div className="p-2 border border-t-0 border-gray-300 bg-gray-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newCrewMember}
                            onChange={(e) => setNewCrewMember(e.target.value)}
                            placeholder="Name:Role"
                            className="flex-1 px-2 py-1 text-sm border border-gray-400"
                            onKeyDown={(e) => e.key === 'Enter' && addCrewCall()}
                          />
                          <button
                            onClick={addCrewCall}
                            className="px-3 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-500"
                          >
                            Add
                          </button>
                        </div>
                        {crew.length > 0 && (
                          <div className="text-xs text-gray-500 mb-1">Or select from crew:</div>
                        )}
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {crew.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => addCrewFromList(c)}
                              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                            >
                              {c.name} ({c.role})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-400">
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Name</th>
                          {isEditing && <th className="text-left p-2">Dept</th>}
                          <th className="text-right p-2">Call Time</th>
                          {isEditing && <th className="w-10"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditing ? editForm.crewCalls : selected.content?.crewCalls)?.length ?? 0 > 0 ? (
                          isEditing ? (
                            // Edit mode - show flat list
                            (editForm.crewCalls || []).map((c, i) => (
                              <tr key={i} className="border-b border-gray-200">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.role}
                                    onChange={(e) => updateCrewCall(i, 'role', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-gray-300 text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.name}
                                    onChange={(e) => updateCrewCall(i, 'name', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-gray-300 text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={c.department || ''}
                                    onChange={(e) => updateCrewCall(i, 'department', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-gray-300 text-sm"
                                  >
                                    <option value="">—</option>
                                    {DEPARTMENTS.map(d => (
                                      <option key={d} value={d}>{d}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="time"
                                    value={c.callTime || ''}
                                    onChange={(e) => updateCrewCall(i, 'callTime', e.target.value)}
                                    className="w-full px-1 py-0.5 border border-gray-300 text-sm text-right"
                                  />
                                </td>
                                <td className="p-2">
                                  <button
                                    onClick={() => removeCrewCall(i)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            // View mode - show grouped by department
                            Object.entries(crewByDepartment).map(([dept, crewList]) => (
                              <tbody key={dept}>
                                <tr className="bg-gray-100">
                                  <td colSpan={3} className="p-2 font-bold text-sm text-gray-700">
                                    {dept}
                                  </td>
                                  <td className="p-2 text-right text-xs text-gray-500">
                                    {crewList.length} crew
                                  </td>
                                </tr>
                                {crewList.map((c, i) => (
                                  <tr key={`${dept}-${i}`} className="border-b border-gray-200">
                                    <td className="p-2">{c.role}</td>
                                    <td className="p-2">{c.name}</td>
                                    <td className="p-2 text-right font-bold">
                                      {c.callTime ?? selected.content?.callTime ?? 'TBD'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            ))
                          )
                        ) : (
                          <tr>
                            <td colSpan={isEditing ? 5 : 3} className="p-4 text-gray-500 text-center">
                              No crew assigned
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2">NOTES</div>
                    {isEditing ? (
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={4}
                        placeholder="Add any notes..."
                        className="w-full p-2 border border-t-0 border-gray-300 resize-none"
                      />
                    ) : (
                      <div className="p-2 border border-t-0 border-gray-300 whitespace-pre-wrap">
                        {selected.notes || 'No notes'}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    Generated by CinePilot
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                Select a call sheet to preview or edit
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-sm text-slate-400">Call Sheets</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh call sheets' },
                { key: '/', description: 'Focus search input' },
                { key: 'N', description: 'New call sheet' },
                { key: 'E', description: 'Edit selected sheet' },
                { key: 'D', description: 'Delete selected sheet' },
                { key: 'P', description: 'Print selected sheet' },
                { key: '?', description: 'Show keyboard shortcuts' },
                { key: 'Esc', description: 'Close modal / Cancel editing' },
              ].map((shortcut) => (
                <div 
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-cyan-400 font-mono text-sm font-medium">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
