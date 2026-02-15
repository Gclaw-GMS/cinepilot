"use client"
import { useState } from 'react'
import { whatsappReal, whatsappEnhanced, whatsappTemplates } from '@/lib/api'

interface WhatsAppMessage {
  recipient: string
  message: string
}

export default function WhatsAppIntegration() {
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [useWacli, setUseWacli] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'send' | 'batch' | 'templates'>('send')

  // Batch send state
  const [batchMessages, setBatchMessages] = useState<WhatsAppMessage[]>([
    { recipient: '', message: '' }
  ])

  // Template state
  const [templateType, setTemplateType] = useState('schedule')
  const [templateVars, setTemplateVars] = useState({
    name: '',
    date: '',
    time: '',
    location: ''
  })

  const sendMessage = async () => {
    if (!recipient || !message) return
    setLoading(true)
    try {
      const res = await whatsappReal.send(recipient, message, useWacli)
      setResult(res)
    } catch (err) {
      setResult({ error: String(err) })
    }
    setLoading(false)
  }

  const sendBatch = async () => {
    const valid = batchMessages.filter(m => m.recipient && m.message)
    if (valid.length === 0) return
    setLoading(true)
    try {
      const res = await whatsappReal.batchSend(valid)
      setResult(res)
    } catch (err) {
      setResult({ error: String(err) })
    }
    setLoading(false)
  }

  const addBatchRow = () => {
    setBatchMessages([...batchMessages, { recipient: '', message: '' }])
  }

  const updateBatchRow = (index: number, field: keyof WhatsAppMessage, value: string) => {
    const updated = [...batchMessages]
    updated[index][field] = value
    setBatchMessages(updated)
  }

  const sendTemplate = async () => {
    if (!recipient) return
    setLoading(true)
    
    let msg = ''
    if (templateType === 'schedule') {
      msg = `📅 *Shooting Schedule*\n\n*Name:* ${templateVars.name}\n*Date:* ${templateVars.date}\n*Time:* ${templateVars.time}\n*Location:* ${templateVars.location}`
    } else if (templateType === 'reminder') {
      msg = `⏰ *Reminder*\n\nHi ${templateVars.name}!\nDon't forget: ${templateVars.date} at ${templateVars.time}\nLocation: ${templateVars.location}`
    } else if (templateType === 'call') {
      msg = `🎬 *Call Sheet*\n\n*Scene:* ${templateVars.name}\n*Date:* ${templateVars.date}\n*Call:* ${templateVars.time}\n*Location:* ${templateVars.location}`
    }

    try {
      const res = await whatsappReal.send(recipient, msg, useWacli)
      setResult(res)
    } catch (err) {
      setResult({ error: String(err) })
    }
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">💬 WhatsApp Integration</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Use wacli:</span>
          <button
            onClick={() => setUseWacli(!useWacli)}
            className={`w-12 h-6 rounded-full transition-colors ${
              useWacli ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              useWacli ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['send', 'batch', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {tab === 'send' && '📤 Send'}
            {tab === 'batch' && '📚 Batch'}
            {tab === 'templates' && '📋 Templates'}
          </button>
        ))}
      </div>

      {/* Single Send */}
      {activeTab === 'send' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recipient (WhatsApp number)</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !recipient || !message}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
          >
            {loading ? '⏳ Sending...' : '📤 Send Message'}
          </button>
        </div>
      )}

      {/* Batch Send */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          {batchMessages.map((msg, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={msg.recipient}
                onChange={(e) => updateBatchRow(idx, 'recipient', e.target.value)}
                placeholder="+91..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded p-2"
              />
              <input
                type="text"
                value={msg.message}
                onChange={(e) => updateBatchRow(idx, 'message', e.target.value)}
                placeholder="Message..."
                className="flex-[2] bg-gray-800 border border-gray-700 rounded p-2"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={addBatchRow}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            >
              + Add Row
            </button>
            <button
              onClick={sendBatch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
            >
              {loading ? '⏳ Sending...' : '📚 Send All'}
            </button>
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Template Type</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2"
            >
              <option value="schedule">📅 Shooting Schedule</option>
              <option value="reminder">⏰ Reminder</option>
              <option value="call">🎬 Call Sheet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name/Project</label>
              <input
                type="text"
                value={templateVars.name}
                onChange={(e) => setTemplateVars({...templateVars, name: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="text"
                value={templateVars.date}
                onChange={(e) => setTemplateVars({...templateVars, date: e.target.value})}
                placeholder="Feb 20, 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time</label>
              <input
                type="text"
                value={templateVars.time}
                onChange={(e) => setTemplateVars({...templateVars, time: e.target.value})}
                placeholder="06:00 AM"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={templateVars.location}
                onChange={(e) => setTemplateVars({...templateVars, location: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2"
              />
            </div>
          </div>
          <button
            onClick={sendTemplate}
            disabled={loading || !recipient}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
          >
            {loading ? '⏳ Sending...' : '📋 Send Template'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-6 p-4 rounded ${result.success ? 'bg-green-900' : result.error ? 'bg-red-900' : 'bg-gray-800'}`}>
          <h4 className="font-bold mb-2">{result.success ? '✅ Sent Successfully' : result.error ? '❌ Error' : '📋 Result'}</h4>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>💡 <strong>wacli</strong> must be installed for real WhatsApp sending:</p>
        <code className="bg-gray-800 px-2 py-1 rounded">npm install -g wacli</code>
      </div>
    </div>
  )
}
