// CinePilot - WhatsApp Template Manager
// Manage and send WhatsApp message templates with full demo support

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, MessageSquare, FileText, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Phone } from 'lucide-react'

interface TemplateVariable {
  name: string
  description: string
  placeholder: string
}

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  template: string
  variables: TemplateVariable[]
  description: string
}

interface MessageHistory {
  id: string
  templateName: string
  recipient: string
  variables: Record<string, string>
  sentAt: string
  status: 'sent' | 'failed'
}

// Demo templates that actually work
const DEMO_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'schedule',
    name: 'Shooting Schedule',
    category: 'production',
    description: 'Send shooting schedule to cast and crew',
    template: `📅 *Shooting Schedule Update*

Hello {{name}}!

Your call time for the upcoming shoot:

📍 *Location:* {{location}}
📅 *Date:* {{date}}
⏰ *Call Time:* {{call_time}}
🎬 *Scenes:* {{scenes}}

Please confirm your availability.

- Production Team`,
    variables: [
      { name: 'name', description: 'Recipient name', placeholder: 'Enter name' },
      { name: 'location', description: 'Shooting location', placeholder: 'Studio/Marina Beach/etc.' },
      { name: 'date', description: 'Shoot date', placeholder: 'March 15, 2026' },
      { name: 'call_time', description: 'Call time', placeholder: '06:00 AM' },
      { name: 'scenes', description: 'Scene numbers', placeholder: '1, 2, 3' },
    ],
  },
  {
    id: 'call-sheet',
    name: 'Call Sheet',
    category: 'production',
    description: 'Send detailed call sheet to crew',
    template: `🎬 *CALL SHEET*

*Date:* {{date}}
*Call Time:* {{call_time}}
*Location:* {{location}}

*Scene(s):* {{scenes}}
*Director:* {{director}}

📋 *Important Notes:*
{{notes}}

Reply CONFIRM to acknowledge.

- Production`,
    variables: [
      { name: 'date', description: 'Shoot date', placeholder: 'March 15, 2026' },
      { name: 'call_time', description: 'Call time', placeholder: '06:00 AM' },
      { name: 'location', description: 'Location', placeholder: 'Studio name' },
      { name: 'scenes', description: 'Scene numbers', placeholder: '1, 2, 3, 4' },
      { name: 'director', description: 'Director name', placeholder: 'Director Name' },
      { name: 'notes', description: 'Special notes', placeholder: 'Warm clothing, pack lunch, etc.' },
    ],
  },
  {
    id: 'reminder',
    name: 'Shoot Reminder',
    category: 'notification',
    description: 'Remind cast/crew about upcoming shoot',
    template: `⏰ *SHOOT REMINDER*

Hi {{name}}!

Just a friendly reminder about your upcoming shoot:

📅 Date: {{date}}
⏰ Time: {{time}}
📍 Location: {{location}}

Please arrive 30 minutes early.

See you on set! 🎬`,
    variables: [
      { name: 'name', description: 'Recipient name', placeholder: 'Enter name' },
      { name: 'date', description: 'Date', placeholder: 'March 15, 2026' },
      { name: 'time', description: 'Time', placeholder: '06:00 AM' },
      { name: 'location', description: 'Location', placeholder: 'Studio name' },
    ],
  },
  {
    id: 'location-change',
    name: 'Location Change',
    category: 'logistics',
    description: 'Notify about location change',
    template: `📍 *Location Change Notice*

Hi {{name}},

The shooting location has been changed:

*Old Location:* {{old_location}}
*New Location:* {{new_location}}
*Effective:* {{date}}

Please update your travel plans accordingly.

Sorry for any inconvenience!

- Production Team`,
    variables: [
      { name: 'name', description: 'Recipient name', placeholder: 'Enter name' },
      { name: 'old_location', description: 'Original location', placeholder: 'Old location' },
      { name: 'new_location', description: 'New location', placeholder: 'New location' },
      { name: 'date', description: 'Effective date', placeholder: 'March 15, 2026' },
    ],
  },
  {
    id: 'cast-call',
    name: 'Cast Call',
    category: 'casting',
    description: 'Send casting call to actors',
    template: `🎭 *CASTING CALL*

Role: {{role}}
Project: {{project}}
Description: {{description}}

📅 Auditions: {{audition_date}}
📍 Location: {{location}}
📧 Submit to: {{submit_email}}

Looking forward to your submission!`,
    variables: [
      { name: 'role', description: 'Character role', placeholder: 'Lead role' },
      { name: 'project', description: 'Project name', placeholder: 'Movie title' },
      { name: 'description', description: 'Role description', placeholder: 'Brief description' },
      { name: 'audition_date', description: 'Audition date', placeholder: 'March 20, 2026' },
      { name: 'location', description: 'Audition location', placeholder: 'Studio address' },
      { name: 'submit_email', description: 'Submission email', placeholder: 'casting@email.com' },
    ],
  },
  {
    id: 'crew-welcome',
    name: 'Welcome Message',
    category: 'onboarding',
    description: 'Welcome new crew members',
    template: `👋 *Welcome to the Team!*

Hi {{name}}!

We're excited to have you join us for {{project}}.

📅 Start Date: {{start_date}}
📍 Location: {{location}}
👤 Contact: {{contact_person}}

Please reach out if you have any questions.

See you on set! 🎬`,
    variables: [
      { name: 'name', description: 'Crew member name', placeholder: 'Enter name' },
      { name: 'project', description: 'Project name', placeholder: 'Movie title' },
      { name: 'start_date', description: 'Start date', placeholder: 'March 1, 2026' },
      { name: 'location', description: 'Reporting location', placeholder: 'Studio name' },
      { name: 'contact_person', description: 'Contact person', placeholder: 'Production manager name' },
    ],
  },
]

