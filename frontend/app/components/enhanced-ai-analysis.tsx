/**
 * Enhanced AI Analysis Dashboard
 * Advanced script and production analysis
 */
'use client'

import { useState, useEffect } from 'react'

interface AnalysisResult {
  type: string
  data: any
  timestamp: string
}

type AnalysisType = 
  | 'dialogue' 
  | 'emotional' 
  | 'pacing' 
  | 'visual' 
  | 'characters' 
  | 'vfx'
  | 'budget'
  | 'comparison'

const ANALYSIS_TYPES = [
  { id: 'dialogue', name: '💬 Dialogue Analysis', desc: 'Character speaking patterns' },
  { id: 'emotional', name: '❤️ Emotional Arc', desc: 'Emotional journey mapping' },
  { id: 'pacing', name: '⏱️ Pacing Analysis', desc: 'Scene rhythm and flow' },
  { id: 'visual', name: '🎨 Visual Flow', desc: 'Visual storytelling patterns' },
  { id: 'characters', name: '👥 Character Deep Dive', desc: 'Character relationships' },
  { id: 'vfx', name: '✨ VFX Requirements', desc: 'VFX scene detection' },
  { id: 'budget', name: '💰 Budget Prediction', desc: 'Cost estimation' },
  { id: 'comparison', name: '🎬 Film Comparison', desc: 'Similar film benchmarking' }
]

