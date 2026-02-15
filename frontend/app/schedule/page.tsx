'use client'

import { useState } from 'react'

const DEMO_SCHEDULE = [
  { day: 1, date: '2026-03-01', scenes: ['1', '2', '3'], location: 'Chennai Studio', call: '06:00', wrap: '18:00', notes: 'Day 1 - Hero introduction' },
  { day: 2, date: '2026-03-02', scenes: ['4', '5', '6'], location: 'Madurai Temple', call: '05:00', wrap: '19:00', notes: 'Temple sequence' },
  { day: 3, date: '2026-03-03', scenes: ['7', '8'], location: 'Beach Resort', call: '07:00', wrap: '17:00', notes: 'Romantic sequence' },
  { day: 4, date: '2026-03-04', scenes: ['9', '10', '11'], location: 'Chennai Office', call: '08:00', wrap: '20:00', notes: 'Corporate drama' },
  { day: 5, date: '2026-03-05', scenes: ['12', '13'], location: 'Mountain View', call: '06:00', wrap: '16:00', notes: 'Action sequence' },
]

const DEMO_SCENES = [
  { number: 1, name: 'Hero Introduction', location: 'Chennai Studio', time: 'Day', intExt: 'INT', status: 'pending' },
  { number: 2, name: 'Family Scene', location: 'Chennai Studio', time: 'Day', intExt: 'INT', status: 'pending' },
  { number: 3, name: 'Office Meeting', location: 'Chennai Office', time: 'Day', intExt: 'INT', status: 'pending' },
  { number: 4, name: 'Temple Arrival', location: 'Madurai Temple', time: 'Morning', intExt: 'EXT', status: 'pending' },
  { number: 5, name: 'Prayer Sequence', location: 'Madurai Temple', time: 'Morning', intExt: 'EXT', status: 'pending' },
  { number: 6, name: 'Festival Scene', location: 'Madurai Temple', time: 'Evening', intExt: 'EXT', status: 'pending' },
]

export default function SchedulePage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [schedule, setSchedule] = useState(DEMO_SCHEDULE)
  const [unassigned, setUnassigned] = useState(DEMO_SCENES)
  const [selectedDay, setSelectedDay] = useState(1)

  const totalDays = schedule.length
  const completedDays = schedule.filter(d => d.scenes.length > 0).length

  const assignToDay = (sceneNumber: number, day: number) => {
    const scene = unassigned.find(s => s.number === sceneNumber)
    if (!scene) return
    
    setUnassigned(unassigned.filter(s => s.number !== sceneNumber))
    setSchedule(schedule.map(d => {
      if (d.day === day) {
        return { ...d, scenes: [...d.scenes, String(sceneNumber)] }
      }
      return d
    }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 Shooting Schedule</h1>
          <p className="text-gray-500 mt-1">Plan and manage your shooting days</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded ${view === 'calendar' ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}
          >
            📆 Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded ${view === 'list' ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-2xl font-bold text-cyan-400">{totalDays}</div>
          <div className="text-sm text-gray-400">Total Days</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-2xl font-bold text-green-400">{completedDays}</div>
          <div className="text-sm text-gray-400">Scheduled</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-2xl font-bold text-amber-400">{unassigned.length}</div>
          <div className="text-sm text-gray-400">Unassigned</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-2xl font-bold text-purple-400">{schedule.reduce((a, b) => a + b.scenes.length, 0)}</div>
          <div className="text-sm text-gray-400">Total Scenes</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="col-span-2">
          {view === 'calendar' ? (
            <div className="grid grid-cols-5 gap-2">
              {schedule.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedDay === day.day
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-xs text-gray-400">Day</div>
                  <div className="text-xl font-bold">{day.day}</div>
                  <div className="text-xs text-gray-400 mt-1">{day.date}</div>
                  <div className="text-xs text-cyan-400 mt-2">{day.scenes.length} scenes</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((day) => (
                <div key={day.day} className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold">Day {day.day} - {day.date}</div>
                    <div className="text-xs text-gray-400">{day.call} - {day.wrap}</div>
                  </div>
                  <div className="text-sm text-gray-400">{day.location}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {day.scenes.map(s => (
                      <span key={s} className="px-2 py-1 bg-cyan-600/30 rounded text-xs">Scene {s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Day Detail */}
          {selectedDay && (
            <div className="mt-6 bg-slate-800 rounded-lg p-4">
              <h3 className="font-bold mb-3">Day {selectedDay} Details</h3>
              {schedule.filter(d => d.day === selectedDay).map(day => (
                <div key={day.day}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Location:</span> {day.location}</div>
                    <div><span className="text-gray-400">Call:</span> {day.call}</div>
                    <div><span className="text-gray-400">Wrap:</span> {day.wrap}</div>
                    <div><span className="text-gray-400">Notes:</span> {day.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Scenes */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-bold mb-3">📝 Unassigned Scenes</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {unassigned.map((scene) => (
              <div key={scene.number} className="bg-slate-900 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Scene {scene.number}</div>
                    <div className="text-xs text-gray-400">{scene.name}</div>
                  </div>
                  <select
                    onChange={(e) => assignToDay(scene.number, Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                    defaultValue=""
                  >
                    <option value="">Assign</option>
                    {schedule.map(d => (
                      <option key={d.day} value={d.day}>Day {d.day}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {scene.location} • {scene.time} • {scene.intExt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
