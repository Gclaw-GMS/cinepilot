'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { MessageCircle, Send, FileText, Clock, Users, Plus, X, Loader2, Search, Download, RefreshCw, Phone, Trash2, Edit2, Keyboard, Printer, ChevronDown, Filter, AlertTriangle } from 'lucide-react'

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds
  
  // Filter panel state (using showFilterPanel)
  
  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Sort state
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'recipient' | 'name' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Bulk selection state for contacts
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Bulk selection handlers
  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }, [])
  
  const selectAllContacts = useCallback(() => {
    // Select all contacts (filtered view shows subset)
    setSelectedContacts(new Set(contacts.map(c => c.id)))
  }, [contacts])
  
  const clearSelection = useCallback(() => {
    setSelectedContacts(new Set())
    setShowBulkActions(false)
  }, [])
  
  const handleBulkDelete = useCallback(() => {
    // In demo mode, just clear selection
    // In production, would call API to remove contacts
    setSelectedContacts(new Set())
    setShowDeleteConfirm(false)
    setShowBulkActions(false)
  }, [])
  
  const handleBulkMessage = useCallback(() => {
    // Add selected contacts to compose tab
    const selectedNames = contacts
      .filter(c => selectedContacts.has(c.id))
      .map(c => c.name)
      .join(', ')
    setMessage(prev => prev + (prev ? '\n' : '') + `Bulk message to: ${selectedNames}`)
    setActiveTab('compose')
    clearSelection()
  }, [selectedContacts, contacts, clearSelection])
  
  // Show bulk actions when contacts are selected
  useEffect(() => {
    setShowBulkActions(selectedContacts.size > 0)
  }, [selectedContacts])
  
  // Calculate active filter count (includes sort state)
  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0) + (sortBy !== 'date' || sortOrder !== 'desc' ? 1 : 0)
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setCategoryFilter('all')
    setStatusFilter('all')
    setRoleFilter('all')
    setSearchQuery('')
    setSortBy('date')
    setSortOrder('desc')
  }, [])

  // Refs for keyboard shortcuts
  const clearFiltersRef = useRef(clearFilters)
  const activeFilterCountRef = useRef(activeFilterCount)

  // Sync refs with state
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])
  
  // Refs for keyboard shortcuts and click outside
  const searchInputRef = useRef<HTMLInputElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts to avoid dependency warnings
  const showFilterPanelRef = useRef(showFilterPanel)
  const categoryFilterRef = useRef(categoryFilter)
  const statusFilterRef = useRef(statusFilter)
  const roleFilterRef = useRef(roleFilter)
  const activeTabRef = useRef(activeTab)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)
  const isRefreshingRef = useRef(isRefreshing)
  
  // Update refs when state changes
  useEffect(() => { showFilterPanelRef.current = showFilterPanel }, [showFilterPanel])
  useEffect(() => { categoryFilterRef.current = categoryFilter }, [categoryFilter])
  useEffect(() => { statusFilterRef.current = statusFilter }, [statusFilter])
  useEffect(() => { roleFilterRef.current = roleFilter }, [roleFilter])
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { autoRefreshRef.current = autoRefresh }, [autoRefresh])
  useEffect(() => { autoRefreshIntervalRef.current = autoRefreshInterval }, [autoRefreshInterval])
  useEffect(() => { isRefreshingRef.current = isRefreshing }, [isRefreshing])

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
    setLastUpdated(new Date())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchData()
    setLastUpdated(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }, [fetchData])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const intervalId = setInterval(() => {
      if (!isRefreshingRef.current) {
        setIsRefreshing(true)
        fetchData()
      }
    }, autoRefreshInterval * 1000)
    
    return () => clearInterval(intervalId)
  }, [autoRefresh, autoRefreshInterval, fetchData])

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
          if (!autoRefreshRef.current) {
            handleRefresh()
          }
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(!autoRefreshRef.current)
          break
        case 'f':
          e.preventDefault()
          setShowFilterPanel(prev => !prev)
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
        case 'm':
          e.preventDefault()
          handleExportMarkdownRef.current?.()
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'f':
          e.preventDefault()
          setShowFilterPanel(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowTemplateEditor(false)
          setShowPrintMenu(false)
          setShowExportDropdown(false)
          setShowFilterPanel(false)
          setShowDeleteConfirm(false)
          setSearchQuery('')
          // Clear selection if bulk actions are shown
          if (showBulkActions) {
            clearSelection()
          }
          break
        // Bulk selection shortcuts (only when on contacts tab)
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (activeTab === 'contacts') {
              selectAllContacts()
            }
          }
          break
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (activeTab === 'contacts' && selectedContacts.size > 0) {
              setShowDeleteConfirm(true)
            }
          }
          break
        // Context-aware number keys: different behavior based on filter panel state
        // When filters panel CLOSED: number keys switch tabs
        // When filters panel OPEN: number keys filter by category/status/role
        case '0':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: clear filters
            if (activeTabRef.current === 'templates') setCategoryFilter('all')
            else if (activeTabRef.current === 'history') setStatusFilter('all')
            else if (activeTabRef.current === 'contacts') setRoleFilter('all')
          }
          break
        case 'x':
        case 'X':
          if (!e.ctrlKey && !e.metaKey && showFilterPanelRef.current && activeFilterCountRef.current > 0) {
            e.preventDefault()
            clearFiltersRef.current()
          }
          break
        case '1':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'templates') setCategoryFilter('schedule')
            else if (activeTabRef.current === 'history') setStatusFilter('pending')
            else if (activeTabRef.current === 'contacts') setRoleFilter('Lead Actor')
          } else {
            // Filters closed: switch to Compose tab
            setActiveTab('compose')
          }
          break
        case '2':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'templates') setCategoryFilter('reminder')
            else if (activeTabRef.current === 'history') setStatusFilter('sent')
            else if (activeTabRef.current === 'contacts') setRoleFilter('Lead Actress')
          } else {
            // Filters closed: switch to Templates tab
            setActiveTab('templates')
          }
          break
        case '3':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'templates') setCategoryFilter('call_sheet')
            else if (activeTabRef.current === 'history') setStatusFilter('delivered')
            else if (activeTabRef.current === 'contacts') setRoleFilter('Supporting Actor')
          } else {
            // Filters closed: switch to History tab
            setActiveTab('history')
          }
          break
        case '4':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'history') setStatusFilter('read')
            else if (activeTabRef.current === 'contacts') setRoleFilter('Cinematographer')
          } else {
            // Filters closed: switch to Contacts tab
            setActiveTab('contacts')
          }
          break
        case '5':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'history') setStatusFilter('failed')
            else if (activeTabRef.current === 'contacts') setRoleFilter('Music Director')
          }
          break
        case '6':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'contacts') setRoleFilter('Director')
          }
          break
        case '7':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'contacts') setRoleFilter('Producer')
          }
          break
        case '8':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'contacts') setRoleFilter('Writer')
          }
          break
        case '9':
          e.preventDefault()
          if (showFilterPanelRef.current) {
            // Filters open: apply filter
            if (activeTabRef.current === 'contacts') setRoleFilter('all')
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRefresh, activeTab, showBulkActions, selectedContacts, selectAllContacts, clearSelection, setCategoryFilter, setStatusFilter, setRoleFilter, setShowFilterPanel])

  // Click outside to close dropdowns and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showExportDropdown && exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false)
      }
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button
        const filterButton = document.querySelector('[data-filter-toggle]')
        if (filterButton && filterButton.contains(e.target as Node)) return
        setShowFilterPanel(false)
      }
    }
    if (showPrintMenu || showExportDropdown || showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrintMenu, showExportDropdown, showFilterPanel])

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



  const filteredMessages = useMemo(() => {
    let result = messages.filter(m => {
      const matchSearch = !searchQuery || m.recipient.includes(searchQuery) || m.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) || m.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      return matchSearch && matchStatus
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'recipient':
          comparison = (a.recipientName || a.recipient).localeCompare(b.recipientName || b.recipient)
          break
        default:
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [messages, searchQuery, statusFilter, sortBy, sortOrder])
  const filteredTemplates = useMemo(() => {
    let result = templates.filter(t => {
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [templates, searchQuery, categoryFilter, sortBy, sortOrder])
  
  const filteredContacts = useMemo(() => {
    let result = contacts.filter(c => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
      const matchRole = roleFilter === 'all' || c.role?.toLowerCase().includes(roleFilter.toLowerCase())
      return matchSearch && matchRole
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          // For contacts, 'category' is used as 'role'
          comparison = (a.role || '').localeCompare(b.role || '')
          break
        case 'recipient':
          // For contacts, 'recipient' is used as 'phone'
          comparison = a.phone.localeCompare(b.phone)
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [contacts, searchQuery, roleFilter, sortBy, sortOrder])

  // Markdown Export function - placed after filtered data definitions
  const handleExportMarkdown = useCallback(() => {
    const exportDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const exportTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    
    // Build markdown content
    let markdown = `# CinePilot WhatsApp Report

**Generated:** ${exportDate} at ${exportTime}

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Messages | ${messages.length} |
| Total Templates | ${templates.length} |
| Total Contacts | ${contacts.length} |
| Delivered | ${messages.filter(m => m.status === 'delivered').length} |
| Read | ${messages.filter(m => m.status === 'read').length} |
| Failed | ${messages.filter(m => m.status === 'failed').length} |
| Pending | ${messages.filter(m => m.status === 'pending').length} |

---

## 📋 Templates (${templates.length})

| Name | Category | Variables | Created |
|------|----------|-----------|----------|
${templates.map(t => `| ${t.name} | ${t.category} | ${t.variables.join(', ') || '-'} | ${new Date(t.createdAt).toLocaleDateString('en-IN')} |`).join('\n')}

---

## 💬 Message History (${filteredMessages.length})

| Date | Recipient | Name | Message | Status |
|------|-----------|------|---------|--------|
${filteredMessages.map(m => {
  const date = new Date(m.timestamp).toLocaleDateString('en-IN')
  const statusEmoji = m.status === 'delivered' ? '✅' : m.status === 'read' ? '👁️' : m.status === 'failed' ? '❌' : '⏳'
  const shortMsg = m.message.length > 50 ? m.message.substring(0, 47) + '...' : m.message.replace(/\n/g, ' ')
  return `| ${date} | ${m.recipient} | ${m.recipientName || '-'} | ${shortMsg} | ${statusEmoji} ${m.status} |`
}).join('\n')}

---

## 👥 Contacts (${contacts.length})

| Name | Phone | Role |
|------|-------|------|
${contacts.map(c => `| ${c.name} | ${c.phone} | ${c.role || '-'} |`).join('\n')}

---

*Exported from CinePilot Production Management System*
`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `whatsapp-report-${new Date().toISOString().split('T')[0]}.md`; a.click()
    setShowExportDropdown(false)
  }, [messages, templates, contacts, filteredMessages])

  // Ref for handleExportMarkdown to use in keyboard handler (avoids ordering issues)
  const handleExportMarkdownRef = useRef(handleExportMarkdown)
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-400', sent: 'bg-blue-500/20 text-blue-400', delivered: 'bg-green-500/20 text-green-400', read: 'bg-emerald-500/20 text-emerald-400', failed: 'bg-red-500/20 text-red-400' }

  if (loading) { return (<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400">Loading WhatsApp...</p></div></div>) }

  return (
    <div className="p-6 space-y-6">
      {/* Header with search and keyboard help */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg"><MessageCircle className="w-6 h-6 text-white" /></div>
          <div><div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">WhatsApp Broadcast</h1>{isDemoMode && <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">Demo Mode</span>}{lastUpdated && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{autoRefresh && <span className="text-emerald-400 ml-1">Auto: {autoRefreshInterval < 60 ? `${autoRefreshInterval}s` : `${autoRefreshInterval / 60}m`}</span>}</span>}</div><p className="text-gray-500 text-sm mt-1">Send messages to cast & crew</p></div>
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
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilterPanel 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
            }`}
            title="Toggle filters (F)"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter & Sort Panel */}
          {showFilterPanel && (
            <div 
              ref={filterPanelRef}
              className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Filter & Sort</h3>
                    <span className="text-xs text-cyan-400">Number keys to filter • 0 to clear • X for all</span>
                  </div>
                  <button 
                    onClick={() => { clearFilters() }}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    Clear All ({activeFilterCount})
                  </button>
                </div>
                
                {/* Sort Options */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 block mb-2">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {activeTab === 'history' && [
                      { value: 'date', label: 'Date' },
                      { value: 'status', label: 'Status' },
                      { value: 'recipient', label: 'Recipient' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          sortBy === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {activeTab === 'templates' && [
                      { value: 'date', label: 'Date' },
                      { value: 'name', label: 'Name' },
                      { value: 'category', label: 'Category' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          sortBy === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {activeTab === 'contacts' && [
                      { value: 'name', label: 'Name' },
                      { value: 'category', label: 'Role' },
                      { value: 'recipient', label: 'Phone' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          sortBy === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      sortBy !== 'date' || sortOrder !== 'desc'
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {sortOrder === 'asc' ? (
                      <>
                        <span>↑</span> Ascending
                      </>
                    ) : (
                      <>
                        <span>↓</span> Descending
                      </>
                    )}
                  </button>
                </div>
                
                {/* Category Filter (for templates) */}
                {activeTab === 'templates' && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 block mb-1">Category <span className="text-cyan-400">(1-4)</span></label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="all">All Categories (0)</option>
                      <option value="schedule">Schedule (1)</option>
                      <option value="reminder">Reminder (2)</option>
                      <option value="call_sheet">Call Sheet (3)</option>
                    </select>
                  </div>
                )}
                
                {/* Status Filter (for history) */}
                {activeTab === 'history' && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 block mb-1">Status <span className="text-cyan-400">(1-6)</span></label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="all">All Status (0)</option>
                      <option value="pending">Pending (1)</option>
                      <option value="sent">Sent (2)</option>
                      <option value="delivered">Delivered (3)</option>
                      <option value="read">Read (4)</option>
                      <option value="failed">Failed (5)</option>
                    </select>
                  </div>
                )}
                
                {/* Role Filter (for contacts) */}
                {activeTab === 'contacts' && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 block mb-1">Role <span className="text-cyan-400">(1-9)</span></label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="all">All Roles (0)</option>
                      <option value="Lead Actor">Lead Actor (1)</option>
                      <option value="Lead Actress">Lead Actress (2)</option>
                      <option value="Supporting Actor">Supporting Actor (3)</option>
                      <option value="Cinematographer">Cinematographer (4)</option>
                      <option value="Music Director">Music Director (5)</option>
                      <option value="Director">Director (6)</option>
                      <option value="Producer">Producer (7)</option>
                      <option value="Writer">Writer (8)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing || autoRefresh}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Auto-Refresh Toggle */}
          <div className="relative">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
              title="Auto-Refresh Toggle (A)"
            >
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-xs font-medium">Auto</span>
              </div>
            </button>
            {autoRefresh && (
              <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px] z-20">
                {[10, 30, 60, 300].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAutoRefreshInterval(val)}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center justify-between ${autoRefreshInterval === val ? 'text-cyan-400' : 'text-gray-300'}`}
                  >
                    {val < 60 ? `${val}s` : `${val / 60}m`}
                    {autoRefreshInterval === val && <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
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
                <button 
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-3 text-left text-cyan-400 hover:bg-gray-700 flex items-center gap-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Markdown</span>
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
          {activeTab === 'templates' && `${filteredTemplates.length} of ${templates.length} templates`}
          {activeTab === 'history' && `${filteredMessages.length} of ${messages.length} messages`}
          {activeTab === 'contacts' && `${filteredContacts.length} of ${contacts.length} contacts`}
          {activeTab === 'compose' && `${templates.length} templates available`}
          {activeFilterCount > 0 && ` (filtered)`}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4" ref={filterPanelRef}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter (for Templates) */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Template Category</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="schedule">Schedule</option>
                <option value="reminder">Reminder</option>
                <option value="call_sheet">Call Sheet</option>
                <option value="update">Update</option>
              </select>
            </div>
            
            {/* Status Filter (for History) */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Message Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            {/* Role Filter (for Contacts) */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Contact Role</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Roles</option>
                <option value="Lead Actor">Lead Actor</option>
                <option value="Lead Actress">Lead Actress</option>
                <option value="Supporting Actor">Supporting Actor</option>
                <option value="Cinematographer">Cinematographer</option>
                <option value="Music Director">Music Director</option>
              </select>
            </div>
          </div>
        </div>
      )}

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

      {activeTab === 'templates' && (<div className="space-y-4"><div className="flex items-center justify-between"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search templates..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-64" /></div><button onClick={() => { setEditingTemplate(null); setTemplateFormData({ name: '', category: 'schedule', content: '' }); setShowTemplateEditor(true) }} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Template</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredTemplates.length > 0 ? filteredTemplates.map(t => (<div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-colors"><div className="flex items-start justify-between mb-2"><div><h4 className="font-medium text-white">{t.name}</h4><span className="text-xs text-gray-500">{t.category}</span></div><div className="flex gap-1"><button onClick={() => { setEditingTemplate(t); setTemplateFormData({ name: t.name, category: t.category, content: t.content }); setShowTemplateEditor(true) }} className="p-1 text-gray-400 hover:text-white"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteTemplate(t.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div></div><pre className="text-xs text-gray-400 whitespace-pre-wrap bg-gray-800/50 rounded p-2 max-h-24 overflow-hidden">{t.content}</pre></div>)) : (<div className="col-span-full text-center py-12 text-gray-500">No templates found. Create one to get started!</div>)}</div></div>)}

      {activeTab === 'history' && (<div className="space-y-4"><div className="flex items-center justify-between"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search messages..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-64" /></div><button onClick={handleExportJSON} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"><Download className="w-4 h-4 inline mr-2" />Export</button></div><div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">{filteredMessages.length > 0 ? (<table className="w-full"><thead className="bg-gray-800/50"><tr><th className="text-left p-4 text-xs text-gray-400">Recipient</th><th className="text-left p-4 text-xs text-gray-400">Message</th><th className="text-center p-4 text-xs text-gray-400">Status</th><th className="text-right p-4 text-xs text-gray-400">Time</th></tr></thead><tbody className="divide-y divide-gray-800">{filteredMessages.map(m => (<tr key={m.id} className="hover:bg-gray-800/30"><td className="p-4"><p className="text-white">{m.recipientName || m.recipient}</p><p className="text-gray-500 text-xs">{m.recipient}</p></td><td className="p-4"><p className="text-gray-300 text-sm line-clamp-1">{m.message}</p></td><td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[m.status] || 'bg-gray-800 text-gray-400'}`}>{m.status}</span></td><td className="p-4 text-right text-gray-500 text-sm">{formatTime(m.timestamp)}</td></tr>))}</tbody></table>) : (<div className="text-center py-12 text-gray-500">No messages found.</div>)}</div></div>)}

      {activeTab === 'contacts' && (<div className="space-y-4">
        {/* Selection Header */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contacts..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-64" />
          </div>
          {showBulkActions ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-400 font-medium">{selectedContacts.size} selected</span>
              <button onClick={clearSelection} className="text-sm text-gray-400 hover:text-white">Clear</button>
            </div>
          ) : (
            filteredContacts.length > 0 && (
              <button onClick={selectAllContacts} className="text-sm text-gray-400 hover:text-green-400 flex items-center gap-1">
                Select All
              </button>
            )
          )}
        </div>
        
        {/* Contacts Grid with Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.length > 0 ? filteredContacts.map(c => {
            const isSelected = selectedContacts.has(c.id)
            return (
              <div 
                key={c.id} 
                className={`bg-gray-900 border rounded-xl p-4 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-green-500 ring-1 ring-green-500/30' 
                    : 'border-gray-800 hover:border-green-500/30'
                }`}
                onClick={() => toggleContactSelection(c.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-green-500 border-green-500' : 'border-gray-600'
                  }`}>
                    {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 font-semibold text-sm">{c.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.role}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{c.phone}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRecipient(c.phone); setRecipientName(c.name); setActiveTab('compose') }} 
                    className="text-xs text-green-400 hover:text-green-300 flex-shrink-0"
                  >
                    Send →
                  </button>
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full text-center py-12 text-gray-500">No contacts found.</div>
          )}
        </div>
        
        {/* Floating Bulk Actions Toolbar */}
        {showBulkActions && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl flex items-center gap-4 z-40">
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
              {selectedContacts.size} selected
            </span>
            <div className="h-6 w-px bg-gray-700" />
            <button 
              onClick={handleBulkMessage}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-medium rounded-lg flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium rounded-lg flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <button 
              onClick={clearSelection}
              className="px-3 py-2 text-gray-400 hover:text-white text-sm"
            >
              Clear
            </button>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Contacts</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {selectedContacts.size} selected contact{selectedContacts.size > 1 ? 's' : ''}?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>)}

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
              {/* Main shortcuts */}
              <div className="text-xs text-cyan-400 uppercase tracking-wider mb-1">General</div>
              {[
                { key: 'A', description: 'Toggle auto-refresh' },
                { key: 'R', description: 'Refresh data' },
                { key: 'S', description: 'Toggle sort order (asc/desc)' },
                { key: 'F', description: 'Toggle filter panel' },
                { key: '/', description: 'Focus search input' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-green-400">{key}</kbd>
                </div>
              ))}
              
              {/* Tab shortcuts */}
              <div className="text-xs text-green-400 uppercase tracking-wider mb-1 mt-3">Tabs</div>
              {[
                { key: 'C', description: 'Compose tab' },
                { key: 'T', description: 'Templates tab' },
                { key: 'H', description: 'History tab' },
                { key: 'O', description: 'Contacts tab' },
                { key: 'N', description: 'New template' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-green-400">{key}</kbd>
                </div>
              ))}
              
              {/* Export shortcuts */}
              <div className="text-xs text-purple-400 uppercase tracking-wider mb-1 mt-3">Export</div>
              {[
                { key: 'P', description: 'Toggle print menu' },
                { key: 'E', description: 'Toggle export menu' },
                { key: 'M', description: 'Export Markdown' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-green-400">{key}</kbd>
                </div>
              ))}
              
              {/* Number keys - when filters panel is CLOSED */}
              <div className="text-xs text-amber-400 uppercase tracking-wider mb-1 mt-3">When Filters Closed (Number Keys)</div>
              {[
                { key: '1', description: 'Switch to Compose tab' },
                { key: '2', description: 'Switch to Templates tab' },
                { key: '3', description: 'Switch to History tab' },
                { key: '4', description: 'Switch to Contacts tab' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-amber-400">{key}</kbd>
                </div>
              ))}

              {/* Filter shortcuts - when filters panel is OPEN */}
              <div className="text-xs text-cyan-400 uppercase tracking-wider mb-1 mt-3">When Filters Open (Number Keys)</div>
              {[
                { key: '0', description: 'Clear filter (show all)' },
                { key: 'X', description: 'Clear all filters' },
                { key: '1-3', description: 'Templates: Schedule, Reminder, Call Sheet' },
                { key: '1-5', description: 'History: Pending, Sent, Delivered, Read, Failed' },
                { key: '1-8', description: 'Contacts: Roles (Lead Actor → Writer)' },
              ].map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">{description}</span>
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-cyan-400">{key}</kbd>
                </div>
              ))}
              
              {/* Help shortcut */}
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 mt-3">Help</div>
              {[
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
