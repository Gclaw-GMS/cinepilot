// @ts-nocheck
'use client'

import { useState } from 'react'
import { whatsappEnhanced, type ScheduleReminderRequest, type LocationUpdateRequest, type CastCallRequest } from '@/lib/api'

interface WhatsAppNotificationCenterProps {
  projectName?: string
}

export default function WhatsAppNotificationCenter({ projectName = 'My Film Project' }: WhatsAppNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'location' | 'cast'>('schedule')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Form states
  const [scheduleForm, setScheduleForm] = useState<ScheduleReminderRequest>({
    recipient: '',
    project_name: projectName,
    shoot_date: '',
    call_time: '06:00',
    location: ''
  })

  const [locationForm, setLocationForm] = useState<LocationUpdateRequest>({
    recipient: '',
    project_name: projectName,
    old_location: '',
    new_location: '',
    effective_date: ''
  })

  const [castForm, setCastForm] = useState<CastCallRequest>({
    recipient: '',
    actor_name: '',
    project_name: projectName,
    scene_numbers: [],
    call_time: '06:00',
    date: ''
  })

  const handleSend = async () => {
    setSending(true)
    setSent(false)
    
    try {
      switch (activeTab) {
        case 'schedule':
          await whatsappEnhanced.sendScheduleReminder(scheduleForm)
          break
        case 'location':
          await whatsappEnhanced.sendLocationUpdate(locationForm)
          break
        case 'cast':
          await whatsappEnhanced.sendCastCall(castForm)
          break
      }
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (error) {
      console.error('Failed to send:', error)
    }
    
    setSending(false)
  }

  const tabs = [
    { id: 'schedule', label: 'Schedule Reminder', icon: '📅' },
    { id: 'location', label: 'Location Update', icon: '📍' },
    { id: 'cast', label: 'Cast Call', icon: '🎭' },
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <h3 className="text-xl font-bold mb-4">📱 WhatsApp Notifications</h3>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="space-y-4">
        {/* Schedule Reminder Form */}
        {activeTab === 'schedule' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recipient Phone</label>
              <input
                type="tel"
                value={scheduleForm.recipient}
                onChange={e => setScheduleForm({ ...scheduleForm, recipient: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shoot Date</label>
              <input
                type="date"
                value={scheduleForm.shoot_date}
                onChange={e => setScheduleForm({ ...scheduleForm, shoot_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Call Time</label>
                <input
                  type="time"
                  value={scheduleForm.call_time}
                  onChange={e => setScheduleForm({ ...scheduleForm, call_time: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={scheduleForm.location}
                  onChange={e => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                  placeholder="Studio A"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </>
        )}

        {/* Location Update Form */}
        {activeTab === 'location' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recipient Phone</label>
              <input
                type="tel"
                value={locationForm.recipient}
                onChange={e => setLocationForm({ ...locationForm, recipient: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Old Location</label>
                <input
                  type="text"
                  value={locationForm.old_location}
                  onChange={e => setLocationForm({ ...locationForm, old_location: e.target.value })}
                  placeholder="Studio A"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Location</label>
                <input
                  type="text"
                  value={locationForm.new_location}
                  onChange={e => setLocationForm({ ...locationForm, new_location: e.target.value })}
                  placeholder="Outdoor Location"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Effective Date</label>
              <input
                type="date"
                value={locationForm.effective_date}
                onChange={e => setLocationForm({ ...locationForm, effective_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </>
        )}

        {/* Cast Call Form */}
        {activeTab === 'cast' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recipient Phone</label>
              <input
                type="tel"
                value={castForm.recipient}
                onChange={e => setCastForm({ ...castForm, recipient: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Actor Name</label>
              <input
                type="text"
                value={castForm.actor_name}
                onChange={e => setCastForm({ ...castForm, actor_name: e.target.value })}
                placeholder="Hero Actor"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={castForm.date}
                  onChange={e => setCastForm({ ...castForm, date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Call Time</label>
                <input
                  type="time"
                  value={castForm.call_time}
                  onChange={e => setCastForm({ ...castForm, call_time: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scene Numbers (comma separated)</label>
              <input
                type="text"
                value={castForm.scene_numbers.join(', ')}
                onChange={e => setCastForm({ 
                  ...castForm, 
                  scene_numbers: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                })}
                placeholder="1, 2, 3"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
            sending
              ? 'bg-gray-700 text-gray-500'
              : sent
              ? 'bg-green-600 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {sending ? '⏳ Sending...' : sent ? '✅ Message Sent!' : '📤 Send WhatsApp Message'}
        </button>
      </div>

      {/* Preview */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-400">Message Preview</h4>
        <div className="bg-green-900/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
          {activeTab === 'schedule' && `🎬 ${scheduleForm.project_name} - Schedule Reminder

📅 Date: ${scheduleForm.shoot_date || 'TBA'}
⏰ Call Time: ${scheduleForm.call_time || '6:00 AM'}
📍 Location: ${scheduleForm.location || 'TBA'}

Please report on time.`}

          {activeTab === 'location' && `📍 Location Update - ${locationForm.project_name}

🔄 Changed from: ${locationForm.old_location || 'TBA'}
🆕 New Location: ${locationForm.new_location || 'TBA'}
📅 Effective: ${locationForm.effective_date || 'TBA'}`}

          {activeTab === 'cast' && `🎭 Call Sheet - ${castForm.project_name}

👤 Actor: ${castForm.actor_name || 'Actor'}
📅 Date: ${castForm.date || 'TBA'}
⏰ Call Time: ${castForm.call_time || '6:00 AM'}
🎬 Scenes: ${castForm.scene_numbers.join(', ') || 'TBA'}`}
        </div>
      </div>
    </div>
  )
}
