'use client'

import { useState, useCallback } from 'react'
import {
  Brain, Sparkles, FileText, Clapperboard, DollarSign,
  Calendar, AlertTriangle, MessageSquare, Wand2, Search,
  Play, ArrowRight, TrendingUp, Target, Zap, CheckCircle,
  AlertCircle, Info, Loader2, X, ChevronDown, BarChart3,
  Clock, Users, MapPin, Sun, Moon, Film
} from 'lucide-react'

// Feature definitions with detailed configs
const AI_FEATURES = [
  {
    id: 'script-analyzer',
    name: 'Script Intelligence',
    desc: 'Deep analysis of your screenplay - themes, pacing, character arcs',
    icon: FileText,
    color: 'indigo',
    category: 'Analysis',
    needsInput: true,
    inputPlaceholder: 'Paste script text or scene descriptions...',
  },
  {
    id: 'budget-forecast',
    name: 'Budget Forecast',
    desc: 'AI-powered production cost estimation based on script complexity',
    icon: DollarSign,
    color: 'emerald',
    category: 'Planning',
    needsInput: true,
    inputPlaceholder: 'Describe your production scope...',
  },
  {
    id: 'shot-suggest',
    name: 'Shot Recommender',
    desc: 'Get cinematographically correct shot suggestions for scenes',
    icon: Clapperboard,
    color: 'violet',
    category: 'Creative',
    needsInput: true,
    inputPlaceholder: 'Describe the scene you want shots for...',
  },
  {
    id: 'schedule',
    name: 'Schedule Optimizer',
    desc: 'Optimize your shooting schedule for efficiency and weather',
    icon: Calendar,
    color: 'amber',
    category: 'Planning',
    needsInput: true,
    inputPlaceholder: 'List your scenes and locations...',
  },
  {
    id: 'risk-detect',
    name: 'Risk Detector',
    desc: 'Identify potential production risks and mitigation strategies',
    icon: AlertTriangle,
    color: 'rose',
    category: 'Analysis',
    needsInput: false,
  },
  {
    id: 'dialogue',
    name: 'Dialogue Refiner',
    desc: 'Improve dialogue authenticity and cultural relevance',
    icon: MessageSquare,
    color: 'cyan',
    category: 'Creative',
    needsInput: true,
    inputPlaceholder: 'Paste dialogue to refine...',
  },
  {
    id: 'casting',
    name: 'Casting Suggestions',
    desc: 'AI-recommended casting based on character descriptions',
    icon: Users,
    color: 'fuchsia',
    category: 'Planning',
    needsInput: true,
    inputPlaceholder: 'Describe your character...',
  },
  {
    id: 'location-breakdown',
    name: 'Location Analysis',
    desc: 'Breakdown location requirements and scout recommendations',
    icon: MapPin,
    color: 'teal',
    category: 'Analysis',
    needsInput: false,
  },
]

