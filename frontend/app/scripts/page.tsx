'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AlertCircle, Upload, FileText, Search, Filter, Download, Trash2, Eye, Play, CheckCircle, XCircle, Clock, Zap, RefreshCw, Keyboard, ChevronDown } from 'lucide-react'
import ScriptComparison from '@/components/ScriptComparison'

interface ScriptData {
  id: string
  title: string
  fileSize: number | null
  mimeType: string | null
  version: number
  createdAt: string
  scenes: SceneData[]
  scriptVersions: { id: string; versionNumber: number; extractionScore: number | null }[]
  isDemo?: boolean
}

// Demo fallback data for scripts page
const DEMO_SCRIPT_DATA = {
  scripts: [
    {
      id: 'demo-script-1',
      title: 'Kaathal - The Core (Final Draft)',
      fileSize: null,
      mimeType: null,
      version: 3,
      createdAt: '2025-12-15T00:00:00.000Z',
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: '1',
          sceneIndex: 0,
          headingRaw: 'INT. COURTROOM - DAY',
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: 'COURTROOM',
          startLine: 1,
          endLine: 10,
          confidence: 0.95,
          sceneCharacters: [
            { character: { id: 'char-1', name: 'JUDGE', aliases: [] } },
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
          ],
          sceneLocations: [{ name: 'COURTROOM', details: 'A high court in Chennai' }],
          sceneProps: [],
          vfxNotes: [],
          warnings: [],
        },
        {
          id: 'scene-2',
          sceneNumber: '2',
          sceneIndex: 1,
          headingRaw: 'EXT. TEMPLE - NIGHT',
          intExt: 'EXT',
          timeOfDay: 'NIGHT',
          location: 'KAPALEESHWARAR TEMPLE',
          startLine: 11,
          endLine: 20,
          confidence: 0.92,
          sceneCharacters: [
            { character: { id: 'char-3', name: 'DIVYA', aliases: [] } },
          ],
          sceneLocations: [{ name: 'KAPALEESHWARAR TEMPLE', details: 'Mylapore, Chennai' }],
          sceneProps: [{ prop: { name: 'DIYA' } }],
          vfxNotes: [],
          warnings: [{ warningType: 'VFX', description: 'Night shooting requires permits', severity: 'medium' }],
        },
        {
          id: 'scene-3',
          sceneNumber: '3',
          sceneIndex: 2,
          headingRaw: "INT. RAVI'S HOUSE - DAY",
          intExt: 'INT',
          timeOfDay: 'DAY',
          location: "RAVI'S HOUSE",
          startLine: 21,
          endLine: 30,
          confidence: 0.98,
          sceneCharacters: [
            { character: { id: 'char-2', name: 'RAVI', aliases: [] } },
            { character: { id: 'char-4', name: 'SARATH', aliases: [] } },
          ],
          sceneLocations: [{ name: "RAVI'S HOUSE", details: 'A modest apartment in Adyar' }],
          sceneProps: [{ prop: { name: 'PHOTOGRAPH' } }, { prop: { name: 'COFFEE CUP' } }],
          vfxNotes: [],
          warnings: [],
        },
      ],
      scriptVersions: [{ id: 'v1', versionNumber: 3, extractionScore: 0.94 }],
      isDemo: true,
    },
    {
      id: 'demo-script-2',
      title: 'Kaathal - Scene Extensions',
      fileSize: null,
      mimeType: null,
      version: 1,
      createdAt: '2026-01-05T00:00:00.000Z',
      scenes: [],
      scriptVersions: [{ id: 'v2', versionNumber: 1, extractionScore: 0.88 }],
      isDemo: true,
    },
  ] as ScriptData[],
  characters: [
    { id: 'char-1', name: 'JUDGE', aliases: [], roleHint: 'Honorable Judge', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }] },
    { id: 'char-2', name: 'RAVI', aliases: ['Ravi Kumar'], roleHint: 'Protagonist', sceneCharacters: [{ sceneId: 'scene-1', isSpeaking: true }, { sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-3', name: 'DIVYA', aliases: [], roleHint: 'Female Lead', sceneCharacters: [{ sceneId: 'scene-2', isSpeaking: true }] },
    { id: 'char-4', name: 'SARATH', aliases: [], roleHint: 'Antagonist', sceneCharacters: [{ sceneId: 'scene-3', isSpeaking: true }] },
    { id: 'char-5', name: 'KANMANI', aliases: ['Kani'], roleHint: 'Comic Relief', sceneCharacters: [] },
  ] as CharacterData[],
  analyses: [
    {
      id: 'analysis-1',
      analysisType: 'breakdown_summary',
      result: {
        totalScenes: 3,
        intScenes: 2,
        extScenes: 1,
        dayScenes: 2,
        nightScenes: 1,
        locations: ['COURTROOM', 'KAPALEESHWARAR TEMPLE', "RAVI'S HOUSE"],
        characters: ['JUDGE', 'RAVI', 'DIVYA', 'SARATH'],
        props: ['DIYA', 'PHOTOGRAPH', 'COFFEE CUP'],
      },
      modelUsed: 'gpt-4',
      createdAt: '2025-12-20T00:00:00.000Z',
    },
  ] as AnalysisData[],
}

interface SceneData {
  id: string
  sceneNumber: string
  sceneIndex: number
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  startLine: number | null
  endLine: number | null
  confidence: number
  sceneCharacters: { character: { id: string; name: string; aliases: string[] } }[]
  sceneLocations: { name: string; details: string | null }[]
  sceneProps: { prop: { name: string } }[]
  vfxNotes: { description: string; vfxType: string }[]
  warnings: { warningType: string; description: string; severity: string }[]
}

interface CharacterData {
  id: string
  name: string
  aliases: string[]
  roleHint: string | null
  sceneCharacters: { sceneId: string; isSpeaking: boolean }[]
}

interface AnalysisData {
  id: string
  analysisType: string
  result: any
  modelUsed: string | null
  createdAt: string
}

type ActiveTab = 'upload' | 'scenes' | 'characters' | 'quality' | 'warnings' | 'compare'

export default function ScriptsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [scripts, setScripts] = useState<ScriptData[]>([])
  const [characters, setCharacters] = useState<CharacterData[]>([])
  const [analyses, setAnalyses] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)

  const [sceneFilter, setSceneFilter] = useState('')
  const [intExtFilter, setIntExtFilter] = useState<string>('all')
  const [selectedScene, setSelectedScene] = useState<SceneData | null>(null)
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => Promise<void>>()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
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
          setShowExportMenu(false)
          setSceneFilter('')
          setIntExtFilter('all')
          break
        case '1':
          e.preventDefault()
          setActiveTab('upload')
          break
        case '2':
          e.preventDefault()
          setActiveTab('scenes')
          break
        case '3':
          e.preventDefault()
          setActiveTab('characters')
          break
        case '4':
          e.preventDefault()
          setActiveTab('quality')
          break
        case '5':
          e.preventDefault()
          setActiveTab('warnings')
          break
        case '6':
          e.preventDefault()
          setActiveTab('compare')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      
      // Handle demo mode from API
      if (data.demoData) {
        setScripts(data.demoData.scripts || [])
        setCharacters(data.demoData.characters || [])
        setAnalyses(data.demoData.analyses || [])
        setIsDemoMode(true)
      } else if (data.scripts) {
        setScripts(data.scripts)
        setCharacters(data.characters || [])
        setAnalyses(data.analyses || [])
        setIsDemoMode(data.scripts.some((s: ScriptData) => s.isDemo))
      } else if (Array.isArray(data)) {
        setScripts(data)
      }
    } catch (e) {
      console.error('Fetch scripts error:', e)
      // Use demo fallback
      setScripts(DEMO_SCRIPT_DATA.scripts)
      setCharacters(DEMO_SCRIPT_DATA.characters)
      setAnalyses(DEMO_SCRIPT_DATA.analyses)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Store fetchData in ref for keyboard shortcuts
  fetchDataRef.current = fetchData

  useEffect(() => { fetchData() }, [fetchData])

  // Export functions
  const exportToCSV = () => {
    if (!activeScript) return
    setExporting(true)
    
    const rows = [['Scene', 'Type', 'Time', 'Location', 'Characters', 'Props', 'VFX Notes', 'Warnings']]
    scenes.forEach(scene => {
      rows.push([
        scene.sceneNumber,
        scene.intExt || '',
        scene.timeOfDay || '',
        scene.location || '',
        scene.sceneCharacters.map(c => c.character.name).join('; '),
        scene.sceneProps.map(p => p.prop.name).join('; '),
        scene.vfxNotes.map(v => v.description).join('; '),
        scene.warnings.map(w => w.description).join('; ')
      ])
    })

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scripts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  const exportToJSON = () => {
    if (!activeScript) return
    setExporting(true)

    const exportData = {
      exportDate: new Date().toISOString(),
      script: {
        id: activeScript.id,
        title: activeScript.title,
        version: activeScript.version,
        createdAt: activeScript.createdAt,
      },
      summary: {
        totalScenes: scenes.length,
        intScenes: scenes.filter(s => s.intExt === 'INT').length,
        extScenes: scenes.filter(s => s.intExt === 'EXT').length,
        dayScenes: scenes.filter(s => s.timeOfDay === 'DAY').length,
        nightScenes: scenes.filter(s => s.timeOfDay === 'NIGHT').length,
        totalCharacters: characters.length,
        totalWarnings: allWarnings.length,
        totalVfxNotes: allVfx.length,
      },
      scenes: scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        heading: scene.headingRaw,
        intExt: scene.intExt,
        timeOfDay: scene.timeOfDay,
        location: scene.location,
        confidence: scene.confidence,
        characters: scene.sceneCharacters.map(c => c.character.name),
        locations: scene.sceneLocations.map(l => ({ name: l.name, details: l.details })),
        props: scene.sceneProps.map(p => p.prop.name),
        vfxNotes: scene.vfxNotes,
        warnings: scene.warnings,
      })),
      characters: characters.map(c => ({
        name: c.name,
        aliases: c.aliases,
        roleHint: c.roleHint,
        scenesAppeared: c.sceneCharacters.length,
      })),
      warnings: allWarnings,
      vfxNotes: allVfx,
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scripts-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    setExporting(false)
  }

  const activeScript = scripts[0]
  const scenes = activeScript?.scenes || []
  const qualityAnalysis = analyses.find(a => a.analysisType === 'quality_score')
  const summaryAnalysis = analyses.find(a => a.analysisType === 'breakdown_summary')
  const allWarnings = scenes.flatMap(s => s.warnings.map(w => ({ ...w, sceneNumber: s.sceneNumber })))
  const allVfx = scenes.flatMap(s => s.vfxNotes.map(v => ({ ...v, sceneNumber: s.sceneNumber })))

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleFileUpload(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadProgress('Uploading script...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setUploadProgress('Processing script (extraction + AI analysis)...')
      const res = await fetch('/api/scripts', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setUploadProgress(`Done! ${data.sceneCount || 0} scenes detected.`)
      await fetchData()
      setActiveTab('scenes')
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const runQualityAnalysis = async () => {
    if (!activeScript) {
      setError('No script available to analyze')
      return
    }
    setRunningAnalysis(true)
    setAnalysisProgress('Running quality analysis...')
    setError(null)

    try {
      const res = await fetch('/api/scripts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: activeScript.id })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysisProgress('Quality analysis complete!')
      await fetchData()
      setActiveTab('quality')
    } catch (e: any) {
      setError(e.message || 'Quality analysis failed')
    } finally {
      setRunningAnalysis(false)
      setTimeout(() => setAnalysisProgress(''), 3000)
    }
  }

  const filteredScenes = scenes.filter(s => {
    const matchesSearch = !sceneFilter ||
      s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
    const matchesIntExt = intExtFilter === 'all' || s.intExt === intExtFilter
    return matchesSearch && matchesIntExt
  })

  const tabs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'scenes', label: 'Scenes', count: scenes.length },
    { key: 'characters', label: 'Characters', count: characters.length },
    { key: 'quality', label: 'Quality' },
    { key: 'warnings', label: 'Warnings', count: allWarnings.length },
    { key: 'compare', label: 'Compare' },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading scripts...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-200">
            Demo mode active. Upload a script to analyze your own content.
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Script Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeScript
              ? `${activeScript.title} (v${activeScript.version}) — ${scenes.length} scenes`
              : 'Upload and analyze your screenplay'}
          </p>
        </div>
        {activeScript && (
          <div className="flex gap-2 items-center">
            <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded">
              Analyzed
            </span>
            {activeScript.scriptVersions[0]?.extractionScore && (
              <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                Quality: {activeScript.scriptVersions[0].extractionScore}/100
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => fetchData()}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
            title="Refresh (R)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeScript && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-2 bg-cinepilot-accent hover:bg-cinepilot-accent/80 text-gray-900 rounded-lg flex items-center gap-2 text-sm font-medium"
                title="Export (E)"
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 text-sm">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.key
                ? 'bg-cinepilot-card text-cinepilot-accent border border-b-0 border-cinepilot-border'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Upload Script</h2>
            <label
              className={`block cursor-pointer ${dragActive ? 'scale-[1.01]' : ''} transition-transform`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                dragActive
                  ? 'border-cinepilot-accent bg-cinepilot-accent/10'
                  : 'border-gray-700 hover:border-cinepilot-accent'
              }`}>
                {uploading ? (
                  <div className="space-y-3">
                    <div className="w-8 h-8 border-2 border-cinepilot-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-gray-300">{uploadProgress}</div>
                    <div className="text-gray-500 text-xs">This may take a minute for AI analysis</div>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl mb-3 opacity-50">+</div>
                    <div className="text-gray-300 font-medium">Drop script here or click to upload</div>
                    <div className="text-gray-500 text-sm mt-2">PDF, DOCX, FDX, TXT supported (max 10MB)</div>
                    <div className="text-gray-600 text-xs mt-3">
                      AI will automatically extract text, detect scenes, characters, locations, props, VFX notes, and safety warnings.
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.fdx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <div className="mt-4 flex gap-2">
              {['PDF', 'DOCX', 'FDX', 'TXT'].map(fmt => (
                <span key={fmt} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">{fmt}</span>
              ))}
            </div>
          </div>

          {/* Summary Cards (if data exists) */}
          {summaryAnalysis?.result && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Breakdown Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Scenes" value={summaryAnalysis.result.total_scenes} />
                <StatCard label="Characters" value={summaryAnalysis.result.unique_characters} />
                <StatCard label="Locations" value={summaryAnalysis.result.unique_locations} />
                <StatCard label="VFX Shots" value={summaryAnalysis.result.vfx_count} />
                <StatCard label="Safety Warnings" value={summaryAnalysis.result.safety_warnings_count} />
                {summaryAnalysis.result.estimated_shoot_days && (
                  <StatCard label="Est. Shoot Days" value={summaryAnalysis.result.estimated_shoot_days} />
                )}
              </div>
              {summaryAnalysis.result.summary && (
                <p className="mt-4 text-sm text-gray-400">{summaryAnalysis.result.summary}</p>
              )}
              {summaryAnalysis.result.cultural_notes?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-blue-400 mb-2">Cultural Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {summaryAnalysis.result.cultural_notes.map((n: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scenes Tab */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search scenes... (/)"
              value={sceneFilter}
              onChange={e => setSceneFilter(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-cinepilot-accent focus:outline-none"
            />
            <select
              value={intExtFilter}
              onChange={e => setIntExtFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none"
            >
              <option value="all">All</option>
              <option value="INT">INT</option>
              <option value="EXT">EXT</option>
              <option value="INT/EXT">INT/EXT</option>
            </select>
          </div>

          {filteredScenes.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              {scenes.length === 0 ? 'No scenes yet. Upload a script first.' : 'No scenes match your filter.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScenes.map(scene => (
                <div
                  key={scene.id}
                  onClick={() => setSelectedScene(selectedScene?.id === scene.id ? null : scene)}
                  className={`bg-cinepilot-card border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedScene?.id === scene.id
                      ? 'border-cinepilot-accent'
                      : 'border-cinepilot-border hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">{scene.sceneNumber}</span>
                        {scene.intExt && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            scene.intExt === 'INT' ? 'bg-blue-900/40 text-blue-400' :
                            scene.intExt === 'EXT' ? 'bg-amber-900/40 text-amber-400' :
                            'bg-purple-900/40 text-purple-400'
                          }`}>{scene.intExt}</span>
                        )}
                        {scene.timeOfDay && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            scene.timeOfDay === 'NIGHT' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-yellow-900/40 text-yellow-400'
                          }`}>{scene.timeOfDay}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">{scene.headingRaw || scene.location || 'Untitled Scene'}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {scene.sceneCharacters.length > 0 && (
                        <span>{scene.sceneCharacters.length} chars</span>
                      )}
                      {scene.sceneProps.length > 0 && (
                        <span>{scene.sceneProps.length} props</span>
                      )}
                      {scene.startLine && scene.endLine && (
                        <span>L{scene.startLine}-{scene.endLine}</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded scene detail */}
                  {selectedScene?.id === scene.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                      {scene.sceneCharacters.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Characters</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneCharacters.map(sc => (
                              <span key={sc.character.id} className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                                {sc.character.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.sceneLocations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Locations</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneLocations.map((loc, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                                {loc.name}{loc.details ? ` (${loc.details})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.sceneProps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Props</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {scene.sceneProps.map(sp => (
                              <span key={sp.prop.name} className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 rounded">{sp.prop.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {scene.vfxNotes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">VFX Notes</h4>
                          {scene.vfxNotes.map((v, i) => (
                            <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded ${v.vfxType === 'explicit' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{v.vfxType}</span>
                              {v.description}
                            </div>
                          ))}
                        </div>
                      )}
                      {scene.warnings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-red-400 mb-1.5">Warnings</h4>
                          {scene.warnings.map((w, i) => (
                            <div key={i} className="text-xs text-red-300 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                w.severity === 'high' ? 'bg-red-500' : w.severity === 'med' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                              {w.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          {characters.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No characters extracted yet. Upload a script first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map(char => (
                <div key={char.id} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-200">{char.name}</h3>
                      {char.roleHint && <span className="text-xs text-gray-500">{char.roleHint}</span>}
                    </div>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {char.sceneCharacters.length} scenes
                    </span>
                  </div>
                  {char.aliases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {char.aliases.map((alias, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded">{alias}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {/* Run Analysis Button */}
          {activeScript && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-200">AI Quality Analysis</h3>
                <p className="text-sm text-gray-500">Analyze screenplay structure, formatting, and dialogue quality</p>
              </div>
              <button
                onClick={runQualityAnalysis}
                disabled={runningAnalysis}
                className="px-4 py-2 bg-cinepilot-accent hover:bg-cinepilot-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {runningAnalysis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          )}
          {analysisProgress && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-green-400 text-sm">
              {analysisProgress}
            </div>
          )}
          {qualityAnalysis?.result ? (
            <>
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                <h2 className="font-semibold mb-4">Screenplay Quality Scores</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(qualityAnalysis.result.scores || {}).map(([key, val]) => (
                    <QualityGauge key={key} label={key} score={val as number} />
                  ))}
                </div>
              </div>
              {qualityAnalysis.result.notes?.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h3 className="font-medium mb-3 text-gray-300">Notes</h3>
                  <ul className="space-y-1.5">
                    {qualityAnalysis.result.notes.map((n: string, i: number) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-gray-600 mt-0.5">-</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {qualityAnalysis.result.quick_fixes?.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h3 className="font-medium mb-3 text-yellow-400">Quick Fixes</h3>
                  <ul className="space-y-1.5">
                    {qualityAnalysis.result.quick_fixes.map((f: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-300/80 flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">!</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center">
              {activeScript ? (
                <div className="space-y-2">
                  <p className="text-gray-400">No quality analysis yet.</p>
                  <p className="text-sm text-gray-500">Click "Run Analysis" above to analyze your screenplay.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">No script uploaded yet.</p>
                  <p className="text-sm text-gray-500">Upload a script first, then run quality analysis.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warnings Tab */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          {allWarnings.length === 0 && allVfx.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No warnings detected.
            </div>
          ) : (
            <>
              {allWarnings.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-red-400">Safety & Content Warnings</h2>
                  <div className="space-y-2">
                    {allWarnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          w.severity === 'high' ? 'bg-red-500' : w.severity === 'med' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">Scene {w.sceneNumber}</span>
                        <span className="text-sm text-gray-300 flex-1">{w.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          w.severity === 'high' ? 'bg-red-900/40 text-red-400' :
                          w.severity === 'med' ? 'bg-yellow-900/40 text-yellow-400' :
                          'bg-gray-800 text-gray-500'
                        }`}>{w.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {allVfx.length > 0 && (
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-purple-400">VFX Notes</h2>
                  <div className="space-y-2">
                    {allVfx.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          v.vfxType === 'explicit' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                        }`}>{v.vfxType}</span>
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">Scene {v.sceneNumber}</span>
                        <span className="text-sm text-gray-300 flex-1">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && <ScriptComparison />}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { key: 'R', action: 'Refresh scripts' },
                { key: 'E', action: 'Export menu' },
                { key: '/', action: 'Focus search' },
                { key: '1', action: 'Upload tab' },
                { key: '2', action: 'Scenes tab' },
                { key: '3', action: 'Characters tab' },
                { key: '4', action: 'Quality tab' },
                { key: '5', action: 'Warnings tab' },
                { key: '6', action: 'Compare tab' },
                { key: '?', action: 'Show this help' },
                { key: 'Esc', action: 'Close modal / Clear filters' },
              ].map(({ key, action }) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400">{action}</span>
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-mono">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-cinepilot-accent">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function QualityGauge({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? 'text-green-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-orange-400' :
    'text-red-400'

  const bgColor =
    score >= 80 ? 'bg-green-400' :
    score >= 60 ? 'bg-yellow-400' :
    score >= 40 ? 'bg-orange-400' :
    'bg-red-400'

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
        <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-2 capitalize">{label.replace(/_/g, ' ')}</div>
    </div>
  )
}
