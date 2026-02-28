'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useScriptManager, Script, Scene, Character, Analysis } from '@/app/hooks/useScriptManager'
import ScriptComparison from '@/components/ScriptComparison'
import {
  FileText, Upload, Trash2, Check, AlertTriangle, Sparkles,
  Users, RefreshCw, X, Search, ChevronDown, ChevronRight
} from 'lucide-react'

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
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {activeScript
              ? `${activeScript.title} (v${activeScript.version}) — ${scenes.length} scenes • ${characters.length} characters`
              : 'Upload and analyze your screenplay'}
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
                  </div>
                ) : (
                  <>
                    <div className="text-5xl mb-3 opacity-50">+</div>
                    <div className="text-gray-300 font-medium">Drop script here or click to upload</div>
                    <div className="text-gray-500 text-sm mt-2">PDF, DOCX, TXT, FDX supported (max 10MB)</div>
                    <div className="text-gray-600 text-xs mt-3">
                      AI will automatically extract scenes, detect characters, locations, and analyze.
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.fdx"
                onChange={handleFileChange}
                className="hidden"
                disabled={processing}
              />
            </label>
            <div className="mt-4 flex gap-2">
              {['PDF', 'DOCX', 'TXT', 'FDX'].map(fmt => (
                <span key={fmt} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">{fmt}</span>
              ))}
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
