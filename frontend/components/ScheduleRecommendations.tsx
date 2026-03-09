// CinePilot - Schedule Recommendations
// AI-powered schedule optimization with full demo support

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Loader2, AlertCircle, CheckCircle, MapPin, 
  DollarSign, Clock, Sparkles, RefreshCw, ChevronDown, ChevronRight,
  Building2, Sun, Moon, Film
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

interface Scene {
  id?: number
  location: string
  description: string
  timeOfDay?: string
  intExt?: string
  estimatedDuration?: number
}

interface Location {
  name: string
  type?: 'indoor' | 'outdoor'
  costPerDay?: number
}

interface Recommendation {
  shooting_order: string[]
  total_days: number
  total_estimated_cost: number
  budget_status: 'within' | 'over' | 'under'
  budget_remaining: number
}

interface ScheduleResult {
  recommendations?: Recommendation
  location_breakdown?: Array<{
    location: string
    scenes: number
    estimated_days: number
    estimated_cost: number
    scenes_list: string[]
  }>
  tips?: string[]
  isDemo?: boolean
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Demo data for when API is not available
const DEMO_LOCATIONS = [
  { name: 'Chennai Studio', type: 'indoor' as const, costPerDay: 150000 },
  { name: 'Madurai Temple', type: 'outdoor' as const, costPerDay: 80000 },
  { name: 'Beach Resort', type: 'outdoor' as const, costPerDay: 120000 },
  { name: 'Heritage Building', type: 'indoor' as const, costPerDay: 100000 },
  { name: 'City Streets', type: 'outdoor' as const, costPerDay: 60000 },
]

const DEMO_SCENES = [
  { location: 'Chennai Studio', description: 'Opening dialogue scene', timeOfDay: 'DAY', intExt: 'INT' },
  { location: 'Madurai Temple', description: 'Action sequence', timeOfDay: 'DAY', intExt: 'EXT' },
  { location: 'Chennai Studio', description: 'Emotional climax', timeOfDay: 'NIGHT', intExt: 'INT' },
  { location: 'Beach Resort', description: 'Romantic sequence', timeOfDay: 'SUNSET', intExt: 'EXT' },
  { location: 'Heritage Building', description: 'Flashback scene', timeOfDay: 'DAY', intExt: 'INT' },
  { location: 'City Streets', description: 'Chase sequence', timeOfDay: 'NIGHT', intExt: 'EXT' },
  { location: 'Chennai Studio', description: 'Final scene', timeOfDay: 'DAY', intExt: 'INT' },
  { location: 'Madurai Temple', description: 'Ceremony scene', timeOfDay: 'DAY', intExt: 'EXT' },
]

function generateDemoRecommendations(scenes: Scene[], locations: Location[], budget: number): ScheduleResult {
  // Group scenes by location
  const locationGroups: Record<string, Scene[]> = {}
  scenes.forEach(scene => {
    const loc = scene.location || 'Unknown'
    if (!locationGroups[loc]) locationGroups[loc] = []
    locationGroups[loc].push(scene)
  })

  // Calculate costs
  let totalCost = 0
  const locationBreakdown = Object.entries(locationGroups).map(([loc, locScenes]) => {
    const locationData = locations.find(l => l.name === loc) || { costPerDay: 100000 }
    const days = Math.max(1, Math.ceil(locScenes.length / 3)) // 3 scenes per day avg
    const cost = (locationData.costPerDay || 100000) * days
    totalCost += cost
    return {
      location: loc,
      scenes: locScenes.length,
      estimated_days: days,
      estimated_cost: cost,
      scenes_list: locScenes.map(s => s.description.substring(0, 20))
    }
  })

  // Sort by optimal shooting order (outdoor day -> indoor -> outdoor night)
  const shootingOrder = locationBreakdown
    .sort((a, b) => {
      const aLoc = locations.find(l => l.name === a.location)
      const bLoc = locations.find(l => l.name === b.location)
      if (aLoc?.type === 'outdoor' && bLoc?.type === 'indoor') return -1
      if (aLoc?.type === 'indoor' && bLoc?.type === 'outdoor') return 1
      return a.estimated_cost - b.estimated_cost
    })
    .map(l => l.location)

  const budgetStatus: 'within' | 'over' | 'under' = totalCost <= budget ? 'within' : 'over'

  return {
    recommendations: {
      shooting_order: shootingOrder,
      total_days: locationBreakdown.reduce((sum, l) => sum + l.estimated_days, 0),
      total_estimated_cost: totalCost,
      budget_status: budgetStatus,
      budget_remaining: budget - totalCost
    },
    location_breakdown: locationBreakdown,
    tips: [
      'Group all outdoor day scenes together for maximum efficiency',
      'Schedule indoor studio shoots between outdoor location days',
      'Consider batch-shooting night scenes to optimize lighting equipment rental',
      'Heritage locations may have time restrictions - schedule early morning',
      totalCost < budget * 0.8 ? 'Budget buffer available for contingency scenes' : 'Consider reducing shoot days to stay within budget'
    ],
    isDemo: true
  }
}

export default function ScheduleRecommendations() {
  const [scenes, setScenes] = useState<Scene[]>(DEMO_SCENES.slice(0, 5))
  const [locations, setLocations] = useState<Location[]>(DEMO_LOCATIONS.slice(0, 3))
  const [budget, setBudget] = useState(3000000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddScene, setShowAddScene] = useState(false)
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())

