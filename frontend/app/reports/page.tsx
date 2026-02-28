'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, AlertTriangle, FileText, CheckCircle, XCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react'

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

// ============================================================================
// DEMO DATA - Rich sample data for showcase when database is not connected
// ============================================================================

const DEMO_ANALYSIS: AnalysisData = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  confidence: 'high',
  deterministicScore: 68.5,
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
  uncertainties: ['Final edit may affect rating', 'Background score intensity unknown', 'Song sequences may need review'],
  sceneFlags: [
    { id: 'f1', category: 'violence', severity: 4, context: 'Temple fight sequence', evidence: null, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE - NIGHT' } },
    { id: 'f2', category: 'violence', severity: 3, context: 'Police confrontation', evidence: null, scene: { sceneNumber: '23', headingRaw: 'INT. POLICE STATION - DAY' } },
    { id: 'f3', category: 'profanity', severity: 3, context: 'Emotional argument', evidence: null, scene: { sceneNumber: '31', headingRaw: 'INT. HOUSE - NIGHT' } },
    { id: 'f4', category: 'violence', severity: 2, context: 'Chase sequence', evidence: null, scene: { sceneNumber: '45', headingRaw: 'EXT. MARKET STREET - DAY' } },
    { id: 'f5', category: 'sexual_content', severity: 2, context: 'Romantic scene', evidence: null, scene: { sceneNumber: '18', headingRaw: 'INT. RESTAURANT - EVENING' } },
    { id: 'f6', category: 'profanity', severity: 2, context: 'Character outburst', evidence: null, scene: { sceneNumber: '27', headingRaw: 'INT. OFFICE - DAY' } },
    { id: 'f7', category: 'violence', severity: 5, context: 'Climactic confrontation', evidence: null, scene: { sceneNumber: '52', headingRaw: 'EXT. WAREHOUSE - NIGHT' } },
    { id: 'f8', category: 'drugs', severity: 1, context: 'Background party scene', evidence: null, scene: { sceneNumber: '15', headingRaw: 'INT. CLUB - NIGHT' } },
    { id: 'f9', category: 'hate', severity: 1, context: ' heated debate', evidence: null, scene: { sceneNumber: '33', headingRaw: 'INT. COURTROOM - DAY' } },
  ],
  suggestions: [
    { id: 's1', sceneNumber: '12', rank: 1, issue: 'Extended fight sequence with blood', suggestedChange: 'Reduce duration of specific impact moments, show aftermath instead of action', why: 'CBFC typically flags visible blood and extended violence', expectedSeverityDelta: -1.5, effort: 'med', creativeRisk: 'med', expectedCertImpact: 'UA 13+ → UA 7+' },
    { id: 's2', sceneNumber: '52', rank: 2, issue: 'Climactic violence with weapon', suggestedChange: 'Diminish weapon visibility, cut before final strike', why: 'Weapons prominently displayed increases rating', expectedSeverityDelta: -2, effort: 'low', creativeRisk: 'low', expectedCertImpact: 'UA 16+ → UA 13+' },
    { id: 's3', sceneNumber: '31', rank: 3, issue: 'Strong language in emotional scene', suggestedChange: 'Replace 2-3 specific words with milder alternatives', why: 'Emotional intensity can be maintained with softer language', expectedSeverityDelta: -1, effort: 'low', creativeRisk: 'low', expectedCertImpact: 'UA 13+ remains UA 13+' },
    { id: 's4', sceneNumber: '23', rank: 4, issue: 'Police brutality depiction', suggestedChange: 'Show restraint techniques instead of excessive force', why: 'Excessive force toward authority figures flagged', expectedSeverityDelta: -1.5, effort: 'med', creativeRisk: 'med', expectedCertImpact: 'UA 13+ → UA 7+' },
    { id: 's5', sceneNumber: '18', rank: 5, issue: 'Suggestive positioning', suggestedChange: 'Adjust camera angles to be less suggestive', why: 'Camera angles can imply more than shown', expectedSeverityDelta: -1, effort: 'low', creativeRisk: 'low', expectedCertImpact: 'UA 13+ remains UA 13+' },
  ]
}

