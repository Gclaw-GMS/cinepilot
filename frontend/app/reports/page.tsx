'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Shield, AlertTriangle, AlertCircle, CheckCircle, 
  Film, RefreshCw, Loader2, Download, ChevronRight,
  Settings, TrendingUp, Target
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface SceneFlagData {
  id: string
  category: string
  severity: number
  context: string | null
  evidence: any
  scene: { sceneNumber: string; headingRaw: string | null }
}

interface SuggestionData {
  id: string
  sceneNumber: string
  rank: number
  issue: string
  suggestedChange: string
  why: string | null
  expectedSeverityDelta: number | null
  effort: string | null
  creativeRisk: string | null
  expectedCertImpact: string | null
}

interface AnalysisData {
  id: string
  predictedCertificate: string | null
  confidence: string | null
  deterministicScore: number | null
  topDrivers: string[]
  highRiskScenes: any
  uncertainties: string[]
  sceneFlags: SceneFlagData[]
  suggestions: SuggestionData[]
}

const CERTIFICATES = ['U', 'UA 7+', 'UA 13+', 'UA 16+', 'A', 'S']
const CATEGORIES = ['violence', 'profanity', 'drugs', 'sexual_content', 'hate', 'child_harm']
const CATEGORY_COLORS: Record<string, string> = {
  violence: 'bg-red-900/30 text-red-400 border-red-800/30',
  profanity: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
  drugs: 'bg-purple-900/30 text-purple-400 border-purple-800/30',
  sexual_content: 'bg-pink-900/30 text-pink-400 border-pink-800/30',
  hate: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  child_harm: 'bg-red-900/50 text-red-300 border-red-800/50',
}