  const addScene = () => {
    setScenes([...scenes, { location: locations[0]?.name || '', description: '', timeOfDay: 'DAY', intExt: 'INT' }])
  }

  const updateScene = (index: number, field: keyof Scene, value: string) => {
    const updated = [...scenes]
    updated[index] = { ...updated[index], [field]: value }
    setScenes(updated)
  }

  const removeScene = (index: number) => {
    setScenes(scenes.filter((_, i) => i !== index))
  }

  const addLocation = () => {
    setLocations([...locations, { name: '', type: 'indoor', costPerDay: 100000 }])
  }

  const updateLocation = (index: number, field: keyof Location, value: string | number) => {
    const updated = [...locations]
    updated[index] = { ...updated[index], [field]: value }
    setLocations(updated)
  }

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index))
  }

  const toggleLocation = (loc: string) => {
    const next = new Set(expandedLocations)
    if (next.has(loc)) next.delete(loc)
    else next.add(loc)
    setExpandedLocations(next)
  }

  const getRecommendations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try the API first
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          scenes: scenes.map((s, i) => ({ ...s, id: i + 1 })),
          locations,
          budget
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setResult({ ...data.data, isDemo: data.isDemoMode })
        } else {
          throw new Error(data.message || 'Optimization failed')
        }
      } else {
        throw new Error('API unavailable')
      }
    } catch (err: any) {
      console.log('Using demo mode:', err.message)
      // Fallback to demo data
      const demoResult = generateDemoRecommendations(scenes, locations, budget)
      setResult(demoResult)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${amount.toLocaleString()}`
  }

  const getTimeIcon = (time: string) => {
    if (!time) return <Clock className="w-3 h-3" />
    const t = time.toLowerCase()
    if (t.includes('night')) return <Moon className="w-3 h-3 text-indigo-400" />
    if (t.includes('sunset') || t.includes('dawn')) return <Sun className="w-3 h-3 text-orange-400" />
    return <Sun className="w-3 h-3 text-yellow-400" />
  }

  // Chart data
  const costChartData = useMemo(() => {
    if (!result?.location_breakdown) return []
    return result.location_breakdown.map(l => ({
      name: l.location.length > 12 ? l.location.substring(0, 12) + '...' : l.location,
      cost: l.estimated_cost,
      days: l.estimated_days,
      scenes: l.scenes
    }))
  }, [result])

  const budgetData = useMemo(() => {
    if (!result?.recommendations) return []
    const total = result.recommendations.total_estimated_cost
    const remaining = result.recommendations.budget_remaining
    return [
      { name: 'Estimated', value: total, color: CHART_COLORS[0] },
      { name: 'Remaining', value: Math.max(0, remaining), color: remaining >= 0 ? CHART_COLORS[1] : CHART_COLORS[3] },
    ]
  }, [result])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-xl p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Schedule AI Optimizer</h3>
          <p className="text-xs text-slate-400">Optimize shooting schedule for cost & efficiency</p>
        </div>
        {result?.isDemo && (
          <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Scenes Input */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              Scenes ({scenes.length})
            </h4>
            <button
              onClick={addScene}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add Scene
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scenes.map((scene, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded p-2">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={scene.location}
                    onChange={(e) => updateScene(idx, 'location', e.target.value)}
                    placeholder="Location"
                    className="bg-slate-700 text-white text-xs rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={scene.description}
                    onChange={(e) => updateScene(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="bg-slate-700 text-white text-xs rounded px-2 py-1 col-span-2"
                  />
                </div>
                <select
                  value={scene.timeOfDay || 'DAY'}
                  onChange={(e) => updateScene(idx, 'timeOfDay', e.target.value)}
                  className="bg-slate-700 text-white text-xs rounded px-2 py-1"
                >
                  <option value="DAY">Day</option>
                  <option value="NIGHT">Night</option>
                  <option value="DAWN">Dawn</option>
                  <option value="SUNSET">Sunset</option>
                </select>
                <button
                  onClick={() => removeScene(idx)}
                  className="text-slate-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Budget & Locations */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-400" />
              Budget
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">₹</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1 bg-slate-700 text-white rounded px-3 py-2"
              />
              <span className="text-slate-400 text-sm">
                ({formatCurrency(budget)})
              </span>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Locations ({locations.length})
              </h4>
              <button
                onClick={addLocation}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => updateLocation(idx, 'name', e.target.value)}
                    placeholder="Location name"
                    className="flex-1 bg-slate-700 text-white text-xs rounded px-2 py-1"
                  />
                  <select
                    value={loc.type || 'indoor'}
                    onChange={(e) => updateLocation(idx, 'type', e.target.value)}
                    className="bg-slate-700 text-white text-xs rounded px-2 py-1"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <input
                    type="number"
                    value={loc.costPerDay || 100000}
                    onChange={(e) => updateLocation(idx, 'costPerDay', Number(e.target.value))}
                    placeholder="Cost/day"
                    className="w-24 bg-slate-700 text-white text-xs rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={getRecommendations}
        disabled={loading || scenes.length === 0}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Optimizing Schedule...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Optimize Schedule
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {result.recommendations?.total_days}
                </p>
                <p className="text-xs text-slate-500">Total Days</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xl font-bold text-green-400">
                  {formatCurrency(result.recommendations?.total_estimated_cost || 0)}
                </p>
                <p className="text-xs text-slate-500">Est. Cost</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {result.recommendations?.budget_status === 'within' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <p className={`text-lg font-bold ${
                  result.recommendations?.budget_status === 'within' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.recommendations?.budget_status === 'within' ? '✅ Within' : '⚠️ Over'}
                </p>
                <p className="text-xs text-slate-500">Budget Status</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                </div>
                <p className={`text-lg font-bold ${
                  (result.recommendations?.budget_remaining || 0) >= 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {formatCurrency(Math.abs(result.recommendations?.budget_remaining || 0))}
                </p>
                <p className="text-xs text-slate-500">
                  {(result.recommendations?.budget_remaining || 0) >= 0 ? 'Remaining' : 'Over Budget'}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cost by Location */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Cost by Location</h4>
                {costChartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${v/100000}L`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          formatter={(value: number) => [formatCurrency(value), 'Cost']}
                        />
                        <Bar dataKey="cost" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </div>

              {/* Budget Overview */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Budget Overview</h4>
                {budgetData.length > 0 ? (
                  <div className="h-48 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {budgetData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Shooting Order */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Optimal Shooting Order
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {result.recommendations?.shooting_order?.map((loc, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 py-1.5">
                      <span className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-white text-sm">{loc}</span>
                    </div>
                    {idx < (result.recommendations?.shooting_order?.length || 0) - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-500 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Location Breakdown */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Location Breakdown
              </h4>
              <div className="space-y-2">
                {result.location_breakdown?.map((loc, idx) => {
                  const isExpanded = expandedLocations.has(loc.location)
                  const locData = locations.find(l => l.name === loc.location)
                  return (
                    <div key={idx} className="bg-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleLocation(loc.location)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <div className="text-left">
                            <p className="text-white font-medium">{loc.location}</p>
                            <p className="text-xs text-slate-500">{locData?.type || 'indoor'} • {loc.scenes} scenes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white font-semibold">{loc.estimated_days} days</p>
                            <p className="text-xs text-slate-500">{formatCurrency(loc.estimated_cost)}</p>
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t border-slate-700"
                          >
                            <div className="p-3 space-y-1">
                              {loc.scenes_list.map((scene, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                  {scene}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.tips.filter(Boolean).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add scenes and click "Optimize Schedule" to get AI recommendations</p>
        </div>
      )}
    </motion.div>
  )
}
