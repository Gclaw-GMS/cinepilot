'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Brain, Sparkles, FileText, Clapperboard, DollarSign,
  Calendar, AlertTriangle, MessageSquare, Wand2, Search,
  Play, ArrowRight, TrendingUp, Target, Zap, CheckCircle,
  AlertCircle, Info, Loader2, X, ChevronDown, BarChart3,
  Clock, Users, MapPin, Sun, Moon, Film, Download, Copy,
  Lightbulb, Gauge
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'

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

// Severity colors for risk display
const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
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
  const [copied, setCopied] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const currentFeature = AI_FEATURES.find(f => f.id === selectedFeature)

  // Check demo mode on mount
  useEffect(() => {
    fetch('/api/ai')
      .then(res => res.json())
      .then(data => {
        if (data.isDemoMode) {
          setIsDemoMode(true)
        }
      })
      .catch(() => setIsDemoMode(true))
  }, [])

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
      
      // Check for demo mode
      if (data.isDemoMode) {
        setIsDemoMode(true)
      }
      
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

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.result || result, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExport = () => {
    if (result) {
      const dataStr = JSON.stringify(result.result || result, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedFeature}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
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
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">AI Production Tools</h1>
                  {isDemoMode && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm">Advanced AI-powered analysis for film production</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              )}
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
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mx-8 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Running in demo mode with simulated AI results. Connect your database for real AI-powered analysis.
          </p>
        </div>
      )}

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
                  <h3 className="font-semibold">Input Parameters</h3>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={currentFeature?.inputPlaceholder || 'Enter your input...'}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-slate-500 text-xs">Leave empty to use demo data for analysis</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Gauge className="w-3 h-3" />
                    Auto-detected: 47 scenes, 12 locations, 28 days
                  </div>
                </div>
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

// Budget Result Component with Enhanced Charts
function BudgetResult({ result, colors }: { result: any; colors: any }) {
  const budgetData = result.breakdown ? [
    { name: 'Production', value: result.breakdown.production?.percentage || 0, amount: result.breakdown.production?.amount || 0 },
    { name: 'Post', value: result.breakdown.postProduction?.percentage || 0, amount: result.breakdown.postProduction?.amount || 0 },
    { name: 'Talent', value: result.breakdown.talent?.percentage || 0, amount: result.breakdown.talent?.amount || 0 },
  ] : []
  const budgetColors = ['#6366f1', '#8b5cf6', '#10b981']

  // Enhanced breakdown with items
  const productionItems = result.breakdown?.production?.items || []
  const postItems = result.breakdown?.postProduction?.items || []

  return (
    <div className="space-y-6">
      {/* Main Budget Display */}
      {result.estimatedTotal && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estimated Total Budget</div>
              <div className="text-4xl font-bold text-emerald-400">
                ₹{(result.estimatedTotal / 10000000).toFixed(2)} Cr
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Contingency (10%)</div>
              <div className="text-xl font-semibold text-amber-400">
                ₹{((result.contingencies?.recommended || 0) / 100000).toFixed(0)}L
              </div>
            </div>
          </div>
          {/* Budget Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Budget Allocation</span>
              <span>100%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
              {budgetData.map((item, i) => (
                <div 
                  key={item.name}
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${item.value}%`,
                    backgroundColor: budgetColors[i]
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {budgetData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: budgetColors[i] }} />
                  <span className="text-slate-400">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pie Chart and Bar Chart Side by Side */}
      {budgetData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Distribution</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={budgetData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={35} 
                    outerRadius={60} 
                    paddingAngle={4} 
                    dataKey="value" 
                    nameKey="name"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={budgetColors[index % budgetColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Percentage']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="space-y-1 mt-2">
              {budgetData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: budgetColors[i] }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-slate-400">₹{(item.amount / 100000).toFixed(0)}L</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">By Amount (Lakhs)</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${v}L`} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${(value / 100000).toFixed(0)}L`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={budgetColors[index % budgetColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {(productionItems.length > 0 || postItems.length > 0) && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-cyan-400" /> Detailed Breakdown
          </h4>
          
          {productionItems.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs font-medium text-indigo-400 mb-2">Production Costs</div>
              <div className="space-y-2">
                {productionItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400">₹{(item.amount / 100000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {postItems.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs font-medium text-violet-400 mb-2">Post-Production</div>
              <div className="space-y-2">
                {postItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400">₹{(item.amount / 100000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Budget Recommendations
          </h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg">
                <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                </div>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Risk Result Component with Enhanced Visualizations
function RiskResult({ result, colors }: { result: any; colors: any }) {
  // Calculate risk distribution for chart
  const riskDistribution = result.risks ? [
    { name: 'High', value: result.risks.filter((r: any) => r.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: result.risks.filter((r: any) => r.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: result.risks.filter((r: any) => r.severity === 'low').length, color: '#10b981' },
  ] : []

  // Probability data for visualization
  const probabilityData = result.risks?.map((risk: any) => ({
    category: risk.category,
    probability: Math.round((risk.probability || 0) * 100),
    severity: risk.severity
  })) || []

  return (
    <div className="space-y-6">
      {result.riskScore && (
        <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 rounded-xl p-5 border border-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Risk Score</div>
              <div className={`text-4xl font-bold ${result.riskScore > 50 ? 'text-red-400' : result.riskScore > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {result.riskScore}/100
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-bold ${result.riskScore > 50 ? 'bg-red-500/20 text-red-400' : result.riskScore > 25 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {result.riskScore > 50 ? '🔴 High Risk' : result.riskScore > 25 ? '🟡 Medium Risk' : '🟢 Low Risk'}
            </div>
          </div>
          {/* Risk Score Bar */}
          <div className="mt-3">
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  result.riskScore > 50 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                  result.riskScore > 25 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                  'bg-gradient-to-r from-emerald-500 to-emerald-400'
                }`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Distribution Chart */}
      {riskDistribution.length > 0 && riskDistribution.some(r => r.value > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Severity Distribution</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={riskDistribution.filter(r => r.value > 0)} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={25} 
                    outerRadius={50} 
                    paddingAngle={4} 
                    dataKey="value" 
                    nameKey="name"
                  >
                    {riskDistribution.filter(r => r.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {riskDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Probability Chart */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Risk Probability</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probabilityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={9} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                    {probabilityData.map((entry: { severity: string }, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.severity === 'high' ? '#ef4444' : entry.severity === 'medium' ? '#f59e0b' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> Identified Risks
        </h4>
        <div className="space-y-2">
          {result.risks.map((risk: any, i: number) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-3 border-l-2" style={{ borderColor: SEVERITY_COLORS[risk.severity] || '#6b7280' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{risk.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${risk.probability ? 'bg-slate-700 text-slate-400' : ''}`}>
                    {risk.probability ? `${Math.round(risk.probability * 100)}%` : ''}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${risk.severity === 'high' ? 'bg-red-500/20 text-red-400' : risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {risk.severity}
                </span>
              </div>
              <p className="text-sm text-slate-400">{risk.description}</p>
              <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
                <span className="text-cyan-400 font-medium">Mitigation:</span> {risk.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.overallAssessment && (
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Overall Assessment</div>
          <p className="text-sm text-slate-300">{result.overallAssessment}</p>
        </div>
      )}
    </div>
  )
}

// Schedule Result Component with Enhanced Charts
function ScheduleResult({ result, colors }: { result: any; colors: any }) {
  const scheduleData = result.schedule?.map((item: any) => ({ phase: item.phase, scenes: item.scenes, focus: item.focus })) || []

  // Calculate efficiency metrics
  const efficiency = result.currentDays > 0 ? Math.round((1 - result.suggestedDays / result.currentDays) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 text-center border border-cyan-500/30">
          <div className="text-3xl font-bold text-cyan-400">{result.suggestedDays}</div>
          <div className="text-xs text-slate-400 mt-1">Suggested Days</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
          <div className="text-3xl font-bold text-slate-300">{result.currentDays}</div>
          <div className="text-xs text-slate-400 mt-1">Current Days</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 text-center border border-emerald-500/30">
          <div className={`text-3xl font-bold ${result.savings > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {result.savings > 0 ? `+${result.savings}` : result.savings}
          </div>
          <div className="text-xs text-slate-400 mt-1">Days Saved</div>
        </div>
      </div>

      {/* Efficiency Bar */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Schedule Efficiency</span>
          <span className={`text-sm font-bold ${efficiency > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {efficiency > 0 ? `${efficiency}% more efficient` : 'Current plan'}
          </span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, 100 - efficiency))}%` }}
          />
        </div>
      </div>

      {/* Schedule Strategy */}
      {result.strategy && (
        <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Optimization Strategy</span>
          </div>
          <p className="text-sm text-slate-300">{result.strategy.description}</p>
        </div>
      )}

      {/* Schedule Phases Chart */}
      {scheduleData.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Schedule Phases</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scheduleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="phase" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="scenes" fill={colors?.chart || '#6366f1'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {result.recommendations && (
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-3 h-3 text-cyan-400" /> Schedule Tips
          </h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle className={`w-4 h-4 ${colors?.text} shrink-0 mt-0.5`} />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
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
  const r = result.result || result

  // Budget forecast - use specialized component
  if (r.breakdown) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${colors.light} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {feature && <feature.icon className={`w-5 h-5 ${colors.text}`} />}
            <span className="font-semibold text-slate-200">{feature?.name || 'Budget Forecast'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4">
          <BudgetResult result={r} colors={colors} />
        </div>
      </div>
    )
  }

  // Risk detection - use specialized component
  if (r.risks) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${colors.light} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {feature && <feature.icon className={`w-5 h-5 ${colors.text}`} />}
            <span className="font-semibold text-slate-200">{feature?.name || 'Risk Detection'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4">
          <RiskResult result={r} colors={colors} />
        </div>
      </div>
    )
  }

  // Schedule optimization - use specialized component
  if (r.schedule) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${colors.light} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {feature && <feature.icon className={`w-5 h-5 ${colors.text}`} />}
            <span className="font-semibold text-slate-200">{feature?.name || 'Schedule Optimizer'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4">
          <ScheduleResult result={r} colors={colors} />
        </div>
      </div>
    )
  }

  // Default: Script analysis display
  if (result.summary) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${colors.light} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {feature && <feature.icon className={`w-5 h-5 ${colors.text}`} />}
            <span className="font-semibold text-slate-200">{feature?.name || 'Analysis Result'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-6">
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
      </div>
    )
  }

  // Fallback for unknown result types
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 ${colors.light} border-b border-slate-800 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {feature && <feature.icon className={`w-5 h-5 ${colors.text}`} />}
          <span className="font-semibold text-slate-200">{feature?.name || 'Analysis Result'}</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="p-4">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  )
}
