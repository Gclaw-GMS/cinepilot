"use client"
import { useState } from 'react'
import { scheduleRecommendations } from '@/lib/api'

interface Scene {
  location: string
  description: string
  timeOfDay?: string
}

interface Location {
  name: string
  type?: string
}

interface Recommendation {
  shooting_order: string[]
  total_days: number
  total_estimated_cost: number
  budget_status: string
  budget_remaining: number
}

export default function ScheduleRecommendations() {
  const [scenes, setScenes] = useState<Scene[]>([
    { location: 'Chennai Studio', description: 'Indoor dialogue scene' },
    { location: 'Madurai Temple', description: 'Exterior action sequence' },
    { location: 'Chennai Studio', description: 'Emotional scene with VFX' }
  ])
  const [locations, setLocations] = useState<Location[]>([
    { name: 'Chennai Studio', type: 'indoor' },
    { name: 'Madurai Temple', type: 'outdoor' }
  ])
  const [budget, setBudget] = useState(2000000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const addScene = () => {
    setScenes([...scenes, { location: '', description: '' }])
  }

  const updateScene = (index: number, field: keyof Scene, value: string) => {
    const updated = [...scenes]
    updated[index][field] = value
    setScenes(updated)
  }

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const res = await scheduleRecommendations.get(scenes, locations, budget)
      setResult(res)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">📅 Schedule AI Recommendations</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Scenes Input */}
        <div>
          <h3 className="text-lg font-semibold mb-3">🎬 Scenes</h3>
          {scenes.map((scene, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={scene.location}
                onChange={(e) => updateScene(idx, 'location', e.target.value)}
                placeholder="Location"
                className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm"
              />
              <input
                type="text"
                value={scene.description}
                onChange={(e) => updateScene(idx, 'description', e.target.value)}
                placeholder="Description"
                className="flex-[2] bg-gray-800 border border-gray-700 rounded p-2 text-sm"
              />
            </div>
          ))}
          <button
            onClick={addScene}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            + Add Scene
          </button>
        </div>

        {/* Budget Input */}
        <div>
          <h3 className="text-lg font-semibold mb-3">💰 Budget</h3>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">₹</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="flex-1 bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={getRecommendations}
        disabled={loading}
        className="mt-6 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
      >
        {loading ? '⏳ Analyzing...' : '🤖 Get AI Recommendations'}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 bg-gray-800 rounded p-4">
          <h3 className="text-lg font-bold mb-4">📊 Recommendations</h3>
          
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Total Days</div>
              <div className="text-2xl font-bold text-blue-400">
                {result.recommendations?.total_days}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Est. Cost</div>
              <div className="text-xl font-bold">
                ₹{(result.recommendations?.total_estimated_cost / 100000).toFixed(1)}L
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Budget Status</div>
              <div className={`text-lg font-bold ${
                result.recommendations?.budget_status === 'within' 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {result.recommendations?.budget_status === 'within' ? '✅ Within' : '❌ Over'}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Remaining</div>
              <div className="text-lg font-bold text-yellow-400">
                ₹{(result.recommendations?.budget_remaining / 100000).toFixed(1)}L
              </div>
            </div>
          </div>

          {/* Shooting Order */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">🎯 Optimal Shooting Order</h4>
            <div className="flex flex-wrap gap-2">
              {result.recommendations?.shooting_order?.map((loc: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    {idx + 1}
                  </span>
                  <span className="bg-gray-700 px-3 py-1 rounded">{loc}</span>
                  {idx < (result.recommendations?.shooting_order?.length || 0) - 1 && (
                    <span className="text-gray-500">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location Breakdown */}
          <div>
            <h4 className="font-semibold mb-2">📍 Location Breakdown</h4>
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-center">Scenes</th>
                  <th className="p-2 text-center">Days</th>
                  <th className="p-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {result.location_breakdown?.map((loc: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-700">
                    <td className="p-2">{loc.location}</td>
                    <td className="p-2 text-center">{loc.scenes}</td>
                    <td className="p-2 text-center">{loc.estimated_days}</td>
                    <td className="p-2 text-right">₹{(loc.estimated_cost / 100000).toFixed(1)}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tips */}
          {result.tips && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded">
              <h4 className="font-semibold mb-2">💡 AI Tips</h4>
              <ul className="list-disc list-inside text-sm">
                {result.tips.filter(Boolean).map((tip: string, idx: number) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
