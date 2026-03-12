"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ShotListGeneratorProps {
  projectId?: number
}

interface Shot {
  shot_number: number
  type: string
  description: string
  camera: string
  movement: string
  duration: number
}

interface GeneratedShotList {
  scene_number: number
  total_shots: number
  estimated_duration: number
  shots: Shot[]
  tips: string[]
}

export default function ShotListGenerator({ projectId = 1 }: ShotListGeneratorProps) {
  const [sceneDescription, setSceneDescription] = useState('')
  const [sceneNumber, setSceneNumber] = useState(1)
  const [location, setLocation] = useState('Interior')
  const [timeOfDay, setTimeOfDay] = useState('Day')
  const [characters, setCharacters] = useState('')
  const [shots, setShots] = useState<GeneratedShotList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDemo, setIsUsingDemo] = useState(false)

  // Generate intelligent demo data based on input
  const generateDemoData = useCallback((): GeneratedShotList => {
    const charList = characters.split(',').map(c => c.trim()).filter(Boolean)
    const isExterior = location.toLowerCase().includes('exterior')
    const isNight = timeOfDay.toLowerCase().includes('night') || timeOfDay.toLowerCase().includes('dusk')
    
    // Dynamic shot suggestions based on scene context
    const baseShots: Shot[] = [
      { shot_number: 1, type: 'wide', description: isExterior ? `Establishing ${location} - ${timeOfDay} wide shot` : `Wide establishing of ${location}`, camera: 'A', movement: isNight ? 'dolly' : 'static', duration: isNight ? 12 : 8 },
      { shot_number: 2, type: 'medium', description: charList.length > 0 ? `Characters entering frame` : 'Scene setup with environment', camera: 'A', movement: 'tracking', duration: 10 },
      { shot_number: 3, type: 'over_shoulder', description: charList.length > 0 ? `Conversation - ${charList[0]} to ${charList[1] || 'scene'}` : 'Two-shot setup', camera: 'A', movement: 'static', duration: 15 },
    ]
    
    if (charList.length > 0) {
      baseShots.push(
        { shot_number: 4, type: 'close_up', description: `Reaction shot - ${charList[0]}`, camera: 'B', movement: 'static', duration: 6 },
        { shot_number: 5, type: 'close_up', description: `Emotional beat - ${charList[0]}`, camera: 'B', movement: 'push in', duration: 8 }
      )
    } else {
      baseShots.push(
        { shot_number: 4, type: 'medium_close_up', description: 'Key moment in scene', camera: 'B', movement: 'static', duration: 8 },
        { shot_number: 5, type: 'insert', description: 'Object/detail shot', camera: 'B', movement: 'static', duration: 4 }
      )
    }

    const tips = [
      isExterior ? 'Check natural light direction for consistency' : 'Control artificial lighting for mood',
      isNight ? 'Use practical lights to enhance atmosphere' : 'Maximize daylight for cost efficiency',
      charList.length > 0 ? `Ensure ${charList[0]} has adequate coverage` : 'Consider adding characters for depth',
    ]

    return {
      scene_number: sceneNumber,
      total_shots: baseShots.length,
      estimated_duration: baseShots.reduce((sum, s) => sum + s.duration, 0),
      shots: baseShots,
      tips
    }
  }, [sceneNumber, location, timeOfDay, characters])

  const generateShots = async () => {
    setLoading(true)
    setError(null)
    setIsUsingDemo(false)
    
    try {
      // Try API first with relative URL
      const response = await fetch('/api/ai/generate-shot-list', {
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
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      setShots(data)
    } catch (err) {
      // Fallback to intelligent demo data
      console.log('Using demo shot list data')
      const demoData = generateDemoData()
      setShots(demoData)
      setIsUsingDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const shotTypeColors: Record<string, string> = {
    'wide': 'bg-blue-500',
    'medium': 'bg-green-500',
    'medium_close_up': 'bg-emerald-500',
    'close_up': 'bg-purple-500',
    'extreme_close_up': 'bg-pink-500',
    'pov': 'bg-yellow-500',
    'over_shoulder': 'bg-teal-500',
    'insert': 'bg-orange-500',
    'two_shot': 'bg-indigo-500',
  }

  const shotTypeIcons: Record<string, string> = {
    'wide': '🌅',
    'medium': '👥',
    'medium_close_up': '👤',
    'close_up': '👀',
    'extreme_close_up': '🔍',
    'pov': '👁️',
    'over_shoulder': '🔄',
    'insert': '✂️',
    'two_shot': '👥',
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎬</span> AI Shot List Generator
          </h3>
          {isUsingDemo && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
              Demo Mode
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Scene Number</label>
            <input
              type="number"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Location Type</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option>Interior</option>
              <option>Exterior</option>
              <option>Interior/Exterior</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Time of Day</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option>Day</option>
              <option>Night</option>
              <option>Dawn</option>
              <option>Dusk</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Characters (comma-separated)</label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="Raj, Priya, Kumar"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-slate-400 text-sm mb-1">Scene Description</label>
          <textarea
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder="Describe the scene action, mood, and key moments..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 h-24 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateShots}
          disabled={loading || !sceneDescription}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              ✨ Generate Shot List
            </>
          )}
        </motion.button>
      </div>

      {shots && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">
                Scene {shots.scene_number} - {shots.total_shots} Shots
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                📍 {location} • 🌙 {timeOfDay} • 👥 {characters || 'No characters specified'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-purple-400 text-lg font-semibold">
                ⏱️ ~{shots.estimated_duration} seconds
              </span>
              <p className="text-slate-500 text-xs mt-1">
                {Math.ceil(shots.estimated_duration / 60)} min estimated
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {shots.shots?.map((shot: Shot, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800 transition-colors"
              >
                <div className={`w-12 h-12 rounded-lg ${shotTypeColors[shot.type] || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {shot.shot_number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium uppercase text-sm">{shot.type.replace('_', ' ')}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{shot.description}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">📷 Camera {shot.camera}</span>
                    <span className="flex items-center gap-1">🎬 {shot.movement}</span>
                    <span className="flex items-center gap-1">⏱️ {shot.duration}s</span>
                  </div>
                </div>
                <div className="text-2xl opacity-60">
                  {shotTypeIcons[shot.type] || '🎬'}
                </div>
              </motion.div>
            ))}
          </div>

          {shots.tips && (
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h5 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                💡 Production Tips
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {shots.tips.map((tip: string, idx: number) => (
                  <div key={idx} className="text-slate-300 text-sm bg-slate-800/50 p-2 rounded">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
