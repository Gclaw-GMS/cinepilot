'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Zap,
  Clock,
  AlertCircle,
  Scale,
  ChevronRight,
  Lightbulb,
  X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, Cell
} from 'recharts'

interface CensorAnalysis {
  id: string
  predictedCertificate: string
  deterministicScore: number
  confidence: string
  topDrivers: string[]
  highRiskScenes: string[]
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

const CERTIFICATE_INFO: Record<string, { label: string; color: string; bg: string; description: string }> = {
  'U': { 
    label: 'Universal', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20 border-emerald-500/30',
    description: 'Suitable for all ages'
  },
  'UA': { 
    label: 'UA 13+', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/20 border-cyan-500/30',
    description: 'Parental guidance for children under 13'
  },
  'A': { 
    label: 'Adults Only 18+', 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20 border-orange-500/30',
    description: 'Restricted to adults'
  },
  'S': { 
    label: 'Special', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20 border-purple-500/30',
    description: 'For specific audiences only'
  },
}

const RISK_LEVELS = [
  { level: 'low', label: 'Low Risk', color: '#10b981', description: 'Should pass easily' },
  { level: 'medium', label: 'Medium Risk', color: '#f59e0b', description: 'May require edits' },
  { level: 'high', label: 'High Risk', color: '#ef4444', description: 'Significant cuts likely' },
]

const DEMO_ANALYSIS: CensorAnalysis = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  deterministicScore: 0.685,
  confidence: 'high',
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
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

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/censor?projectId=${selectedProject}`)
      const data = await res.json()
      
      if (data.analysis) {
        setAnalysis(data.analysis)
      } else if (data.predictedCertificate) {
        setStats(data)
      }
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis')
      // Fall back to demo data
      setAnalysis(DEMO_ANALYSIS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

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
      
      // Refresh to get new analysis
      await fetchAnalysis()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  // Get certificate info
  const certInfo = analysis?.predictedCertificate 
    ? CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()] || CERTIFICATE_INFO['UA']
    : CERTIFICATE_INFO['UA']

  // Sensitivity gauge data
  const sensitivityValue = stats?.sensitivityScore ?? Math.round((analysis?.deterministicScore ?? 0) * 100)
  const sensitivityData = [
    { name: 'score', value: sensitivityValue, fill: '#06b6d4' }
  ]

  // Risk breakdown data
  const riskData = [
    { name: 'Content', value: 35, fill: '#f59e0b' },
    { name: 'Violence', value: 25, fill: '#ef4444' },
    { name: 'Language', value: 20, fill: '#f97316' },
    { name: 'Theme', value: 15, fill: '#8b5cf6' },
    { name: 'Other', value: 5, fill: '#6b7280' },
  ]

  // Confidence level
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
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Certificate Display */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Certificate Badge */}
            <div className={`px-8 py-6 rounded-2xl border-2 ${certInfo.bg} text-center`}>
              <div className={`text-4xl font-bold ${certInfo.color}`}>
                {analysis?.predictedCertificate || stats?.predictedCertificate || '--'}
              </div>
              <div className={`text-sm mt-1 ${certInfo.color}`}>
                {certInfo.label}
              </div>
            </div>
            
            {/* Certificate Info */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Predicted Certificate</h2>
              <p className="text-gray-400 text-sm mb-3">{certInfo.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${confidenceColors[confidenceLevel]}`}>
                  {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence
                </span>
                <span className="text-xs text-gray-500">
                  Analysis date: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Sensitivity Gauge */}
          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={sensitivityData} startAngle={180} endAngle={0}>
                <RadialBar 
                  background={{ fill: '#1f2937' }} 
                  dataKey="value" 
                  cornerRadius={10}
                  fill="#06b6d4"
                />
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
            <span className="text-sm text-gray-400">High Risk Scenes</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {analysis?._count?.sceneFlags || stats?.highRiskCount || 0}
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
            {analysis?._count?.suggestions || stats?.suggestionCount || 0}
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
            <span className="text-sm text-gray-400">Analysis Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {analysis ? 'Complete' : 'Not Run'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Breakdown */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Risk Breakdown by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Risk Level']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risk Drivers */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Top Risk Drivers
          </h3>
          <div className="space-y-3">
            {analysis?.topDrivers && analysis.topDrivers.length > 0 ? (
              analysis.topDrivers.map((driver, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
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
                <p className="text-xs mt-1">Run analysis to detect content</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High Risk Scenes */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-400" />
          High Risk Scenes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {analysis?.highRiskScenes && analysis.highRiskScenes.length > 0 ? (
            analysis.highRiskScenes.map((scene, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
              >
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-white font-medium">{scene}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              <p>No high-risk scenes identified</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Reference Guide */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Indian Film Certificate Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CERTIFICATE_INFO).map(([key, info]) => (
            <div 
              key={key}
              className={`p-4 rounded-xl border ${info.bg}`}
            >
              <div className={`text-xl font-bold ${info.color} mb-1`}>{key}</div>
              <div className={`text-sm font-medium ${info.color} mb-2`}>{info.label}</div>
              <div className="text-xs text-gray-400">{info.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-600">
        <p>Last analysis: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Never'}</p>
        <p className="mt-1">Powered by CinePilot AI • For reference only</p>
      </div>
    </div>
  )
}