export default function CensorBoardPage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [targetCert, setTargetCert] = useState('UA 13+')
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/censor')
      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
        setIsDemoMode(false)
      } else {
        // Use demo data when no database analysis exists
        setAnalysis(DEMO_ANALYSIS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.error(e)
      // Use demo data on error
      setAnalysis(DEMO_ANALYSIS)
      setIsDemoMode(true)
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
      // On error, simulate analysis with demo data
      setAnalysis(DEMO_ANALYSIS)
      setIsDemoMode(true)
      setError(null)
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
      // On error, show the demo suggestions
      setActiveTab('suggestions')
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
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading censor board...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-600 to-rose-700 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Censor Board Analysis</h1>
              <p className="text-slate-500 text-sm mt-0.5">CBFC certificate prediction + content sensitivity analysis</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
              Demo Mode
            </span>
          )}
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-lg p-3 mb-4 text-indigo-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Showing demo data — Connect a PostgreSQL database to analyze your actual script.
        </div>
      )}

      {/* Certificate Prediction Card */}
      {analysis && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-6 border text-center ${CERT_COLORS[analysis.predictedCertificate || 'U'] || 'bg-slate-900 border-slate-700'}`}>
            <div className="text-4xl font-bold">{analysis.predictedCertificate || '—'}</div>
            <div className="text-xs mt-2 opacity-70">Predicted Certificate</div>
            {analysis.confidence && (
              <div className="text-xs mt-2 opacity-60 capitalize">Confidence: {analysis.confidence}</div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{analysis.deterministicScore?.toFixed(1) || '0'}</div>
            <div className="text-xs text-slate-500 mt-1">Sensitivity Score</div>
            <div className="text-[10px] text-slate-600 mt-1">0 = Clean, 100 = Explicit</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{analysis.sceneFlags.length}</div>
            <div className="text-xs text-slate-500 mt-1">Content Flags</div>
            <div className="text-[10px] text-slate-600 mt-1">Scenes requiring review</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {analysis.sceneFlags.filter(f => f.severity >= 4).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">High Severity</div>
            <div className="text-[10px] text-slate-600 mt-1">Severity 4-5 flags</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {tabs.map(tab => (
          <button 
            key={tab.key} 
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key 
                ? 'bg-slate-900 text-indigo-400 border border-b-0 border-slate-800' 
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
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <div className="text-lg text-slate-400 mb-2">No censor analysis yet</div>
              <p className="text-sm text-slate-500 mb-4">Upload a script first, then click "Run Analysis" to predict the CBFC certificate.</p>
              <button onClick={handleAnalyze} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium">
                Generate Demo Analysis
              </button>
            </div>
          ) : (
            <>
              {/* Category Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4 text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Category Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <span className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[cat]}`}>
                          {cat.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-200">{categoryCounts[cat] || 0}</div>
                        <div className="text-[10px] text-slate-500">max sev: {maxSeverityByCategory[cat] || 0}/5</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Drivers */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold mb-3 text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Top Content Drivers
                </h3>
                <ul className="space-y-2">
                  {analysis.topDrivers.map((d, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-3">
                      <span className="text-red-400 mt-0.5">•</span> 
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Uncertainties */}
              {analysis.uncertainties.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-3 text-slate-300">Uncertainties</h3>
                  <ul className="space-y-2">
                    {analysis.uncertainties.map((u, i) => (
                      <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                        <span className="text-slate-600">?</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Optimizer */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold mb-3 text-slate-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Target Certificate Optimizer
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Target:</span>
                    <select 
                      value={targetCert} 
                      onChange={e => setTargetCert(e.target.value)} 
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    >
                      {CERTIFICATES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={handleSuggestCuts} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Generate Cut Suggestions
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Get AI-powered suggestions to achieve your target certificate while preserving creative intent.
                </p>
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
              No flags found. Run analysis to detect content issues.
            </div>
          ) : (
            analysis.sceneFlags.map(flag => (
              <div key={flag.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2">
                  <SeverityDots severity={flag.severity} />
                  <span className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[flag.category] || 'bg-slate-800 text-slate-500'}`}>
                    {flag.category.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{flag.scene.sceneNumber}</span>
                <span className="text-sm text-slate-300 flex-1 truncate">{flag.scene.headingRaw || 'Untitled Scene'}</span>
                {flag.context && (
                  <span className="text-xs text-slate-500 max-w-xs truncate">{flag.context}</span>
                )}
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
              No suggestions yet. Run analysis and use the Target Optimizer to get cut suggestions.
            </div>
          ) : (
            analysis.suggestions.map(sug => (
              <div key={sug.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-indigo-400">#{sug.rank}</span>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">Scene {sug.sceneNumber}</span>
                  {sug.effort && (
                    <span className={`text-[10px] px-2 py-1 rounded ${
                      sug.effort === 'low' ? 'bg-green-900/30 text-green-400' :
                      sug.effort === 'med' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      Effort: {sug.effort}
                    </span>
                  )}
                  {sug.creativeRisk && (
                    <span className={`text-[10px] px-2 py-1 rounded ${
                      sug.creativeRisk === 'low' ? 'bg-green-900/30 text-green-400' :
                      sug.creativeRisk === 'med' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      Risk: {sug.creativeRisk}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-200 mb-2">
                  <span className="text-red-400 font-medium">Issue:</span> {sug.issue}
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  <span className="text-green-400 font-medium">Suggestion:</span> {sug.suggestedChange}
                </div>
                {sug.why && (
                  <div className="text-xs text-slate-500 mb-2">
                    <span className="text-slate-400">Why:</span> {sug.why}
                  </div>
                )}
                {sug.expectedCertImpact && (
                  <div className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Expected impact: {sug.expectedCertImpact}
                  </div>
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
