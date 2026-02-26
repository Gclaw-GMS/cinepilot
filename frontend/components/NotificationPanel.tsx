// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'

// WhatsApp notification templates
export interface WhatsAppTemplate {
  id: string
  name: string
  icon: string
  variables: string[]
  defaultMessage: string
}

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'script_uploaded',
    name: 'Script Uploaded',
    icon: '📜',
    variables: ['project_name', 'script_name'],
    defaultMessage: '📜 *Script Update*\n\nHi! The script "{script_name}" has been uploaded to {project_name}. AI analysis will be ready shortly.'
  },
  {
    id: 'analysis_complete',
    name: 'Analysis Complete',
    icon: '🤖',
    variables: ['project_name', 'scene_count', 'shooting_days'],
    defaultMessage: '🤖 *AI Analysis Complete*\n\n{project_name} Analysis:\n• {scene_count} scenes detected\n• ~{shooting_days} shooting days estimated\n\nView full analysis in CinePilot!'
  },
  {
    id: 'schedule_ready',
    name: 'Schedule Ready',
    icon: '📅',
    variables: ['project_name', 'start_date', 'total_days'],
    defaultMessage: '📅 *Shooting Schedule Ready*\n\n{project_name} schedule is ready!\n• Start: {start_date}\n• Duration: {total_days} days\n\nCheck CinePilot for full breakdown.'
  },
  {
    id: 'callsheet_today',
    name: "Today's Call Sheet",
    icon: '📋',
    variables: ['project_name', 'call_time', 'location', 'scenes'],
    defaultMessage: '📋 *Call Sheet - Today*\n\n{project_name}\n🕐 Call: {call_time}\n📍 Location: {location}\n🎬 Scenes: {scenes}\n\nSee you there!'
  },
  {
    id: 'budget_update',
    name: 'Budget Update',
    icon: '💰',
    variables: ['project_name', 'total_budget', 'spent'],
    defaultMessage: '💰 *Budget Update*\n\n{project_name}\nTotal: ₹{total_budget}\nSpent: ₹{spent}\n\nView detailed breakdown in CinePilot.'
  },
  {
    id: 'shoot_complete',
    name: 'Shoot Complete',
    icon: '🎬',
    variables: ['project_name', 'scenes_completed', 'next_date'],
    defaultMessage: '🎬 *Day Complete!*\n\nGreat work today! 🎉\n• Scenes completed: {scenes_completed}\n• Next shoot: {next_date}\n\nSee you then!'
  },
  {
    id: 'location_change',
    name: 'Location Change',
    icon: '📍',
    variables: ['project_name', 'old_location', 'new_location', 'date'],
    defaultMessage: '📍 *Location Change*\n\n{project_name}\n📍 From: {old_location}\n➡️ To: {new_location}\n📅 Date: {date}\n\nPlease update your travel plans.'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    icon: '✏️',
    variables: [],
    defaultMessage: ''
  }
]

// Email templates
export interface EmailTemplate {
  id: string
  name: string
  icon: string
  subject_template: string
  body_template: string
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'project_update',
    name: 'Project Update',
    icon: '📧',
    subject_template: '[CinePilot] {project_name} - Weekly Update',
    body_template: `Dear Team,

Here is the weekly update on {project_name}:

📊 *Progress:*
- Scenes completed: {scenes_completed}
- Total scenes: {total_scenes}
- Budget spent: ₹{spent} / ₹{total_budget}

📅 *Upcoming:*
- Next shoot: {next_date}
- Location: {next_location}

📋 *Action Items:*
{action_items}

Best regards,
CinePilot Production Team`
  },
  {
    id: 'callsheet',
    name: 'Call Sheet',
    icon: '📋',
    subject_template: '[CinePilot] Call Sheet - {date}',
    body_template: `🎬 *Call Sheet*
{project_name}
Date: {date}

*Call Times:*
- Director: {director_call}
- Cast: {cast_call}
- Crew: {crew_call}

*Location:*
{location}
Address: {address}

*Scenes:*
{scenes_list}

*Notes:*
{notes}

---
Sent via CinePilot`
  },
  {
    id: 'schedule_change',
    name: 'Schedule Change',
    icon: '📅',
    subject_template: '[CinePilot] Schedule Change - {project_name}',
    body_template: `Dear All,

There has been a change in the shooting schedule for {project_name}.

*Change Details:*
- Previous: {old_date} at {old_location}
- New: {new_date} at {new_location}

*Reason:*
{reason}

Please update your schedules accordingly. Contact the production team if you have any conflicts.

Thank you for your understanding.

Best regards,
CinePilot Production`
  },
  {
    id: 'budget_approval',
    name: 'Budget Approval Request',
    icon: '💰',
    subject_template: '[CinePilot] Budget Approval - {project_name}',
    body_template: `Dear {recipient_name},

Please review and approve the following budget for {project_name}:

*Budget Breakdown:*
- Pre-Production: ₹{pre_production}
- Production: ₹{production}
- Post-Production: ₹{post_production}
- Contingency: ₹{contingency}
- *Total: ₹{total}*

*Justification:*
{justification}

Please approve at your earliest convenience.

Best regards,
CinePilot`
  }
]

