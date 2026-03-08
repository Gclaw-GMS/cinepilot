// CinePilot - Visual Flow Analyzer
// Analyze and visualize scene flow and continuity

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Network, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Sun, 
  Moon,
  Building2,
  Waves
} from 'lucide-react'

interface Scene {
  id: string | number
  sceneNumber?: number
  scene_number?: number
  heading?: string
  headingRaw?: string
  location?: string
  timeOfDay?: string
  time_of_day?: string
  intExt?: string
  interior_exterior?: string
}

interface VisualFlowResult {
  flowScore: number
  totalScenes: number
  locationChanges: number
  locationChangeRate: number
  timeChanges: number
  timeChangeRate: number
  intExtChanges: number
  recommendations: string[]
  sceneFlow: Array<{
    scene: Scene
    type: 'same' | 'location_change' | 'time_change' | 'int_ext_change'
  }>
}

interface VisualNetworkProps {
  scenes?: Scene[]
  onAnalysisComplete?: (result: VisualFlowResult) => void
}

// Demo analysis function
function analyzeVisualFlowDemo(scenes: Scene[]): VisualFlowResult {
  const flow: VisualFlowResult = {
    flowScore: 0,
    totalScenes: scenes.length,
    locationChanges: 0,
    locationChangeRate: 0,
    timeChanges: 0,
    timeChangeRate: 0,
    intExtChanges: 0,
    recommendations: [],
    sceneFlow: [],
  }

  let locationChanges = 0
  let timeChanges = 0
  let intExtChanges = 0

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const prevScene = i > 0 ? scenes[i - 1] : null
    
    const sceneLocation = scene.location || 'Unknown'
    const prevLocation = prevScene?.location || null
    const sceneTime = scene.timeOfDay || scene.time_of_day || 'DAY'
    const prevTime = prevScene?.timeOfDay || prevScene?.time_of_day || null
    const sceneIntExt = scene.intExt || scene.interior_exterior || 'INT'
    const prevIntExt = prevScene?.intExt || prevScene?.interior_exterior || null

    let type: 'same' | 'location_change' | 'time_change' | 'int_ext_change' = 'same'
    
    if (prevScene) {
      if (sceneLocation !== prevLocation) {
        locationChanges++
        type = 'location_change'
      } else if (sceneTime !== prevTime) {
        timeChanges++
        type = 'time_change'
      } else if (sceneIntExt !== prevIntExt) {
        intExtChanges++
        type = 'int_ext_change'
      }
    }

    flow.sceneFlow.push({ scene, type })
  }

  flow.locationChanges = locationChanges
  flow.timeChanges = timeChanges
  flow.intExtChanges = intExtChanges
  flow.locationChangeRate = scenes.length > 1 ? locationChanges / (scenes.length - 1) : 0
  flow.timeChangeRate = scenes.length > 1 ? timeChanges / (scenes.length - 1) : 0

  // Calculate flow score (0-10)
  // Lower changes = higher score
  const totalChanges = locationChanges + timeChanges + intExtChanges
  const changeRate = scenes.length > 1 ? totalChanges / (scenes.length - 1) : 0
  flow.flowScore = Math.max(0, Math.min(10, Math.round(10 - changeRate * 5)))

  // Generate recommendations
  if (flow.locationChangeRate > 0.4) {
    flow.recommendations.push('Consider grouping scenes by location to reduce travel time and costs')
  }
  if (flow.timeChangeRate > 0.3) {
    flow.recommendations.push('Group scenes by time of day (all day scenes together, then night)')
  }
  if (flow.intExtChanges > 3) {
    flow.recommendations.push('Review INT/EXT transitions - consider shooting all interiors before exteriors')
  }
  if (flow.flowScore >= 8) {
    flow.recommendations.push('Great visual flow! Your scene order is well organized')
  }

  return flow
}

