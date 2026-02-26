'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Trash2, Calendar } from 'lucide-react'

type CallSheetContent = {
  callTime?: string
  wrapTime?: string
  location?: string
  locationAddress?: string
  scenes?: string[]
  crewCalls?: Array<{
    name: string
    role: string
    department?: string
    callTime?: string
  }>
  weather?: string
}

type CallSheet = {
  id: string
  projectId: string
  shootingDayId: string | null
  title: string | null
  date: string
  content: CallSheetContent | null
  notes: string | null
  createdAt: string
  shootingDay?: {
    id: string
    dayNumber: number
    scheduledDate: string | null
    callTime: string | null
    locationId: string | null
  } | null
}

export default function CallSheetsPage() {
  const [callSheets, setCallSheets] = useState<CallSheet[]>([])
  const [selected, setSelected] = useState<CallSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCallSheets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/call-sheets')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to fetch call sheets')
      }
      const data = await res.json()
      setCallSheets(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCallSheets()
  }, [])

  const createNew = async () => {
    try {
      setCreating(true)
      const res = await fetch('/api/call-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          title: 'New Call Sheet',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create call sheet')
      }
      const created = await res.json()
      setCallSheets((prev) => [created, ...prev])
      setSelected(created)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const deleteSheet = async (id: string) => {
    try {
      setDeleting(id)
      const res = await fetch('/api/call-sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete call sheet')
      }
      setCallSheets((prev) => prev.filter((s) => s.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
    catch {
      return d
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">Call Sheets</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Generate and manage daily call sheets
            </p>
          </div>
        </div>
        <button
          onClick={createNew}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded font-medium"
        >
          <Plus className="h-4 w-4" />
          New Call Sheet
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-950/50 border border-red-800 rounded text-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 p-6">
        <div className="col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            Recent Call Sheets
          </h3>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : callSheets.length === 0 ? (
            <p className="text-slate-400 text-sm">No call sheets yet</p>
          ) : (
            <div className="space-y-2">
              {callSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`flex items-center justify-between gap-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selected?.id === sheet.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => setSelected(sheet)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">
                      {formatDate(sheet.date)}
                    </div>
                    <div className="text-sm text-slate-400 truncate">
                      {sheet.title ?? 'Untitled'}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSheet(sheet.id)
                    }}
                    disabled={deleting === sheet.id}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-white text-black rounded-lg overflow-hidden print:shadow-none">
              <div className="p-8">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h2 className="text-2xl font-bold">
                    {selected.title ?? 'CALL SHEET'}
                  </h2>
                  <p className="text-lg mt-1">{formatDate(selected.date)}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="font-bold bg-gray-200 p-2">DATE</div>
                    <div className="p-2 border border-t-0 border-gray-300">
                      {formatDate(selected.date)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold bg-gray-200 p-2">CALL TIME</div>
                    <div className="p-2 border border-t-0 border-gray-300 text-xl font-bold">
                      {selected.content?.callTime ?? 'TBD'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-bold bg-gray-200 p-2">LOCATION</div>
                    <div className="p-2 border border-t-0 border-gray-300">
                      {selected.content?.location ?? 'TBD'}
                      {selected.content?.locationAddress && (
                        <span className="block text-sm text-gray-600 mt-1">
                          {selected.content.locationAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-bold bg-gray-200 p-2">SCENES</div>
                  <div className="p-2 border border-t-0 border-gray-300 flex gap-2 flex-wrap">
                    {(selected.content?.scenes ?? []).length > 0
                      ? (selected.content?.scenes ?? []).map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 bg-gray-200 rounded"
                          >
                            {s}
                          </span>
                        ))
                      : 'TBD'}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-bold bg-gray-200 p-2">CREW CALLS</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-400">
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-right p-2">Call Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.content?.crewCalls ?? []).length > 0
                        ? (selected.content?.crewCalls ?? []).map((c, i) => (
                            <tr
                              key={i}
                              className="border-b border-gray-200"
                            >
                              <td className="p-2">{c.role}</td>
                              <td className="p-2">{c.name}</td>
                              <td className="p-2 text-right font-bold">
                                {c.callTime ?? selected.content?.callTime ?? 'TBD'}
                              </td>
                            </tr>
                          ))
                        : (
                            <tr>
                              <td
                                colSpan={3}
                                className="p-2 text-gray-500"
                              >
                                No crew assigned
                              </td>
                            </tr>
                          )}
                    </tbody>
                  </table>
                </div>

                {selected.notes && (
                  <div className="mb-6">
                    <div className="font-bold bg-gray-200 p-2">NOTES</div>
                    <div className="p-2 border border-t-0 border-gray-300 whitespace-pre-wrap">
                      {selected.notes}
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                  Generated by CinePilot
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                Select a call sheet to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
