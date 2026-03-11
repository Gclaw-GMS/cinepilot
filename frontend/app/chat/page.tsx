'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Settings, 
  Trash2, 
  Copy, 
  Check,
  Zap,
  Clock,
  BarChart3,
  Film,
  DollarSign,
  Users,
  Calendar,
  FileText,
  RefreshCw,
  AlertCircle,
  Loader2,
  Keyboard,
  Download,
  ChevronDown,
  X
} from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface ContextData {
  scriptsCount: number
  scenesCount: number
  budgetTotal: number
  scheduleDays: number
  crewCount: number
  warningsCount: number
  isDemoMode?: boolean
}

const SUGGESTED_PROMPTS = [
  { icon: Film, label: 'Summarize today\'s shoot', prompt: 'What scenes are scheduled for today?' },
  { icon: DollarSign, label: 'Budget status', prompt: 'What is the current budget status?' },
  { icon: Users, label: 'Crew availability', prompt: 'Show me the crew availability for this week' },
  { icon: Calendar, label: 'Schedule overview', prompt: 'Give me an overview of the shooting schedule' },
  { icon: FileText, label: 'Script summary', prompt: 'Summarize the current script breakdown' },
  { icon: AlertCircle, label: 'Production risks', prompt: 'What are the current production risks?' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<ContextData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initialLoadDone = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Add welcome message on first load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      setMessages([
        {
          role: 'assistant',
          content: `👋 Hello! I'm **CinePilot AI**, your production assistant for South Indian cinema.

I have access to your project's data and can help you with:

• 📅 **Shooting Schedule** - Day-by-day breakdown
• 💰 **Budget Analysis** - Cost tracking and forecasts  
• 👥 **Crew Management** - Availability and assignments
• 🎬 **Script Insights** - Scene analysis and notes
• ⚠️ **Risk Assessment** - Production warnings

What would you like to know about your production?`,
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [])

  const handleSend = async (overrideMessage?: string) => {
    const trimmed = overrideMessage || input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { 
      role: 'user', 
      content: trimmed,
      timestamp: new Date().toISOString()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      
      if (data.context) {
        setContext(data.context)
      }
      
      // Track demo mode state
      if (data.isDemoMode !== undefined) {
        setIsDemoMode(data.isDemoMode)
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: data.response,
          timestamp: new Date().toISOString()
        },
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get response'
      setError(message)
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `❌ Sorry, I encountered an error: ${message}. Please try again.`,
          timestamp: new Date().toISOString()
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClear = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      setMessages([])
      setContext(null)
      setIsDemoMode(false)
      initialLoadDone.current = false
    }
  }

  const handleExportCSV = () => {
    setExporting(true)
    const headers = ['Timestamp', 'Role', 'Message']
    const rows = messages.map(m => [
      m.timestamp || new Date().toISOString(),
      m.role,
      `"${m.content.replace(/"/g, '""')}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  const handleExportJSON = () => {
    setExporting(true)
    const exportData = {
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
      context: context ? {
        scriptsCount: context.scriptsCount,
        scenesCount: context.scenesCount,
        budgetTotal: context.budgetTotal,
        scheduleDays: context.scheduleDays,
        crewCount: context.crewCount,
        warningsCount: context.warningsCount,
      } : null,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp || new Date().toISOString(),
      })),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  const handlePrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  // Fetch context data
  const fetchContext = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Give me production context', history: [] }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.context) {
          setContext(data.context)
        }
        if (data.isDemoMode !== undefined) {
          setIsDemoMode(data.isDemoMode)
        }
      }
    } catch (err) {
      console.error('Failed to fetch context:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchContext()
          break
        case '/':
          e.preventDefault()
          inputRef.current?.focus()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'c':
          e.preventDefault()
          handleClear()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu])

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">CinePilot AI Assistant</h1>
                <p className="text-slate-500 text-sm">Ask questions about your production</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchContext}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Refresh context (R)"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(prev => !prev)}
                  disabled={exporting || messages.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                  title="Export chat (E)"
                >
                  <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
                  Export
                  <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </button>
              {isDemoMode && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span>Demo Mode</span>
                </div>
              )}
              {context && (
                <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 rounded-lg text-sm">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">{context.scriptsCount} scripts</span>
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">{context.scenesCount} scenes</span>
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">₹{(context.budgetTotal / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300">{context.crewCount} crew</span>
                  </div>
                </div>
              )}
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-85px)]">
        {/* Sidebar - Suggested Prompts */}
        <aside className="w-72 bg-slate-900/30 border-r border-slate-800 p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2">
            Quick Questions
          </h3>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handlePrompt(item.prompt)}
                disabled={loading}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg text-sm text-left transition-all group disabled:opacity-50"
              >
                <item.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <span className="text-slate-400 group-hover:text-slate-200">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Context Info */}
          {context && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Production Context
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Shooting Days</span>
                  <span className="text-slate-300 font-medium">{context.scheduleDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crew Members</span>
                  <span className="text-slate-300 font-medium">{context.crewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Warnings</span>
                  <span className={context.warningsCount > 0 ? 'text-amber-400 font-medium' : 'text-slate-300 font-medium'}>
                    {context.warningsCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                    : 'bg-slate-700'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-2xl ${
                    msg.role === 'assistant' 
                      ? 'bg-slate-800 border border-slate-700' 
                      : 'bg-indigo-600 text-white'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 mt-1.5 text-xs text-slate-500 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <Clock className="w-3 h-3" />
                    {formatTime(msg.timestamp)}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.content, `msg-${idx}`)}
                        className="ml-2 hover:text-slate-300 transition-colors"
                        title="Copy"
                      >
                        {copiedId === `msg-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && !loading && (
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-4 text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your production... (/)"
                  disabled={loading}
                  rows={1}
                  className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none pr-14"
                  style={{ minHeight: '56px', maxHeight: '200px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  <span>AI can make mistakes - verify important info</span>
                </div>
                <span>•</span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Refresh context</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Focus input</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Clear chat</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">C</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Export chat</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">E</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">?</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-slate-300">Close modal</span>
                <kbd className="px-2.5 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono">Esc</kbd>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
