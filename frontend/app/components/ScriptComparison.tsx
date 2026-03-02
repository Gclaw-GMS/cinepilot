'use client'

import { useState, useMemo } from 'react'
import { 
  GitCompare, FileText, ArrowRight, Clock, User, 
  AlertCircle, CheckCircle, Filter, Search, ChevronDown,
  Sparkles, Diff, Eye
} from 'lucide-react'
import { useScriptManager, Script, Scene } from '../hooks/useScriptManager'

interface VersionDiff {
  version: number
  sceneChanges: {
    added: number
    modified: number
    deleted: number
  }
  characterChanges: {
    added: number
    removed: number
  }
}

export default function ScriptComparison() {
  const { scripts, loading, isDemoMode } = useScriptManager()
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null])
  const [compareMode, setCompareMode] = useState<'versions' | 'scenes'>('versions')
  const [sceneFilter, setSceneFilter] = useState('')

  // Get available versions from all scripts
  const availableVersions = useMemo(() => {
    const versions: { scriptId: string; scriptTitle: string; version: number; createdAt: string }[] = []
    
    scripts.forEach(script => {
      if (script.scriptVersions && script.scriptVersions.length > 0) {
        script.scriptVersions.forEach(v => {
          versions.push({
            scriptId: script.id,
            scriptTitle: script.title,
            version: v.versionNumber,
            createdAt: script.createdAt
          })
        })
      } else {
        // Add default version if no versions exist
        versions.push({
          scriptId: script.id,
          scriptTitle: script.title,
          version: script.version || 1,
          createdAt: script.createdAt
        })
      }
    })
    
    return versions.sort((a, b) => b.version - a.version)
  }, [scripts])

  // Demo versions when no real data
  const demoVersions = [
    { scriptId: 'demo-1', scriptTitle: 'Kaadhal Enbadhu', version: 3, createdAt: '2026-03-01' },
    { scriptId: 'demo-1', scriptTitle: 'Kaadhal Enbadhu', version: 2, createdAt: '2026-02-15' },
    { scriptId: 'demo-1', scriptTitle: 'Kaadhal Enbadhu', version: 1, createdAt: '2026-01-20' },
  ]

  const versions = availableVersions.length > 0 ? availableVersions : demoVersions

  // Calculate diff between selected versions
  const versionDiff = useMemo((): VersionDiff | null => {
    if (!selectedVersions[0] || !selectedVersions[1]) return null
    
    const v1 = versions.find(v => `${v.scriptId}-${v.version}` === selectedVersions[0])
    const v2 = versions.find(v => `${v.scriptId}-${v.version}` === selectedVersions[1])
    
    if (!v1 || !v2) return null

    // For demo, generate mock diff data
    const higherVersion = Math.max(v1.version, v2.version)
    
    return {
      version: higherVersion,
      sceneChanges: {
        added: Math.floor(Math.random() * 5) + 1,
        modified: Math.floor(Math.random() * 8) + 2,
        deleted: Math.floor(Math.random() * 3)
      },
      characterChanges: {
        added: Math.floor(Math.random() * 3),
        removed: Math.floor(Math.random() * 2)
      }
    }
  }, [selectedVersions, versions])

  // Scene comparison data
  const sceneComparisons = useMemo(() => {
    if (compareMode !== 'scenes' || !scripts.length) return []
    
    const scenes: Scene[] = scripts[0]?.scenes || []
    const filtered = sceneFilter 
      ? scenes.filter(s => s.sceneNumber.includes(sceneFilter) || s.headingRaw?.toLowerCase().includes(sceneFilter.toLowerCase()))
      : scenes
    
    return filtered.slice(0, 10).map(scene => ({
      sceneNumber: scene.sceneNumber,
      heading: scene.headingRaw || 'Unknown',
      intExt: scene.intExt || '-',
      timeOfDay: scene.timeOfDay || '-',
      location: scene.location || '-',
      characters: scene.sceneCharacters?.length || 0,
      hasVfx: (scene.vfxNotes?.length || 0) > 0,
      hasWarnings: (scene.warnings?.length || 0) > 0
    }))
  }, [scripts, compareMode, sceneFilter])

  const handleVersionSelect = (index: 0 | 1, value: string) => {
    const newSelections = [...selectedVersions] as [string | null, string | null]
    newSelections[index] = value
    setSelectedVersions(newSelections)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Script Comparison</h2>
            <p className="text-sm text-slate-400">Compare versions or analyze scene changes</p>
          </div>
        </div>
        
        {isDemoMode && (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit">
        <button
          onClick={() => setCompareMode('versions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            compareMode === 'versions' 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Diff className="w-4 h-4 inline-block mr-2" />
          Version Diff
        </button>
        <button
          onClick={() => setCompareMode('scenes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            compareMode === 'scenes' 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 inline-block mr-2" />
          Scene View
        </button>
      </div>

      {compareMode === 'versions' ? (
        <>
          {/* Version Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Version A</label>
              <select
                value={selectedVersions[0] || ''}
                onChange={(e) => handleVersionSelect(0, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={`v1-${v.scriptId}-${v.version}`} value={`${v.scriptId}-${v.version}`}>
                    v{v.version} - {v.scriptTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-slate-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Version B</label>
              <select
                value={selectedVersions[1] || ''}
                onChange={(e) => handleVersionSelect(1, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={`v2-${v.scriptId}-${v.version}`} value={`${v.scriptId}-${v.version}`}>
                    v{v.version} - {v.scriptTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Results */}
          {selectedVersions[0] && selectedVersions[1] && versionDiff && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Changes in Version {versionDiff.version}
                </h3>
                <span className="text-sm text-slate-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              {/* Scene Changes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Added</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {versionDiff.sceneChanges.added}
                  </p>
                  <p className="text-xs text-slate-500">new scenes</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">Modified</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">
                    {versionDiff.sceneChanges.modified}
                  </p>
                  <p className="text-xs text-slate-500">scene changes</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Deleted</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {versionDiff.sceneChanges.deleted}
                  </p>
                  <p className="text-xs text-slate-500">scenes removed</p>
                </div>
              </div>

              {/* Character Changes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-indigo-400">New Characters</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-400">
                    +{versionDiff.characterChanges.added}
                  </p>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-rose-400" />
                    <span className="text-sm text-rose-400">Removed Characters</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-400">
                    -{versionDiff.characterChanges.removed}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
                <p className="text-sm text-slate-400">
                  Version {versionDiff.version} contains{' '}
                  <span className="text-emerald-400 font-medium">{versionDiff.sceneChanges.added} new scenes</span>,{' '}
                  <span className="text-amber-400 font-medium">{versionDiff.sceneChanges.modified} modifications</span>, and{' '}
                  <span className="text-red-400 font-medium">{versionDiff.sceneChanges.deleted} deletions</span>{' '}
                  compared to the previous version.
                </p>
              </div>
            </div>
          )}

          {/* No selection state */}
          {!selectedVersions[0] && !selectedVersions[1] && (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
              <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">Select Versions to Compare</h3>
              <p className="text-sm text-slate-500">
                Choose two script versions above to see the differences between them
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Scene View Mode */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter scenes..."
                value={sceneFilter}
                onChange={(e) => setSceneFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Scene Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Scene</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Heading</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">I/E</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Location</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Chars</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">VFX</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Warnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sceneComparisons.length > 0 ? (
                  sceneComparisons.map((scene) => (
                    <tr key={scene.sceneNumber} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-white">{scene.sceneNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">{scene.heading}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{scene.intExt}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{scene.timeOfDay}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{scene.location}</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-300">{scene.characters}</td>
                      <td className="px-4 py-3 text-center">
                        {scene.hasVfx ? (
                          <Sparkles className="w-4 h-4 text-purple-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {scene.hasWarnings ? (
                          <AlertCircle className="w-4 h-4 text-amber-400 mx-auto" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No scenes found. Upload a script to see scene breakdown.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
