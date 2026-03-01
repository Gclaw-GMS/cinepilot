'use client'

import { useState, useEffect, useCallback } from 'react'
import { Languages, FileText, ArrowRight, RefreshCw, Globe, Sparkles, CheckCircle } from 'lucide-react'

type ScriptOption = {
  id: string
  title: string
}

type DubbedScript = {
  id: string
  title: string
  language: string
  createdAt: string
}

type TranslatedScene = {
  sceneNumber: string
  translatedDialogue: string
  notes?: string
}

const TARGET_LANGUAGES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'english', label: 'English' },
]

// Demo data for fallback
const DEMO_SCRIPTS: ScriptOption[] = [
  { id: 'demo-1', title: 'Kaadhal Enbadhu (Tamil)' },
  { id: 'demo-2', title: 'Vikram Vedha 2 (Tamil)' },
]

const DEMO_DUBBED_VERSIONS: DubbedScript[] = [
  { id: 'dub-1', title: 'Kaadhal Enbadhu (Telugu)', language: 'telugu', createdAt: '2026-02-20T14:30:00Z' },
  { id: 'dub-2', title: 'Kaadhal Enbadhu (Hindi)', language: 'hindi', createdAt: '2026-02-21T09:15:00Z' },
  { id: 'dub-3', title: 'Kaadhal Enbadhu (Malayalam)', language: 'malayalam', createdAt: '2026-02-22T11:00:00Z' },
]

const DEMO_PREVIEW: TranslatedScene[] = [
  { sceneNumber: '1', translatedDialogue: 'INT. COLLEGE CAMPUS - DAY\n\nPREMA enters the campus with excitement. Her eyes scan the bustling environment.\n\nPREMA\n(softly)\nIdhe naa first day...', notes: 'Lip-sync adapted' },
  { sceneNumber: '2', translatedDialogue: 'INT. CLASSROOM - DAY\n\nPrema takes a seat. Her neighbor ARJUN smiles at her.\n\nARJUN\nHi! I\'m Arjun. Are you new?', notes: undefined },
  { sceneNumber: '3', translatedDialogue: 'EXT. CANTEEN - EVENING\n\nPrema and Arjun share a meal. Laughter echoes around them.\n\nPREMA\n(laughing)\nThis place is amazing!', notes: 'Cultural adaptation applied' },
  { sceneNumber: '4', translatedDialogue: 'INT. LIBRARY - NIGHT\n\nPrema studies alone. Arjun approaches with books.\n\nARJUN\nMind if I join you?\n\nPREMA\n(not looking up)\nSure...', notes: 'Emotional tone preserved' },
  { sceneNumber: '5', translatedDialogue: 'EXT. ROOFTOP - NIGHT\n\nStars twinkle above. Prema and Arjun sit together.\n\nPREMA\nYou know what? This college is better than I expected.\n\nARJUN\n(smiling)\nI told you so!', notes: undefined },
]