const CERT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'U': { bg: 'bg-green-900/40', border: 'border-green-700/50', text: 'text-green-400' },
  'UA 7+': { bg: 'bg-emerald-900/40', border: 'border-emerald-700/50', text: 'text-emerald-400' },
  'UA 13+': { bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', text: 'text-yellow-400' },
  'UA 16+': { bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-400' },
  'A': { bg: 'bg-red-900/40', border: 'border-red-700/50', text: 'text-red-400' },
  'S': { bg: 'bg-red-900/60', border: 'border-red-600/50', text: 'text-red-300' },
}

const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

type ActiveTab = 'overview' | 'flags' | 'suggestions'

export default function CensorBoardPage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [targetCert, setTargetCert] = useState('UA 13+')
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/censor')
      const data = await res.json()
      setAnalysis(data.analysis || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/censor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSuggestCuts = async () => {
    if (!analysis) return
    setError(null)
    try {
      const res = await fetch('/api/censor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggestCuts', analysisId: analysis.id, targetCertificate: targetCert }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
      setActiveTab('suggestions')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const categoryCounts = analysis?.sceneFlags.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {}) || {}

  const maxSeverityByCategory = analysis?.sceneFlags.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = Math.max(acc[f.category] || 0, f.severity)
    return acc
  }, {}) || {}

  // Chart data
  const pieData = Object.entries(categoryCounts).map(([name, value], idx) => ({
    name: name.replace('_', ' '),
    value,
    color: CHART_COLORS[idx % CHART_COLORS.length]
  }))

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'flags', label: `Scene Flags (${analysis?.sceneFlags.length || 0})` },
    { key: 'suggestions', label: `Cut Suggestions (${analysis?.suggestions.length || 0})` },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-slate-400">Loading censor board...</p>
        </div>
      </div>
    )
  }

  const certStyle = analysis?.predictedCertificate ? CERT_COLORS[analysis.predictedCertificate] : null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Censor Board Analysis</h1>
              <p className="text-slate-400 text-sm mt-0.5">CBFC certificate prediction + content sensitivity analysis</p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Certificate Prediction Card */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`rounded-xl p-6 border text-center ${certStyle?.bg || 'bg-slate-900'} ${certStyle?.border || 'border-slate-800'} ${certStyle?.text || 'text-slate-400'}`}>
              <div className="text-4xl font-bold">{analysis.predictedCertificate || '—'}</div>
              <div className="text-xs mt-1 opacity-70">Predicted Certificate</div>
              {analysis.confidence && (
                <div className="text-xs mt-2 opacity-60">Confidence: {analysis.confidence}</div>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-400">Sensitivity Score</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{analysis.deterministicScore?.toFixed(1) || '0'}</div>
              <div className="text-xs text-slate-500 mt-1">out of 100</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-400">Content Flags</span>
              </div>
              <div className="text-3xl font-bold text-red-400">{analysis.sceneFlags.length}</div>
              <div className="text-xs text-slate-500 mt-1">issues detected</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-400">High Severity</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {analysis.sceneFlags.filter(f => f.severity >= 4).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">requires attention</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-800 pb-px">
          {tabs.map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                activeTab === tab.key 
                  ? 'bg-slate-900 text-red-400 border border-b-0 border-slate-800' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {!analysis ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No censor analysis yet</p>
                <p className="text-sm text-slate-500">Upload a script first, then click "Run Analysis" to predict the CBFC certificate.</p>
              </div>
            ) : (
              <>
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown Chart */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium mb-4 text-slate-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Category Distribution
                    </h3>
                    {pieData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-500">
                        No flags detected
                      </div>
                    )}
                  </div>

                  {/* Severity Distribution */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium mb-4 text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      Severity Distribution
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={CATEGORIES.map(cat => ({
                            category: cat.replace('_', ' '),
                            count: categoryCounts[cat] || 0,
                            severity: maxSeverityByCategory[cat] || 0
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" stroke="#64748b" fontSize={12} />
                          <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={11} width={70} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          />
                          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Category Cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-medium mb-4 text-slate-300">Category Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {CATEGORIES.map(cat => (
                      <div key={cat} className="bg-slate-800/50 rounded-lg p-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[cat]}`}>
                          {cat.replace('_', ' ')}
                        </span>
                        <div className="flex justify-between items-end mt-2">
                          <div className="text-xl font-bold text-slate-200">{categoryCounts[cat] || 0}</div>
                          <div className="text-[10px] text-slate-500">max: {maxSeverityByCategory[cat] || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Drivers */}
                {analysis.topDrivers.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium mb-3 text-slate-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      Top Drivers
                    </h3>
                    <ul className="space-y-2">
                      {analysis.topDrivers.map((d, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Optimizer */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-medium mb-3 text-slate-300 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Target Certificate Optimizer
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-400">Target:</span>
                    <select 
                      value={targetCert} 
                      onChange={e => setTargetCert(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      {CERTIFICATES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button 
                      onClick={handleSuggestCuts} 
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Generate Cut Suggestions
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
          <div className="space-y-2">
            {(!analysis || analysis.sceneFlags.length === 0) ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
                <p>No flags found. Your script is clean!</p>
              </div>
            ) : (
              analysis.sceneFlags.map(flag => (
                <div key={flag.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors">
                  <SeverityDots severity={flag.severity} />
                  <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[flag.category] || 'bg-slate-800 text-slate-500'}`}>
                    {flag.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">{flag.scene.sceneNumber}</span>
                  <span className="text-sm text-slate-400 flex-1 truncate">{flag.scene.headingRaw || 'Untitled'}</span>
                  {flag.context && <span className="text-xs text-slate-600">{flag.context}</span>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {(!analysis || analysis.suggestions.length === 0) ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p>No suggestions yet.</p>
                <p className="text-sm mt-1">Run analysis and use the Target Optimizer.</p>
              </div>
            ) : (
              analysis.suggestions.map(sug => (
                <div key={sug.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">#{sug.rank}</span>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">Scene {sug.sceneNumber}</span>
                    {sug.effort && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        sug.effort === 'low' ? 'bg-green-900/30 text-green-400' :
                        sug.effort === 'med' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>Effort: {sug.effort}</span>
                    )}
                    {sug.creativeRisk && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        sug.creativeRisk === 'low' ? 'bg-green-900/30 text-green-400' :
                        sug.creativeRisk === 'med' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>Creative Risk: {sug.creativeRisk}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-200 mb-1"><strong>Issue:</strong> {sug.issue}</div>
                  <div className="text-sm text-slate-400 mb-2"><strong>Suggestion:</strong> {sug.suggestedChange}</div>
                  {sug.why && <div className="text-xs text-slate-500 mb-2"><strong>Why:</strong> {sug.why}</div>}
                  {sug.expectedCertImpact && (
                    <div className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Expected impact: {sug.expectedCertImpact}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div 
          key={i} 
          className={`w-2 h-2 rounded-full ${
            i <= severity
              ? severity >= 4 ? 'bg-red-500' : severity >= 3 ? 'bg-orange-500' : 'bg-yellow-500'
              : 'bg-slate-700'
          }`} 
        />
      ))}
    </div>
  )
}
