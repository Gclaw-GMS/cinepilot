/**
 * Enhanced WhatsApp Notification Center
 * Advanced templates and batch messaging
 */
'use client'

import { useState, useEffect } from 'react'

interface NotificationTemplate {
  id: string
  name: string
  template: string
  category: string
  variables: string[]
}

const TEMPLATES: NotificationTemplate[] = [
  {
    id: 'call_sheet',
    name: '📅 Call Sheet',
    template: `🎬 CALL SHEET - {project_name}

📅 Date: {date}
⏰ Call Time: {call_time}
📍 Location: {location}

Scenes: {scenes}

Costume: {costume_notes}
Makeup: {makeup_notes}

Stay safe!`,
    category: 'schedule',
    variables: ['project_name', 'date', 'call_time', 'location', 'scenes', 'costume_notes', 'makeup_notes']
  },
  {
    id: 'schedule_change',
    name: '🔄 Schedule Change',
    template: `⚠️ SCHEDULE CHANGE - {project_name}

📅 New Date: {new_date}
⏰ New Call Time: {new_call_time}
📍 New Location: {new_location}

Reason: {reason}

Contact {contact_person} if you have questions.`,
    category: 'schedule',
    variables: ['project_name', 'new_date', 'new_call_time', 'new_location', 'reason', 'contact_person']
  },
  {
    id: 'location_update',
    name: '📍 Location Update',
    template: `📍 LOCATION UPDATE - {project_name}

📍 Location: {location_name}
📌 Address: {address}

🅿️ Parking: {parking_info}
📝 Notes: {notes}

See you there!`,
    category: 'schedule',
    variables: ['project_name', 'location_name', 'address', 'parking_info', 'notes']
  },
  {
    id: 'shoot_reminder',
    name: '⏰ Shoot Reminder',
    template: `⏰ REMINDER - {project_name}

📅 Tomorrow: {date}
⏰ Call Time: {call_time}
📍 Location: {location}

What to bring: {bring_items}

Don't be late! 🎬`,
    category: 'reminder',
    variables: ['project_name', 'date', 'call_time', 'location', 'bring_items']
  },
  {
    id: 'budget_alert',
    name: '💰 Budget Alert',
    template: `💰 BUDGET UPDATE - {project_name}

📊 Spent: ₹{spent}
📈 Budget: ₹{budget}
📉 Remaining: ₹{remaining}

{alert_message}

Talk to {contact_person} for details.`,
    category: 'budget',
    variables: ['project_name', 'spent', 'budget', 'remaining', 'alert_message', 'contact_person']
  },
  {
    id: 'scene_ready',
    name: '🎬 Scene Ready',
    template: `🎬 SCENE READY - {project_name}

Scene {scene_number}: {scene_heading}
📍 Location: {location}
⏰ Time: {time_of_day}

{scene_description}

Be prepared!`,
    category: 'production',
    variables: ['project_name', 'scene_number', 'scene_heading', 'location', 'time_of_day', 'scene_description']
  },
  {
    id: 'equipment_ready',
    name: '🎥 Equipment Ready',
    template: `🎥 EQUIPMENT READY - {project_name}

Items: {equipment_list}
📍 Location: {location}

Please check and confirm.`,
    category: 'production',
    variables: ['project_name', 'equipment_list', 'location']
  },
  {
    id: 'wrapping_up',
    name: '🎉 Wrapping Up',
    template: `🎉 WRAP - {project_name}

That's a wrap for {date}!

Great work everyone! 🎬
See you next shoot day.`,
    category: 'production',
    variables: ['project_name', 'date']
  }
]

export function EnhancedWhatsAppNotifier() {
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState('')
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    if (selectedTemplate) {
      const vars: Record<string, string> = {}
      selectedTemplate.variables.forEach(v => vars[v] = '')
      setVariables(vars)
    }
  }, [selectedTemplate])

  useEffect(() => {
    if (selectedTemplate && variables) {
      let text = selectedTemplate.template
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{${key}}`, 'g'), value || `[${key}]`)
      })
      setPreview(text)
    }
  }, [selectedTemplate, variables])

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !recipients.includes(recipientInput.trim())) {
      setRecipients([...recipients, recipientInput.trim()])
      setRecipientInput('')
    }
  }

  const handleSend = async () => {
    if (!recipients.length || !preview) return
    
    setSending(true)
    try {
      // Send to all recipients
      for (const phone of recipients) {
        await fetch('/api/notifications/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message: preview })
        })
      }
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (error) {
      console.error('Failed to send:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredTemplates = category === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === category)

  const categories = ['all', 'schedule', 'reminder', 'budget', 'production']

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Select Template</h3>
        
        <div className="flex gap-2 mb-3 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm ${
                category === cat 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-3 rounded-lg text-left text-sm transition-all ${
                selectedTemplate?.id === template.id
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-50 border border-gray-200 hover:border-green-300'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <>
          {/* Variable Inputs */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📝 Fill Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedTemplate.variables.map(variable => (
                <div key={variable}>
                  <label className="block text-sm text-gray-600 mb-1 capitalize">
                    {variable.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={variables[variable] || ''}
                    onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">👁️ Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap text-sm">
              {preview}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <h3 className="text-lg font-semibold mb-3">👥 Recipients</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="tel"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                placeholder="+91 98765 43210"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipients.map((phone, i) => (
                <span
                  key={i}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {phone}
                  <button
                    onClick={() => setRecipients(recipients.filter(r => r !== phone))}
                    className="text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !recipients.length || !preview}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : sent ? '✓ Sent Successfully!' : `📤 Send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Notification History
 */
export function NotificationHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage (mock)
    setLoading(false)
    // In real app, fetch from API
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl">📭</span>
          <p className="mt-2">No notifications sent yet</p>
        </div>
      ) : (
        history.map((item, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{item.recipient}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.message}</p>
              </div>
              <span className="text-xs text-gray-400">{item.sent_at}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