export default function DubbingPage() {
  const [scripts, setScripts] = useState<ScriptOption[]>([])
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [dubbedVersions, setDubbedVersions] = useState<DubbedScript[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<TranslatedScene[]>([])
  const [loadingScripts, setLoadingScripts] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    async function loadScripts() {
      try {
        const res = await fetch('/api/scripts')
        if (!res.ok) throw new Error('Failed to load scripts')
        const data = await res.json()
        const list = (data.scripts || data || []).map(
          (s: { id: string; title: string }) => ({ id: s.id, title: s.title }),
        )
        
        if (list.length === 0) {
          // No scripts in DB, use demo
          setScripts(DEMO_SCRIPTS)
          setIsDemoMode(true)
        } else {
          setScripts(list)
        }
      } catch {
        // API error, use demo data
        setScripts(DEMO_SCRIPTS)
        setIsDemoMode(true)
      } finally {
        setLoadingScripts(false)
      }
    }
    loadScripts()
  }, [])

  const loadDubbedVersions = useCallback(async (scriptId: string) => {
    if (!scriptId) return
    try {
      const res = await fetch(`/api/dubbing?scriptId=${scriptId}`)
      if (!res.ok) throw new Error('Failed to load dubbed versions')
      const data = await res.json()
      if (data.isDemoMode || !data.scripts || data.scripts.length === 0) {
        setDubbedVersions(DEMO_DUBBED_VERSIONS)
        setIsDemoMode(true)
      } else {
        setDubbedVersions(data.scripts || [])
      }
    } catch {
      // Use demo data on error
      setDubbedVersions(DEMO_DUBBED_VERSIONS)
      setIsDemoMode(true)
    }
  }, [])

  useEffect(() => {
    if (selectedScriptId) {
      loadDubbedVersions(selectedScriptId)
      setPreview([])
    }
  }, [selectedScriptId, loadDubbedVersions])

  async function handleGenerate() {
    if (!selectedScriptId || !targetLanguage) return
    setGenerating(true)
    setError('')
    setPreview([])

    try {
      const res = await fetch('/api/dubbing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScriptId, targetLanguage, demo: isDemoMode }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()

      // If demo mode, show demo preview
      if (data.isDemoMode) {
        setDubbedVersions([...DEMO_DUBBED_VERSIONS, {
          id: `new-${Date.now()}`,
          title: `${selectedScriptId.includes('demo') ? 'Demo Script' : 'New'} (${targetLanguage})`,
          language: targetLanguage,
          createdAt: new Date().toISOString(),
        }])
        setPreview(DEMO_PREVIEW)
        setIsDemoMode(true)
      } else {
        await loadDubbedVersions(selectedScriptId)

        const newScript = dubbedVersions.find(
          (d) => d.language === targetLanguage,
        )
        if (newScript) {
          try {
            const contentRes = await fetch(`/api/scripts/${newScript.id}`)
            if (contentRes.ok) {
              const contentData = await contentRes.json()
              const parsed = JSON.parse(contentData.content || '{}')
              setPreview(parsed.translatedScenes || [])
            }
          } catch {
            // preview not critical
          }
        }
      }
    } catch (err) {
      // On error, show demo preview anyway for better UX
      setPreview(DEMO_PREVIEW)
      setIsDemoMode(true)
    } finally {
      setGenerating(false)
    }
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dubbing Script Generator</h1>
              <p className="text-sm text-slate-400">
                Translate scripts with cultural adaptation and lip-sync matching
              </p>
            </div>
          </div>
          {isDemoMode && (
            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Demo Mode</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-slate-400">Source Scripts</span>
            </div>
            <p className="text-2xl font-semibold text-white">{scripts.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Dubbed Versions</span>
            </div>
            <p className="text-2xl font-semibold text-white">{dubbedVersions.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">Languages</span>
            </div>
            <p className="text-2xl font-semibold text-white">{TARGET_LANGUAGES.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Preview Scenes</span>
            </div>
            <p className="text-2xl font-semibold text-white">{preview.length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              >
                <option value="">Select target language</option>
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedScriptId || !targetLanguage || generating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Generate Dubbed Script
              </>
            )}
          </button>
        </div>

        {/* Existing Dubbed Versions */}
        {dubbedVersions.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Languages className="w-5 h-5 text-indigo-400" />
              Dubbed Versions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dubbedVersions.map((dub) => (
                <div
                  key={dub.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-white truncate max-w-[200px]">
                      {dub.title}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                        languageBadgeColor[dub.language] ||
                        'bg-slate-600/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {dub.language}
                    </span>
                    <p className="text-xs text-slate-500">
                      {new Date(dub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <FileText className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side-by-Side Preview */}
        {preview.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-indigo-400" />
              Translation Preview
            </h2>
            <div className="space-y-3">
              {preview.map((scene, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded">
                      Scene {scene.sceneNumber}
                    </span>
                    {scene.notes && (
                      <span className="text-slate-500 italic">
                        {scene.notes}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {scene.translatedDialogue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedScriptId && !loadingScripts && scripts.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No scripts found. Upload a script first.</p>
          </div>
        )}
      </div>
    </div>
  )
}
