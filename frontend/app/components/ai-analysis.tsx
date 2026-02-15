/**
 * AI Analysis Panel
 * Enhanced AI tools for script analysis, shot planning, and more
 */
'use client'

import { useState } from 'react'
import { ai, type Scene, type Location, type Character } from '../lib/api'

interface ShotSuggestion {
  shot_type: string
  description: string
  camera: string
  lens: string
  movement?: string
}

interface AIShotPlannerProps {
  scene: Scene
  onAddShots?: (shots: ShotSuggestion[]) => void
}

export function AIShotPlanner({ scene, onAddShots }: AIShotPlannerProps) {
  const [loading, setLoading] = useState(false)
  const [shots, setShots] = useState<ShotSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)

  const generateShots = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await ai.generateShotList(scene.description || '')
      setShots(result.shots)
    } catch (err) {
      setError('Failed to generate shots')
      // Demo data
      setShots([
        { shot_type: 'Wide Shot', description: 'Establish the location', camera: 'Wide', lens: '24mm', movement: 'Static' },
        { shot_type: 'Medium Shot', description: 'Character introduction', camera: 'Medium', lens: '50mm', movement: 'Dolly' },
        { shot_type: 'Close-up', description: 'Emotional beat', camera: 'CU', lens: '85mm', movement: 'Static' },
        { shot_type: 'Over the Shoulder', description: 'Conversation', camera: 'OTS', lens: '50mm', movement: 'Push in' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🎬 AI Shot Planner</h3>
        <button
          onClick={generateShots}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Shots'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {shots.length > 0 && (
        <div className="space-y-3">
          {shots.map((shot, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-indigo-600">{shot.shot_type}</span>
                <span className="text-sm text-gray-500">{shot.camera} • {shot.lens}</span>
              </div>
              <p className="text-sm text-gray-700">{shot.description}</p>
              {shot.movement && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {shot.movement}
                </span>
              )}
            </div>
          ))}
          
          {onAddShots && (
            <button
              onClick={() => onAddShots(shots)}
              className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add All Shots to List
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Location Recommender
interface LocationRecommenderProps {
  scenes: Scene[]
  onLocationsFound?: (locations: Partial<Location>[]) => void
}

export function LocationRecommender({ scenes, onLocationsFound }: LocationRecommenderProps) {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Partial<Location>[]>([])
  const [error, setError] = useState<string | null>(null)

  const findLocations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In production, this would call the API
      // For demo, generate suggestions based on scene locations
      const uniqueLocations = [...new Set(scenes.map(s => s.location).filter(Boolean))]
      
      setRecommendations(uniqueLocations.map(loc => ({
        name: loc || 'Unknown',
        type: 'Outdoor',
        estimated_cost: Math.floor(Math.random() * 50000) + 10000,
      })))
    } catch (err) {
      setError('Failed to find locations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📍 Location Finder</h3>
        <button
          onClick={findLocations}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Finding...' : 'Find Locations'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((loc, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{loc.name}</div>
                <div className="text-sm text-gray-500">{loc.type}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">₹{(loc.estimated_cost || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">estimated</div>
              </div>
            </div>
          ))}
          
          {onLocationsFound && (
            <button
              onClick={() => onLocationsFound(recommendations)}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add to Project
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Budget Estimator
interface BudgetEstimatorProps {
  scenes: Scene[]
  locations: Location[]
  castSize: number
}

export function BudgetEstimator({ scenes, locations, castSize }: BudgetEstimatorProps) {
  const [loading, setLoading] = useState(false)
  const [estimate, setEstimate] = useState<any>(null)

  const generateEstimate = async () => {
    setLoading(true)
    
    try {
      const result = await ai.estimateBudget(scenes, locations, castSize)
      setEstimate(result)
    } catch (err) {
      // Demo estimate
      const base = 500000
      const sceneCost = scenes.length * 50000
      const locationCost = locations.length * 100000
      const castCost = castSize * 75000
      const total = base + sceneCost + locationCost + castCost
      
      setEstimate({
        estimated_total: total,
        breakdown: {
          base,
          scenes: sceneCost,
          locations: locationCost,
          cast: castCost,
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">💰 Budget Estimator</h3>
        <button
          onClick={generateEstimate}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Estimate'}
        </button>
      </div>

      {estimate && (
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg space-y-3">
          <div className="text-center border-b border-yellow-200 pb-3">
            <div className="text-sm text-gray-600">Estimated Total</div>
            <div className="text-3xl font-bold text-orange-600">
              ₹{(estimate.estimated_total / 100000).toFixed(1)}L
            </div>
          </div>
          
          {estimate.breakdown && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Production</span>
                <span>₹{(estimate.breakdown.base / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between">
                <span>Scenes ({scenes.length})</span>
                <span>₹{(estimate.breakdown.scenes / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between">
                <span>Locations ({locations.length})</span>
                <span>₹{(estimate.breakdown.locations / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between">
                <span>Cast ({castSize})</span>
                <span>₹{(estimate.breakdown.cast / 100000).toFixed(1)}L</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Schedule Optimizer
interface ScheduleOptimizerProps {
  projectId: number
  onScheduleGenerated?: (schedule: any[]) => void
}

export function ScheduleOptimizer({ projectId, onScheduleGenerated }: ScheduleOptimizerProps) {
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<any[]>([])
  const [optimizing, setOptimizing] = useState(false)

  const generateSchedule = async () => {
    setLoading(true)
    
    try {
      const result = await ai.generateSchedule([], [], [])
      setSchedule(result.schedule || [])
    } catch (err) {
      // Demo schedule
      setSchedule([
        { day: 1, scenes: [1, 2], location: 'Chennai Studio', notes: 'Interior day' },
        { day: 2, scenes: [3, 4], location: 'Outdoor', notes: 'Exteriors' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const optimizeSchedule = async () => {
    setOptimizing(true)
    
    try {
      const result = await ai.getScheduleRecommendations(projectId)
      // Handle recommendations
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📅 Schedule Optimizer</h3>
        <div className="space-x-2">
          <button
            onClick={generateSchedule}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={optimizeSchedule}
            disabled={optimizing}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      </div>

      {schedule.length > 0 && (
        <div className="space-y-2">
          {schedule.map((day, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">Day {day.day}</div>
                <div className="text-sm text-gray-500">{day.location}</div>
              </div>
              <div className="text-sm text-gray-600">
                Scenes {day.scenes?.join(', ')}
              </div>
            </div>
          ))}
          
          {onScheduleGenerated && (
            <button
              onClick={() => onScheduleGenerated(schedule)}
              className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Schedule
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Character Analyzer
interface CharacterAnalyzerProps {
  projectId: number
}

export function CharacterAnalyzer({ projectId }: CharacterAnalyzerProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  const analyzeCharacters = async () => {
    setLoading(true)
    
    // Demo analysis
    setTimeout(() => {
      setAnalysis({
        protagonist: { name: 'Main Lead', arc: ' transformation', scenes: 45 },
        antagonist: { name: 'Villain', motivation: 'revenge', scenes: 12 },
        supporting: 6,
        total: 8,
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">👤 Character Analysis</h3>
        <button
          onClick={analyzeCharacters}
          disabled={loading}
          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-700">Protagonist</div>
            <div className="text-sm">{analysis.protagonist.name}</div>
            <div className="text-xs text-gray-600">Arc: {analysis.protagonist.arc}</div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="font-medium text-red-700">Antagonist</div>
            <div className="text-sm">{analysis.antagonist.name}</div>
            <div className="text-xs text-gray-600">Motivation: {analysis.antagonist.motivation}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{analysis.supporting}</div>
              <div className="text-xs text-gray-500">Supporting</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{analysis.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
