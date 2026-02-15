"use client"

import { useState } from 'react'

interface ScheduleDay {
  day: number
  date: string
  location: string
  scenes: { number: number; name: string; status: string }[]
  callTime: string
  wrapTime: string
  notes?: string
}

export default function ShootingScheduleManager({ projectId }: { projectId?: number }) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { day: 1, date: '2026-03-01', location: 'Meenakshi Temple', callTime: '05:00', wrapTime: '18:00', scenes: [
      { number: 1, name: 'Temple Entry', status: 'pending' },
      { number: 2, name: 'Aarti Sequence', status: 'pending' },
      { number: 3, name: 'Devotees Scene', status: 'pending' },
    ]},
    { day: 2, date: '2026-03-02', location: 'Madurai Streets', callTime: '06:00', wrapTime: '19:00', scenes: [
      { number: 4, name: 'Market Chase', status: 'pending' },
      { number: 5, name: 'Food Stall Scene', status: 'pending' },
    ]},
    { day: 3, date: '2026-03-03', location: 'Chennai Studio', callTime: '07:00', wrapTime: '20:00', scenes: [
      { number: 6, name: 'Office Interior', status: 'pending' },
      { number: 7, name: 'Meeting Room', status: 'pending' },
    ]},
    { day: 4, date: '2026-03-04', location: 'Marina Beach', callTime: '04:00', wrapTime: '10:00', scenes: [
      { number: 8, name: 'Sunrise Scene', status: 'pending' },
      { number: 9, name: 'Beach Walk', status: 'pending' },
    ]},
    { day: 5, date: '2026-03-05', location: 'Anna Nagar', callTime: '06:00', wrapTime: '18:00', scenes: [
      { number: 10, name: 'Apartment', status: 'pending' },
    ]},
  ])

  const updateSceneStatus = (dayIndex: number, sceneIndex: number, status: string) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].scenes[sceneIndex].status = status
    setSchedule(newSchedule)
  }

  const completedScenes = schedule.flatMap(d => d.scenes).filter(s => s.status === 'completed').length
  const totalScenes = schedule.flatMap(d => d.scenes).length
  const progress = Math.round((completedScenes / totalScenes) * 100)

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Shooting Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1 rounded ${view === 'calendar' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            📆 Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{completedScenes}/{totalScenes} scenes ({progress}%)</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-gray-500 text-sm py-2">{d}</div>
          ))}
          {schedule.map(day => (
            <div key={day.day} className="bg-gray-800 p-2 rounded-lg min-h-24">
              <div className="text-xs text-gray-500">{day.date.split('-')[2]}</div>
              <div className="font-semibold text-sm">{day.location.split(' ')[0]}</div>
              <div className="text-xs text-blue-400">{day.scenes.length} scenes</div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {schedule.map((day, dayIndex) => (
            <div key={day.day} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xl font-bold">Day {day.day}</div>
                  <div className="text-gray-400">{day.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400">📍 {day.location}</div>
                  <div className="text-sm text-gray-400">Call: {day.callTime} • Wrap: {day.wrapTime}</div>
                </div>
              </div>
              <div className="space-y-2">
                {day.scenes.map((scene, sceneIndex) => (
                  <div key={scene.number} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{scene.number}</span>
                      <span>{scene.name}</span>
                    </div>
                    <select
                      value={scene.status}
                      onChange={e => updateSceneStatus(dayIndex, sceneIndex, e.target.value)}
                      className={`px-2 py-1 rounded text-sm ${
                        scene.status === 'completed' ? 'bg-green-900 text-green-300' :
                        scene.status === 'in-progress' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-600'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold">{schedule.length}</div>
          <div className="text-gray-400 text-sm">Shooting Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{totalScenes}</div>
          <div className="text-gray-400 text-sm">Total Scenes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{new Set(schedule.map(s => s.location)).size}</div>
          <div className="text-gray-400 text-sm">Locations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{completedScenes}</div>
          <div className="text-gray-400 text-sm">Completed</div>
        </div>
      </div>
    </div>
  )
}
