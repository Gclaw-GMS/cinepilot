'use client'

import { useState } from 'react'
import * as api from '@/lib/api'

const tools = [
  { id: 'analyze', label: 'Script Analysis', icon: '📝', description: 'AI-powered script breakdown' },
  { id: 'shots', label: 'Shot Generator', icon: '🎥', description: 'Generate shot lists from scenes' },
  { id: 'budget', label: 'Budget Estimate', icon: '💰', description: 'AI budget estimation' },
  { id: 'schedule', label: 'Schedule Optimize', icon: '📅', description: 'Optimize shooting schedule' },
  { id: 'tamil', label: 'Tamil Analysis', icon: '🇮🇳', description: 'Tamil script & cultural analysis' },
  { id: 'format', label: 'Format Check', icon: '📋', description: 'Check screenplay format' },
  { id: 'complexity', label: 'Scene Complexity', icon: '🎯', description: 'Score scene complexity' },
  { id: 'fountain', label: 'Fountain Parse', icon: '📜', description: 'Parse Fountain format' },
]

const DEMO_ANALYSIS = {
  total_scenes: 45,
  total_locations: 12,
  total_characters: 8,
  estimated_shooting_days: 25,
  estimated_budget: 3000000,
  tags: ['romance', 'thriller', 'family', 'emotional'],
  safety_warnings: ['⚠️ Stunt scene in scene 23', '🔥 Fire effects in scene 31'],
  cultural_notes: ['🎭 Festival scene', '🛕 Temple setting'],
}

const DEMO_SHOTS = [
  { shot_type: 'Wide Shot', description: 'Establish the location', camera: 'Wide', lens: '24mm' },
  { shot_type: 'Medium Shot', description: 'Character introduction', camera: 'Medium', lens: '50mm' },
  { shot_type: 'Close-up', description: 'Emotional beat', camera: 'CU', lens: '85mm' },
  { shot_type: 'Over the Shoulder', description: 'Conversation shot', camera: 'OTS', lens: '50mm' },
]

