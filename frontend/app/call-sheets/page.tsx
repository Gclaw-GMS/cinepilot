'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  FileText, Plus, Trash2, Calendar, Save, X, Edit2, 
  Clock, MapPin, CloudSun, Users, Film, ChevronDown, ChevronUp,
  Printer, Download, RefreshCw, AlertCircle, BarChart3, TrendingUp, Building2,
  Keyboard, Search, Filter, ArrowRight
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

// Type for shooting days from schedule
interface ShootingDayOption {
  id: string
  dayNumber: number
  scheduledDate: string | null
  callTime: string | null
  location: { name: string } | null
  dayScenes: Array<{
    scene: { sceneNumber: string; headingRaw: string | null; location: string | null }
    estimatedMinutes: number | null
  }>
}

export default function CallSheetsPage() {
  const [callSheets, setCallSheets] = useState<CallSheet[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [selected, setSelected] = useState<CallSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'location'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Shooting days for creating call sheets from schedule
  const [shootingDays, setShootingDays] = useState<ShootingDayOption[]>([])
  const [loadingShootingDays, setLoadingShootingDays] = useState(false)
  const [showScheduleImport, setShowScheduleImport] = useState(false)
  
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts (to avoid dependency issues)
  const filterLocationRef = useRef(filterLocation)
  const filterMonthRef = useRef(filterMonth)
  const showFiltersRef = useRef(showFilters)
  
  // Keep refs in sync with state
  useEffect(() => {
    filterLocationRef.current = filterLocation
  }, [filterLocation])
  
  useEffect(() => {
    filterMonthRef.current = filterMonth
  }, [filterMonth])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const deleteSheetRef = useRef<(id: string) => Promise<void>>()
  const startEditingRef = useRef<() => void>()
  const cancelEditingRef = useRef<() => void>()
  const handleExportMarkdownRef = useRef<() => void>()
  
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
      setLastUpdated(new Date())
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

  const fetchShootingDays = useCallback(async () => {
    try {
      setLoadingShootingDays(true)
      const res = await fetch('/api/schedule')
      if (res.ok) {
        const data = await res.json()
        // Handle different response formats
        const days = data.shootingDays || data.data?.shootingDays || data.days || []
        // Filter to only future/scheduled days that don't have call sheets yet
        const existingDates = new Set(callSheets.map(cs => cs.shootingDayId).filter(Boolean))
        const filteredDays = days.filter((d: ShootingDayOption) => !existingDates.has(d.id))
        setShootingDays(filteredDays.slice(0, 10)) // Limit to 10 most recent
      }
    } catch (e) {
      console.error('Failed to fetch shooting days:', e)
    } finally {
      setLoadingShootingDays(false)
    }
  }, [callSheets])

  useEffect(() => {
    fetchCallSheets()
    fetchCrew()
  }, [fetchCallSheets, fetchCrew])

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }, [])

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
        case 'i':
          e.preventDefault()
          if (!creating && !isEditing) {
            fetchShootingDaysRef.current?.()
            setShowScheduleImport(true)
          }
          break
        case 'e':
          e.preventDefault()
          if (selected && !isEditing) {
            startEditingRef.current?.()
          }
          break
        case 'f':
          e.preventDefault()
          if (!creating && !isEditing) {
            setShowFilters(prev => !prev)
          }
          break
        case 's':
          e.preventDefault()
          if (!creating && !isEditing) {
            toggleSortOrder()
          }
          break
        // Number keys for filtering (when filters panel is open)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          if (showFiltersRef.current && !creating && !isEditing) {
            e.preventDefault()
            const num = e.key
            const locations = uniqueLocationsRef.current
            const months = uniqueMonthsRef.current
            
            if (num === '0') {
              // Clear all filters
              setFilterLocation('all')
              setFilterMonth('all')
            } else if (locations.length > 0 && showFiltersRef.current) {
              // Filter by location (keys 1-9)
              const index = parseInt(num) - 1
              if (index < locations.length) {
                const newLoc = locations[index]
                // Toggle: if same location selected, clear it
                if (filterLocationRef.current === newLoc) {
                  setFilterLocation('all')
                } else {
                  setFilterLocation(newLoc)
                }
              }
            }
          }
          break
        // Month filters (when filters open, using Shift+1-9)
        case '!':
        case '@':
        case '#':
        case '$':
        case '%':
        case '^':
        case '&':
        case '*':
        case '(':
          if (showFiltersRef.current && !creating && !isEditing) {
            e.preventDefault()
            const months = uniqueMonthsRef.current
            let monthIndex = 0
            switch (e.key) {
              case '!': monthIndex = 0; break
              case '@': monthIndex = 1; break
              case '#': monthIndex = 2; break
              case '$': monthIndex = 3; break
              case '%': monthIndex = 4; break
              case '^': monthIndex = 5; break
              case '&': monthIndex = 6; break
              case '*': monthIndex = 7; break
              case '(': monthIndex = 8; break
            }
            if (monthIndex < months.length) {
              const newMonth = months[monthIndex]
              // Toggle: if same month selected, clear it
              if (filterMonthRef.current === newMonth) {
                setFilterMonth('all')
              } else {
                setFilterMonth(newMonth)
              }
            }
          }
          break
        case 'x':
        case 'X':
          e.preventDefault()
          // When filter panel OPEN and filters active: clear all filters
          // Otherwise: toggle export menu (when call sheet selected)
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current?.()
          } else if (selected && !isEditing) {
            setShowExportMenu(prev => !prev)
          }
          break
        case 'm':
          e.preventDefault()
          if (selected && !isEditing) {
            handleExportMarkdownRef.current?.()
          }
          break
        case 'd':
          e.preventDefault()
          if (selected && !isEditing && !deleting) {
            deleteSheetRef.current?.(selected.id)
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
          } else if (showExportMenu) {
            setShowExportMenu(false)
          } else if (showFilters) {
            setShowFilters(false)
          } else if (isEditing) {
            cancelEditingRef.current?.()
          } else {
            // Reset sort to default
            setSortBy('date')
            setSortOrder('desc')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, isEditing, creating, deleting, showKeyboardHelp, showExportMenu, showFilters, fetchCallSheets, toggleSortOrder])

  // Click outside to close export menu and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    if (showExportMenu || showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu, showFilters])

  // Filter call sheets by search and filters
  const filteredCallSheets = useMemo(() => {
    let result = callSheets
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(sheet => 
        (sheet.title?.toLowerCase() || '').includes(query) ||
        sheet.date?.toLowerCase().includes(query) ||
        (sheet.content?.location?.toLowerCase() || '').includes(query)
      )
    }
    
    // Apply location filter
    if (filterLocation !== 'all') {
      result = result.filter(sheet => 
        sheet.content?.location?.toLowerCase() === filterLocation.toLowerCase()
      )
    }
    
    // Apply month filter
    if (filterMonth !== 'all') {
      result = result.filter(sheet => {
        const sheetDate = new Date(sheet.date)
        const monthKey = `${sheetDate.getFullYear()}-${String(sheetDate.getMonth() + 1).padStart(2, '0')}`
        return monthKey === filterMonth
      })
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'location':
          comparison = (a.content?.location || '').localeCompare(b.content?.location || '')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [callSheets, searchQuery, filterLocation, filterMonth, sortBy, sortOrder])

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    callSheets.forEach(sheet => {
      if (sheet.content?.location) {
        locations.add(sheet.content.location)
      }
    })
    return Array.from(locations).sort()
  }, [callSheets])

  // Get unique months for filter
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    callSheets.forEach(sheet => {
      if (sheet.date) {
        const date = new Date(sheet.date)
        months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
      }
    })
    return Array.from(months).sort().reverse()
  }, [callSheets])

  // Refs for unique locations and months (for keyboard shortcuts)
  const uniqueLocationsRef = useRef(uniqueLocations)
  const uniqueMonthsRef = useRef(uniqueMonths)
  
  // Keep refs in sync with state
  useEffect(() => {
    uniqueLocationsRef.current = uniqueLocations
  }, [uniqueLocations])
  
  useEffect(() => {
    uniqueMonthsRef.current = uniqueMonths
  }, [uniqueMonths])

  // Active filter count (includes sort state)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterLocation !== 'all') count++
    if (filterMonth !== 'all') count++
    if (sortBy !== 'date' || sortOrder !== 'desc') count++
    return count
  }, [filterLocation, filterMonth, sortBy, sortOrder])

  // Ref for active filter count (for keyboard shortcut)
  const activeFilterCountRef = useRef(activeFilterCount)
  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  // Clear all filters and sort
  const clearFilters = useCallback(() => {
    setFilterLocation('all')
    setFilterMonth('all')
    setSortBy('date')
    setSortOrder('desc')
  }, [])

  // Ref for clearFilters (for keyboard shortcut)
  const clearFiltersRef = useRef(clearFilters)
  const fetchShootingDaysRef = useRef<() => Promise<void>>()
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])
  useEffect(() => {
    fetchShootingDaysRef.current = fetchShootingDays
  }, [fetchShootingDays])

  // Create call sheet from a shooting day
  const createFromShootingDay = async (day: ShootingDayOption) => {
    try {
      setCreating(true)
      setShowScheduleImport(false)
      
      // Extract scene numbers from the shooting day
      const sceneNumbers = day.dayScenes?.map(ds => ds.scene.sceneNumber).filter(Boolean) || []
      
      // Build the call sheet content from the shooting day data
      const content = {
        callTime: day.callTime || '06:00',
        wrapTime: calculateWrapTime(day.callTime, day.dayScenes),
        location: day.location?.name || '',
        locationAddress: '',
        scenes: sceneNumbers,
        crewCalls: [],
        weather: '',
      }
      
      const res = await fetch('/api/call-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: day.scheduledDate || new Date().toISOString().split('T')[0],
          title: `Day ${day.dayNumber} - ${day.location?.name || 'Call Sheet'}`,
          shootingDayId: day.id,
          content,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create call sheet')
      }
      
      const created = await res.json()
      setCallSheets((prev) => [created, ...prev])
      setSelected(created)
      setEditForm(created.content || content)
      setEditNotes(created.notes || '')
      setEditTitle(created.title || '')
      setEditDate(created.date ? created.date.split('T')[0] : '')
      setIsEditing(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create from shooting day')
    } finally {
      setCreating(false)
    }
  }

  // Helper to calculate wrap time based on call time and estimated scene duration
  const calculateWrapTime = (callTime: string | null, dayScenes: ShootingDayOption['dayScenes']): string => {
    if (!callTime || !dayScenes?.length) return '19:00'
    
    // Calculate total estimated minutes
    const totalMinutes = dayScenes.reduce((sum, ds) => sum + (ds.estimatedMinutes || 60), 0)
    
    // Parse call time
    const [hours, mins] = callTime.split(':').map(Number)
    if (isNaN(hours)) return '19:00'
    
    // Add 1 hour buffer for setup/wrap
    const totalCalc = hours * 60 + totalMinutes + 60
    const wrapHours = Math.floor(totalCalc / 60) % 24
    const wrapMins = totalCalc % 60
    
    return `${String(wrapHours).padStart(2, '0')}:${String(wrapMins).padStart(2, '0')}`
  }

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

  const deleteSheet = useCallback(async (id: string) => {
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
  }, [selected, setCallSheets, setSelected, setIsEditing, setError, setDeleting])

  const selectSheet = (sheet: CallSheet) => {
    setSelected(sheet)
    setIsEditing(false)
    setEditForm(sheet.content || {})
    setEditNotes(sheet.notes || '')
    setEditTitle(sheet.title || '')
    setEditDate(sheet.date ? sheet.date.split('T')[0] : '')
  }

  const startEditing = useCallback(() => {
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
  }, [selected, setEditForm, setEditNotes, setEditTitle, setEditDate, setIsEditing])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    if (selected) {
      setEditForm(selected.content || {})
      setEditNotes(selected.notes || '')
    }
  }, [selected, setEditForm, setEditNotes, setIsEditing])

  // Update refs for keyboard shortcuts
  useEffect(() => {
    deleteSheetRef.current = deleteSheet
  }, [deleteSheet])

  useEffect(() => {
    startEditingRef.current = startEditing
  }, [startEditing])

  useEffect(() => {
    cancelEditingRef.current = cancelEditing
  }, [cancelEditing])

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
    const date = new Date().toISOString().split('T')[0]
    a.download = `callsheet-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Export to JSON
  const handleExportJSON = () => {
    if (!selected) return
    const data = {
      exportDate: new Date().toISOString(),
      callSheet: {
        id: selected.id,
        title: selected.title,
        date: selected.date,
        callTime: selected.content?.callTime,
        wrapTime: selected.content?.wrapTime,
        location: selected.content?.location,
        locationAddress: selected.content?.locationAddress,
        weather: selected.content?.weather,
        scenes: selected.content?.scenes || [],
        crewCalls: selected.content?.crewCalls || [],
        notes: selected.notes
      },
      summary: {
        totalCrew: selected.content?.crewCalls?.length || 0,
        departments: [...new Set(selected.content?.crewCalls?.map(c => c.department).filter(Boolean))].length,
        scenesCount: selected.content?.scenes?.length || 0
      }
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().split('T')[0]
    a.download = `callsheet-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Export to Markdown
  const handleExportMarkdown = useCallback(() => {
    if (!selected) return
    
    const crewCalls = selected.content?.crewCalls || []
    const scenes = selected.content?.scenes || []
    
    // Calculate summary stats
    const departments = [...new Set(crewCalls.map(c => c.department).filter(Boolean))]
    const crewByDept: Record<string, number> = {}
    crewCalls.forEach(c => {
      const dept = c.department || 'Other'
      crewByDept[dept] = (crewByDept[dept] || 0) + 1
    })
    
    let markdown = `# Call Sheet: ${selected.title}\n\n`
    markdown += `**Generated:** ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`
    
    // Executive Summary
    markdown += `## Executive Summary\n\n`
    markdown += `| Metric | Value |\n`
    markdown += `|--------|-------|\n`
    markdown += `| **Date** | ${selected.date || 'TBD'} |\n`
    markdown += `| **Call Time** | ${selected.content?.callTime || 'TBD'} |\n`
    markdown += `| **Wrap Time** | ${selected.content?.wrapTime || 'TBD'} |\n`
    markdown += `| **Location** | ${selected.content?.location || 'TBD'} |\n`
    markdown += `| **Total Crew** | ${crewCalls.length} |\n`
    markdown += `| **Departments** | ${departments.length} |\n`
    markdown += `| **Scenes** | ${scenes.length} |\n\n`
    
    // Weather Info
    if (selected.content?.weather) {
      markdown += `## Weather\n\n`
      markdown += `- **Conditions:** ${selected.content.weather || 'N/A'}\n\n`
    }
    
    // Department Breakdown
    if (Object.keys(crewByDept).length > 0) {
      markdown += `## Department Breakdown\n\n`
      markdown += `| Department | Count |\n`
      markdown += `|------------|-------|\n`
      Object.entries(crewByDept).sort(([,a], [,b]) => b - a).forEach(([dept, count]) => {
        markdown += `| ${dept} | ${count} |\n`
      })
      markdown += `\n`
    }
    
    // Scenes
    if (scenes.length > 0) {
      markdown += `## Scheduled Scenes\n\n`
      markdown += `| # |\n`
      markdown += `|----|\n`
      scenes.forEach(scene => {
        markdown += `| ${scene} |\n`
      })
      markdown += `\n`
    }
    
    // Crew Call List
    if (crewCalls.length > 0) {
      markdown += `## Crew Call List\n\n`
      markdown += `| Role | Name | Department | Call Time |\n`
      markdown += `|------|------|------------|----------|\n`
      crewCalls.forEach(crew => {
        markdown += `| ${crew.role || '-'} | ${crew.name || '-'} | ${crew.department || '-'} | ${crew.callTime || selected.content?.callTime || '-'} |\n`
      })
      markdown += `\n`
    }
    
    // Notes
    if (selected.notes) {
      markdown += `## Notes\n\n`
      markdown += `${selected.notes}\n\n`
    }
    
    // Footer
    markdown += `---\n\n`
    markdown += `*Generated by CinePilot - Call Sheet Export*\n`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const exportDate = new Date().toISOString().split('T')[0]
    a.download = `callsheet-${exportDate}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [selected])

  // Store handleExportMarkdown in ref for keyboard shortcuts
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

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
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
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
          {/* Filter Toggle Button */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
              }`}
              title="Filter & Sort (F)"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Filter & Sort</span>
                    <span className="text-xs text-cyan-400">(X for all)</span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-xs text-cyan-500 uppercase tracking-wider block mb-2">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'location')}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="date">Date</option>
                        <option value="title">Title</option>
                        <option value="location">Location</option>
                      </select>
                      <button
                        onClick={toggleSortOrder}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortOrder === 'asc' 
                            ? 'bg-cyan-600 text-white hover:bg-cyan-500' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title="Toggle sort order (S)"
                      >
                        {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                      </button>
                    </div>
                  </div>
                  {/* Location Filter */}
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Location (1-{Math.min(9, uniqueLocations.length)})</label>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Locations (0)</option>
                      {uniqueLocations.slice(0, 9).map((loc, i) => (
                        <option key={loc} value={loc}>{loc} ({i + 1})</option>
                      ))}
                    </select>
                  </div>
                  {/* Month Filter */}
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Month (Shift+1-{Math.min(9, uniqueMonths.length)})</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Months (Shift+0)</option>
                      {uniqueMonths.slice(0, 9).map((month, i) => {
                        const [year, m] = month.split('-')
                        const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
                        const shortcut = ['!','@','#','$','%','^','&','*','('][i]
                        return (
                          <option key={month} value={month}>{monthName} (Shift+{shortcut})</option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <button
            onClick={() => {
              fetchShootingDays()
              setShowScheduleImport(true)
            }}
            disabled={creating}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg font-medium transition-colors border border-slate-600"
            title="Import from Schedule (I)"
          >
            <Calendar className="w-4 h-4" />
            Import from Schedule
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
                        title="Print (P)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <div className="relative" ref={exportMenuRef}>
                        <button
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                          title="Export (X)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {showExportMenu && (
                          <div className="absolute right-0 top-full mt-2 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={handleExportCSV}
                              className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Export CSV
                            </button>
                            <button
                              onClick={handleExportJSON}
                              className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Export JSON
                            </button>
                            <button
                              onClick={handleExportMarkdown}
                              className="w-full px-3 py-2 text-left text-sm text-cyan-300 hover:bg-slate-700 hover:text-cyan-200 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Export Markdown
                            </button>
                          </div>
                        )}
                      </div>
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
                { key: 'F', description: 'Toggle filters' },
                { key: 'S', description: 'Toggle sort order (ASC/DESC)' },
                { key: 'N', description: 'New call sheet' },
                { key: 'I', description: 'Import from schedule' },
                { key: 'E', description: 'Edit selected sheet' },
                { key: 'X', description: 'Clear filters (when open) / Export menu' },
                { key: 'M', description: 'Export as Markdown' },
                { key: 'D', description: 'Delete selected sheet' },
                { key: 'P', description: 'Print selected sheet' },
                { key: '?', description: 'Show keyboard shortcuts' },
                { key: 'Esc', description: 'Close modal / filters / Cancel editing' },
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
              
              {/* Number key shortcuts section */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-xs text-amber-400 uppercase tracking-wider mb-3">When Filters Open</h4>
                {[
                  { key: '1-9', description: 'Filter by location' },
                  { key: '0', description: 'Clear location filter' },
                  { key: 'X', description: 'Clear all filters', color: 'cyan' },
                  { key: 'Shift+1-9', description: 'Filter by month' },
                  { key: 'Shift+0', description: 'Clear month filter' },
                ].map((shortcut) => (
                  <div 
                    key={shortcut.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-slate-400 text-sm">{shortcut.description}</span>
                    <kbd className={`px-2 py-0.5 bg-slate-700 border border-slate-600 rounded ${shortcut.color === 'cyan' ? 'text-cyan-400' : 'text-amber-400'} font-mono text-xs`}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Import Modal */}
      {showScheduleImport && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowScheduleImport(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Import from Schedule</h2>
                  <p className="text-sm text-slate-400">Create call sheet from shooting day</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleImport(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingShootingDays ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="ml-3 text-slate-400">Loading shooting days...</span>
              </div>
            ) : shootingDays.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No shooting days found</p>
                <p className="text-sm text-slate-500 mt-1">Create shooting days in the Schedule first</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1">
                {shootingDays.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => createFromShootingDay(day)}
                    disabled={creating}
                    className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          Day {day.dayNumber} — {day.location?.name || 'Unknown Location'}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {day.scheduledDate ? new Date(day.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date not set'}
                          {day.callTime && ` • Call: ${day.callTime}`}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {day.dayScenes?.length || 0} scenes scheduled
                        </div>
                      </div>
                      <div className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
