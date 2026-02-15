'use client'

import { useState } from 'react'

interface Notification {
  id: number
  type: 'whatsapp' | 'email'
  to: string
  message: string
  status: 'sent' | 'pending' | 'failed'
  sentAt: string
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'whatsapp', to: '+91 98765 43210', message: 'Call time updated to 06:00 for tomorrow shooting', status: 'sent', sentAt: '2026-02-14 10:30' },
  { id: 2, type: 'whatsapp', to: '+91 98765 43211', message: 'Location changed to Chennai Studio', status: 'sent', sentAt: '2026-02-14 09:15' },
  { id: 3, type: 'email', to: 'crew@film.com', message: 'Shooting Schedule Week 1', status: 'sent', sentAt: '2026-02-13 18:00' },
  { id: 4, type: 'whatsapp', to: '+91 98765 43212', message: 'Your call time is 08:00 for Day 1', status: 'pending', sentAt: '' },
]

const TEMPLATES = [
  { id: 'call_time', name: 'Call Time Update', message: 'Hi {{name}}, your call time for {{date}} is {{call_time}}. Location: {{location}}.' },
  { id: 'location', name: 'Location Change', message: 'Important: Location has been changed to {{new_location}}. Please report there.' },
  { id: 'schedule', name: 'Schedule Release', message: 'Week {{week}} schedule is out! Check the call sheet for details.' },
  { id: 'reminder', name: 'Shooting Reminder', message: 'Reminder: Shooting starts tomorrow at {{call_time}}. See you there!' },
]

const RECIPIENTS = [
  { name: 'Rajesh Kumar', phone: '+91 98765 43210', role: 'Director' },
  { name: 'Anand Chakravarthy', phone: '+91 98765 43211', role: 'Cinematographer' },
  { name: 'Vijay Sethupathi', phone: '+91 98765 43212', role: 'Lead Actor' },
  { name: 'Nithya Menen', phone: '+91 98765 43213', role: 'Lead Actress' },
  { name: 'All Crew', phone: 'crew@film.com', role: 'All' },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'templates'>('send')
  const [type, setType] = useState<'whatsapp' | 'email'>('whatsapp')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const sentCount = notifications.filter(n => n.status === 'sent').length
  const pendingCount = notifications.filter(n => n.status === 'pending').length

  const sendNotification = async () => {
    if (!recipient || !message) return
    setSending(true)
    
    await new Promise(r => setTimeout(r, 1000))
    
    const newNotif: Notification = {
      id: Date.now(),
      type,
      to: recipient,
      message,
      status: 'sent',
      sentAt: new Date().toLocaleString()
    }
    setNotifications([newNotif, ...notifications])
    setRecipient('')
    setMessage('')
    setSending(false)
  }

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template) setMessage(template.message)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📱 Notifications</h1>
          <p className="text-gray-500 mt-1">Send updates to crew via WhatsApp & Email</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Total Sent</div>
          <div className="text-2xl font-bold text-white">{notifications.length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">WhatsApp</div>
          <div className="text-2xl font-bold text-green-400">{notifications.filter(n => n.type === 'whatsapp').length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Email</div>
          <div className="text-2xl font-bold text-blue-400">{notifications.filter(n => n.type === 'email').length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Pending</div>
          <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['send', 'history', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? 'bg-cyan-500 text-black' : 'bg-slate-800'
            }`}
          >
            {tab === 'send' && '📤 Send'}
            {tab === 'history' && '📋 History'}
            {tab === 'templates' && '📝 Templates'}
          </button>
        ))}
      </div>

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="font-bold mb-4">New Notification</h3>
            
            {/* Type */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setType('whatsapp')}
                className={`flex-1 py-3 rounded flex items-center justify-center gap-2 ${
                  type === 'whatsapp' ? 'bg-green-600' : 'bg-slate-700'
                }`}
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => setType('email')}
                className={`flex-1 py-3 rounded flex items-center justify-center gap-2 ${
                  type === 'email' ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                📧 Email
              </button>
            </div>

            {/* Recipient */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Recipient</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2"
              >
                <option value="">Select recipient...</option>
                {RECIPIENTS.map(r => (
                  <option key={r.phone} value={r.phone}>{r.name} ({r.role})</option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Template (optional)</label>
              <select
                value={selectedTemplate}
                onChange={(e) => { applyTemplate(e.target.value); setSelectedTemplate(e.target.value) }}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2"
              >
                <option value="">Select template...</option>
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2"
              />
            </div>

            <button
              onClick={sendNotification}
              disabled={sending || !recipient || !message}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded font-medium"
            >
              {sending ? '⏳ Sending...' : `📤 Send via ${type === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="font-bold mb-4">Preview</h3>
            {recipient && message ? (
              <div className={`rounded-lg p-4 ${type === 'whatsapp' ? 'bg-green-900/30' : 'bg-blue-900/30'}`}>
                <div className="text-xs text-gray-400 mb-2">To: {recipient}</div>
                <div className="whitespace-pre-wrap">{message}</div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Add recipient and message to preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-gray-400">
              <tr>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">To</th>
                <th className="text-left p-3">Message</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notif => (
                <tr key={notif.id} className="border-t border-slate-700">
                  <td className="p-3">
                    <span className={notif.type === 'whatsapp' ? 'text-green-400' : 'text-blue-400'}>
                      {notif.type === 'whatsapp' ? '💬' : '📧'}
                    </span>
                  </td>
                  <td className="p-3">{notif.to}</td>
                  <td className="p-3 max-w-xs truncate">{notif.message}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      notif.status === 'sent' ? 'bg-green-600/30 text-green-300' :
                      notif.status === 'pending' ? 'bg-amber-600/30 text-amber-300' :
                      'bg-red-600/30 text-red-300'
                    }`}>
                      {notif.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{notif.sentAt || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-2 gap-4">
          {TEMPLATES.map(template => (
            <div key={template.id} className="bg-slate-800 p-4 rounded-lg">
              <div className="font-bold mb-2">{template.name}</div>
              <div className="text-sm text-gray-400">{template.message}</div>
              <button
                onClick={() => { setMessage(template.message); setActiveTab('send') }}
                className="mt-3 text-cyan-400 text-sm hover:underline"
              >
                Use this template →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
