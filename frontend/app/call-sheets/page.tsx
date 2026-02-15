'use client'

import { useState } from 'react'

interface CallSheet {
  id: number
  date: string
  project: string
  scenes: string[]
  location: string
  callTime: string
  wrapTime: string
  weather?: string
  created: string
}

const DEMO_CALLSHEETS: CallSheet[] = [
  { id: 1, date: '2026-03-01', project: 'இதயத்தின் ஒலி', scenes: ['1', '2', '3'], location: 'Chennai Studio', callTime: '06:00', wrapTime: '18:00', weather: 'Indoor', created: '2026-02-10' },
  { id: 2, date: '2026-03-02', project: 'இதயத்தின் ஒலி', scenes: ['4', '5'], location: 'Madurai Temple', callTime: '05:00', wrapTime: '19:00', weather: 'Sunny 32°C', created: '2026-02-11' },
  { id: 3, date: '2026-03-03', project: 'Veera\'s Journey', scenes: ['12', '13', '14'], location: 'Mountain View', callTime: '07:00', wrapTime: '17:00', weather: 'Cloudy 24°C', created: '2026-02-12' },
]

const CREW_CALLS = [
  { name: 'Rajesh Kumar', role: 'Director', callTime: '06:00' },
  { name: 'Anand Chakravarthy', role: 'Cinematographer', callTime: '06:00' },
  { name: 'Vijay Sethupathi', role: 'Lead Actor', callTime: '08:00' },
  { name: 'Nithya Menen', role: 'Lead Actress', callTime: '08:30' },
  { name: 'Gautham Vasudev', role: '1st AD', callTime: '05:30' },
  { name: 'Sound Team', role: 'Sound', callTime: '06:00' },
  { name: 'Art Department', role: 'Art', callTime: '05:00' },
  { name: 'Lighting Team', role: 'Lighting', callTime: '05:00' },
]

export default function CallSheetsPage() {
  const [callSheets, setCallSheets] = useState(DEMO_CALLSHEETS)
  const [selected, setSelected] = useState<CallSheet | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const createNew = () => {
    const newSheet: CallSheet = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      project: 'இதயத்தின் ஒலி',
      scenes: ['1', '2'],
      location: 'TBD',
      callTime: '06:00',
      wrapTime: '18:00',
      weather: 'TBD',
      created: new Date().toISOString().split('T')[0]
    }
    setCallSheets([newSheet, ...callSheets])
    setSelected(newSheet)
    setShowCreate(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📋 Call Sheets</h1>
          <p className="text-gray-500 mt-1">Generate and manage daily call sheets</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-medium"
        >
          + New Call Sheet
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* List */}
        <div className="col-span-1">
          <h3 className="font-bold mb-3">Recent Call Sheets</h3>
          <div className="space-y-2">
            {callSheets.map(sheet => (
              <button
                key={sheet.id}
                onClick={() => setSelected(sheet)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selected?.id === sheet.id
                    ? 'bg-cyan-500/20 border-2 border-cyan-500'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div className="font-medium">{sheet.date}</div>
                <div className="text-sm text-gray-400">{sheet.project}</div>
                <div className="text-xs text-cyan-400 mt-1">{sheet.location}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="col-span-2">
          {selected ? (
            <div className="bg-white text-black rounded-lg p-6">
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h2 className="text-2xl font-bold">{selected.project}</h2>
                <h3 className="text-xl">CALL SHEET</h3>
                <p className="text-lg">{selected.date}</p>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="font-bold bg-gray-200 p-2">DATE</div>
                  <div className="p-2">{selected.date}</div>
                </div>
                <div>
                  <div className="font-bold bg-gray-200 p-2">CALL TIME</div>
                  <div className="p-2 text-2xl font-bold">{selected.callTime}</div>
                </div>
                <div>
                  <div className="font-bold bg-gray-200 p-2">LOCATION</div>
                  <div className="p-2">{selected.location}</div>
                </div>
                <div>
                  <div className="font-bold bg-gray-200 p-2">WRAP TIME</div>
                  <div className="p-2 text-2xl font-bold">{selected.wrapTime}</div>
                </div>
              </div>

              {/* Weather */}
              <div className="mb-6">
                <div className="font-bold bg-gray-200 p-2">WEATHER</div>
                <div className="p-2">{selected.weather}</div>
              </div>

              {/* Scenes */}
              <div className="mb-6">
                <div className="font-bold bg-gray-200 p-2">SCENES</div>
                <div className="p-2 flex gap-2 flex-wrap">
                  {selected.scenes.map(s => (
                    <span key={s} className="px-3 py-1 bg-gray-300 rounded">{s}</span>
                  ))}
                </div>
              </div>

              {/* Crew Calls */}
              <div className="mb-6">
                <div className="font-bold bg-gray-200 p-2">CREW CALLS</div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-right p-2">Call Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CREW_CALLS.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="p-2">{c.role}</td>
                        <td className="p-2">{c.name}</td>
                        <td className="p-2 text-right font-bold">{c.callTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                Generated by CinePilot • {selected.created}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-400">Select a call sheet to preview</p>
            </div>
          )}

          {/* Actions */}
          {selected && (
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded font-medium">
                📤 Send to Crew
              </button>
              <button className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded">
                🖨️ Print
              </button>
              <button className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded">
                📄 Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Call Sheet</h2>
            <p className="text-gray-400 mb-4">Generate a new call sheet from the schedule.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-700 py-2 rounded">Cancel</button>
              <button onClick={createNew} className="flex-1 bg-cyan-500 py-2 rounded text-black font-medium">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
