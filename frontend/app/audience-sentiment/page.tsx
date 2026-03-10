'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  TrendingUp,
  Lightbulb,
  ExternalLink,
  Plus,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingDown,
  Instagram,
  Youtube,
  Twitter,
  Video,
  AlertCircle,
  CheckCircle,
  Clock,
  HelpCircle,
  X,
  Search,
} from 'lucide-react'
import {
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, color: '#1DA1F2' },
]

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
}

const DEMO_PROJECT_ID = 'demo-project'

interface SentimentAnalysis {
  id: string
  title: string
  platform: string
  videoUrl?: string | null
  totalComments: number
  analyzedCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  avgSentiment: number
  topPositive: Array<{ text: string; author: string; likes: number }>
  topNegative: Array<{ text: string; author: string; likes: number }>
  takeaways: string[]
  posterTips: string[]
  status: string
  errorMsg?: string | null
  createdAt: string
}

export default function AudienceSentimentPage() {
  const [analyses, setAnalyses] = useState<SentimentAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube',
    videoUrl: '',
  })

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()

  // Filter analyses by platform and search query
  const filteredAnalyses = analyses.filter(a => {
    const matchesPlatform = platformFilter === 'all' || a.platform === platformFilter
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.topPositive?.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (a.topNegative?.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (a.takeaways?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    return matchesPlatform && matchesSearch
  })

  const fetchAnalyses = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/audience-sentiment?projectId=${DEMO_PROJECT_ID}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalyses(data.sentiments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = async () => {
      setRefreshing(true)
      await fetchAnalyses()
    }
  }, [fetchAnalyses])

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
        case 'n':
          e.preventDefault()
          setShowForm(true)
          break
        case '1':
          e.preventDefault()
          setPlatformFilter('all')
          break
        case '2':
          e.preventDefault()
          setPlatformFilter('youtube')
          break
        case '3':
          e.preventDefault()
          setPlatformFilter('instagram')
          break
        case '4':
          e.preventDefault()
          setPlatformFilter('twitter')
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowForm(false)
          setSearchQuery('')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.platform) return

    try {
      const res = await fetch('/api/audience-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: DEMO_PROJECT_ID,
          title: formData.title,
          platform: formData.platform,
          videoUrl: formData.videoUrl || null,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Auto-start analysis
      setAnalyzing(data.sentiment.id)
      const analyzeRes = await fetch('/api/audience-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentimentId: data.sentiment.id }),
      })
      await analyzeRes.json()
      setAnalyzing(null)

      setShowForm(false)
      setFormData({ title: '', platform: 'youtube', videoUrl: '' })
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create analysis')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis?')) return
    try {
      await fetch(`/api/audience-sentiment?id=${id}`, { method: 'DELETE' })
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const runAnalysis = async (id: string) => {
    setAnalyzing(id)
    try {
      const res = await fetch('/api/audience-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentimentId: id }),
      })
      await res.json()
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze')
    } finally {
      setAnalyzing(null)
    }
  }

  const selectedAnalysis = filteredAnalyses[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Audience Sentiment</h1>
                <p className="text-sm text-slate-400">
                  {searchQuery || platformFilter !== 'all'
                    ? `${filteredAnalyses.length} of ${analyses.length} analyses`
                    : `${analyses.length} analyses total`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search analyses... (/)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 w-48"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">(/)</span>
              </div>
              
              {/* Platform Filter */}
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                {PLATFORMS.map((platform, idx) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.key}
                      onClick={() => setPlatformFilter(platform.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        platformFilter === platform.key
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: platform.color }} />
                      <span className="hidden sm:inline">{platform.label}</span>
                      <span className="text-xs text-slate-500 ml-0.5">({idx + 2})</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    platformFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  All
                </button>
              </div>
              <button
                onClick={() => fetchDataRef.current?.()}
                disabled={refreshing}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Refresh data (R)"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Sentiment Analyses Yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Analyze audience reactions from trailer comments to understand what viewers think and get tips for improving your movie poster.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {selectedAnalysis && (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-400">Total Comments</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedAnalysis.totalComments}</p>
                    <p className="text-xs text-slate-500 mt-1">Analyzed: {selectedAnalysis.analyzedCount}</p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-400">Positive</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{selectedAnalysis.positiveCount}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.totalComments > 0 
                        ? Math.round((selectedAnalysis.positiveCount / selectedAnalysis.totalComments) * 100)
                        : 0}% of total
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <ThumbsDown className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-sm text-slate-400">Negative</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{selectedAnalysis.negativeCount}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.totalComments > 0 
                        ? Math.round((selectedAnalysis.negativeCount / selectedAnalysis.totalComments) * 100)
                        : 0}% of total
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-sm text-slate-400">Sentiment Score</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {selectedAnalysis.avgSentiment > 0 ? '+' : ''}{selectedAnalysis.avgSentiment.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.avgSentiment > 0.3 ? '🟢 Very Positive' 
                        : selectedAnalysis.avgSentiment > 0 ? '🟢 Positive' 
                        : selectedAnalysis.avgSentiment > -0.3 ? '🟡 Neutral' 
                        : '🔴 Negative'}
                    </p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sentiment Distribution */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-rose-400" />
                      Sentiment Distribution
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: selectedAnalysis.positiveCount, color: '#10b981' },
                              { name: 'Negative', value: selectedAnalysis.negativeCount, color: '#ef4444' },
                              { name: 'Neutral', value: selectedAnalysis.neutralCount, color: '#6b7280' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { name: 'Positive', value: selectedAnalysis.positiveCount, color: '#10b981' },
                              { name: 'Negative', value: selectedAnalysis.negativeCount, color: '#ef4444' },
                              { name: 'Neutral', value: selectedAnalysis.neutralCount, color: '#6b7280' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Comments */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-rose-400" />
                      Top Positive Comments
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedAnalysis.topPositive?.map((comment, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-emerald-500/20">
                          <p className="text-sm text-white line-clamp-2">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">@{comment.author}</span>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {comment.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!selectedAnalysis.topPositive || selectedAnalysis.topPositive.length === 0) && (
                        <p className="text-sm text-slate-500 text-center py-4">No positive comments yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insights Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key Takeaways */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-3">
                      {selectedAnalysis.takeaways?.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {takeaway}
                        </li>
                      ))}
                      {(!selectedAnalysis.takeaways || selectedAnalysis.takeaways.length === 0) && (
                        <p className="text-sm text-slate-500">Run analysis to see takeaways</p>
                      )}
                    </ul>
                  </div>

                  {/* Poster Tips */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-rose-400" />
                      Poster Improvement Tips
                    </h3>
                    <ul className="space-y-3">
                      {selectedAnalysis.posterTips?.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 text-xs flex-shrink-0">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                      {(!selectedAnalysis.posterTips || selectedAnalysis.posterTips.length === 0) && (
                        <p className="text-sm text-slate-500">Run analysis to get poster tips</p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Negative Feedback */}
                {selectedAnalysis.negativeCount > 0 && (
                  <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      Areas of Concern
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedAnalysis.topNegative?.map((comment, i) => (
                        <div key={i} className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                          <p className="text-sm text-slate-300 line-clamp-2">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">@{comment.author}</span>
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" /> {comment.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Analyses List */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-400" />
                    All Analyses
                  </h3>
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center">
                            {analysis.platform === 'youtube' ? (
                              <Youtube className="w-5 h-5 text-red-400" />
                            ) : analysis.platform === 'instagram' ? (
                              <Instagram className="w-5 h-5 text-pink-400" />
                            ) : (
                              <Twitter className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{analysis.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500">
                                {new Date(analysis.createdAt).toLocaleDateString()}
                              </span>
                              {analysis.status === 'completed' && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Completed
                                </span>
                              )}
                              {analysis.status === 'analyzing' && (
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                                </span>
                              )}
                              {analysis.status === 'pending' && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.status === 'completed' && (
                            <div className="flex items-center gap-4 mr-4">
                              <span className="text-sm text-emerald-400">{analysis.positiveCount} 🟢</span>
                              <span className="text-sm text-red-400">{analysis.negativeCount} 🔴</span>
                            </div>
                          )}
                          {analysis.status !== 'completed' && (
                            <button
                              onClick={() => runAnalysis(analysis.id)}
                              disabled={analyzing === analysis.id}
                              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            >
                              {analyzing === analysis.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              Analyze
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(analysis.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-white mb-6">New Sentiment Analysis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Analysis Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Thalapathy 68 First Look"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: platform.key })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        formData.platform === platform.key
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                      <span className="text-xs">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Video URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Create & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Refresh data</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Search analyses</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">New analysis</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">N</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter: All</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter: YouTube</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter: Instagram</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter: Twitter</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">4</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300">Close / Clear</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
