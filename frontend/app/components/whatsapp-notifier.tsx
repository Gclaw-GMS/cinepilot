// @ts-nocheck
/**
 * WhatsApp Notification Integration
 * Sends notifications via WhatsApp for production updates
 */
'use client'

import { useState } from 'react'
import { notifications, type Project, type Scene } from '../lib/api'

interface WhatsAppNotifierProps {
  project?: Project
  scenes?: Scene[]
}

export function WhatsAppNotifier({ project, scenes }: WhatsAppNotifierProps) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!phone || !message) {
      setError('Please enter phone number and message')
      return
    }

    setSending(true)
    setError(null)

    try {
      await notifications.sendWhatsApp(phone, message)
      setSuccess(true)
      setMessage('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📱 WhatsApp Notification</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Phone (with country code)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Enter your message..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          ✅ Message sent successfully!
        </div>
      )}

      <button
        onClick={sendMessage}
        disabled={sending || !phone || !message}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending...' : 'Send WhatsApp'}
      </button>

      {/* Quick Templates */}
      <div className="space-y-2 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700">Quick Templates</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMessage(`🎬 *Shooting Update*\n\nDear team,\n\nShooting scheduled for tomorrow at 6:00 AM.\n\nLocation: ${project?.name || 'TBA'}\n\nPlease confirm attendance.`)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            📅 Schedule Update
          </button>
          <button
            onClick={() => setMessage(`📍 *Location Change*\n\nAttention crew,\n\nLocation changed to new venue.\n\nAddress will be shared shortly.\n\nRegards`)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            📍 Location Change
          </button>
          <button
            onClick={() => setMessage(`🎥 *Call Sheet*\n\nTomorrow's call sheet attached.\n\nCall time: 5:30 AM\n\nBring your costumes and ID.\n\nSee you there!`)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            📄 Call Sheet
          </button>
          <button
            onClick={() => setMessage(`⛈️ *Weather Alert*\n\nShooting postponed due to weather.\n\nNew schedule will be shared soon.\n\nStay safe!`)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            ⛈️ Weather Alert
          </button>
        </div>
      </div>
    </div>
  )
}

// WhatsApp Template Sender
export function WhatsAppTemplateSender() {
  const [phone, setPhone] = useState('')
  const [template, setTemplate] = useState('')
  const [params, setParams] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const templates = [
    { id: 'shooting_schedule', name: 'Shooting Schedule', params: ['date', 'time', 'location'] },
    { id: 'call_sheet', name: 'Call Sheet', params: ['call_time', 'location'] },
    { id: 'location_change', name: 'Location Change', params: ['new_location', 'address'] },
    { id: 'budget_approval', name: 'Budget Approval', params: ['amount', 'project_name'] },
    { id: 'scene_reminder', name: 'Scene Reminder', params: ['scene_number', 'date'] },
  ]

  const selectedTemplate = templates.find(t => t.id === template)

  const sendTemplate = async () => {
    if (!phone || !template) return
    
    setSending(true)
    try {
      await notifications.sendWhatsAppTemplate(phone, template, params)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📋 WhatsApp Templates</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template
        </label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a template</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTemplate?.params.map(param => (
        <div key={param}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {param.replace('_', ' ')}
          </label>
          <input
            type="text"
            value={params[param] || ''}
            onChange={(e) => setParams({ ...params, [param]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      ))}

      <button
        onClick={sendTemplate}
        disabled={sending || !phone || !template}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Template'}
      </button>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          ✅ Template sent successfully!
        </div>
      )}
    </div>
  )
}

// Interactive WhatsApp with Buttons
export function WhatsAppInteractive() {
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const [buttons, setButtons] = useState([{ id: '1', title: 'Confirm' }, { id: '2', title: 'Decline' }])
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const sendInteractive = async () => {
    if (!phone || !body) return
    
    setSending(true)
    try {
      await notifications.sendWhatsAppInteractive(phone, body, buttons)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🔘 Interactive Messages</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buttons
        </label>
        <div className="space-y-2">
          {buttons.map((btn, i) => (
            <div key={btn.id} className="flex gap-2">
              <input
                value={btn.title}
                onChange={(e) => {
                  const newButtons = [...buttons]
                  newButtons[i].title = e.target.value
                  setButtons(newButtons)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Button title"
              />
              {buttons.length > 1 && (
                <button
                  onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {buttons.length < 3 && (
            <button
              onClick={() => setButtons([...buttons, { id: String(buttons.length + 1), title: '' }])}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Button
            </button>
          )}
        </div>
      </div>

      <button
        onClick={sendInteractive}
        disabled={sending || !phone || !body}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Interactive'}
      </button>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          ✅ Message sent with buttons!
        </div>
      )}
    </div>
  )
}
