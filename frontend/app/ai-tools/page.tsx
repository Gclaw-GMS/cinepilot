'use client'

import { useState } from 'react'
import { Card, StatCard, Button, Badge, PageHeader } from '@/components/ui'
import { 
  Brain, Sparkles, FileText, Clapperboard, DollarSign, 
  Calendar, AlertTriangle, MessageSquare, Wand2, Search,
  Play, ArrowRight, TrendingUp, Target, Zap
} from 'lucide-react'

const AI_FEATURES = [
  { id: 'script-analyzer', name: 'Script Intelligence', desc: 'Deep analysis of your script', icon: FileText, color: 'indigo' },
  { id: 'budget-forecast', name: 'Budget Forecast', desc: 'Predict production costs', icon: DollarSign, color: 'emerald' },
  { id: 'shot-suggest', name: 'Shot Recommender', desc: 'AI shot suggestions', icon: Clapperboard, color: 'violet' },
  { id: 'schedule', name: 'Schedule Optimizer', desc: 'Optimize shooting schedule', icon: Calendar, color: 'amber' },
  { id: 'risk-detect', name: 'Risk Detector', desc: 'Identify production risks', icon: AlertTriangle, color: 'rose' },
  { id: 'dialogue', name: 'Dialogue Refiner', desc: 'Improve script dialogue', icon: MessageSquare, color: 'cyan' },
]

export default function AIToolsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [scriptText, setScriptText] = useState('')

  const runAnalysis = async (featureId: string) => {
    setSelected(featureId)
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: featureId,
          text: scriptText || 'sample script text',
          scene_count: 45,
          location_count: 8,
          cast_size: 12,
          duration_days: 30,
          is_outdoor: true,
          is_night_shoots: false
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <PageHeader title="AI Production Tools" subtitle="Advanced AI features for film production" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="AI Analyses" value="24" color="indigo" icon={<Brain className="w-5 h-5" />} />
        <StatCard title="Insights" value="156" color="violet" icon={<Sparkles className="w-5 h-5" />} />
        <StatCard title="Time Saved" value="48h" color="emerald" icon={<Zap className="w-5 h-5" />} />
      </div>

      {/* Script Input for testing */}
      <Card className="mb-8">
        <h3 className="font-semibold mb-4">Test with Script</h3>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Paste your script text here to analyze..."
          className="w-full h-32 bg-slate-800 border-slate-700 rounded-lg p-4 text-sm"
        />
        <p className="text-slate-500 text-xs mt-2">Leave empty to use demo data</p>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {AI_FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => runAnalysis(feature.id)}
            disabled={loading}
            className="text-left bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
              <div>
                <h3 className="font-semibold">{feature.name}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm">
              Run Analysis <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <Card className="text-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">AI is analyzing...</p>
        </Card>
      )}

      {result && (
        <Card>
          <Badge variant="emerald" className="mb-4">Analysis Complete</Badge>
          <pre className="text-sm text-slate-300 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}