interface WhatsAppTemplateManagerProps {
  onMessageSent?: (result: MessageHistory) => void
}

export default function WhatsAppTemplateManager({ onMessageSent }: WhatsAppTemplateManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [recipient, setRecipient] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; messageId?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([])
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose')

  // Load templates and history on mount
  useEffect(() => {
    // Simulate API load
    setTimeout(() => {
      setTemplates(DEMO_TEMPLATES)
      // Load from localStorage if available
      const saved = localStorage.getItem('whatsapp-history')
      if (saved) {
        try {
          setMessageHistory(JSON.parse(saved))
        } catch {
          // ignore
        }
      }
      setLoading(false)
    }, 500)
  }, [])

  // Reset variables when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) {
        const vars: Record<string, string> = {}
        template.variables.forEach(v => {
          vars[v.name] = ''
        })
        setVariables(vars)
      }
    } else {
      setVariables({})
    }
  }, [selectedTemplateId, templates])

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const formatPreview = useCallback(() => {
    if (!selectedTemplate) return ''
    
    let preview = selectedTemplate.template
    selectedTemplate.variables.forEach(v => {
      const value = variables[v.name] || `[${v.name}]`
      preview = preview.replace(new RegExp(`{{${v.name}}}`, 'g'), value)
    })
    return preview
  }, [selectedTemplate, variables])

  const validateRecipient = (phone: string): boolean => {
    // Basic validation - allows various formats
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^[\+]?[(]?[0-9]{1,4}[)]?[0-9]{7,12}$/.test(cleaned)
  }

  const handleSend = async () => {
    if (!selectedTemplateId || !recipient) return
    
    if (!validateRecipient(recipient)) {
      setResult({ error: 'Please enter a valid phone number' })
      return
    }

    // Check all variables are filled
    const template = templates.find(t => t.id === selectedTemplateId)
    if (template) {
      const missingVars = template.variables.filter(v => !variables[v.name]?.trim())
      if (missingVars.length > 0) {
        setResult({ error: `Please fill in: ${missingVars.map(v => v.name).join(', ')}` })
        return
      }
    }
    
    setSending(true)
    setResult(null)
    
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate success (in real app, would call API)
    const messageId = `msg-${Date.now()}`
    const newHistory: MessageHistory = {
      id: messageId,
      templateName: selectedTemplate?.name || 'Unknown',
      recipient,
      variables: { ...variables },
      sentAt: new Date().toISOString(),
      status: 'sent',
    }
    
    const updatedHistory = [newHistory, ...messageHistory]
    setMessageHistory(updatedHistory)
    localStorage.setItem('whatsapp-history', JSON.stringify(updatedHistory))
    
    setResult({ success: true, messageId })
    onMessageSent?.(newHistory)
    setSending(false)
  }

  const clearHistory = () => {
    setMessageHistory([])
    localStorage.removeItem('whatsapp-history')
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-32 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <MessageSquare className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">WhatsApp Templates</h3>
            <p className="text-xs text-slate-400">Send messages to cast & crew</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'compose' 
                ? 'bg-green-500/20 text-green-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' 
                ? 'bg-green-500/20 text-green-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            History ({messageHistory.length})
          </button>
        </div>
      </div>

      {activeTab === 'compose' ? (
        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Select Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose a template...</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.category})
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p>
            )}
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Recipient Phone
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-600"
            />
          </div>

          {/* Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Template Variables
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTemplate.variables.map((v) => (
                  <div key={v.name} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <label className="text-xs text-slate-400 block mb-1 capitalize">
                      {v.name.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={variables[v.name] || ''}
                      onChange={(e) => setVariables({ ...variables, [v.name]: e.target.value })}
                      placeholder={v.placeholder}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-slate-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedTemplate && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Preview</span>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-white whitespace-pre-wrap font-mono">
                  {formatPreview()}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{result.error}</p>
            </div>
          )}

          {/* Success Display */}
          {result?.success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                ✓ Message sent successfully at {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!selectedTemplateId || !recipient || sending}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send WhatsApp Message
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* History Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">Message History</h4>
            {messageHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            )}
          </div>

          {/* History List */}
          {messageHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages sent yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {messageHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-start justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {msg.templateName}
                      </span>
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      To: {msg.recipient}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(msg.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
