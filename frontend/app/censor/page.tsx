'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  FileText,
  TrendingUp,
  Eye,
  Target,
  AlertCircle,
  Scale,
  ChevronRight,
  Lightbulb,
  X,
  Download,
  Printer,
  Filter,
  HelpCircle,
  Search
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell
} from 'recharts'

interface CensorSceneFlag {
  id: string
  category: string
  severity: number
  context: string
  scene: {
    sceneNumber: string
    headingRaw: string
  }
}

interface CensorSuggestion {
  id: string
  sceneNumber: string
  issue: string
  suggestedChange: string
  why: string
  expectedSeverityDelta: number
}

interface CensorAnalysis {
  id: string
  predictedCertificate: string
  deterministicScore: number
  confidence: string
  topDrivers: string[]
  highRiskScenes: string[]
  sceneFlags?: CensorSceneFlag[]
  suggestions?: CensorSuggestion[]
  uncertainties?: string[]
  createdAt: string
  _count?: {
    sceneFlags: number
    suggestions: number
  }
}

interface CensorStats {
  predictedCertificate: string
  sensitivityScore: number
  confidence: string
  highRiskCount: number
  suggestionCount: number
  isDemoMode?: boolean
}

const CERTIFICATE_INFO: Record<string, { label: string; color: string; bg: string; description: string; age: string }> = {
  'U': { 
    label: 'Universal', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20 border-emerald-500/30',
    description: 'Suitable for all ages',
    age: 'All ages'
  },
  'UA': { 
    label: 'UA 13+', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/20 border-cyan-500/30',
    description: 'Parental guidance for children under 13',
    age: '13+'
  },
  'A': { 
    label: 'Adults Only 18+', 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20 border-orange-500/30',
    description: 'Restricted to adults',
    age: '18+'
  },
  'S': { 
    label: 'Special', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20 border-purple-500/30',
    description: 'For specific audiences only',
    age: 'Special'
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Violence': '#ef4444',
  'Profanity': '#f97316',
  'Sexual Content': '#ec4899',
  'Drugs/Alcohol': '#8b5cf6',
  'Sensitive Theme': '#f59e0b',
  'Other': '#64748b',
}

const DEMO_ANALYSIS: CensorAnalysis = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  deterministicScore: 0.685,
  confidence: 'high',
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
  uncertainties: ['Final edit may affect rating', 'Background score intensity unknown'],
  sceneFlags: [
    { id: 'f1', category: 'Violence', severity: 7, context: 'Temple fight sequence with blood', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE - NIGHT' } },
    { id: 'f2', category: 'Violence', severity: 5, context: 'Police confrontation with weapons', scene: { sceneNumber: '23', headingRaw: 'INT. POLICE STATION - DAY' } },
    { id: 'f3', category: 'Profanity', severity: 4, context: 'Emotional argument with harsh language', scene: { sceneNumber: '31', headingRaw: 'INT. HOUSE - NIGHT' } },
    { id: 'f4', category: 'Sensitive Theme', severity: 6, context: 'Suicide attempt reference', scene: { sceneNumber: '45', headingRaw: 'INT. APARTMENT - DAY' } },
    { id: 'f5', category: 'Drugs/Alcohol', severity: 3, context: 'Party scene with drinking', scene: { sceneNumber: '28', headingRaw: 'EXT. CLUB - NIGHT' } },
    { id: 'f6', category: 'Sexual Content', severity: 5, context: 'Romantic sequence', scene: { sceneNumber: '15', headingRaw: 'INT. BEACH - SUNSET' } },
  ],
  suggestions: [
    { id: 's1', sceneNumber: '12', issue: 'Fight sequence intensity', suggestedChange: 'Reduce graphic violence in temple fight', why: 'Lower the severity to avoid A rating', expectedSeverityDelta: -3 },
    { id: 's2', sceneNumber: '23', issue: 'Police violence', suggestedChange: 'Show consequences of violence', why: 'Add moral context to justify action', expectedSeverityDelta: -2 },
    { id: 's3', sceneNumber: '45', issue: 'Suicide reference', suggestedChange: 'Remove or alter the suicide attempt', why: 'CBFC is sensitive to this', expectedSeverityDelta: -4 },
    { id: 's4', sceneNumber: '31', issue: 'Profanity in argument', suggestedChange: 'Mild dialogue changes', why: 'Reduce harsh words', expectedSeverityDelta: -2 },
  ],
  createdAt: new Date().toISOString(),
  _count: {
    sceneFlags: 6,
    suggestions: 4,
  },
}

const DEMO_STATS: CensorStats = {
  predictedCertificate: 'UA 13+',
  sensitivityScore: 69,
  confidence: 'high',
  highRiskCount: 6,
  suggestionCount: 4,
  isDemoMode: true,
}

export default function CensorPage() {
  const [analysis, setAnalysis] = useState<CensorAnalysis | null>(null)
  const [stats, setStats] = useState<CensorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setSearchQuery('')
          setFilterCategory('all')
          setFilterSeverity('all')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/censor?projectId=${selectedProject}&full=true`)
      const data = await res.json()
      
      if (data.analysis) {
        setAnalysis(data.analysis)
        if (data.analysis._count) {
          setStats({
            predictedCertificate: data.analysis.predictedCertificate,
            sensitivityScore: Math.round(data.analysis.deterministicScore * 100),
            confidence: data.analysis.confidence,
            highRiskCount: data.analysis._count.sceneFlags,
            suggestionCount: data.analysis._count.suggestions,
          })
        }
      } else if (data.predictedCertificate) {
        setStats(data)
      }
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis')
      setAnalysis(DEMO_ANALYSIS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = fetchAnalysis

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/censor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', projectId: selectedProject })
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      await fetchAnalysis()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = (format: 'json' | 'pdf') => {
    if (!analysis) return

    if (format === 'json') {
      const exportData = {
        project: selectedProject,
        generatedAt: new Date().toISOString(),
        certificate: analysis.predictedCertificate,
        sensitivityScore: Math.round(analysis.deterministicScore * 100),
        confidence: analysis.confidence,
        topDrivers: analysis.topDrivers,
        highRiskScenes: analysis.highRiskScenes,
        sceneFlags: analysis.sceneFlags || [],
        suggestions: analysis.suggestions || [],
        uncertainties: analysis.uncertainties || [],
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `censor-analysis-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      const html = `<!DOCTYPE html>
<html>
<head><title>Censor Analysis Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #06b6d4;padding-bottom:20px}.header h1{font-size:28px;color:#06b6d4;margin-bottom:5px}.header .date{color:#64748b;font-size:14px}.certificate{text-align:center;padding:30px;background:#f0f9ff;border-radius:12px;margin-bottom:30px}.certificate .cert{font-size:48px;font-weight:bold;color:#0891b2}.certificate .label{font-size:18px;color:#0e7490;margin-top:5px}.stats{display:flex;justify-content:space-around;margin-bottom:30px}.stat{text-align:center;padding:15px;background:#f8fafc;border-radius:8px}.stat-value{font-size:24px;font-weight:bold;color:#06b6d4}.stat-label{font-size:12px;color:#64748b}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#06b6d4;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #e2e8f0}.severity-high{color:#dc2626;font-weight:bold}.severity-medium{color:#d97706;font-weight:bold}.severity-low{color:#16a34a;font-weight:bold}.suggestion{background:#fef3c7;padding:15px;border-radius:8px;margin-bottom:10px}.suggestion h4{color:#92400e;margin-bottom:5px}.footer{margin-top:30px;text-align:center;color:#94a3b8;font-size:12px}</style>
</head>
<body>
<div class="header"><h1>📊 Censor Certification Analysis</h1><div class="date">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
<div class="certificate"><div class="cert">${analysis.predictedCertificate}</div><div class="label">${CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()]?.label || 'Certificate'}</div></div>
<div class="stats"><div class="stat"><div class="stat-value">${Math.round(analysis.deterministicScore * 100)}%</div><div class="stat-label">Sensitivity Score</div></div><div class="stat"><div class="stat-value">${analysis._count?.sceneFlags || 0}</div><div class="stat-label">Risk Flags</div></div><div class="stat"><div class="stat-value">${analysis._count?.suggestions || 0}</div><div class="stat-label">Suggestions</div></div><div class="stat"><div class="stat-value">${analysis.confidence}</div><div class="stat-label">Confidence</div></div></div>
<h3>🚨 Risk Flags</h3>
<table><thead><tr><th>Scene</th><th>Category</th><th>Severity</th><th>Context</th></tr></thead>
<tbody>${(analysis.sceneFlags || []).map(f => `<tr><td>${f.scene.sceneNumber}</td><td>${f.category}</td><td class="severity-${f.severity >= 6 ? 'high' : f.severity >= 4 ? 'medium' : 'low'}">${f.severity}/10</td><td>${f.context}</td></tr>`).join('')}</tbody></table>
<h3>💡 Suggestions</h3>
${(analysis.suggestions || []).map(s => `<div class="suggestion"><h4>Scene ${s.sceneNumber}: ${s.issue}</h4><p><strong>Change:</strong> ${s.suggestedChange}</p><p><strong>Why:</strong> ${s.why}</p></div>`).join('')}
<div class="footer">Generated by CinePilot • For reference only</div>
</body></html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => printWindow.print()
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `censor-report-${new Date().toISOString().split('T')[0]}.html`
        a.click()
      }
    }
  }

  const certInfo = analysis?.predictedCertificate 
    ? CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()] || CERTIFICATE_INFO['UA']
    : CERTIFICATE_INFO['UA']

  const sensitivityValue = stats?.sensitivityScore ?? Math.round((analysis?.deterministicScore ?? 0) * 100)
  const sensitivityData = [{ name: 'score', value: sensitivityValue, fill: '#06b6d4' }]

  const riskData = [
    { name: 'Content', value: 35, fill: '#f59e0b' },
    { name: 'Violence', value: 25, fill: '#ef4444' },
    { name: 'Language', value: 20, fill: '#f97316' },
    { name: 'Theme', value: 15, fill: '#8b5cf6' },
    { name: 'Other', value: 5, fill: '#6b7280' },
  ]

  const categoryData = analysis?.sceneFlags 
    ? Object.entries(analysis.sceneFlags.reduce((acc, flag) => {
        acc[flag.category] = (acc[flag.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)).map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other']
      }))
    : []

  const filteredFlags = analysis?.sceneFlags?.filter(flag => {
    if (filterCategory !== 'all' && flag.category !== filterCategory) return false
    if (filterSeverity === 'high' && flag.severity < 6) return false
    if (filterSeverity === 'medium' && (flag.severity < 4 || flag.severity >= 6)) return false
    if (filterSeverity === 'low' && flag.severity >= 4) return false
    return true
  }) || []

  const confidenceLevel = analysis?.confidence || stats?.confidence || 'medium'
  const confidenceColors: Record<string, string> = {
    high: 'text-emerald-400 bg-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    low: 'text-red-400 bg-red-500/20',
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Censor Analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Censor Certification</h1>
              {isDemoMode && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                  Demo
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Predict certificate ratings & identify risky content
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="default-project">இதயத்தின் ஒலி</option>
            <option value="project-2">Veera's Journey</option>
          </select>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('json')}
              disabled={!analysis}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Export JSON"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!analysis}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Export PDF"
            >
              <Printer className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs">?</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Certificate Display */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`px-8 py-6 rounded-2xl border-2 ${certInfo.bg} text-center`}>
              <div className={`text-4xl font-bold ${certInfo.color}`}>
                {analysis?.predictedCertificate || stats?.predictedCertificate || '--'}
              </div>
              <div className={`text-sm mt-1 ${certInfo.color}`}>{certInfo.label}</div>
              <div className={`text-xs mt-1 ${certInfo.color} opacity-75`}>Age: {certInfo.age}</div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Predicted Certificate</h2>
              <p className="text-gray-400 text-sm mb-3">{certInfo.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${confidenceColors[confidenceLevel]}`}>
                  {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence
                </span>
                <span className="text-xs text-gray-500">
                  Analysis: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={sensitivityData} startAngle={180} endAngle={0}>
                <RadialBar background={{ fill: '#1f2937' }} dataKey="value" cornerRadius={10} fill="#06b6d4" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-12 relative z-10">
              <div className="text-2xl font-bold text-cyan-400">
                {stats?.sensitivityScore || Math.round((analysis?.deterministicScore || 0) * 100)}
              </div>
              <div className="text-xs text-gray-500">Sensitivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-gray-400">High Risk Flags</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {analysis?.sceneFlags?.filter(f => f.severity >= 6).length || analysis?._count?.sceneFlags || stats?.highRiskCount || 0}
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-gray-400">Suggestions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {analysis?.suggestions?.length || analysis?._count?.suggestions || stats?.suggestionCount || 0}
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-gray-400">Content Score</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round((analysis?.deterministicScore || 0.5) * 100)}%
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-400">Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {analysis ? 'Complete' : 'Not Run'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Risk by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.length > 0 ? categoryData : riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} flags`, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {(categoryData.length > 0 ? categoryData : riskData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Top Risk Drivers
          </h3>
          <div className="space-y-3">
            {analysis?.topDrivers && analysis.topDrivers.length > 0 ? (
              analysis.topDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{driver}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No risk drivers identified</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scene Flags Detail */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Scene-by-Scene Flags
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
            >
              <option value="all">All Severity</option>
              <option value="high">High (6-10)</option>
              <option value="medium">Medium (4-5)</option>
              <option value="low">Low (1-3)</option>
            </select>
          </div>
        </div>
        
        {filteredFlags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFlags.map((flag) => (
              <div 
                key={flag.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  flag.severity >= 6 ? 'bg-red-500/10 border-red-500/30' : 
                  flag.severity >= 4 ? 'bg-amber-500/10 border-amber-500/30' : 
                  'bg-green-500/10 border-green-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  flag.severity >= 6 ? 'bg-red-500/20 text-red-400' : 
                  flag.severity >= 4 ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-green-500/20 text-green-400'
                }`}>
                  {flag.severity}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{flag.scene?.sceneNumber || 'Scene'}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${CATEGORY_COLORS[flag.category]}30`, color: CATEGORY_COLORS[flag.category] }}
                    >
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{flag.context}</p>
                  {flag.scene?.headingRaw && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{flag.scene.headingRaw}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            <p>No flags match the selected filters</p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {analysis?.suggestions && analysis.suggestions.length > 0 && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Suggested Modifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Scene {suggestion.sceneNumber}</span>
                  <span className="text-xs text-amber-400">Severity -{Math.abs(suggestion.expectedSeverityDelta)}</span>
                </div>
                <p className="text-sm text-gray-300 mb-2"><strong>Issue:</strong> {suggestion.issue}</p>
                <p className="text-sm text-gray-400 mb-2"><strong>Change:</strong> {suggestion.suggestedChange}</p>
                <p className="text-xs text-gray-500"><strong>Why:</strong> {suggestion.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Reference Guide */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Indian Film Certificate Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CERTIFICATE_INFO).map(([key, info]) => (
            <div key={key} className={`p-4 rounded-xl border ${info.bg}`}>
              <div className={`text-xl font-bold ${info.color} mb-1`}>{key}</div>
              <div className={`text-sm font-medium ${info.color} mb-2`}>{info.label}</div>
              <div className="text-xs text-gray-400">{info.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600">
        <p>Last analysis: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Never'}</p>
        <p className="mt-1">Powered by CinePilot AI • For reference only</p>
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Refresh analysis</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Focus search</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Close / Clear filters</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
