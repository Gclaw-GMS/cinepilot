"use client"
import { useState } from 'react'
import { aiEnhancedV2 } from '@/lib/api'

interface FormatAnalysis {
  format_type: string
  score: number
  issues: string[]
  warnings: string[]
  scene_headings_count: number
  estimated_pages: number
}

interface ComplexityResult {
  scene_analysis: any[]
  summary: {
    total_scenes: number
    avg_complexity: number
    high_complexity_count: number
    recommended_shoot_days: number
  }
}

interface FountainResult {
  format: string
  scenes_count: number
  characters: string[]
  metadata: any
}

export default function EnhancedAIDashboard() {
  const [script, setScript] = useState('')
  const [formatResult, setFormatResult] = useState<FormatAnalysis | null>(null)
  const [complexityResult, setComplexityResult] = useState<ComplexityResult | null>(null)
  const [fountainResult, setFountainResult] = useState<FountainResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'format' | 'complexity' | 'fountain'>('format')

  const analyzeFormat = async () => {
    if (!script.trim()) return
    setLoading(true)
    try {
      const result = await aiEnhancedV2.analyzeScreenplayFormat(script) as FormatAnalysis
      setFormatResult(result)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const analyzeComplexity = async () => {
    if (!script.trim()) return
    setLoading(true)
    try {
      const result = await aiEnhancedV2.analyzeSceneComplexity(script) as ComplexityResult
      setComplexityResult(result)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const parseFountain = async () => {
    if (!script.trim()) return
    setLoading(true)
    try {
      const result = await aiEnhancedV2.parseFountain(script) as FountainResult
      setFountainResult(result)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const runAnalysis = () => {
    if (activeTab === 'format') analyzeFormat()
    else if (activeTab === 'complexity') analyzeComplexity()
    else parseFountain()
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🎬 Enhanced AI Analysis V2</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['format', 'complexity', 'fountain'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab 
                ? 'bg-blue-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {tab === 'format' && '📝 Format'}
            {tab === 'complexity' && '🎯 Complexity'}
            {tab === 'fountain' && '📜 Fountain'}
          </button>
        ))}
      </div>

      {/* Script Input */}
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Paste your screenplay script here..."
        className="w-full h-48 bg-gray-800 border border-gray-700 rounded p-3 text-sm font-mono mb-4"
      />

      <button
        onClick={runAnalysis}
        disabled={loading || !script.trim()}
        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
      >
        {loading ? '⏳ Analyzing...' : '🔍 Run Analysis'}
      </button>

      {/* Results */}
      {formatResult && activeTab === 'format' && (
        <div className="mt-6 bg-gray-800 rounded p-4">
          <h3 className="text-lg font-bold mb-3">📝 Format Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Format Score</div>
              <div className={`text-2xl font-bold ${
                formatResult.score >= 80 ? 'text-green-400' : 
                formatResult.score >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {formatResult.score}/100
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Format Type</div>
              <div className="text-xl font-semibold">{formatResult.format_type}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Scene Headings</div>
              <div className="text-xl">{formatResult.scene_headings_count}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Est. Pages</div>
              <div className="text-xl">{formatResult.estimated_pages}</div>
            </div>
          </div>
          
          {formatResult.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-400">❌ Issues</h4>
              <ul className="list-disc list-inside text-sm">
                {formatResult.issues.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          )}
          
          {formatResult.warnings.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-yellow-400">⚠️ Warnings</h4>
              <ul className="list-disc list-inside text-sm">
                {formatResult.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {complexityResult && activeTab === 'complexity' && (
        <div className="mt-6 bg-gray-800 rounded p-4">
          <h3 className="text-lg font-bold mb-3">🎯 Scene Complexity</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Total Scenes</div>
              <div className="text-xl font-bold">{complexityResult.summary.total_scenes}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Avg Complexity</div>
              <div className="text-xl font-bold">{complexityResult.summary.avg_complexity}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">High Complexity</div>
              <div className="text-xl font-bold text-red-400">{complexityResult.summary.high_complexity_count}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-center">
              <div className="text-sm text-gray-400">Shoot Days</div>
              <div className="text-xl font-bold text-green-400">{complexityResult.summary.recommended_shoot_days}</div>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Scene</th>
                  <th className="p-2 text-left">Complexity</th>
                  <th className="p-2 text-left">Label</th>
                </tr>
              </thead>
              <tbody>
                {complexityResult.scene_analysis.slice(0, 10).map((scene: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-700">
                    <td className="p-2">{scene.heading}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                          <div 
                            className={`h-full ${
                              scene.complexity_label === 'High' ? 'bg-red-500' :
                              scene.complexity_label === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${scene.complexity_score * 10}%` }}
                          />
                        </div>
                        <span>{scene.complexity_score}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        scene.complexity_label === 'High' ? 'bg-red-900 text-red-300' :
                        scene.complexity_label === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                      }`}>
                        {scene.complexity_label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fountainResult && activeTab === 'fountain' && (
        <div className="mt-6 bg-gray-800 rounded p-4">
          <h3 className="text-lg font-bold mb-3">📜 Fountain Parser</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Format</div>
              <div className="text-xl">{fountainResult.format}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Scenes</div>
              <div className="text-xl">{fountainResult.scenes_count}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Characters</div>
              <div className="text-xl">{fountainResult.characters.length}</div>
            </div>
          </div>
          
          {fountainResult.characters.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">👥 Characters Found</h4>
              <div className="flex flex-wrap gap-2">
                {fountainResult.characters.map((char, idx) => (
                  <span key={idx} className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-sm">
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