// Analysis history
interface HistoryItem {
  id: string
  featureId: string
  featureName: string
  timestamp: Date
  result: any
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; light: string }> = {
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-400', light: 'bg-indigo-500/10' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-400', light: 'bg-emerald-500/10' },
  violet: { bg: 'bg-violet-600', border: 'border-violet-500', text: 'text-violet-400', light: 'bg-violet-500/10' },
  amber: { bg: 'bg-amber-600', border: 'border-amber-500', text: 'text-amber-400', light: 'bg-amber-500/10' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-500', text: 'text-rose-400', light: 'bg-rose-500/10' },
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-500', text: 'text-cyan-400', light: 'bg-cyan-500/10' },
  fuchsia: { bg: 'bg-fuchsia-600', border: 'border-fuchsia-500', text: 'text-fuchsia-400', light: 'bg-fuchsia-500/10' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-500', text: 'text-teal-400', light: 'bg-teal-500/10' },
}

export default function AIToolsPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const currentFeature = AI_FEATURES.find(f => f.id === selectedFeature)

  const runAnalysis = async (featureId: string) => {
    const feature = AI_FEATURES.find(f => f.id === featureId)
    if (!feature) return

    setSelectedFeature(featureId)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: featureId,
          text: inputText || `Sample analysis for ${feature.name}`,
          scene_count: 47,
          location_count: 12,
          cast_size: 18,
          duration_days: 28,
          is_outdoor: true,
          is_night_shoots: true,
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)

      // Add to history
      setHistory(prev => [{
        id: Date.now().toString(),
        featureId,
        featureName: feature.name,
        timestamp: new Date(),
        result: data,
      }, ...prev.slice(0, 9)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    }
    setLoading(false)
  }

  const clearResult = () => {
    setResult(null)
    setSelectedFeature(null)
    setError(null)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI Production Tools</h1>
                <p className="text-slate-500 text-sm">Advanced AI-powered analysis for film production</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showHistory ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              History
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="AI Analyses" value={history.length + 12} color="indigo" icon={<Brain className="w-5 h-5" />} />
          <StatCard title="Insights Generated" value={history.length * 4 + 48} color="violet" icon={<Sparkles className="w-5 h-5" />} />
          <StatCard title="Features Available" value={AI_FEATURES.length} color="emerald" icon={<Zap className="w-5 h-5" />} />
          <StatCard title="Success Rate" value="98%" color="amber" icon={<Target className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            {currentFeature?.needsInput && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  {currentFeature && <currentFeature.icon className={`w-5 h-5 ${COLOR_MAP[currentFeature.color]?.text}`} />}
                  <h3 className="font-semibold">Input</h3>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={currentFeature?.inputPlaceholder || 'Enter your input...'}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-slate-500 text-xs mt-2">Leave empty to use demo data for analysis</p>
              </div>
            )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_FEATURES.map((feature) => {
                const colors = COLOR_MAP[feature.color]
                const isSelected = selectedFeature === feature.id

                return (
                  <button
                    key={feature.id}
                    onClick={() => runAnalysis(feature.id)}
                    disabled={loading}
                    className={`text-left relative bg-slate-900 border rounded-xl p-5 transition-all hover:shadow-lg ${
                      isSelected
                        ? `${colors?.border} shadow-lg shadow-${feature.color}-500/10`
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && loading && (
                      <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center">
                        <Loader2 className={`w-8 h-8 ${colors?.text} animate-spin`} />
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors?.light} flex items-center justify-center shrink-0`}>
                        <feature.icon className={`w-6 h-6 ${colors?.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-200">{feature.name}</h3>
                        <p className="text-slate-500 text-sm mt-1">{feature.desc}</p>
                        <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full ${colors?.light} ${colors?.text}`}>
                          {feature.category}
                        </span>
                      </div>
                    </div>
                    <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs ${colors?.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Run <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-300">Analysis Error</h4>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {result ? (
              <ResultPanel result={result} feature={currentFeature} onClose={clearResult} />
            ) : !loading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-300 mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 text-sm">Select an AI tool from the options above to get started</p>
              </div>
            ) : null}

            {/* History Panel */}
            {showHistory && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Analyses
                </h3>
                {history.length === 0 ? (
                  <p className="text-slate-500 text-sm">No history yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((item) => {
                      const feature = AI_FEATURES.find(f => f.id === item.featureId)
                      const colors = feature ? COLOR_MAP[feature.color] : COLOR_MAP.indigo
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setResult(item.result)
                            setSelectedFeature(item.featureId)
                          }}
                          className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${colors?.text}`}>{item.featureName}</span>
                            <span className="text-xs text-slate-600">{formatTime(item.timestamp)}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.indigo

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors.light} flex items-center justify-center`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <div>
          <p className="text-slate-500 text-xs">{title}</p>
          <p className="text-xl font-semibold text-slate-200">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ result, feature, onClose }: { result: any; feature?: typeof AI_FEATURES[0]; onClose: () => void }) {
  if (!result) return null

  const colors = feature ? COLOR_MAP[feature.color] : COLOR_MAP.indigo

  // Different display based on feature type
  const renderContent = () => {
    if (result.summary) {
      return (
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Summary</h4>
            <p className="text-slate-200">{result.summary}</p>
          </div>

          {/* Stats */}
          {result.stats && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.stats).map(([key, val]) => (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-lg font-semibold text-slate-200">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Insights
              </h4>
              <ul className="space-y-2">
                {result.insights.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${colors?.text} shrink-0 mt-0.5`} />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-3 h-3" /> Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scene Breakdown */}
          {result.sceneBreakdown && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Scene Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(result.sceneBreakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors?.bg}`}
                          style={{ width: `${(Number(val) / (result.sceneBreakdown?.interior + result.sceneBreakdown?.exterior || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-300 w-8">{String(val)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Fallback for other result types
    return (
      <pre className="text-sm text-slate-300 whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 ${colors?.light} border-b border-slate-800 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {feature && <feature.icon className={`w-5 h-5 ${colors?.text}`} />}
          <span className="font-semibold text-slate-200">{feature?.name || 'Analysis Result'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  )
}
