'use client'

import { useState, useEffect, useCallback } from 'react'

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
  violence: 'bg-red-900/30 text-red-400',
  profanity: 'bg-orange-900/30 text-orange-400',
  drugs: 'bg-purple-900/30 text-purple-400',
  sexual_content: 'bg-pink-900/30 text-pink-400',
  hate: 'bg-yellow-900/30 text-yellow-400',
  child_harm: 'bg-red-900/50 text-red-300',
}

const CERT_COLORS: Record<string, string> = {
  'U': 'bg-green-900/40 text-green-400 border-green-700/50',
  'UA 7+': 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
  'UA 13+': 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50',
  'UA 16+': 'bg-orange-900/40 text-orange-400 border-orange-700/50',
  'A': 'bg-red-900/40 text-red-400 border-red-700/50',
  'S': 'bg-red-900/60 text-red-300 border-red-600/50',
}

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

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'flags', label: `Scene Flags (${analysis?.sceneFlags.length || 0})` },
    { key: 'suggestions', label: `Cut Suggestions (${analysis?.suggestions.length || 0})` },
  ]

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading censor board...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Censor Board Analysis</h1>
          <p className="text-gray-500 text-sm mt-0.5">CBFC certificate prediction + content sensitivity analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAnalyze} disabled={analyzing} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded font-medium text-sm">
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {/* Certificate Prediction Card */}
      {analysis && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg p-6 border text-center ${CERT_COLORS[analysis.predictedCertificate || 'U'] || 'bg-gray-800 border-gray-700'}`}>
            <div className="text-3xl font-bold">{analysis.predictedCertificate || '—'}</div>
            <div className="text-xs mt-1 opacity-70">Predicted Certificate</div>
            {analysis.confidence && (
              <div className="text-xs mt-2 opacity-60">Confidence: {analysis.confidence}</div>
            )}
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{analysis.deterministicScore?.toFixed(1) || '0'}</div>
            <div className="text-xs text-gray-500">Sensitivity Score</div>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{analysis.sceneFlags.length}</div>
            <div className="text-xs text-gray-500">Content Flags</div>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">
              {analysis.sceneFlags.filter(f => f.severity >= 4).length}
            </div>
            <div className="text-xs text-gray-500">High Severity</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.key ? 'bg-cinepilot-card text-cinepilot-accent border border-b-0 border-cinepilot-border' : 'text-gray-500 hover:text-gray-300'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!analysis ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center text-gray-500">
              <div className="mb-3">No censor analysis yet</div>
              <p className="text-sm text-gray-600 mb-4">Upload a script first, then click "Run Analysis" to predict the CBFC certificate.</p>
            </div>
          ) : (
            <>
              {/* Category Breakdown */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                <h3 className="font-medium mb-4 text-gray-300">Category Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="bg-gray-900/50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[cat]}`}>{cat.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-300">{categoryCounts[cat] || 0}</div>
                        <div className="text-[10px] text-gray-600">max sev: {maxSeverityByCategory[cat] || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Drivers */}
              {analysis.topDrivers.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h3 className="font-medium mb-3 text-gray-300">Top Drivers</h3>
                  <ul className="space-y-1">
                    {analysis.topDrivers.map((d, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">-</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Optimizer */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                <h3 className="font-medium mb-3 text-gray-300">Target Certificate Optimizer</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Target:</span>
                  <select value={targetCert} onChange={e => setTargetCert(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
                    {CERTIFICATES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={handleSuggestCuts} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium">
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
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">No flags found.</div>
          ) : (
            analysis.sceneFlags.map(flag => (
              <div key={flag.id} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SeverityDots severity={flag.severity} />
                  <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[flag.category] || 'bg-gray-800 text-gray-500'}`}>
                    {flag.category.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">{flag.scene.sceneNumber}</span>
                <span className="text-sm text-gray-400 flex-1 truncate">{flag.scene.headingRaw || 'Untitled'}</span>
                {flag.context && <span className="text-xs text-gray-600">{flag.context}</span>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-3">
          {(!analysis || analysis.suggestions.length === 0) ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No suggestions yet. Run analysis and use the Target Optimizer.
            </div>
          ) : (
            analysis.suggestions.map(sug => (
              <div key={sug.id} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-cinepilot-accent">#{sug.rank}</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">Scene {sug.sceneNumber}</span>
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
                <div className="text-sm text-gray-300 mb-1"><strong>Issue:</strong> {sug.issue}</div>
                <div className="text-sm text-gray-400 mb-1"><strong>Suggestion:</strong> {sug.suggestedChange}</div>
                {sug.why && <div className="text-xs text-gray-500"><strong>Why:</strong> {sug.why}</div>}
                {sug.expectedCertImpact && (
                  <div className="text-xs text-cinepilot-accent mt-1">Expected impact: {sug.expectedCertImpact}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${
          i <= severity
            ? severity >= 4 ? 'bg-red-500' : severity >= 3 ? 'bg-orange-500' : 'bg-yellow-500'
            : 'bg-gray-700'
        }`} />
      ))}
    </div>
  )
}
