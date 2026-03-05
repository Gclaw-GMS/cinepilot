'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useScriptManager, Script, Scene, Character, Analysis } from '@/app/hooks/useScriptManager'
import ScriptComparison from '@/components/ScriptComparison'
import {
  FileText, Upload, Trash2, Check, AlertTriangle, Sparkles,
  Users, RefreshCw, X, Search, ChevronDown, ChevronRight,
  Film, Clock, AlertOctagon, TrendingUp, Keyboard, HelpCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'

type ActiveTab = 'upload' | 'scenes' | 'characters' | 'quality' | 'warnings' | 'compare'

export default function ScriptsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('scenes')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sceneFilter, setSceneFilter] = useState('')
  const [intExtFilter, setIntExtFilter] = useState<string>('all')
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [linkingCharacters, setLinkingCharacters] = useState(false)
  const [linkResult, setLinkResult] = useState<string | null>(null)

  // Use the hook
  const {
    scripts,
    characters,
    analyses,
    loading,
    isDemoMode,
    processing,
    processProgress,
    uploadScript,
    deleteScript,
    setActiveScript,
    resetToDemo,
  } = useScriptManager()

  const activeScript = scripts.find(s => s.isActive) || scripts[0]
  const scenes = activeScript?.scenes || []
  const qualityAnalysis = analyses.find(a => a.analysisType === 'quality_score')
  const summaryAnalysis = analyses.find(a => a.analysisType === 'breakdown_summary')
  const allWarnings = scenes.flatMap(s => s.warnings.map(w => ({ ...w, sceneNumber: s.sceneNumber, sceneId: s.id })))
  const allVfx = scenes.flatMap(s => s.vfxNotes.map(v => ({ ...v, sceneNumber: s.sceneNumber, sceneId: s.id })))

  // Filter scenes
  const filteredScenes = useMemo(() => {
    return scenes.filter(s => {
      const matchesSearch = !sceneFilter ||
        s.sceneNumber.toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.headingRaw || '').toLowerCase().includes(sceneFilter.toLowerCase()) ||
        (s.location || '').toLowerCase().includes(sceneFilter.toLowerCase())
      const matchesIntExt = intExtFilter === 'all' || s.intExt === intExtFilter
      return matchesSearch && matchesIntExt
    })
  }, [scenes, sceneFilter, intExtFilter])

  // Filter characters
  const filteredCharacters = useMemo(() => {
    if (!searchQuery) return characters
    const q = searchQuery.toLowerCase()
    return characters.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.aliases?.some(a => a.toLowerCase().includes(q))
    )
  }, [characters, searchQuery])

  // Chart data computed from scenes
  const chartData = useMemo(() => {
    // INT/EXT breakdown
    const intExtCount = scenes.reduce((acc, scene) => {
      const key = scene.intExt || 'UNKNOWN'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const intExtData = Object.entries(intExtCount).map(([name, value]) => ({
      name, value,
      color: name === 'INT' ? '#6366f1' : name === 'EXT' ? '#22c55e' : '#94a3b8'
    }))

    // Time of day breakdown
    const timeOfDayCount = scenes.reduce((acc, scene) => {
      const key = scene.timeOfDay || 'UNSPECIFIED'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const timeOfDayData = Object.entries(timeOfDayCount).map(([name, value]) => ({
      name: name.length > 10 ? name.slice(0, 10) + '...' : name, value
    }))

    // Character frequency (top 10)
    const charFrequency = characters.map(char => ({
      name: char.name.length > 12 ? char.name.slice(0, 12) + '...' : char.name,
      fullName: char.name,
      appearances: char.sceneCharacters?.length || 0
    })).sort((a, b) => b.appearances - a.appearances).slice(0, 10)

    // Location breakdown
    const locationCount = scenes.reduce((acc, scene) => {
      const loc = scene.location || 'Unknown'
      // Group similar locations
      const group = loc.toLowerCase().includes('house') ? 'House' :
                    loc.toLowerCase().includes('street') ? 'Street' :
                    loc.toLowerCase().includes('office') ? 'Office' :
                    loc.toLowerCase().includes('restaurant') ? 'Restaurant' :
                    loc.toLowerCase().includes('car') || loc.toLowerCase().includes('vehicle') ? 'Vehicle' :
                    loc.length > 15 ? 'Other' : loc
      acc[group] = (acc[group] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const locationData = Object.entries(locationCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    // Warnings by type
    const warningTypes = allWarnings.reduce((acc, w) => {
      const key = w.warningType || 'Other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const warningData = Object.entries(warningTypes).map(([name, value]) => ({
      name, value
    }))

    return { intExtData, timeOfDayData, charFrequency, locationData, warningData }
  }, [scenes, characters, allWarnings])

  // Stats for header
  const stats = useMemo(() => ({
    totalScenes: scenes.length,
    totalCharacters: characters.length,
    totalWarnings: allWarnings.length,
    totalVfx: allVfx.length,
    intScenes: scenes.filter(s => s.intExt === 'INT').length,
    extScenes: scenes.filter(s => s.intExt === 'EXT').length,
    dayScenes: scenes.filter(s => s.timeOfDay?.includes('DAY')).length,
    nightScenes: scenes.filter(s => s.timeOfDay?.includes('NIGHT')).length,
  }), [scenes, characters, allWarnings, allVfx])

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
    setError(null)
    setSuccess(null)

    // Enhanced file validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['.pdf', '.docx', '.txt', '.fdx', '.fountain']
    const ALLOWED_MIME = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/x-fountain'
    ]
    
    // Check file extension
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!ALLOWED_TYPES.includes(fileExt)) {
      setError(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
      return
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
      return
    }
    
    // Check for empty file
    if (file.size === 0) {
      setError('File is empty. Please upload a valid script file.')
      return
    }

    const result = await uploadScript(file)
    
    if (result.success) {
      setSuccess(`Successfully uploaded "${file.name}" with ${result.script?.scenes.length || 0} scenes!`)
      setActiveTab('scenes')
    } else {
      setError(result.error || 'Upload failed')
    }
  }

  const handleDeleteScript = (scriptId: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      deleteScript(scriptId)
      setSuccess('Script deleted')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      // Arrow keys for scene navigation
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        const currentIndex = filteredScenes.findIndex(s => s.id === selectedScene?.id)
        if (currentIndex < filteredScenes.length - 1) {
          setSelectedScene(filteredScenes[currentIndex + 1])
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        const currentIndex = filteredScenes.findIndex(s => s.id === selectedScene?.id)
        if (currentIndex > 0) {
          setSelectedScene(filteredScenes[currentIndex - 1])
        }
      } else if (e.key === 'Escape') {
        setSelectedScene(null)
      } else if (e.key === '1' && e.altKey) {
        setActiveTab('scenes')
      } else if (e.key === '2' && e.altKey) {
        setActiveTab('characters')
      } else if (e.key === '3' && e.altKey) {
        setActiveTab('warnings')
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault()
        document.getElementById('scene-search')?.focus()
      } else if (e.key === '?') {
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredScenes, selectedScene])
  
  // Export script data
  const handleExport = () => {
    if (!activeScript) return
    const data = JSON.stringify({
      script: activeScript,
      characters,
      analyses
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeScript.title}-export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Link characters to scenes using rule-based matching
  const handleLinkCharacters = async () => {
    setLinkingCharacters(true)
    setLinkResult(null)
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reextract' }),
      })
      const data = await res.json()
      if (data.error) {
        setLinkResult(data.error)
      } else {
        setLinkResult(data.message)
      }
    } catch (err) {
      setLinkResult('Failed to link characters')
    } finally {
      setLinkingCharacters(false)
    }
  }

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
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-400">Loading scripts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Script Management</h1>
            {isDemoMode && (
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                Demo Mode
              </span>
            )}
            {processing && (
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {processProgress}
              </span>
            )}
            {linkResult && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${linkResult.includes('complete') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {linkResult}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {activeScript
              ? `${activeScript.title} (v${activeScript.version}) — ${scenes.length} scenes • ${characters.length} characters`
              : 'Upload and analyze your screenplay'}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">↑↓</kbd> or <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">jk</kbd> navigate scenes • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Esc</kbd> close • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Ctrl+F</kbd> search • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Shift+?</kbd> help
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {scripts.length > 0 && (
            <select
              value={activeScript?.id || ''}
              onChange={e => setActiveScript(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.isActive ? '(active)' : ''}
                </option>
              ))}
            </select>
          )}
          
          {activeScript && (
            <button
              onClick={handleExport}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
              title="Export"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {activeScript && characters.length > 0 && (
            <button
              onClick={handleLinkCharacters}
              disabled={linkingCharacters}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
              title="Link characters to scenes"
            >
              <Users className="w-4 h-4" />
              {linkingCharacters ? 'Linking...' : 'Link Characters'}
            </button>
          )}
          
          {isDemoMode && (
            <button
              onClick={resetToDemo}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
              title="Reset to demo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-400 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6 text-green-400 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Navigate scenes down</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">↓ or J</div>
                <div className="text-gray-400">Navigate scenes up</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">↑ or K</div>
                <div className="text-gray-400">Close scene details</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Esc</div>
                <div className="text-gray-400">Search scenes</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Ctrl+F</div>
              </div>
              <div className="border-t border-gray-700 my-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Scenes tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Alt+1</div>
                <div className="text-gray-400">Characters tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Alt+2</div>
                <div className="text-gray-400">Warnings tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Alt+3</div>
              </div>
              <div className="border-t border-gray-700 my-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Show this help</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Shift+?</div>
                <div className="text-gray-400">Close/Escape</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Esc</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {scenes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Film className="w-4 h-4" />
              <span className="text-xs">Scenes</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalScenes}</p>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Characters</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCharacters}</p>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <AlertOctagon className="w-4 h-4" />
              <span className="text-xs">Warnings</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalWarnings}</p>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">INT</span>
            </div>
            <p className="text-2xl font-bold text-indigo-400">{stats.intScenes}</p>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">EXT</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.extScenes}</p>
          </div>
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Day/Night</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.dayScenes}/{stats.nightScenes}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-cinepilot-card text-indigo-400 border border-b-0 border-cinepilot-border'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
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
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload Script
              <span className="text-xs font-normal text-gray-500 ml-2">
                AI-powered scene detection
              </span>
            </h2>
            <label
              className={`block cursor-pointer ${dragActive ? 'scale-[1.01]' : ''} transition-transform`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 hover:border-indigo-500'
              }`}>
                {processing ? (
                  <div className="space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-gray-300 font-medium">{processProgress || 'Processing...'}</div>
                    <div className="text-gray-500 text-xs">Analyzing screenplay structure...</div>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl mb-3 opacity-50">+</div>
                    <div className="text-gray-300 font-medium">Drop script here or click to upload</div>
                    <div className="text-gray-500 text-sm mt-2">PDF, DOCX, TXT, FDX, Fountain supported (max 10MB)</div>
                    <div className="text-gray-600 text-xs mt-3 flex flex-col gap-1">
                      <span>• AI extracts scenes, characters, locations automatically</span>
                      <span>• Detects INT/EXT, time of day, VFX notes</span>
                      <span>• Generates quality scores and warnings</span>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.fdx,.fountain"
                onChange={handleFileChange}
                className="hidden"
                disabled={processing}
              />
            </label>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['PDF', 'DOCX', 'TXT', 'FDX', 'Fountain'].map(fmt => (
                <span key={fmt} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">{fmt}</span>
              ))}
              <span className="text-xs text-gray-500 ml-2 flex items-center">
                Max 10MB • Auto scene detection • Character extraction
              </span>
              <span className="px-2 py-1 bg-green-900/30 rounded text-xs text-green-400 ml-auto flex items-center gap-1">
                <Check className="w-3 h-3" />
                Local Storage
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          {summaryAnalysis?.result && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Breakdown Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Scenes" value={summaryAnalysis.result.totalScenes} />
                <StatCard label="Characters" value={summaryAnalysis.result.totalCharacters} />
                <StatCard label="Locations" value={summaryAnalysis.result.totalLocations} />
                <StatCard label="VFX Shots" value={summaryAnalysis.result.vfxShots} />
              </div>
            </div>
          )}

          {/* Script List */}
          {scripts.length > 0 && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Your Scripts</h2>
              <div className="space-y-2">
                {scripts.map(script => (
                  <div 
                    key={script.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      script.isActive 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-200">{script.title}</div>
                        <div className="text-xs text-gray-500">
                          {script.scenes.length} scenes • {new Date(script.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {script.isActive && (
                        <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">Active</span>
                      )}
                      <button
                        onClick={() => setActiveScript(script.id)}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                        title="Set active"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScript(script.id)}
                        className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenes Tab */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search scenes..."
                value={sceneFilter}
                onChange={e => setSceneFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={intExtFilter}
              onChange={e => setIntExtFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="INT">INT</option>
              <option value="EXT">EXT</option>
              <option value="INT/EXT">INT/EXT</option>
            </select>
            <span className="text-sm text-gray-500">
              {filteredScenes.length} of {scenes.length} scenes
            </span>
          </div>

          {/* Scene Charts */}
          {scenes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* INT/EXT Pie Chart */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Scene Types (INT/EXT)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.intExtData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartData.intExtData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#9ca3af' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time of Day Bar Chart */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Time of Day</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.timeOfDayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#9ca3af' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Location Distribution */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Top Locations</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.locationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={60} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#9ca3af' }}
                      />
                      <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {filteredScenes.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              {scenes.length === 0 ? (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No scenes yet. Upload a script first.</p>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
                  >
                    Upload Script
                  </button>
                </>
              ) : (
                'No scenes match your filter.'
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isSelected={selectedScene?.id === scene.id}
                  onClick={() => setSelectedScene(selectedScene?.id === scene.id ? null : scene)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-sm text-gray-500">
              {filteredCharacters.length} characters
            </span>
          </div>

          {/* Character Frequency Chart */}
          {characters.length > 0 && chartData.charFrequency.length > 0 && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Character Screen Time (Top 10)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.charFrequency} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#9ca3af' }}
                      formatter={(value, name, props) => [value + ' scenes', props.payload.fullName]}
                    />
                    <Bar dataKey="appearances" fill="#ec4899" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {filteredCharacters.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No characters found. Upload a script to extract characters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharacters.map(char => (
                <CharacterCard key={char.id} character={char} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {qualityAnalysis?.result ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
              <h2 className="font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Screenplay Quality Scores
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(qualityAnalysis.result).filter(([k]) => !['suggestions'].includes(k)).map(([key, val]) => (
                  typeof val === 'number' ? (
                    <QualityGauge key={key} label={key} score={val} />
                  ) : null
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No quality analysis yet. Upload a script to get quality scoring.</p>
            </div>
          )}
        </div>
      )}

      {/* Warnings Tab */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          {/* Warnings Chart */}
          {allWarnings.length > 0 && chartData.warningData.length > 0 && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Warnings by Type</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.warningData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {allWarnings.length === 0 && allVfx.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium text-gray-300">All Clear!</p>
              <p className="text-sm mt-1">No warnings or VFX notes detected in your script.</p>
            </div>
          ) : (
            <>
              {allWarnings.length > 0 && (
                <div className="bg-cinepilot-card border border-red-900/30 rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Safety & Content Warnings ({allWarnings.length})
                  </h2>
                  <div className="space-y-2">
                    {allWarnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          w.severity === 'high' ? 'bg-red-500' : w.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">Scene {w.sceneNumber}</span>
                        <span className="text-sm text-gray-300 flex-1">{w.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          w.severity === 'high' ? 'bg-red-900/40 text-red-400' :
                          w.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                          'bg-gray-800 text-gray-500'
                        }`}>{w.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {allVfx.length > 0 && (
                <div className="bg-cinepilot-card border border-purple-900/30 rounded-lg p-6">
                  <h2 className="font-semibold mb-4 text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    VFX Notes ({allVfx.length})
                  </h2>
                  <div className="space-y-2">
                    {allVfx.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          v.vfxType === 'crowd' ? 'bg-purple-900/30 text-purple-400' : 'bg-yellow-900/30 text-yellow-400'
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
    </div>
  )
}

// Sub-components

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-indigo-400">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function SceneCard({ 
  scene, 
  isSelected, 
  onClick 
}: { 
  scene: Scene
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-cinepilot-card border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
          : 'border-cinepilot-border hover:border-gray-600'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-300">
              Scene {scene.sceneNumber}
            </span>
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
          <div className="text-sm text-gray-300 mt-2 font-medium">
            {scene.headingRaw || scene.location || 'Untitled Scene'}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {scene.sceneCharacters.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {scene.sceneCharacters.length}
            </span>
          )}
          {scene.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {scene.warnings.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
          {scene.sceneCharacters.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Characters</h4>
              <div className="flex flex-wrap gap-1.5">
                {scene.sceneCharacters.map((sc, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                    {sc.character.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {scene.sceneLocations && scene.sceneLocations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Locations</h4>
              <div className="flex flex-wrap gap-1.5">
                {scene.sceneLocations.map((loc, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                    {loc.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {scene.sceneProps && scene.sceneProps.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Props</h4>
              <div className="flex flex-wrap gap-1.5">
                {scene.sceneProps.map((sp, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 rounded">
                    {sp.prop.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {scene.vfxNotes && scene.vfxNotes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-purple-400 mb-2">VFX Notes</h4>
              {scene.vfxNotes.map((v, i) => (
                <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">{v.vfxType}</span>
                  {v.description}
                </div>
              ))}
            </div>
          )}
          
          {scene.warnings && scene.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-400 mb-2">Warnings</h4>
              {scene.warnings.map((w, i) => (
                <div key={i} className="text-xs text-red-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    w.severity === 'high' ? 'bg-red-500' : w.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  {w.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-200">{character.name}</h3>
          {character.nameTamil && (
            <span className="text-xs text-gray-500">{character.nameTamil}</span>
          )}
        </div>
        {character.isMain && (
          <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Lead</span>
        )}
      </div>
      
      {character.description && (
        <p className="text-sm text-gray-400 mb-2">{character.description}</p>
      )}
      
      {character.actorName && (
        <div className="text-xs text-gray-500 mb-2">
          <span className="text-gray-600">Actor:</span> {character.actorName}
        </div>
      )}
      
      {character.aliases && character.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {character.aliases.map((alias, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded">{alias}</span>
          ))}
        </div>
      )}
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
