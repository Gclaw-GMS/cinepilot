"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface CharacterArcViewerProps {
  projectId?: number
}

interface CharacterArc {
  character_name: string
  arc: {
    introduction: { scene: number; description: string }
    rising_action: { scenes: number[]; description: string }
    climax: { scene: number; description: string }
    resolution: { scene: number; description: string }
  }
  screen_time: { total_scenes: number; estimated_minutes: number }
  emotional_journey: string[]
  character_moments: Array<{ scene: number; type: string; description: string }>
}

interface CharacterSceneData {
  scenes: Array<{ scene_number: number; location: string; time: string; description: string }>
}

export default function CharacterArcViewer({ projectId = 1 }: CharacterArcViewerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(1)
  const [arcData, setArcData] = useState<CharacterArc | null>(null)
  const [sceneData, setSceneData] = useState<CharacterSceneData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUsingDemo, setIsUsingDemo] = useState(false)

  const characters = [
    { id: 1, name: 'Kathir', role: 'Lead', color: 'from-blue-500 to-cyan-500' },
    { id: 2, name: 'Anjali', role: 'Lead', color: 'from-pink-500 to-rose-500' },
    { id: 3, name: 'Father', role: 'Supporting', color: 'from-purple-500 to-violet-500' },
    { id: 4, name: 'Villain', role: 'Antagonist', color: 'from-red-500 to-orange-500' },
  ]

  const fetchCharacterArc = async (charId: number) => {
    setLoading(true)
    setSelectedCharacter(charId)
    setIsUsingDemo(false)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/characters/${charId}/arc`)
      if (!response.ok) throw new Error('API failed')
      const data = await response.json()
      setArcData(data)
    } catch (error) {
      // Demo data
      const demoData: CharacterArc = {
        character_name: characters[charId - 1]?.name || 'Character',
        arc: {
          introduction: { scene: 1, description: 'Character introduced in humble circumstances' },
          rising_action: { scenes: [3, 5, 8], description: 'Faces challenges, grows skills' },
          climax: { scene: 12, description: 'Key transformation moment' },
          resolution: { scene: 15, description: 'Character emerges changed' },
        },
        screen_time: { total_scenes: 8, estimated_minutes: 12 },
        emotional_journey: ['hope', 'doubt', 'determination', 'triumph'],
        character_moments: [
          { scene: 1, type: 'introduction', description: 'First appearance' },
          { scene: 5, type: 'challenge', description: 'Faces obstacle' },
          { scene: 12, type: 'transformation', description: 'Key decision' },
        ]
      }
      setArcData(demoData)
      setIsUsingDemo(true)
    }
    
    // Also fetch scenes
    try {
      const scenesRes = await fetch(`/api/projects/${projectId}/characters/${charId}/scenes`)
      if (!scenesRes.ok) throw new Error('Scenes API failed')
      const scenesData = await scenesRes.json()
      setSceneData(scenesData)
    } catch {
      setSceneData({
        scenes: [
          { scene_number: 1, location: 'Home', time: 'Day', description: 'Opening scene' },
          { scene_number: 3, location: 'Office', time: 'Day', description: 'Work meeting' },
          { scene_number: 5, location: 'Street', time: 'Night', description: 'Confrontation' },
        ]
      })
    }
    
    setLoading(false)
  }

  const selectedChar = characters.find(c => c.id === selectedCharacter)

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎭</span> Character Arc Viewer
          </h3>
          {isUsingDemo && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
              Demo Mode
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {characters.map((char) => (
            <motion.button
              key={char.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchCharacterArc(char.id)}
              disabled={loading}
              className={`p-4 rounded-xl text-center transition-all ${
                selectedCharacter === char.id
                  ? `bg-gradient-to-br ${char.color} ring-2 ring-white`
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <div className="text-white font-semibold">{char.name}</div>
              <div className="text-white/70 text-xs">{char.role}</div>
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-2">Loading character data...</p>
          </div>
        ) : arcData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Character Header */}
            <div className={`bg-gradient-to-r ${selectedChar?.color || 'from-gray-600 to-gray-700'} rounded-xl p-4`}>
              <h4 className="text-2xl font-bold text-white">{arcData.character_name}</h4>
              <div className="flex gap-4 mt-2 text-white/80">
                <span>🎬 {arcData.screen_time?.total_scenes || 0} Scenes</span>
                <span>⏱️ ~{arcData.screen_time?.estimated_minutes || 0} min</span>
              </div>
            </div>

            {/* Arc Timeline */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-4 flex items-center gap-2">
                📈 Character Arc
              </h5>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-600"></div>
                
                {/* Introduction */}
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="text-blue-400 font-medium">Introduction (Scene {arcData.arc?.introduction?.scene})</div>
                    <p className="text-slate-300 text-sm">{arcData.arc?.introduction?.description}</p>
                  </div>
                </div>
                
                {/* Rising Action */}
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="text-yellow-400 font-medium">Rising Action (Scenes {arcData.arc?.rising_action?.scenes?.join(', ')})</div>
                    <p className="text-slate-300 text-sm">{arcData.arc?.rising_action?.description}</p>
                  </div>
                </div>
                
                {/* Climax */}
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-2 w-4 h-4 bg-orange-500 rounded-full"></div>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="text-orange-400 font-medium">Climax (Scene {arcData.arc?.climax?.scene})</div>
                    <p className="text-slate-300 text-sm">{arcData.arc?.climax?.description}</p>
                  </div>
                </div>
                
                {/* Resolution */}
                <div className="relative pl-10">
                  <div className="absolute left-2 w-4 h-4 bg-green-500 rounded-full"></div>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="text-green-400 font-medium">Resolution (Scene {arcData.arc?.resolution?.scene})</div>
                    <p className="text-slate-300 text-sm">{arcData.arc?.resolution?.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emotional Journey */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                💫 Emotional Journey
              </h5>
              <div className="flex flex-wrap gap-2">
                {arcData.emotional_journey?.map((emotion: string, idx: number) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm ${
                      idx === arcData.emotional_journey.length - 1
                        ? 'bg-green-500 text-white'
                        : idx === 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>

            {/* Character Moments */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                🎬 Key Moments
              </h5>
              <div className="space-y-2">
                {arcData.character_moments?.map((moment: { scene: number; type: string; description: string }, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-2">
                    <span className="text-slate-400 text-sm">Scene {moment.scene}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      moment.type === 'introduction' ? 'bg-blue-500' :
                      moment.type === 'challenge' ? 'bg-yellow-500' :
                      moment.type === 'transformation' ? 'bg-orange-500' : 'bg-slate-500'
                    } text-white`}>
                      {moment.type}
                    </span>
                    <span className="text-slate-300 text-sm">{moment.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
