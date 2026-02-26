// @ts-nocheck
// CinePilot - Visual Flow Analyzer
// Analyze and visualize scene flow and continuity

'use client'

import { useState } from 'react'
import { aiAnalysis } from '../lib/api-phase24'

interface Scene {
  id: number
  scene_number: number
  heading: string
  location: string
  time_of_day: string
  interior_exterior: string
}

interface VisualFlowAnalyzerProps {
  scenes?: Scene[]
  onAnalysisComplete?: (result: any) => void
}

export default function VisualFlowAnalyzer({ scenes = [], onAnalysisComplete }: VisualFlowAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (scenes.length === 0) {
      setError('No scenes to analyze')
      return
    }
    
    setAnalyzing(true)
    setError(null)
    
    try {
      const res = await aiAnalysis.analyzeVisualFlow(scenes)
      setResult(res)
      onAnalysisComplete?.(res)
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getFlowScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFlowScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 5) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={analyzing || scenes.length === 0}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {analyzing ? 'Analyzing Flow...' : `Analyze ${scenes.length} Scenes`}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Flow Score */}
          <div className={`rounded-lg p-4 ${getFlowScoreBg(result.flow_score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visual Flow Score</p>
                <p className={`text-3xl font-bold ${getFlowScoreColor(result.flow_score)}`}>
                  {result.flow_score}/10
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Scenes</p>
                <p className="text-xl font-semibold">{result.total_scenes}</p>
              </div>
            </div>
          </div>

          {/* Change Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{result.location_changes}</p>
              <p className="text-xs text-gray-500">Location Changes</p>
              <p className="text-xs text-gray-400">{result.location_change_rate * 100}% rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{result.time_changes}</p>
              <p className="text-xs text-gray-500">Time Changes</p>
              <p className="text-xs text-gray-400">{result.time_change_rate * 100}% rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{result.int_ext_changes}</p>
              <p className="text-xs text-gray-500">INT/EXT Changes</p>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-gray-600 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flow Visualization */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Scene Flow
            </h4>
            <div className="flex flex-wrap gap-1">
              {scenes.map((scene, i) => {
                const prevScene = i > 0 ? scenes[i - 1] : null
                const locationChange = prevScene && scene.location !== prevScene.location
                const timeChange = prevScene && scene.time_of_day !== prevScene.time_of_day
                
                return (
                  <div
                    key={scene.id || i}
                    className={`
                      w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                      ${locationChange 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' 
                        : timeChange 
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                      }
                    `}
                    title={`Scene ${scene.scene_number}: ${scene.location} (${scene.time_of_day})`}
                  >
                    {scene.scene_number}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                <span className="text-gray-500">Location Change</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/30 rounded"></div>
                <span className="text-gray-500">Time Change</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <span className="text-gray-500">Same Setup</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