export default function VisualNetwork({ scenes = [], onAnalysisComplete }: VisualNetworkProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<VisualFlowResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Provide demo scenes if none provided
  const demoScenes: Scene[] = useMemo(() => [
    { id: '1', sceneNumber: 1, heading: 'EXT. TEMPLE - DAY', location: 'Temple', timeOfDay: 'DAY', intExt: 'EXT' },
    { id: '2', sceneNumber: 2, heading: 'EXT. TEMPLE COURTYARD - DAY', location: 'Temple', timeOfDay: 'DAY', intExt: 'EXT' },
    { id: '3', sceneNumber: 3, heading: 'INT. TEMPLE - DAY', location: 'Temple', timeOfDay: 'DAY', intExt: 'INT' },
    { id: '4', sceneNumber: 4, heading: 'EXT. BEACH - SUNRISE', location: 'Beach', timeOfDay: 'DAWN', intExt: 'EXT' },
    { id: '5', sceneNumber: 5, heading: 'EXT. BEACH - DAY', location: 'Beach', timeOfDay: 'DAY', intExt: 'EXT' },
    { id: '6', sceneNumber: 6, heading: 'INT. HOUSE - DAY', location: 'House', timeOfDay: 'DAY', intExt: 'INT' },
    { id: '7', sceneNumber: 7, heading: 'EXT. HOUSE - DAY', location: 'House', timeOfDay: 'DAY', intExt: 'EXT' },
    { id: '8', sceneNumber: 8, heading: 'INT. HOUSE - NIGHT', location: 'House', timeOfDay: 'NIGHT', intExt: 'INT' },
    { id: '9', sceneNumber: 12, heading: 'EXT. WAREHOUSE - NIGHT', location: 'Warehouse', timeOfDay: 'NIGHT', intExt: 'EXT' },
    { id: '10', sceneNumber: 13, heading: 'INT. WAREHOUSE - NIGHT', location: 'Warehouse', timeOfDay: 'NIGHT', intExt: 'INT' },
  ], [])

  const scenesToAnalyze = scenes.length > 0 ? scenes : demoScenes

  const analyze = async () => {
    if (scenesToAnalyze.length === 0) {
      setError('No scenes to analyze')
      return
    }
    
    setAnalyzing(true)
    setError(null)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      const analysisResult = analyzeVisualFlowDemo(scenesToAnalyze)
      setResult(analysisResult)
      onAnalysisComplete?.(analysisResult)
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getFlowScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getFlowScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-500/20 border-green-500/30'
    if (score >= 5) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'location_change': return <MapPin className="w-3 h-3" />
      case 'time_change': return <Clock className="w-3 h-3" />
      case 'int_ext_change': return <Building2 className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-xl p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Network className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Visual Flow Analyzer</h3>
          <p className="text-xs text-slate-400">Analyze scene continuity and flow</p>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={analyzing || scenesToAnalyze.length === 0}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 mb-4"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing {scenesToAnalyze.length} Scenes...
          </>
        ) : (
          <>
            <Network className="w-4 h-4" />
            Analyze Visual Flow
          </>
        )}
      </button>

      {/* Demo Mode Badge */}
      {scenes.length === 0 && (
        <div className="text-xs text-slate-500 text-center mb-4">
          Using demo scenes (upload script for real analysis)
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Flow Score */}
          <div className={`rounded-xl p-5 border ${getFlowScoreBg(result.flowScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Visual Flow Score</p>
                <p className={`text-4xl font-bold ${getFlowScoreColor(result.flowScore)}`}>
                  {result.flowScore}/10
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Scenes</p>
                <p className="text-2xl font-semibold text-white">{result.totalScenes}</p>
              </div>
            </div>
          </div>

          {/* Change Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{result.locationChanges}</p>
              <p className="text-xs text-slate-500">Location Changes</p>
              <p className="text-xs text-slate-600">{Math.round(result.locationChangeRate * 100)}% rate</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                {result.timeChanges > 0 ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </div>
              <p className="text-2xl font-bold text-amber-400">{result.timeChanges}</p>
              <p className="text-xs text-slate-500">Time Changes</p>
              <p className="text-xs text-slate-600">{Math.round(result.timeChangeRate * 100)}% rate</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Waves className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">{result.intExtChanges}</p>
              <p className="text-xs text-slate-500">INT/EXT Changes</p>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span className="text-slate-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flow Visualization */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h4 className="font-semibold text-white mb-3">
              Scene Flow Visualization
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.sceneFlow.map((item, i) => {
                const sceneNum = item.scene.sceneNumber || item.scene.scene_number || i + 1
                const location = item.scene.location || 'Unknown'
                
                return (
                  <div
                    key={i}
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                      transition-all
                      ${item.type === 'location_change' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : item.type === 'time_change'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : item.type === 'int_ext_change'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }
                    `}
                    title={`Scene ${sceneNum}: ${location} (${item.type})`}
                  >
                    {sceneNum}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/30 rounded"></div>
                <span className="text-slate-500">Location Change</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded"></div>
                <span className="text-slate-500">Time Change</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500/20 border border-purple-500/30 rounded"></div>
                <span className="text-slate-500">INT/EXT Change</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-slate-700 border border-slate-600 rounded"></div>
                <span className="text-slate-500">Same Setup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !analyzing && (
        <div className="text-center py-6 text-slate-500">
          <Network className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click "Analyze Visual Flow" to see scene continuity analysis</p>
        </div>
      )}
    </motion.div>
  )
}
