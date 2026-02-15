'use client'

import { useState } from 'react'
import * as api from '@/lib/api'
import Link from 'next/link'

// Demo scenes for shot suggestions
const DEMO_SCENES = [
  { id: 1, scene_number: 1, heading: 'EXT. CHENNAI STREET - DAY', description: 'Rain pours on the busy street. People rush with umbrellas.' },
  { id: 2, scene_number: 2, heading: 'INT. APARTMENT - NIGHT', description: 'Priya sits alone, looking at old photographs.' },
  { id: 3, scene_number: 3, heading: 'EXT. MADURAI TEMPLE - DAY', description: 'Devotees gather for the evening aarti.' },
]

export default function ShotListPage() {
  const [selectedScene, setSelectedScene] = useState<number | null>(null)
  const [shotList, setShotList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sceneDescription, setSceneDescription] = useState('')

  const generateShotList = async () => {
    if (!sceneDescription.trim()) return
    
    setLoading(true)
    try {
      // Call the API
      const result: any = await api.ai.generateShotList?.(sceneDescription) || { shots: [] }
      setShotList(result.shots || [])
    } catch (e) {
      // Mock response for demo
      setShotList([
        { shot_type: 'Wide Shot', description: 'Establish the location and atmosphere', camera: 'Wide', lens: '24mm' },
        { shot_type: 'Medium Shot', description: 'Character introduction and context', camera: 'Medium', lens: '50mm' },
        { shot_type: 'Close-up', description: 'Emotional beat - key reaction', camera: 'CU', lens: '85mm' },
        { shot_type: 'Over the Shoulder', description: 'Conversation coverage', camera: 'OTS', lens: '50mm' },
        { shot_type: 'Two Shot', description: 'Characters together', camera: 'Wide', lens: '35mm' },
      ])
    }
    setLoading(false)
  }

  const shotTypes = [
    { type: 'Wide Shot (WS)', icon: '🌐', color: 'blue' },
    { type: 'Medium Shot (MS)', icon: '👤', color: 'green' },
    { type: 'Close-up (CU)', icon: '👁️', color: 'purple' },
    { type: 'Extreme Close-up (ECU)', icon: '🔍', color: 'pink' },
    { type: 'Over the Shoulder (OTS)', icon: '🔄', color: 'yellow' },
    { type: 'Point of View (POV)', icon: '👀', color: 'cyan' },
    { type: 'Two Shot', icon: '👥', color: 'orange' },
    { type: 'Insert', icon: '✂️', color: 'red' },
  ]

  const addShotType = (shotType: string, lens: string = '50mm') => {
    const newShot = {
      shot_type: shotType,
      description: '',
      camera: shotType.includes('Wide') ? 'Wide' : shotType.includes('CU') ? 'CU' : 'Medium',
      lens
    }
    setShotList([...shotList, newShot])
  }

  const removeShot = (index: number) => {
    setShotList(shotList.filter((_, i) => i !== index))
  }

  const updateShot = (index: number, field: string, value: string) => {
    const updated = [...shotList]
    updated[index] = { ...updated[index], [field]: value }
    setShotList(updated)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">←</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">🎬 Shot List Generator</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered shot suggestions for your scenes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scene Description Input */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Describe Your Scene</h2>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Describe what happens in the scene. E.g., 'A romantic conversation between two leads on a beach at sunset...'"
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-cinepilot-accent focus:outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={generateShotList}
                disabled={loading || !sceneDescription.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium flex items-center gap-2"
              >
                {loading ? '⏳ Generating...' : '🤖 AI Generate Shots'}
              </button>
              <button
                onClick={() => setShotList([])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Shot List */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Shot List ({shotList.length} shots)</h2>
              <div className="text-sm text-gray-500">
                {shotList.reduce((sum, s) => sum + (s.lens?.includes('24') ? 12 : s.lens?.includes('85') ? 6 : 8), 0)} min estimated
              </div>
            </div>

            {shotList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🎥</div>
                <p>No shots yet</p>
                <p className="text-sm mt-2">Describe a scene or add shot types manually</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shotList.map((shot, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-800/50 rounded-lg items-start">
                    <div className="w-8 h-8 bg-cinepilot-accent text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Shot Type</label>
                        <select
                          value={shot.shot_type}
                          onChange={(e) => updateShot(index, 'shot_type', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          {shotTypes.map(st => (
                            <option key={st.type} value={st.type}>{st.type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Camera</label>
                        <select
                          value={shot.camera}
                          onChange={(e) => updateShot(index, 'camera', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          <option value="Wide">Wide</option>
                          <option value="Medium">Medium</option>
                          <option value="CU">CU</option>
                          <option value="OTS">OTS</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Lens</label>
                        <select
                          value={shot.lens}
                          onChange={(e) => updateShot(index, 'lens', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          <option value="24mm">24mm</option>
                          <option value="35mm">35mm</option>
                          <option value="50mm">50mm</option>
                          <option value="85mm">85mm</option>
                          <option value="135mm">135mm</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Description</label>
                        <input
                          type="text"
                          value={shot.description}
                          onChange={(e) => updateShot(index, 'description', e.target.value)}
                          placeholder="Shot description..."
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeShot(index)}
                      className="text-gray-500 hover:text-red-400 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {shotList.length > 0 && (
              <div className="mt-6 flex gap-4">
                <button className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium hover:bg-cyan-400">
                  💾 Save Shot List
                </button>
                <button className="px-4 py-2 bg-gray-700 rounded font-medium hover:bg-gray-600">
                  📤 Export PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shot Types Reference */}
        <div className="space-y-6">
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Add Shot Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {shotTypes.map((shot) => (
                <button
                  key={shot.type}
                  onClick={() => addShotType(shot.type)}
                  className="p-2 text-left bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 hover:border-cinepilot-accent transition-colors"
                >
                  <span className="text-lg">{shot.icon}</span>
                  <span className="block text-xs mt-1">{shot.type.split(' (')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Templates */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Scene Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSceneDescription('Two characters having an intense romantic conversation in a coffee shop. Emotional dialogue with some humor.')}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm"
              >
                ☕ Coffee Shop Conversation
              </button>
              <button
                onClick={() => setSceneDescription('Action sequence with a car chase through busy city streets. Stunts and explosions.')}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm"
              >
                🚗 Car Chase Action
              </button>
              <button
                onClick={() => setSceneDescription('Emotional family drama scene at a funeral. Characters crying and consoling each other.')}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm"
              >
                😢 Funeral Drama
              </button>
              <button
                onClick={() => setSceneDescription('Song and dance sequence in a traditional Tamil wedding. Colorful costumes, large crowd.')}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm"
              >
                💃 Tamil Wedding Song
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