const DEMO_BUDGET = {
  estimated_total: 3250000,
  breakdown: {
    pre_production: 325000,
    production: 2275000,
    post_production: 650000,
    contingency: 325000,
  },
}

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('analyze')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [input, setInput] = useState('')

  const handleRun = async () => {
    setLoading(true)
    setResult(null)
    
    await new Promise(r => setTimeout(r, 1000)) // Simulate processing
    
    switch (activeTab) {
      case 'analyze':
        setResult(DEMO_ANALYSIS)
        break
      case 'shots':
        setResult({ shots: DEMO_SHOTS })
        break
      case 'budget':
        setResult(DEMO_BUDGET)
        break
      case 'schedule':
        setResult({
          schedule: Array.from({ length: 25 }, (_, i) => ({
            day: i + 1,
            scenes: [],
            location: 'TBD',
            estimated_hours: 10
          }))
        })
        break
      case 'tamil':
        setResult({
          summary: { total_scenes: 45, total_pages: 120, estimated_runtime: '2h 15m' },
          locations: [
            { name: 'Chennai', tamil: 'சென்னை', count: 15, suggested_days: 5 },
            { name: 'Madurai', tamil: 'மதுரை', count: 8, suggested_days: 3 },
          ],
          characters: [
            { name: 'Arjun', tamil: 'அருஜ்', scenes: 40, dialogue_lines: 250 },
            { name: 'Priya', tamil: 'பிரியா', scenes: 35, dialogue_lines: 200 },
          ],
          tags: { genres: ['romance'], moods: ['emotional'], themes: ['family'] },
          cultural_notes: ['🙏 Temple ceremony scene', '🎪 Festival sequence'],
          safety_warnings: [],
        })
        break
      case 'format':
        setResult({
          format_analysis: {
            format_type: 'Standard',
            score: 85,
            issues: [],
            warnings: ['Consider adding more scene headings'],
            scene_headings_count: 45,
            estimated_pages: 120
          }
        })
        break
      case 'complexity':
        setResult({
          scene_analysis: [
            { scene_number: 1, heading: 'INT. APARTMENT - DAY', complexity_score: 2, complexity_label: 'Low' },
            { scene_number: 2, heading: 'EXT. STREET - NIGHT', complexity_score: 5, complexity_label: 'Medium' },
            { scene_number: 3, heading: 'EXT. TEMPLE - DAY', complexity_score: 7, complexity_label: 'High' },
          ],
          summary: {
            total_scenes: 45,
            avg_complexity: 3.5,
            high_complexity_count: 8,
            recommended_shoot_days: 28
          }
        })
        break
      case 'fountain':
        setResult({
          format: 'Fountain',
          scenes_count: 45,
          characters: ['KATHIR', 'ANJALI', 'FATHER', 'PRIYA', 'RAHUL'],
          metadata: { total_lines: 1200, estimated_pages: 120 }
        })
        break
    }
    setLoading(false)
  }

  const renderResult = () => {
    if (!result) return null
    
    if (activeTab === 'shots') {
      return (
        <div className="space-y-3">
          {result.shots?.map((shot: any, i: number) => (
            <div key={i} className="bg-slate-800 p-4 rounded-lg flex items-center gap-4">
              <div className="text-2xl">🎬</div>
              <div className="flex-1">
                <div className="font-medium text-cyan-400">{shot.shot_type}</div>
                <div className="text-sm text-gray-300">{shot.description}</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-gray-400">{shot.camera}</div>
                <div className="text-gray-500">{shot.lens}</div>
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    if (activeTab === 'budget') {
      const b = result.breakdown
      return (
        <div>
          <div className="text-3xl font-bold text-green-400 mb-4">₹{result.estimated_total?.toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(b || {}).map(([k, v]: [string, any]) => (
              <div key={k} className="bg-slate-800 p-3 rounded">
                <div className="text-xs text-gray-400 uppercase">{k.replace('_', ' ')}</div>
                <div className="text-lg font-medium">₹{v?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'tamil') {
      return (
        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400 mb-2">Summary</div>
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-2xl font-bold">{result.summary?.total_scenes}</div><div className="text-xs text-gray-500">Scenes</div></div>
              <div><div className="text-2xl font-bold">{result.summary?.total_pages}</div><div className="text-xs text-gray-500">Pages</div></div>
              <div><div className="text-2xl font-bold">{result.summary?.estimated_runtime}</div><div className="text-xs text-gray-500">Runtime</div></div>
            </div>
          </div>
          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400 mb-2">Locations</div>
            {result.locations?.map((loc: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-700 last:border-0">
                <span>{loc.name} ({loc.tamil})</span>
                <span className="text-cyan-400">{loc.count} scenes • {loc.suggested_days} days</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400 mb-2">Characters</div>
            {result.characters?.map((char: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-700 last:border-0">
                <span>{char.name} ({char.tamil})</span>
                <span className="text-cyan-400">{char.scenes} scenes • {char.dialogue_lines} lines</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Default analysis view
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(result).filter(([k]) => !['tags', 'safety_warnings', 'cultural_notes', 'breakdown', 'schedule', 'shots'].includes(k)).map(([k, v]) => (
            <div key={k} className="bg-slate-800 p-3 rounded text-center">
              <div className="text-2xl font-bold text-cyan-400">{String(v)}</div>
              <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
        {result.tags && (
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">{tag}</span>
            ))}
          </div>
        )}
        {result.safety_warnings?.length > 0 && (
          <div className="bg-red-900/20 border border-red-800 p-3 rounded">
            <div className="text-red-400 text-sm font-medium mb-2">⚠️ Safety Warnings</div>
            {result.safety_warnings.map((w: string, i: number) => (
              <div key={i} className="text-red-300 text-sm">{w}</div>
            ))}
          </div>
        )}
        {result.cultural_notes?.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-800 p-3 rounded">
            <div className="text-amber-400 text-sm font-medium mb-2">🎭 Cultural Notes</div>
            {result.cultural_notes.map((n: string, i: number) => (
              <div key={i} className="text-amber-300 text-sm">{n}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🤖 AI Tools</h1>
        <p className="text-gray-500 mt-1">Power up your pre-production with AI</p>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTab(tool.id); setResult(null) }}
            className={`p-4 rounded-lg text-left transition-all ${
              activeTab === tool.id
                ? 'bg-cyan-500/20 border-2 border-cyan-500'
                : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <span className="text-2xl block mb-2">{tool.icon}</span>
            <h3 className="font-semibold text-white text-sm">{tool.label}</h3>
            <p className="text-xs text-gray-400 mt-1">{tool.description}</p>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeTab === 'analyze' ? 'Paste your script here...' : 'Enter scene description, parameters...'}
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={handleRun}
          disabled={loading}
          className="mt-3 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded font-medium"
        >
          {loading ? '⏳ Processing...' : '🚀 Run Analysis'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-4">📊 Results</h3>
          {renderResult()}
        </div>
      )}
    </div>
  )
}
