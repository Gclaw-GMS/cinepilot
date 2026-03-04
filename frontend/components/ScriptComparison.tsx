'use client'

import { useState } from 'react'
import { ArrowRight, RefreshCw, FileText, GitCompare, AlertCircle, CheckCircle, Plus, Minus, Edit } from 'lucide-react'

interface SceneChange {
  sceneNumber: string
  headingRaw: string
  changeType: 'added' | 'removed' | 'modified'
  details?: string
}

interface CharacterChange {
  name: string
  changeType: 'added' | 'removed'
}

interface ComparisonResult {
  version1Title: string
  version2Title: string
  changes: {
    addedScenes: SceneChange[]
    removedScenes: SceneChange[]
    modifiedScenes: SceneChange[]
    addedCharacters: CharacterChange[]
    removedCharacters: CharacterChange[]
  }
  summary: {
    totalChanges: number
    scenesAdded: number
    scenesRemoved: number
    scenesModified: number
    charactersAdded: number
    charactersRemoved: number
  }
  sceneMapping?: { old: string; new: string }[]
  details: string
}

export default function ScriptComparison() {
  const [version1, setVersion1] = useState('')
  const [version2, setVersion2] = useState('')
  const [title1, setTitle1] = useState('Original Script')
  const [title2, setTitle2] = useState('Revised Script')
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!version1 || !version2) {
      setError('Please enter content for both versions')
      return
    }

    setComparing(true)
    setError(null)

    try {
      // Call the backend comparison API
      const response = await fetch('/api/scripts/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          version1, 
          version2,
          title1,
          title2
        })
      });
      
      if (!response.ok) {
        throw new Error('Comparison failed');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      // Fallback: simple local comparison if API fails
      console.warn('API comparison failed, using local fallback:', e);
      
      const scenes1 = (version1.match(/INT\.|EXT\./gi) || []).length;
      const scenes2 = (version2.match(/INT\.|EXT\./gi) || []).length;
      
      const chars1 = new Set(version1.match(/^[A-Z][A-Z\s]{1,20}(?=\s*\(|\s*$)/gm) || []);
      const chars2 = new Set(version2.match(/^[A-Z][A-Z\s]{1,20}(?=\s*\(|\s*$)/gm) || []);
      
      const addedChars = [...chars2].filter(c => !chars1.has(c));
      const removedChars = [...chars1].filter(c => !chars2.has(c));
      
      setResult({
        version1Title: title1,
        version2Title: title2,
        changes: {
          addedScenes: [],
          removedScenes: [],
          modifiedScenes: [],
          addedCharacters: addedChars.map(name => ({ name, changeType: 'added' as const })),
          removedCharacters: removedChars.map(name => ({ name, changeType: 'removed' as const }))
        },
        summary: {
          totalChanges: Math.max(0, scenes2 - scenes1) + Math.max(0, scenes1 - scenes2) + addedChars.length + removedChars.length,
          scenesAdded: Math.max(0, scenes2 - scenes1),
          scenesRemoved: Math.max(0, scenes1 - scenes2),
          scenesModified: 0,
          charactersAdded: addedChars.length,
          charactersRemoved: removedChars.length
        },
        details: `Scenes: ${scenes1} → ${scenes2}. Characters: ${chars1.size} → ${chars2.size}.`
      });
    } finally {
      setComparing(false);
    }
  }

  const loadSample = (sample: { v1: string; v2: string; label: string }) => {
    setVersion1(sample.v1);
    setVersion2(sample.v2);
    setTitle1('Version 1 (Original)');
    setTitle2('Version 2 (Revised)');
  }

  const samples = [
    {
      label: 'Sample: Added Scenes',
      v1: `INT. COFFEE SHOP - DAY
RAJI sits alone.

RAJI
Did he really mean it?`,
      v2: `INT. COFFEE SHOP - DAY
RAJI sits alone.

RAJI
Did he really mean it?

EXT. BEACH - SUNSET
RAJI walks along the shore.`
    },
    {
      label: 'Sample: Character Changes',
      v1: `INT. OFFICE - DAY
ARJUN works at his desk.
PRIYA enters.`,
      v2: `INT. OFFICE - DAY
ARJUN works at his desk.
PRIYA enters.
VIKRAM follows behind.`
    }
  ]

  const clearComparison = () => {
    setVersion1('');
    setVersion2('');
    setResult(null);
    setError(null);
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <GitCompare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Script Version Comparison</h3>
            <p className="text-sm text-slate-400">Compare two script versions to detect changes</p>
          </div>
        </div>
        {result && (
          <button
            onClick={clearComparison}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New Comparison
          </button>
        )}
      </div>

      {!result ? (
        <>
          {/* Sample Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-500">Try a sample:</span>
            {samples.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => loadSample(sample)}
                className="text-xs px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Version 1</label>
                <input
                  type="text"
                  value={title1}
                  onChange={(e) => setTitle1(e.target.value)}
                  placeholder="Version title..."
                  className="text-xs px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 w-40"
                />
              </div>
              <textarea
                value={version1}
                onChange={(e) => setVersion1(e.target.value)}
                placeholder="Paste original script version here...

Example:
INT. COFFEE SHOP - DAY
RAJI sits alone.
RAJI
Did he really mean it?"
                className="w-full h-56 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-mono text-slate-300 placeholder-slate-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Version 2</label>
                <input
                  type="text"
                  value={title2}
                  onChange={(e) => setTitle2(e.target.value)}
                  placeholder="Version title..."
                  className="text-xs px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 w-40"
                />
              </div>
              <textarea
                value={version2}
                onChange={(e) => setVersion2(e.target.value)}
                placeholder="Paste revised script version here...

Example:
INT. COFFEE SHOP - DAY
RAJI sits alone.
RAJI
Did he really mean it?

EXT. BEACH - SUNSET
RAJI walks along the shore."
                className="w-full h-56 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-mono text-slate-300 placeholder-slate-600"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleCompare}
              disabled={comparing || !version1 || !version2}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {comparing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Compare Versions
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* Results */
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-emerald-400">{result.summary.scenesAdded}</div>
              <div className="text-xs text-emerald-400/70 mt-1">Scenes Added</div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-red-400">{result.summary.scenesRemoved}</div>
              <div className="text-xs text-red-400/70 mt-1">Scenes Removed</div>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-amber-400">{result.summary.scenesModified}</div>
              <div className="text-xs text-amber-400/70 mt-1">Scenes Modified</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-blue-400">{result.summary.charactersAdded}</div>
              <div className="text-xs text-blue-400/70 mt-1">Characters Added</div>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-purple-400">{result.summary.charactersRemoved}</div>
              <div className="text-xs text-purple-400/70 mt-1">Characters Removed</div>
            </div>
          </div>

          {/* Overall Summary */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {result.summary.totalChanges > 0 ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              <span className="font-medium text-white">
                {result.summary.totalChanges === 0 ? 'No Changes Detected' : `${result.summary.totalChanges} Total Changes`}
              </span>
            </div>
            <p className="text-sm text-slate-400">{result.details}</p>
          </div>

          {/* Scene Changes */}
          {(result.changes.addedScenes.length > 0 || result.changes.removedScenes.length > 0 || result.changes.modifiedScenes.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Scene Changes</h4>
              <div className="space-y-2">
                {result.changes.addedScenes.map((scene, i) => (
                  <div key={`added-${i}`} className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Scene {scene.sceneNumber}</span>
                    <span className="text-xs text-slate-400 truncate">{scene.headingRaw}</span>
                  </div>
                ))}
                {result.changes.removedScenes.map((scene, i) => (
                  <div key={`removed-${i}`} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Minus className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Scene {scene.sceneNumber}</span>
                    <span className="text-xs text-slate-400 truncate">{scene.headingRaw}</span>
                  </div>
                ))}
                {result.changes.modifiedScenes.map((scene, i) => (
                  <div key={`modified-${i}`} className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Edit className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">Scene {scene.sceneNumber}</span>
                    <span className="text-xs text-slate-400 truncate">{scene.headingRaw}</span>
                    {scene.details && <span className="text-xs text-amber-400/70">({scene.details})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Changes */}
          {(result.changes.addedCharacters.length > 0 || result.changes.removedCharacters.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Character Changes</h4>
              <div className="flex flex-wrap gap-2">
                {result.changes.addedCharacters.map((char, i) => (
                  <span key={`added-${i}`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                    <Plus className="w-3 h-3" />
                    {char.name}
                  </span>
                ))}
                {result.changes.removedCharacters.map((char, i) => (
                  <span key={`removed-${i}`} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    <Minus className="w-3 h-3" />
                    {char.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No Changes State */}
          {result.summary.totalChanges === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">Scripts are identical!</p>
              <p className="text-sm text-slate-500">No scene or character changes detected between versions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