interface NotificationTemplatesProps {
  type: 'whatsapp' | 'email'
  onSelect: (template: WhatsAppTemplate | EmailTemplate) => void
}

export function NotificationTemplates({ type, onSelect }: NotificationTemplatesProps) {
  const templates = type === 'whatsapp' ? WHATSAPP_TEMPLATES : EMAIL_TEMPLATES
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Templates</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
          >
            <span className="mr-2">{template.icon}</span>
            {template.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// Template variable replacer
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

// Export templates for use elsewhere
export { WHATSAPP_TEMPLATES, EMAIL_TEMPLATES }

// Component for sending notifications
export default function WhatsAppNotificationPanel() {
  const [type, setType] = useState<'whatsapp' | 'email'>('whatsapp')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [projectName, setProjectName] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})

  // Load projects for dropdown
  const [projects, setProjects] = useState<any[]>([])
  useEffect(() => {
    api.projects.list().then(setProjects).catch(() => {})
  }, [])

  const handleTemplateSelect = (template: any) => {
    if (type === 'whatsapp') {
      setMessage(template.defaultMessage)
    } else {
      setSubject(template.subject_template)
      setMessage(template.body_template)
    }
    // Set default variables
    const vars: Record<string, string> = {
      project_name: projectName || 'My Project',
      script_name: 'script_v1.pdf',
      scene_count: '45',
      shooting_days: '25',
      start_date: 'March 1, 2026',
      total_days: '30',
      call_time: '06:00 AM',
      location: 'Meenakshi Temple, Madurai',
      scenes: '1, 2, 3, 5',
      total_budget: '30,00,000',
      spent: '15,00,000',
      scenes_completed: '12',
      next_date: 'Feb 15, 2026',
      date: 'Feb 14, 2026',
    }
    setVariables(vars)
  }

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }))
    // Live update message preview
    const template = type === 'whatsapp' 
      ? WHATSAPP_TEMPLATES.find(t => t.defaultMessage === message)?.defaultMessage || message
      : message
    const newVars = { ...variables, [key]: value }
    // This would update in real-time
  }

  const sendNotification = async () => {
    if (!recipient || !message) return
    
    setSending(true)
    try {
      if (type === 'whatsapp') {
        const response: any = await api.notifications.sendWhatsApp({
          recipient,
          message: replaceVariables(message, variables),
        } as any)
        setResult(response)
      } else {
        const response: any = await api.notifications.sendEmail({
          recipient,
          subject: replaceVariables(subject, variables),
          body: replaceVariables(message, variables),
        } as any)
        setResult(response)
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message })
    } finally {
      setSending(false)
    }
  }

  const getCurrentTemplate = () => {
    if (type === 'whatsapp') {
      return WHATSAPP_TEMPLATES.find(t => t.defaultMessage === message)
    }
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📱 Notification Center</h1>
        <p className="text-gray-500 text-sm mt-1">Send WhatsApp messages and emails to your crew</p>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setType('whatsapp')}
          className={`px-4 py-2 rounded font-medium text-sm ${
            type === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          💬 WhatsApp
        </button>
        <button
          onClick={() => setType('email')}
          className={`px-4 py-2 rounded font-medium text-sm ${
            type === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          📧 Email
        </button>
      </div>

      {/* Templates */}
      <NotificationTemplates type={type} onSelect={handleTemplateSelect as any} />

      {/* Form */}
      <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {type === 'whatsapp' ? 'Phone Number' : 'Email'}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={type === 'whatsapp' ? '+91 98765 43210' : 'crew@example.com'}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project</label>
            <select
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {type === 'email' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Variable Inputs */}
        {getCurrentTemplate() && (
          <div className="mb-4 p-3 bg-purple-900/20 border border-purple-800 rounded">
            <h4 className="text-sm font-medium text-purple-400 mb-2">Template Variables</h4>
            <div className="grid grid-cols-2 gap-2">
              {getCurrentTemplate()?.variables.map(v => (
                <div key={v}>
                  <label className="block text-xs text-gray-500 mb-1">{v.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={variables[v] || ''}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
          />
        </div>

        <button
          onClick={sendNotification}
          disabled={sending || !recipient || !message}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending...
            </>
          ) : (
            <>
              {type === 'whatsapp' ? '💬 Send WhatsApp' : '📧 Send Email'}
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {result.success ? '✅ Message sent successfully!' : `❌ Failed: ${result.error || result.note || 'Unknown error'}`}
          </div>
        )}
      </div>
    </div>
  )
}
