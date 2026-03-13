// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { aiAnalysis } from '@/lib/api'

interface ScriptAnalysisDashboardProps {
  scriptContent: string
}

export default function ScriptAnalysisDashboard({ scriptContent }: ScriptAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pacing' | 'characters' | 'emotions' | 'tags'>('pacing')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const analyze = useCallback(async () => {
    setLoading(true)
    try {
      let data
      switch (activeTab) {
        case 'pacing':
          data = await aiAnalysis.analyzePacing(scriptContent)
          break
        case 'characters':
          data = await aiAnalysis.analyzeCharacters(scriptContent)
          break
        case 'emotions':
          data = await aiAnalysis.analyzeEmotionalArc(scriptContent)
          break
        case 'tags':
          data = await aiAnalysis.generateTags(scriptContent)
          break
      }
      setResults(data)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
    setLoading(false)
  }, [scriptContent, activeTab])

  useEffect(() => {
    if (scriptContent) {
      analyze()
    }
  }, [scriptContent, analyze])

  const tabs = [
    { id: 'pacing', label: 'Pacing', icon: '⏱️' },
    { id: 'characters', label: 'Characters', icon: '👥' },
    { id: 'emotions', label: 'Emotions', icon: '💫' },
    { id: 'tags', label: 'Tags 🏷️', icon: '🏷️' },
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <h3 className="text-xl font-bold mb-4">📊 Script Analysis Dashboard</h3>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setResults(null) }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : results ? (
          <div className="space-y-4">
            {/* Pacing Results */}
            {activeTab === 'pacing' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{results.pacing_score}</div>
                    <div className="text-sm text-gray-400">Pacing Score</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{results.total_dialogues}</div>
                    <div className="text-sm text-gray-400">Dialogues</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">{results.total_actions}</div>
                    <div className="text-sm text-gray-400">Actions</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{results.estimated_runtime_minutes}m</div>
                    <div className="text-sm text-gray-400">Est. Runtime</div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Pacing Type</h4>
                  <div className="flex gap-2">
                    {results.dialogue_heavy && <span className="px-3 py-1 bg-blue-900 rounded-full text-sm">Dialogue Heavy</span>}
                    {results.action_heavy && <span className="px-3 py-1 bg-orange-900 rounded-full text-sm">Action Heavy</span>}
                    {results.balanced && <span className="px-3 py-1 bg-green-900 rounded-full text-sm">Balanced</span>}
                  </div>
                </div>

                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {results.recommendations.filter(Boolean).map((rec: string, i: number) => (
                        <li key={i} className="text-gray-300">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Character Results */}
            {activeTab === 'characters' && (
              <>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{results.total_characters}</div>
                  <div className="text-gray-400">Total Characters</div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-yellow-400">Lead Characters</h4>
                    <ul className="space-y-1">
                      {results.lead_characters?.map((char: string, i: number) => (
                        <li key={i} className="text-white">⭐ {char}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-400">Supporting Cast</h4>
                    <ul className="space-y-1">
                      {results.supporting_characters?.map((char: string, i: number) => (
                        <li key={i} className="text-gray-300">• {char}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {results.analysis && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Cast Analysis</h4>
                    <div className="flex gap-2">
                      {results.analysis.ensemble && <span className="px-3 py-1 bg-purple-900 rounded-full text-sm">Ensemble Cast</span>}
                      {results.analysis.small_cast && <span className="px-3 py-1 bg-green-900 rounded-full text-sm">Small Cast</span>}
                      <span className="px-3 py-1 bg-blue-900 rounded-full text-sm">Recommended: {results.analysis.recommended_cast_size}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Emotional Arc Results */}
            {activeTab === 'emotions' && (
              <>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Emotion Distribution</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(results.emotion_counts || {}).map(([emotion, count]: [string, any]) => (
                      <div key={emotion} className="text-center">
                        <div className="text-lg font-bold" style={{
                          color: emotion === 'joy' ? '#FFD700' :
                                 emotion === 'sadness' ? '#4169E1' :
                                 emotion === 'anger' ? '#FF4500' :
                                 emotion === 'tension' ? '#9932CC' : '#FF69B4'
                        }}>{count}</div>
                        <div className="text-xs text-gray-400 capitalize">{emotion}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Dominant Emotion: <span className="text-yellow-400 capitalize">{results.dominant_emotion}</span></h4>
                </div>

                {results.emotional_journey && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Emotional Journey</h4>
                    <div className="flex justify-between items-center">
                      {results.emotional_journey.map((act: any, i: number) => (
                        <div key={i} className="flex-1 text-center px-2">
                          <div className="text-xs text-gray-500">Act {i + 1}</div>
                          <div className="font-medium text-white">{act.emotion}</div>
                          <div className="text-sm text-gray-400 capitalize">{act.primary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tags Results */}
            {activeTab === 'tags' && (
              <>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Detected Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.tags?.map((tag: any, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${tag.confidence})`,
                        }}
                      >
                        {tag.tag} ({Math.round(tag.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Primary Genre</div>
                  <div className="text-2xl font-bold text-white capitalize">{results.primary_genre}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Enter script content and click analyze to see results
          </div>
        )}
      </div>
    </div>
  )
}
