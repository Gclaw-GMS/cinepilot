'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Send, FileText, Clock, Users, Plus, X, Loader2, Search, Download, RefreshCw, Phone, Trash2, Edit2 } from 'lucide-react'

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
  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), messages: messages.map(m => ({ recipient: m.recipient, message: m.message, status: m.status, timestamp: m.timestamp })) }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `whatsapp-history-${new Date().toISOString().split('T')[0]}.json`; a.click()
  }

  const filteredMessages = messages.filter(m => !searchQuery || m.recipient.includes(searchQuery) || m.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredTemplates = templates.filter(t => (categoryFilter === 'all' || t.category === categoryFilter) && (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())))
  const filteredContacts = contacts.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))

  const formatTime = (timestamp: string) => { const date = new Date(timestamp), now = new Date(), diffMs = now.getTime() - date.getTime(), diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMins / 60), diffDays = Math.floor(diffHours / 24); if (diffMins < 1) return 'Just now'; if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`; if (diffDays < 7) return `${diffDays}d ago`; return date.toLocaleDateString() }
  const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-400', sent: 'bg-blue-500/20 text-blue-400', delivered: 'bg-green-500/20 text-green-400', read: 'bg-emerald-500/20 text-emerald-400', failed: 'bg-red-500/20 text-red-400' }

  if (loading) { return (<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400">Loading WhatsApp...</p></div></div>) }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg"><MessageCircle className="w-6 h-6 text-white" /></div>
          <div><div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">WhatsApp Broadcast</h1>{isDemoMode && <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">Demo Mode</span>}</div><p className="text-gray-500 text-sm mt-1">Send messages to cast & crew</p></div>
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"><RefreshCw className="w-5 h-5 text-gray-400" /></button>
      </div>

      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {[{ key: 'compose', label: 'Compose', icon: Send }, { key: 'templates', label: 'Templates', icon: FileText }, { key: 'history', label: 'History', icon: Clock }, { key: 'contacts', label: 'Contacts', icon: Users }].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>))}
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

      {activeTab === 'history' && (<div className="space-y-4"><div className="flex items-center justify-between"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-48" /></div><button onClick={handleExportHistory} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"><Download className="w-4 h-4 inline" />Export</button></div><div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-gray-800/50"><tr><th className="text-left p-4 text-xs text-gray-400">Recipient</th><th className="text-left p-4 text-xs text-gray-400">Message</th><th className="text-center p-4 text-xs text-gray-400">Status</th><th className="text-right p-4 text-xs text-gray-400">Time</th></tr></thead><tbody className="divide-y divide-gray-800">{filteredMessages.map(m => (<tr key={m.id} className="hover:bg-gray-800/30"><td className="p-4"><p className="text-white">{m.recipientName || m.recipient}</p><p className="text-gray-500 text-xs">{m.recipient}</p></td><td className="p-4"><p className="text-gray-300 text-sm line-clamp-1">{m.message}</p></td><td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[m.status] || 'bg-gray-800 text-gray-400'}`}>{m.status}</span></td><td className="p-4 text-right text-gray-500 text-sm">{formatTime(m.timestamp)}</td></tr>))}</tbody></table></div></div>)}

      {activeTab === 'contacts' && (<div className="space-y-4"><div className="relative"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-48" /></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredContacts.map(c => (<div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"><span className="text-green-400 font-semibold text-sm">{c.name.split(' ').map(n => n[0]).join('')}</span></div><div className="flex-1"><p className="font-medium text-white">{c.name}</p><p className="text-xs text-gray-500">{c.role}</p></div></div><div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-xs text-gray-500">{c.phone}</span><button onClick={() => { setRecipient(c.phone); setRecipientName(c.name); setActiveTab('compose') }} className="text-xs text-green-400">Send →</button></div></div>))}</div></div>)}

      {showTemplateEditor && (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6"><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-white">{editingTemplate ? 'Edit' : 'New'} Template</h3><button onClick={() => setShowTemplateEditor(false)}><X className="w-5 h-5 text-gray-400" /></button></div><div className="space-y-4"><div><label className="block text-sm text-gray-400 mb-1">Name</label><input type="text" value={templateFormData.name} onChange={(e) => setTemplateFormData(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white" /></div><div><label className="block text-sm text-gray-400 mb-1">Category</label><select value={templateFormData.category} onChange={(e) => setTemplateFormData(p => ({...p, category: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white"><option value="schedule">Schedule</option><option value="reminder">Reminder</option><option value="call_sheet">Call Sheet</option><option value="update">Update</option></select></div><div><label className="block text-sm text-gray-400 mb-1">Content (use {'{var}'})</label><textarea value={templateFormData.content} onChange={(e) => setTemplateFormData(p => ({...p, content: e.target.value}))} rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white resize-none" /></div><button onClick={handleSaveTemplate} disabled={savingTemplate} className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg flex items-center justify-center gap-2">{savingTemplate ? <Loader2 className="w-5 h-5 animate-spin" /> : null}Save Template</button></div></div></div>)}
    </div>
  )
}
