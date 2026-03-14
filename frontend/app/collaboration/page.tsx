'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Users, Mail, Phone, MessageSquare, Calendar, Plus, Search,
  Film, Star, Clock, CheckCircle, MoreHorizontal, Loader2,
  Trash2, Edit2, X, DollarSign, Briefcase, Send, RefreshCw,
  TrendingUp, UserPlus, AlertCircle, HelpCircle, Download, FileText, Printer, Filter
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  email: string | null
  phone: string | null
  status: 'active' | 'busy' | 'offline'
  skills: string[]
  department: string | null
  dailyRate: number | null
  notes: string | null
  createdAt: string
}

interface Stats {
  totalMembers: number
  activeNow: number
  pendingTasks: number
  messages: number
  scriptsCount: number
  locationsCount: number
}

const STATUS_COLORS = {
  active: 'emerald',
  busy: 'amber',
  offline: 'slate',
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'busy', label: 'Busy', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'offline', label: 'Offline', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
]

const DEPARTMENTS = [
  'Camera', 'Lighting', 'Sound', 'Art', 'Makeup', 'Costume',
  'Direction', 'Production', 'VFX', 'Stunts', 'Post-Production'
]

// Demo data for when API is not available
const DEMO_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'], department: 'Direction', dailyRate: 50000, notes: 'Award-winning director', createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'], department: 'Production', dailyRate: 45000, notes: 'Experienced producer', createdAt: '2024-01-15T10:00:00Z' },
  { id: '3', name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'], department: 'Camera', dailyRate: 35000, notes: 'Expert in cinematic lighting', createdAt: '2024-01-15T10:00:00Z' },
  { id: '4', name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'], department: 'Art', dailyRate: 28000, notes: 'Specializes in period dramas', createdAt: '2024-01-15T10:00:00Z' },
  { id: '5', name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'], department: 'Sound', dailyRate: 22000, notes: 'Location sound specialist', createdAt: '2024-01-15T10:00:00Z' },
  { id: '6', name: 'Divya Ramesh', role: 'Editor', email: 'divya@film.com', phone: '+91 98765 43215', status: 'active', skills: ['Editing', 'Color Grading'], department: 'Post-Production', dailyRate: 25000, notes: 'Known for fast-paced action', createdAt: '2024-01-15T10:00:00Z' },
  { id: '7', name: 'Karthik S', role: 'VFX Supervisor', email: 'karthik@film.com', phone: '+91 98765 43216', status: 'busy', skills: ['VFX', 'CGI'], department: 'VFX', dailyRate: 40000, notes: 'International experience', createdAt: '2024-01-15T10:00:00Z' },
  { id: '8', name: 'Bala Subramani', role: 'Stunt Choreographer', email: 'bala@film.com', phone: '+91 98765 43217', status: 'active', skills: ['Stunts', 'Action Design'], department: 'Stunts', dailyRate: 30000, notes: 'Safety certified', createdAt: '2024-01-15T10:00:00Z' },
]

const DEMO_STATS: Stats = {
  totalMembers: 8,
  activeNow: 5,
  pendingTasks: 12,
  messages: 47,
  scriptsCount: 2,
  locationsCount: 6,
}

export default function CollaborationPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<Stats>(DEMO_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
  })
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // Calculate active filter count
  const activeFilterCount = (filters.department !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0)
  const filteredMembersRef = useRef<TeamMember[]>([])

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    department: '',
    dailyRate: '',
    notes: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/collaboration')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `API error: ${res.status}`)
      }
      const data = await res.json()
      setMembers(data.members || [])
      setStats(data.stats || DEMO_STATS)
      setIsDemoMode(false)
    } catch (err) {
      console.error('Failed to fetch collaboration data:', err)
      // Use demo data on error
      setMembers(DEMO_MEMBERS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          setRefreshing(true)
          fetchDataRef.current?.().finally(() => setRefreshing(false))
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'e':
          e.preventDefault()
          if (filteredMembersRef.current.length > 0) {
            setShowExportMenu(!showExportMenu)
          }
          break
        case 'n':
          e.preventDefault()
          if (!showForm) {
            openNewForm()
          }
          break
        case 'd':
          e.preventDefault()
          // Focus department dropdown (simulated with cycling)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearch('')
          setFilters({ department: 'all', status: 'all' })
          break
        case 'p':
          e.preventDefault()
          if (filteredMembersRef.current.length > 0) {
            handlePrintRef.current?.()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showExportMenu, showPrintMenu, showFilters, search])

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    const matchesDept = filters.department === 'all' || m.department === filters.department
    const matchesStatus = filters.status === 'all' || m.status === filters.status
    return matchesSearch && matchesDept && matchesStatus
  })
  
  // Update ref for keyboard shortcuts
  filteredMembersRef.current = filteredMembers

  const activeCount = members.filter(m => m.status === 'active').length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData

      const res = await fetch('/api/collaboration', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }

      const saved = await res.json()

      if (editingId) {
        setMembers(prev => prev.map(m => m.id === editingId ? saved : m))
        setEditingId(null)
      } else {
        setMembers(prev => [saved, ...prev])
      }

      setShowForm(false)
      setFormData({ name: '', role: '', email: '', phone: '', department: '', dailyRate: '', notes: '' })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this team member?')) return
    
    try {
      const res = await fetch('/api/collaboration', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete')
      }

      setMembers(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleEdit = (member: TeamMember) => {
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      department: member.department || '',
      dailyRate: member.dailyRate?.toString() || '',
      notes: member.notes || '',
    })
    setEditingId(member.id)
    setShowForm(true)
  }

  const openNewForm = () => {
    setFormData({ name: '', role: '', email: '', phone: '', department: '', dailyRate: '', notes: '' })
    setEditingId(null)
    setShowForm(true)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Email', 'Phone', 'Department', 'Status', 'Daily Rate', 'Skills']
    const rows = filteredMembers.map(m => [
      m.name,
      m.role,
      m.email || '',
      m.phone || '',
      m.department || '',
      m.status,
      m.dailyRate?.toString() || '',
      m.skills?.join('; ') || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalMembers: filteredMembers.length,
      members: filteredMembers.map(m => ({
        name: m.name,
        role: m.role,
        email: m.email,
        phone: m.phone,
        department: m.department,
        status: m.status,
        dailyRate: m.dailyRate,
        skills: m.skills,
        notes: m.notes
      }))
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-members-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Print function
  const handlePrint = useCallback(() => {
    const membersToPrint = filteredMembersRef.current
    const activeCount = membersToPrint.filter(m => m.status === 'active').length
    const busyCount = membersToPrint.filter(m => m.status === 'busy').length
    const offlineCount = membersToPrint.filter(m => m.status === 'offline').length
    const totalDailyRate = membersToPrint.reduce((sum, m) => sum + (m.dailyRate || 0), 0)
    
    const departments: Record<string, number> = {}
    membersToPrint.forEach(m => {
      if (m.department) {
        departments[m.department] = (departments[m.department] || 0) + 1
      }
    })
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Team Collaboration Report - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #1e293b; }
    .header .date { color: #64748b; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; }
    .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #1e293b; margin-top: 5px; }
    .stat-card.active .value { color: #10b981; }
    .stat-card.busy .value { color: #f59e0b; }
    .stat-card.offline .value { color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status.active { background: #d1fae5; color: #059669; }
    .status.busy { background: #fef3c7; color: #d97706; }
    .status.offline { background: #f1f5f9; color: #64748b; }
    .skills { display: flex; gap: 5px; flex-wrap: wrap; }
    .skill-tag { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Team Collaboration Report</h1>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Total Members</div>
      <div class="value">${membersToPrint.length}</div>
    </div>
    <div class="stat-card active">
      <div class="label">Active</div>
      <div class="value">${activeCount}</div>
    </div>
    <div class="stat-card busy">
      <div class="label">Busy</div>
      <div class="value">${busyCount}</div>
    </div>
    <div class="stat-card offline">
      <div class="label">Offline</div>
      <div class="value">${offlineCount}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Department</th>
        <th>Contact</th>
        <th>Daily Rate</th>
        <th>Status</th>
        <th>Skills</th>
      </tr>
    </thead>
    <tbody>
      ${membersToPrint.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.role}</td>
          <td>${m.department || '-'}</td>
          <td>${m.email || '-'} ${m.phone ? '<br>' + m.phone : ''}</td>
          <td>${m.dailyRate ? '₹' + m.dailyRate.toLocaleString() : '-'}</td>
          <td><span class="status ${m.status}">${m.status.charAt(0).toUpperCase() + m.status.slice(1)}</span></td>
          <td><div class="skills">${(m.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    CinePilot - AI Pre-Production Assistant | Total Daily Rate: ₹${totalDailyRate.toLocaleString()}
  </div>
</body>
</html>`
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    setShowPrintMenu(false)
  }, [])

  // Refs for keyboard shortcuts
  const handlePrintRef = useRef(handlePrint)
  const fetchDataRef = useRef(fetchData)
  
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])
  
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  // Click outside handler for export menu, print menu and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button
        const target = e.target as HTMLElement
        if (!target.closest('.filter-toggle')) {
          setShowFilters(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            Team Collaboration
          </h1>
          <p className="text-slate-400 mt-1">Manage your production team and communications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members... (/)"
              className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchData().finally(() => setRefreshing(false)) }}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || filteredMembers.length === 0}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              title="Export (E)"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 transition-colors text-left border-t border-slate-700"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Print Dropdown */}
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              disabled={exporting || filteredMembers.length === 0}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              title="Print (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 transition-colors text-left"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          {/* Filter Toggle Button */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors filter-toggle ${
                showFilters 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Toggle Filters (F)"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">{activeFilterCount}</span>
              )}
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-white font-medium mb-3">Filter Team</h3>
                  
                  {/* Department Filter */}
                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  
                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => setFilters({ department: 'all', status: 'all' })}
                      className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Clear Filters ({activeFilterCount})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-200 text-sm">Using demo data. Connect a database for full collaboration features.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
          <button onClick={fetchData} className="ml-auto text-red-400 hover:text-red-300 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm text-slate-400">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '-' : stats.totalMembers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Active Now</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{loading ? '-' : activeCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">Pending Tasks</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{loading ? '-' : stats.pendingTasks}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm text-slate-400">Messages</span>
          </div>
          <p className="text-2xl font-bold text-violet-400">{loading ? '-' : stats.messages}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search team members... (/)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <span className="text-slate-400 text-sm">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
          {activeFilterCount > 0 && (
            <span className="ml-2 text-indigo-400">(filtered)</span>
          )}
        </span>
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No team members found</p>
          <button onClick={openNewForm} className="mt-4 text-indigo-400 hover:text-indigo-300">
            Invite your first team member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-semibold flex-shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{member.name}</h3>
                      <p className="text-slate-400 text-sm truncate">{member.role}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      member.status === 'busy' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {member.status}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap gap-2 mb-3">
                  {member.skills?.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                      {skill}
                    </span>
                  ))}
                  {member.department && (
                    <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-xs text-indigo-400">
                      {member.department}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  {member.dailyRate && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(member.dailyRate)}/day
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                  {member.phone && (
                    <a 
                      href={`tel:${member.phone}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  )}
                  <button 
                    onClick={() => handleEdit(member)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Team Member' : 'Invite Team Member'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Director"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@film.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Daily Rate (INR)
                </label>
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                  placeholder="25000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {editingId ? 'Update' : 'Invite'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Refresh data</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Focus search</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle filters</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">F</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Export team data</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">E</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Print team report</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">P</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Add new member</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter by department</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">D</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">?</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Close / Clear filters</span>
                <kbd className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">Esc</kbd>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-500">Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">?</kbd> anytime to show this help</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
