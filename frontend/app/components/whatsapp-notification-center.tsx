/**
 * CinePilot - WhatsApp Notification Center
 * Enhanced WhatsApp with Schedule Reminders, Location Updates, Cast Calls
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { whatsappEnhanced } from '../lib/api'

interface Contact {
  id: string
  name: string
  phone: string
  role: string
}

export default function WhatsAppNotificationCenter({ contacts = [] }: { contacts?: Contact[] }) {
  const [activeTab, setActiveTab] = useState<'reminder' | 'location' | 'cast'>('reminder')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // Form states
  const [reminderForm, setReminderForm] = useState({
    recipient: '',
    projectName: 'My Film',
    date: new Date().toISOString().split('T')[0],
    callTime: '06:00',
    location: 'Primary Location'
  })
  
  const [locationForm, setLocationForm] = useState({
    recipient: '',
    oldLocation: 'Studio A',
    newLocation: 'Outdoor Location',
    effectiveDate: new Date().toISOString().split('T')[0]
  })
  
  const [castForm, setCastForm] = useState({
    recipient: '',
    characterName: '',
    shootDate: new Date().toISOString().split('T')[0],
    callTime: '07:00',
    scenes: ''
  })

  const tabs = [
    { id: 'reminder', label: '📅 Schedule Reminder', icon: '📅' },
    { id: 'location', label: '📍 Location Update', icon: '📍' },
    { id: 'cast', label: '🎭 Cast Call', icon: '🎭' },
  ]

  const sendReminder = async () => {
    if (!reminderForm.recipient) return
    setSending(true)
    try {
      const res = await whatsappEnhanced.scheduleReminder(
        reminderForm.recipient,
        reminderForm.projectName,
        reminderForm.date,
        reminderForm.callTime,
        reminderForm.location
      )
      setResult(res)
    } catch (e) {
      setResult({ status: 'error', message: 'Failed to send' })
    }
    setSending(false)
  }

  const sendLocationUpdate = async () => {
    if (!locationForm.recipient) return
    setSending(true)
    try {
      const res = await whatsappEnhanced.locationUpdate(
        locationForm.recipient,
        locationForm.oldLocation,
        locationForm.newLocation,
        locationForm.effectiveDate
      )
      setResult(res)
    } catch (e) {
      setResult({ status: 'error', message: 'Failed to send' })
    }
    setSending(false)
  }

  const sendCastCall = async () => {
    if (!castForm.recipient) return
    setSending(true)
    try {
      const scenesArray = castForm.scenes.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      const res = await whatsappEnhanced.castCall(
        castForm.recipient,
        castForm.characterName,
        castForm.shootDate,
        castForm.callTime,
        scenesArray
      )
      setResult(res)
    } catch (e) {
      setResult({ status: 'error', message: 'Failed to send' })
    }
    setSending(false)
  }

  const handleSend = () => {
    setResult(null)
    if (activeTab === 'reminder') sendReminder()
    else if (activeTab === 'location') sendLocationUpdate()
    else if (activeTab === 'cast') sendCastCall()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-xl p-6 border border-green-800">
        <div className="flex items-center gap-3">
          <div className="text-4xl">💬</div>
          <div>
            <h2 className="text-xl font-bold text-white">WhatsApp Notifications</h2>
            <p className="text-green-300 text-sm">Send automated notifications to cast & crew</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setResult(null) }}
              className={`flex-1 py-4 px-4 font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'reminder' && (
              <motion.div
                key="reminder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Recipient Phone</label>
                  <input
                    type="tel"
                    value={reminderForm.recipient}
                    onChange={(e) => setReminderForm({ ...reminderForm, recipient: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Project Name</label>
                    <input
                      type="text"
                      value={reminderForm.projectName}
                      onChange={(e) => setReminderForm({ ...reminderForm, projectName: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Date</label>
                    <input
                      type="date"
                      value={reminderForm.date}
                      onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Call Time</label>
                    <input
                      type="time"
                      value={reminderForm.callTime}
                      onChange={(e) => setReminderForm({ ...reminderForm, callTime: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Location</label>
                    <input
                      type="text"
                      value={reminderForm.location}
                      onChange={(e) => setReminderForm({ ...reminderForm, location: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Recipient Phone</label>
                  <input
                    type="tel"
                    value={locationForm.recipient}
                    onChange={(e) => setLocationForm({ ...locationForm, recipient: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Old Location</label>
                    <input
                      type="text"
                      value={locationForm.oldLocation}
                      onChange={(e) => setLocationForm({ ...locationForm, oldLocation: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">New Location</label>
                    <input
                      type="text"
                      value={locationForm.newLocation}
                      onChange={(e) => setLocationForm({ ...locationForm, newLocation: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Effective Date</label>
                  <input
                    type="date"
                    value={locationForm.effectiveDate}
                    onChange={(e) => setLocationForm({ ...locationForm, effectiveDate: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'cast' && (
              <motion.div
                key="cast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Recipient Phone</label>
                  <input
                    type="tel"
                    value={castForm.recipient}
                    onChange={(e) => setCastForm({ ...castForm, recipient: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Character Name</label>
                    <input
                      type="text"
                      value={castForm.characterName}
                      onChange={(e) => setCastForm({ ...castForm, characterName: e.target.value })}
                      placeholder="Arjun"
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Shoot Date</label>
                    <input
                      type="date"
                      value={castForm.shootDate}
                      onChange={(e) => setCastForm({ ...castForm, shootDate: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Call Time</label>
                    <input
                      type="time"
                      value={castForm.callTime}
                      onChange={(e) => setCastForm({ ...castForm, callTime: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Scenes (comma-separated)</label>
                    <input
                      type="text"
                      value={castForm.scenes}
                      onChange={(e) => setCastForm({ ...castForm, scenes: e.target.value })}
                      placeholder="1, 2, 5, 10"
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {sending ? '⏳ Sending...' : '📤 Send WhatsApp Message'}
            </button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-4 rounded-lg ${
                  result.status === 'sent' || result.status === 'scheduled' 
                    ? 'bg-green-900/30 border border-green-800' 
                    : 'bg-red-900/30 border border-red-800'
                }`}
              >
                <p className="text-white">
                  {result.status === 'sent' || result.status === 'scheduled' 
                    ? `✅ Message ${result.status} to ${result.recipient}`
                    : '❌ Failed to send message'}
                </p>
                {result.message && (
                  <details className="mt-2">
                    <summary className="text-gray-400 text-sm cursor-pointer">Preview Message</summary>
                    <pre className="mt-2 text-gray-300 text-xs whitespace-pre-wrap bg-gray-800 p-3 rounded">
                      {result.message}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Contacts */}
      {contacts.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-white font-medium mb-4">Quick Select Contact</h3>
          <div className="flex flex-wrap gap-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  if (activeTab === 'reminder') setReminderForm({ ...reminderForm, recipient: contact.phone })
                  else if (activeTab === 'location') setLocationForm({ ...locationForm, recipient: contact.phone })
                  else if (activeTab === 'cast') setCastForm({ ...castForm, recipient: contact.phone })
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {contact.name} ({contact.role})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