export function EnhancedAIAnalysis({ projectId, scriptContent }: { projectId: number; scriptContent?: string }) {
  const [selectedType, setSelectedType] = useState<AnalysisType>('dialogue')
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AnalysisResult[]>([])

  const runAnalysis = async () => {
    setLoading(true)
    try {
      // Simulated analysis based on type
      await new Promise(r => setTimeout(r, 1000))
      
      let result: any = {}
      
      switch (selectedType) {
        case 'dialogue':
          result = {
            total_lines: 156,
            unique_speakers: 12,
            avg_words_per_line: 8,
            top_speakers: [
              { name: 'RAM', words: 2340, lines: 45 },
              { name: 'PRIYA', words: 1890, lines: 38 },
              { name: 'ARJUN', words: 1560, lines: 32 }
            ],
            dialogue_rhythm: 'Fast-paced conversational'
          }
          break
          
        case 'emotional':
          result = {
            emotional_peaks: 8,
            emotional_valleys: 5,
            arc_shape: 'Hero\'s Journey',
            key_moments: [
              { scene: 5, emotion: 'hope', description: 'Introduction of goal' },
              { scene: 12, emotion: 'conflict', description: 'First major obstacle' },
              { scene: 25, emotion: 'despair', description: 'All seems lost' },
              { scene: 35, emotion: 'resolution', description: 'Victory achieved' }
            ],
            overall_mood: 'Uplifting drama'
          }
          break
          
        case 'pacing':
          result = {
            act_structure: { act1: '25%', act2: '50%', act3: '25%' },
            scene_lengths: { avg: '2.5 pages', shortest: '0.5 pages', longest: '5 pages' },
            pacing_score: 78,
            rhythm_pattern: 'Build-Release-Build',
            recommendations: [
              'Shorten opening act for faster hook',
              'Add tension beat at scene 15',
              'Climax is well-positioned'
            ]
          }
          break
          
        case 'visual':
          result = {
            shot_suggestions: 245,
            camera_movements: { pan: 45, tilt: 23, dolly: 18, crane: 8 },
            location_variety: 8,
            visual_themes: ['Urban realism', 'Natural lighting', 'Close-up intimacy'],
            coverage_ratio: '3.2 shots per scene'
          }
          break
          
        case 'characters':
          result = {
            main_characters: 4,
            supporting: 8,
            total_relationships: 15,
            central_character: 'RAM',
            character_arcs: [
              { name: 'RAM', arc: 'transformation', beats: ['innocent', 'broken', 'heroic'] },
              { name: 'PRIYA', arc: 'supporting', beats: ['catalyst', 'moral_compass'] }
            ]
          }
          break
          
        case 'vfx':
          result = {
            vfx_scenes: 6,
            complexity: 'Medium',
            estimated_cost: 2500000,
            types: { cgi: 3, composite: 2, digital: 1 },
            recommendations: [
              'Scene 8 - Dream sequence (CGI required)',
              'Scene 22 - Cityscape enhancement',
              'Scene 35 - Action enhancement'
            ]
          }
          break
          
        case 'budget':
          result = {
            estimated_total: 8500000,
            breakdown: {
              pre_production: 500000,
              production: 5000000,
              post_production: 2000000,
              contingency: 1000000
            },
            per_scene_average: 85000,
            recommendations: [
              'Consider co-production for budget relief',
              'Shoot in Tamil Nadu for tax benefits',
              'Prioritize principal photography days'
            ]
          }
          break
          
        case 'comparison':
          result = {
            similar_films: [
              { title: 'Vikram', match: 85, budget: 150000000, runtime: 175 },
              { title: 'Jai Bhim', match: 72, budget: 15000000, runtime: 164 },
              { title: 'Master', match: 68, budget: 125000000, runtime: 182 }
            ],
            predicted_runtime: 165,
            genre: 'Action Drama',
            target_audience: 'Universal'
          }
          break
      }
      
      const analysisResult: AnalysisResult = {
        type: selectedType,
        data: result,
        timestamp: new Date().toISOString()
      }
      
      setResults(analysisResult)
      setHistory(prev => [analysisResult, ...prev.slice(0, 9)])
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analysis Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">🔬 Select Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ANALYSIS_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as AnalysisType)}
              className={`p-3 rounded-lg text-left transition-all ${
                selectedType === type.id
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-gray-50 border border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-gray-500">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Run Analysis Button */}
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '🔄 Analyzing...' : `▶️ Run ${ANALYSIS_TYPES.find(t => t.id === selectedType)?.name}`}
      </button>

      {/* Results Display */}
      {results && (
        <div className="bg-white rounded-xl p-6 border border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-purple-900">
              {ANALYSIS_TYPES.find(t => t.id === results.type)?.name}
            </h3>
            <span className="text-xs text-gray-400">
              {new Date(results.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="space-y-4">
            {selectedType === 'dialogue' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{results.data.total_lines}</div>
                    <div className="text-xs text-purple-600">Dialogue Lines</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{results.data.unique_speakers}</div>
                    <div className="text-xs text-purple-600">Characters</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{results.data.avg_words_per_line}</div>
                    <div className="text-xs text-purple-600">Avg Words/Line</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Top Speakers</h4>
                  {results.data.top_speakers.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{s.words} words</span>
                        <span>{s.lines} lines</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedType === 'emotional' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-pink-700">{results.data.emotional_peaks}</div>
                    <div className="text-xs text-pink-600">Emotional Peaks</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{results.data.arc_shape}</div>
                    <div className="text-xs text-blue-600">Arc Type</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Emotional Moments</h4>
                  {results.data.key_moments.map((m: any, i: number) => (
                    <div key={i} className="flex gap-3 py-2 border-b border-gray-100">
                      <span className="text-purple-600 font-mono">Scene {m.scene}</span>
                      <span className="capitalize px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                        {m.emotion}
                      </span>
                      <span className="text-gray-600 text-sm">{m.description}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedType === 'budget' && (
              <>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="text-3xl font-bold text-green-700">
                    ₹{results.data.estimated_total.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Estimated Total Budget</div>
                </div>
                <div className="space-y-2">
                  {Object.entries(results.data.breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-gray-600">{key.replace('_', ' ')}</span>
                      <span className="font-medium">₹{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedType === 'comparison' && (
              <>
                <div className="space-y-3">
                  {results.data.similar_films.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <div className="font-medium">{f.title}</div>
                        <div className="text-sm text-gray-500">Runtime: {f.runtime} min | Budget: ₹{(f.budget/10000000).toFixed(1)}Cr</div>
                      </div>
                      <div className="text-green-600 font-bold">{f.match}% match</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Generic rendering for other types */}
            {['pacing', 'visual', 'characters', 'vfx'].includes(selectedType) && (
              <div className="prose prose-sm max-w-none">
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis History */}
      {history.length > 1 && (
        <div>
          <h4 className="font-semibold mb-2">Recent Analyses</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => setResults(h)}
                className="flex-shrink-0 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                {ANALYSIS_TYPES.find(t => t.id === h.type)?.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
