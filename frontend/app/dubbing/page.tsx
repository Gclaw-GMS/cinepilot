'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Languages, FileText, ArrowRight, RefreshCw, Globe, BarChart3, PieChart, TrendingUp, Download, Copy, Check, Wand2, Film } from 'lucide-react'
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

type ScriptOption = {
  id: string
  title: string
}

type DubbedScript = {
  id: string
  title: string
  language: string
  createdAt: string
  sceneCount?: number
}

type TranslatedScene = {
  sceneNumber: string
  translatedDialogue: string
  notes?: string
}

type Stats = {
  totalLanguages: number
  totalScenesTranslated: number
  averageSceneLength: number
  lastUpdated: string
}

const TARGET_LANGUAGES = [
  { value: 'telugu', label: 'Telugu', color: '#eab308', speakers: '85M+' },
  { value: 'hindi', label: 'Hindi', color: '#f97316', speakers: '600M+' },
  { value: 'malayalam', label: 'Malayalam', color: '#14b8a6', speakers: '35M+' },
  { value: 'kannada', label: 'Kannada', color: '#f43f5e', speakers: '44M+' },
  { value: 'english', label: 'English', color: '#3b82f6', speakers: '1.5B+' },
]

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308']

export default function DubbingPage() {
  const [scripts, setScripts] = useState<ScriptOption[]>([])
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [dubbedVersions, setDubbedVersions] = useState<DubbedScript[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<TranslatedScene[]>([])
  const [loadingScripts, setLoadingScripts] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [copiedScene, setCopiedScene] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'versions' | 'preview'>('versions')

  // Load available scripts
  useEffect(() => {
    async function loadScripts() {
      try {
        const res = await fetch('/api/scripts')
        if (!res.ok) throw new Error('Failed to load scripts')
        const data = await res.json()
        const list = (data.scripts || data || []).map(
          (s: { id: string; title: string }) => ({ id: s.id, title: s.title }),
        )
        // Add demo script if none available
        if (list.length === 0) {
          list.push({ id: 'demo-script', title: 'Kaadhal Enbadhu (Demo)' })
          setIsDemoMode(true)
        }
        setScripts(list)
      } catch {
        // Use demo script on error
        setScripts([{ id: 'demo-script', title: 'Kaadhal Enbadhu (Demo)' }])
        setIsDemoMode(true)
      } finally {
        setLoadingScripts(false)
      }
    }
    loadScripts()
  }, [])

  // Load dubbed versions for selected script
  const loadDubbedVersions = useCallback(async (scriptId: string) => {
    if (!scriptId) return
    try {
      const res = await fetch(`/api/dubbing?scriptId=${scriptId}`)
      if (!res.ok) throw new Error('Failed to load dubbed versions')
      const data = await res.json()
      setDubbedVersions(data.scripts || [])
      setIsDemoMode(!!data.isDemoMode)
    } catch {
      setDubbedVersions([])
    }
  }, [])

  useEffect(() => {
    if (selectedScriptId) {
      loadDubbedVersions(selectedScriptId)
      setPreview([])
    }
  }, [selectedScriptId, loadDubbedVersions])

  // Calculate statistics
  const stats: Stats = useMemo(() => {
    const totalLanguages = dubbedVersions.length
    const totalScenesTranslated = preview.length
    const averageSceneLength = preview.length > 0
      ? Math.round(preview.reduce((acc, s) => acc + s.translatedDialogue.length, 0) / preview.length)
      : 0
    const lastUpdated = dubbedVersions.length > 0
      ? dubbedVersions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : ''

    return { totalLanguages, totalScenesTranslated, averageSceneLength, lastUpdated }
  }, [dubbedVersions, preview])

  // Language distribution data for chart
  const languageDistribution = useMemo(() => {
    const dist: Record<string, number> = {}
    dubbedVersions.forEach(d => {
      dist[d.language] = (dist[d.language] || 0) + 1
    })
    return Object.entries(dist).map(([name, value]) => ({ name, value }))
  }, [dubbedVersions])

  // Scene length by scene number
  const sceneLengthData = useMemo(() => {
    return preview.map(s => ({
      scene: `Scene ${s.sceneNumber}`,
      length: s.translatedDialogue.length
    }))
  }, [preview])

  async function handleGenerate() {
    if (!selectedScriptId || !targetLanguage) return
    setGenerating(true)
    setError('')
    setSuccess('')
    setPreview([])

    try {
      const res = await fetch('/api/dubbing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScriptId, targetLanguage }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()
      
      if (data.translatedScenes) {
        setPreview(data.translatedScenes)
        setIsDemoMode(true)
        const langLabel = TARGET_LANGUAGES.find(l => l.value === targetLanguage)?.label || targetLanguage
        setDubbedVersions(prev => [...prev, {
          id: data.scriptId || `dub-${Date.now()}`,
          title: `Kaadhal Enbadhu (${langLabel})`,
          language: targetLanguage,
          createdAt: new Date().toISOString(),
          sceneCount: data.scenesTranslated
        }])
        setSuccess(`Successfully generated ${data.scenesTranslated} translated scenes in ${langLabel}!`)
        setActiveTab('preview')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopyScene(text: string, index: number) {
    navigator.clipboard.writeText(text)
    setCopiedScene(index)
    setTimeout(() => setCopiedScene(null), 2000)
  }

  const languageBadgeColor: Record<string, string> = {
    telugu: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    hindi: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    malayalam: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    kannada: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    english: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dubbing Studio</h1>
              <p className="text-sm text-slate-400">
                Translate scripts with cultural adaptation and lip-sync optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Demo Mode
              </span>
            )}
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Languages</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalLanguages}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Film className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Scenes</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalScenesTranslated}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Avg Length</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageSceneLength} chars</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Last Updated</span>
            </div>
            <p className="text-lg font-bold text-white">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : '--'}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        {languageDistribution.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Distribution Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                Language Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={languageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {languageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scene Length Bar Chart */}
            {sceneLengthData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Scene Length Analysis
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sceneLengthData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="scene" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="length" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Script Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Source Script
              </label>
              <select
                value={selectedScriptId}
                onChange={(e) => setSelectedScriptId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                disabled={loadingScripts}
              >
                <option value="">
                  {loadingScripts ? 'Loading scripts...' : 'Select a script'}
                </option>
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                Target Language
              </label>
              <div className="grid grid-cols-5 gap-1">
                {TARGET_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setTargetLanguage(lang.value)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      targetLanguage === lang.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={`${lang.label} (${lang.speakers} speakers)`}
                  >
                    {lang.label.substring(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={!selectedScriptId || !targetLanguage || generating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Translation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {dubbedVersions.length > 0 && (
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('versions')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'versions'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Languages className="w-4 h-4 inline mr-2" />
              Dubbed Versions ({dubbedVersions.length})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={preview.length === 0}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300 disabled:opacity-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Preview ({preview.length})
            </button>
          </div>
        )}

        {/* Dubbed Versions Grid */}
        {activeTab === 'versions' && dubbedVersions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dubbedVersions.map((dub, idx) => {
              const langInfo = TARGET_LANGUAGES.find(l => l.value === dub.language)
              return (
                <div
                  key={dub.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${langInfo?.color}20` }}
                    >
                      <Languages className="w-5 h-5" style={{ color: langInfo?.color }} />
                    </div>
                    <span className="text-xs text-slate-500">
                      #{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                    {dub.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                        languageBadgeColor[dub.language] ||
                        'bg-slate-600/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {langInfo?.label || dub.language}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(dub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {langInfo && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <span className="text-xs text-slate-500">
                        ~{langInfo.speakers} speakers
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Translation Preview */}
        {activeTab === 'preview' && preview.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Translation Preview
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 transition-colors">
                <Download className="w-3 h-3" />
                Export All
              </button>
            </div>
            
            <div className="space-y-3">
              {preview.map((scene, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-xs font-medium">
                        Scene {scene.sceneNumber}
                      </span>
                      {scene.notes && (
                        <span className="text-xs text-slate-500 italic flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {scene.notes}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyScene(scene.translatedDialogue, idx)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-white transition-colors"
                    >
                      {copiedScene === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {scene.translatedDialogue}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                    <span>{scene.translatedDialogue.length} characters</span>
                    <span>~{Math.ceil(scene.translatedDialogue.split(/\s+/).length / 150)} min read</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dubbedVersions.length === 0 && !loadingScripts && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Languages className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Dubbed Versions Yet</h3>
            <p className="text-slate-400 mb-4">
              Select a script and target language to generate your first translation.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Telugu
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Hindi
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                Malayalam
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                Kannada
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
