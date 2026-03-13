'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageCircle, Send, FileText, Clock, Users, Plus, X, Loader2, Search, Download, RefreshCw, Phone, Trash2, Edit2, Keyboard, Printer, ChevronDown, Filter } from 'lucide-react'

interface WhatsAppTemplate { id: string; name: string; category: string; content: string; variables: string[]; createdAt: string }
interface SentMessage { id: string; recipient: string; recipientName?: string; message: string; status: string; timestamp: string }
interface Contact { id: string; name: string; phone: string; role?: string }

const DEMO_TEMPLATES: WhatsAppTemplate[] = [
  { id: 'tpl-1', name: 'Schedule Update', category: 'schedule', content: '📅 *Shooting Schedule Update*\n\nHi {name}!\n\n*Date:* {date}\n*Time:* {time}\n*Location:* {location}\n\nPlease confirm.', variables: ['name', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
  { id: 'tpl-2', name: 'Call Reminder', category: 'reminder', content: '⏰ *Call Reminder*\n\nHi {name}!\n\nDon\'t forget: {date} at {time}\nLocation: {location}', variables: ['name', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
  { id: 'tpl-3', name: 'Call Sheet', category: 'call_sheet', content: '🎬 *Call Sheet*\n\n*Scene:* {scene}\n*Date:* {date}\n*Call Time:* {time}\n*Location:* {location}', variables: ['scene', 'date', 'time', 'location'], createdAt: new Date().toISOString() },
]

const DEMO_CONTACTS: Contact[] = [
  { id: '1', name: 'Ajith Kumar', phone: '+919876543210', role: 'Lead Actor' },
  { id: '2', name: 'Sai Pallavi', phone: '+919876543211', role: 'Lead Actress' },
  { id: '3', name: 'Vijay Sethupathi', phone: '+919876543212', role: 'Supporting Actor' },
  { id: '4', name: 'Ravi K. Chandran', phone: '+919876543213', role: 'Cinematographer' },
  { id: '5', name: 'A.R. Rahman', phone: '+919876543214', role: 'Music Director' },
]

const DEMO_MESSAGES: SentMessage[] = [
  { id: 'wa-1', recipient: '+919876543210', recipientName: 'Ajith Kumar', message: '📅 Schedule Update\n\nDate: 15-03-2026\nTime: 6:00 AM\nLocation: Studio A', status: 'delivered', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'wa-2', recipient: '+919876543213', recipientName: 'Ravi K. Chandran', message: '⏰ Call Reminder\n\nDon\'t forget: 15-03-2026 at 5:00 AM', status: 'read', timestamp: new Date(Date.now() - 7200000).toISOString() },
]

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'contacts'>('compose')
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [messages, setMessages] = useState<SentMessage[]>([])
  const [contacts] = useState<Contact[]>(DEMO_CONTACTS)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [templateFormData, setTemplateFormData] = useState({ name: '', category: 'schedule', content: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Refs for keyboard shortcuts and click outside
  const searchInputRef = useRef<HTMLInputElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const templatesRes = await fetch('/api/whatsapp/templates')
      const templatesData = await templatesRes.json()
      setTemplates(templatesData.templates || DEMO_TEMPLATES)
      const historyRes = await fetch('/api/whatsapp')
      const historyData = await historyRes.json()
      setMessages(historyData.messages || DEMO_MESSAGES)
      setIsDemoMode(templatesData.isDemoMode === true || historyData.isDemoMode === true)
    } catch {
      setTemplates(DEMO_TEMPLATES); setMessages(DEMO_MESSAGES); setIsDemoMode(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setTimeout(() => setIsRefreshing(false), 500)
  }

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
          handleRefresh()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'c':
          e.preventDefault()
          setActiveTab('compose')
          break
        case 't':
          e.preventDefault()
          setActiveTab('templates')
          break
        case 'h':
          e.preventDefault()
          setActiveTab('history')
          break
        case 'o':
          e.preventDefault()
          setActiveTab('contacts')
          break
        case 'n':
          e.preventDefault()
          setEditingTemplate(null)
          setTemplateFormData({ name: '', category: 'schedule', content: '' })
          setShowTemplateEditor(true)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'p':
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
          break
        case 'e':
          e.preventDefault()
          setShowExportDropdown(prev => !prev)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowTemplateEditor(false)
          setShowPrintMenu(false)
          setShowExportDropdown(false)
          setShowFilters(false)
          setSearchQuery('')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showExportDropdown && exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Check if the click is not on the filter toggle button
        const filterButton = document.querySelector('[data-filter-toggle]')
        if (filterButton && !filterButton.contains(e.target as Node)) {
          setShowFilters(false)
        }
      }
    }
    if (showPrintMenu || showExportDropdown || showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrintMenu, showExportDropdown, showFilters])

  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template); setMessage(template.content)
    const vars: Record<string, string> = {}
    template.variables.forEach(v => vars[v] = '')
    setVariableValues(vars)
  }

  useEffect(() => {
    if (!selectedTemplate) return
    let updatedContent = selectedTemplate.content
    Object.entries(variableValues).forEach(([key, value]) => {
      updatedContent = updatedContent.replace(new RegExp(`{${key}}`, 'g'), value || `{${key}}`)
    })
    setMessage(updatedContent)
  }, [variableValues, selectedTemplate])

  const handleSend = async () => {
    if (!recipient || !message) return
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient, message }) })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [{ id: data.message?.id || `wa-${Date.now()}`, recipient, recipientName, message, status: 'pending', timestamp: new Date().toISOString() }, ...prev])
        setRecipient(''); setRecipientName(''); setMessage(''); setSelectedTemplate(null); setVariableValues({})
      }
    } catch { console.error('Failed to send') }
    setSending(false)
  }

  const [savingTemplate, setSavingTemplate] = useState(false)

  const handleSaveTemplate = async () => {
    if (!templateFormData.name || !templateFormData.content) return
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: templateFormData.name,
          category: templateFormData.category,
          content: templateFormData.content
        })
      })
      const data = await res.json()
      if (data.success && data.template) {
        if (editingTemplate) {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data.template : t))
        } else {
          setTemplates(prev => [...prev, data.template])
        }
      }
    } catch (err) {
      console.error('Failed to save template:', err)
      // Fallback to local state
      const variableRegex = /\{(\w+)\}/g
      const variables: string[] = []
      let match
      while ((match = variableRegex.exec(templateFormData.content)) !== null) { if (!variables.includes(match[1])) variables.push(match[1]) }
      const newTemplate: WhatsAppTemplate = { id: editingTemplate?.id || `tpl-${Date.now()}`, name: templateFormData.name, category: templateFormData.category, content: templateFormData.content, variables, createdAt: editingTemplate?.createdAt || new Date().toISOString() }
      if (editingTemplate) { setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? newTemplate : t)) } else { setTemplates(prev => [...prev, newTemplate]) }
    }
    setShowTemplateEditor(false); setEditingTemplate(null); setTemplateFormData({ name: '', category: 'schedule', content: '' })
    setSavingTemplate(false)
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/templates?id=${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
    setTemplates(prev => prev.filter(t => t.id !== id))
  }
  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const stats = {
      total: messages.length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      read: messages.filter(m => m.status === 'read').length,
      sent: messages.filter(m => m.status === 'sent').length,
      pending: messages.filter(m => m.status === 'pending').length,
      failed: messages.filter(m => m.status === 'failed').length,
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - WhatsApp Broadcast Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 32px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .stat-card { background: white; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #111827; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { padding: 24px; }
    .section h2 { font-size: 18px; color: #111827; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .status-delivered { background: #dcfce7; color: #166534; }
    .status-read { background: #d1fae5; color: #065f46; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 WhatsApp Broadcast Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div class="stats">
      <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Messages</div></div>
      <div class="stat-card"><div class="stat-value">${stats.delivered + stats.read}</div><div class="stat-label">Delivered/Read</div></div>
      <div class="stat-card"><div class="stat-value">${stats.failed}</div><div class="stat-label">Failed</div></div>
    </div>
    <div class="section">
      <h2>Recent Messages</h2>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Message</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${messages.slice(0, 20).map(m => `
            <tr>
              <td>${m.recipientName || m.recipient}<br><small style="color:#6b7280">${m.recipient}</small></td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.message}</td>
              <td><span class="status status-${m.status}">${m.status}</span></td>
              <td>${formatTime(m.timestamp)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="footer">
      CinePilot - Film Production Management System
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`
    printWindow.document.write(html)
    printWindow.document.close()
    setShowPrintMenu(false)
  }
  
  const formatTime = (timestamp: string) => { const date = new Date(timestamp), now = new Date(), diffMs = now.getTime() - date.getTime(), diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMins / 60), diffDays = Math.floor(diffHours / 24); if (diffMins < 1) return 'Just now'; if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`; if (diffDays < 7) return `${diffDays}d ago`; return date.toLocaleDateString() }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), messages: messages.map(m => ({ recipient: m.recipient, message: m.message, status: m.status, timestamp: m.timestamp })) }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `whatsapp-history-${new Date().toISOString().split('T')[0]}.json`; a.click()
    setShowExportDropdown(false)
  }
  
  const handleExportCSV = () => {
    const headers = ['Recipient', 'Recipient Name', 'Message', 'Status', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...messages.map(m => [
        `"${(m.recipient || '').replace(/"/g, '""')}"`,
        `"${(m.recipientName || '').replace(/"/g, '""')}"`,
        `"${(m.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${m.status}"`,
        `"${m.timestamp}"`
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `whatsapp-history-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    setShowExportDropdown(false)
  }

  const filteredMessages = messages.filter(m => !searchQuery || m.recipient.includes(searchQuery) || m.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredTemplates = templates.filter(t => (categoryFilter === 'all' || t.category === categoryFilter) && (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())))
  const filteredContacts = contacts.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))

  const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-400', sent: 'bg-blue-500/20 text-blue-400', delivered: 'bg-green-500/20 text-green-400', read: 'bg-emerald-500/20 text-emerald-400', failed: 'bg-red-500/20 text-red-400' }

  if (loading) { return (<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400">Loading WhatsApp...</p></div></div>) }

  return (
    <div className="p-6 space-y-6">
      {/* Header with search and keyboard help */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg"><MessageCircle className="w-6 h-6 text-white" /></div>
          <div><div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">WhatsApp Broadcast</h1>{isDemoMode && <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">Demo Mode</span>}</div><p className="text-gray-500 text-sm mt-1">Send messages to cast & crew</p></div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (/)"
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm w-48 placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          
          {/* Filter Toggle Button */}
          <button
            data-filter-toggle
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
            }`}
            title="Toggle filters (F)"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(categoryFilter !== 'all' || searchQuery) && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                {(categoryFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Filter Panel */}
          {showFilters && (
            <div 
              ref={filterPanelRef}
              className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Filter Options</h3>
                  <button 
                    onClick={() => { setCategoryFilter('all'); setSearchQuery('') }}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    Clear Filters
                  </button>
                </div>
                
                {/* Category Filter */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="schedule">Schedule</option>
                    <option value="reminder">Reminder</option>
                    <option value="call_sheet">Call Sheet</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Keyboard Help Button */}
          <button 
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-5 h-5 text-gray-400" />
          </button>
          
          {/* Print Dropdown */}
          <div className="relative" ref={printMenuRef}>
            <button 
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2"
              title="Print (P)"
            >
              <Printer className="w-5 h-5 text-gray-400" />
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button 
                  onClick={handlePrint}
                  className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Broadcast Report</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2"
              title="Export (E)"
            >
              <Download className="w-5 h-5 text-gray-400" />
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button 
                  onClick={handleExportJSON}
                  className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs with keyboard shortcut hints */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-800 pb-2">
        <div className="flex gap-2">
          {[
            { key: 'compose', label: 'Compose', icon: Send, shortcut: 'C' }, 
            { key: 'templates', label: 'Templates', icon: FileText, shortcut: 'T' }, 
            { key: 'history', label: 'History', icon: Clock, shortcut: 'H' }, 
            { key: 'contacts', label: 'Contacts', icon: Users, shortcut: 'O' }
          ].map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key as typeof activeTab)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-xs text-gray-600 ml-1">({tab.shortcut})</span>
            </button>
          ))}
        </div>
        
        {/* Active tab stats */}
        <div className="text-sm text-gray-500">
          {activeTab === 'templates' && `${filteredTemplates.length} templates`}
          {activeTab === 'history' && `${filteredMessages.length} messages`}
          {activeTab === 'contacts' && `${filteredContacts.length} contacts`}
          {activeTab === 'compose' && `${templates.length} templates available`}
          {searchQuery && ` (filtered)`}
        </div>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Send className="w-5 h-5 text-green-400" />Compose Message</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Recipient</label>
              <div className="flex gap-2">
                <div className="flex-1 relative"><Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+91 98765 43210" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" /></div>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Name" className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">{contacts.slice(0, 4).map(c => (<button key={c.id} onClick={() => { setRecipient(c.phone); setRecipientName(c.name) }} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">{c.name.split(' ')[0]}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Template</label>
              <select value={selectedTemplate?.id || ''} onChange={(e) => { const t = templates.find(x => x.id === e.target.value); if (t) handleTemplateSelect(t) }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"><option value="">Select...</option>{templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select>
            </div>
            {selectedTemplate && selectedTemplate.variables.length > 0 && (<div className="bg-gray-800/50 rounded-lg p-4"><p className="text-xs text-gray-500 mb-2">Variables</p><div className="grid grid-cols-2 gap-2">{selectedTemplate.variables.map(v => (<input key={v} type="text" value={variableValues[v] || ''} onChange={(e) => setVariableValues(p => ({...p, [v]: e.target.value}))} placeholder={v} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />))}</div></div>)}
            <div><label className="block text-sm text-gray-400 mb-2">Message</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none" /><p className="text-xs text-gray-500 mt-2">{message.length} chars</p></div>
            <button onClick={handleSend} disabled={!recipient || !message || sending} className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg flex items-center justify-center gap-2">{sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" />Send</>}</button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div className="bg-[#1a1a1a] rounded-[2.5rem] p-4 mx-auto max-w-sm border-4 border-gray-800">
              <div className="bg-[#2d2d2d] rounded-2xl p-4 mb-2"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"><MessageCircle className="w-5 h-5 text-white" /></div><div><p className="text-white text-sm">{recipientName || recipient || '...'}</p><p className="text-gray-500 text-xs">WhatsApp</p></div></div></div>
              <div className="bg-[#0f0f0f] rounded-2xl p-4 min-h-[300px]">{message ? (<div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-3 ml-8"><p className="text-white text-sm whitespace-pre-wrap">{message}</p></div>) : (<div className="flex items-center justify-center h-[300px] text-gray-600">Preview</div>)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (<div className="space-y-4"><div className="flex items-center justify-between"><div className="flex gap-2"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-48" /></div><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"><option value="all">All</option><option value="schedule">Schedule</option><option value="reminder">Reminder</option><option value="call_sheet">Call Sheet</option></select></div><button onClick={() => { setEditingTemplate(null); setTemplateFormData({ name: '', category: 'schedule', content: '' }); setShowTemplateEditor(true) }} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredTemplates.map(t => (<div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="flex items-start justify-between mb-2"><div><h4 className="font-medium text-white">{t.name}</h4><span className="text-xs text-gray-500">{t.category}</span></div><div className="flex gap-1"><button onClick={() => { setEditingTemplate(t); setTemplateFormData({ name: t.name, category: t.category, content: t.content }); setShowTemplateEditor(true) }} className="p-1 text-gray-400 hover:text-white"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteTemplate(t.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div></div><pre className="text-xs text-gray-400 whitespace-pre-wrap bg-gray-800/50 rounded p-2 max-h-24 overflow-hidden">{t.content}</pre></div>))}</div></div>)}

      {activeTab === 'history' && (<div className="space-y-4"><div className="flex items-center justify-between"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-48" /></div><button onClick={handleExportJSON} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"><Download className="w-4 h-4 inline" />Export</button></div><div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-gray-800/50"><tr><th className="text-left p-4 text-xs text-gray-400">Recipient</th><th className="text-left p-4 text-xs text-gray-400">Message</th><th className="text-center p-4 text-xs text-gray-400">Status</th><th className="text-right p-4 text-xs text-gray-400">Time</th></tr></thead><tbody className="divide-y divide-gray-800">{filteredMessages.map(m => (<tr key={m.id} className="hover:bg-gray-800/30"><td className="p-4"><p className="text-white">{m.recipientName || m.recipient}</p><p className="text-gray-500 text-xs">{m.recipient}</p></td><td className="p-4"><p className="text-gray-300 text-sm line-clamp-1">{m.message}</p></td><td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[m.status] || 'bg-gray-800 text-gray-400'}`}>{m.status}</span></td><td className="p-4 text-right text-gray-500 text-sm">{formatTime(m.timestamp)}</td></tr>))}</tbody></table></div></div>)}

      {activeTab === 'contacts' && (<div className="space-y-4"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-48" /></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredContacts.map(c => (<div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"><span className="text-green-400 font-semibold text-sm">{c.name.split(' ').map(n => n[0]).join('')}</span></div><div className="flex-1"><p className="font-medium text-white">{c.name}</p><p className="text-xs text-gray-500">{c.role}</p></div></div><div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-xs text-gray-500">{c.phone}</span><button onClick={() => { setRecipient(c.phone); setRecipientName(c.name); setActiveTab('compose') }} className="text-xs text-green-400">Send →</button></div></div>))}</div></div>)}

      {showTemplateEditor && (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6"><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-white">{editingTemplate ? 'Edit' : 'New'} Template</h3><button onClick={() => setShowTemplateEditor(false)}><X className="w-5 h-5 text-gray-400" /></button></div><div className="space-y-4"><div><label className="block text-sm text-gray-400 mb-1">Name</label><input type="text" value={templateFormData.name} onChange={(e) => setTemplateFormData(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white" /></div><div><label className="block text-sm text-gray-400 mb-1">Category</label><select value={templateFormData.category} onChange={(e) => setTemplateFormData(p => ({...p, category: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white"><option value="schedule">Schedule</option><option value="reminder">Reminder</option><option value="call_sheet">Call Sheet</option><option value="update">Update</option></select></div><div><label className="block text-sm text-gray-400 mb-1">Content (use {'{var}'})</label><textarea value={templateFormData.content} onChange={(e) => setTemplateFormData(p => ({...p, content: e.target.value}))} rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white resize-none" /></div><button onClick={handleSaveTemplate} disabled={savingTemplate} className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg flex items-center justify-center gap-2">{savingTemplate ? <Loader2 className="w-5 h-5 animate-spin" /> : null}Save Template</button></div></div></div>)}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh data' },
                { key: '/', description: 'Focus search input' },
                { key: 'F', description: 'Toggle filters' },
                { key: 'C', description: 'Switch to Compose tab' },
                { key: 'T', description: 'Switch to Templates tab' },
                { key: 'H', description: 'Switch to History tab' },
                { key: 'O', description: 'Switch to Contacts tab' },
                { key: 'N', description: 'Create new template' },
                { key: 'P', description: 'Toggle print menu' },
                { key: 'E', description: 'Toggle export menu' },
                { key: '?', description: 'Show this help' },
                { key: 'Esc', description: 'Close modal / Clear search' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-green-400">{key}</kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">?</kbd> anytime to show/hide this help</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
