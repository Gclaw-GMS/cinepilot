"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ShotListGeneratorProps {
  projectId?: number
}

export default function ShotListGenerator({ projectId = 1 }: ShotListGeneratorProps) {
  const [sceneDescription, setSceneDescription] = useState('')
  const [sceneNumber, setSceneNumber] = useState(1)
  const [location, setLocation] = useState('Interior')
  const [timeOfDay, setTimeOfDay] = useState('Day')
  const [characters, setCharacters] = useState('')
  const [shots, setShots] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateShots = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/ai/generate-shot-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_description: sceneDescription,
          scene_number: sceneNumber,
          location,
          time_of_day: timeOfDay,
          characters: characters.split(',').map(c => c.trim()).filter(Boolean)
        })
      })
      const data = await response.json()
      setShots(data)
    } catch (error) {
      // Fallback demo data
      setShots({
        scene_number: sceneNumber,
        total_shots: 5,
        estimated_duration: 44,
        shots: [
          { shot_number: 1, type: 'wide', description: `Establishing ${location}`, camera: 'A', movement: 'static', duration: 10 },
          { shot_number: 2, type: 'medium', description: 'Scene coverage', camera: 'A', movement: 'static', duration: 15 },
          { shot_number: 3, type: 'over_shoulder', description: 'Conversation', camera: 'A', movement: 'static', duration: 10 },
          { shot_number: 4, type: 'close_up', description: 'Reaction shot', camera: 'B', movement: 'static', duration: 5 },
          { shot_number: 5, type: 'insert', description: 'Detail shot', camera: 'B', movement: 'static', duration: 4 },
        ],
        tips: ['Start with wide to establish location', 'Match cut sizes for continuity']
      })
    }
    setLoading(false)
  }

  const shotTypeColors: Record<string, string> = {
    'wide': 'bg-blue-500',
    'medium': 'bg-green-500',
    'close_up': 'bg-purple-500',
    'extreme_close_up': 'bg-pink-500',
    'pov': 'bg-yellow-500',
    'over_shoulder': 'bg-teal-500',
    'insert': 'bg-orange-500',
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎬 AI Shot List Generator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Scene Number</label>
            <input
              type="number"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Location Type</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            >
              <option>Interior</option>
              <option>Exterior</option>
              <option>Interior/Exterior</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Time of Day</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            >
              <option>Day</option>
              <option>Night</option>
              <option>Dawn</option>
              <option>Dusk</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Characters (comma-separated)</label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="Raj, Priya, Kumar"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Scene Description</label>
          <textarea
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder="Describe the scene action, mood, and key moments..."
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 h-24"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateShots}
          disabled={loading || !sceneDescription}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Generating...' : '✨ Generate Shot List'}
        </motion.button>
      </div>

      {shots && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-white">
              Scene {shots.scene_number} - {shots.total_shots} Shots
            </h4>
            <span className="text-purple-400">
              ⏱️ ~{shots.estimated_duration} seconds
            </span>
          </div>

          <div className="space-y-3">
            {shots.shots?.map((shot: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-gray-700 rounded-lg p-3"
              >
                <div className={`w-10 h-10 rounded-full ${shotTypeColors[shot.type] || 'bg-gray-500'} flex items-center justify-center text-white font-bold`}>
                  {shot.shot_number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium uppercase">{shot.type.replace('_', ' ')}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{shot.description}</span>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-400 mt-1">
                    <span>📷 Camera {shot.camera}</span>
                    <span>🎬 {shot.movement}</span>
                    <span>⏱️ {shot.duration}s</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {shots.tips && (
            <div className="mt-4 p-3 bg-purple-900/30 rounded-lg">
              <h5 className="text-purple-400 font-medium mb-2">💡 Tips</h5>
              <ul className="text-gray-300 text-sm space-y-1">
                {shots.tips.map((tip: string, idx: number) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
