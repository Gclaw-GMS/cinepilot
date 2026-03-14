'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StoryboardFrame {
  id?: number
  scene_id: number
  scene_number: number
  shot_number: number
  description: string
  camera_angle: string
  camera_movement: string
  duration: number
  image_url?: string
  notes: string
}

interface StoryboardViewerProps {
  frames: StoryboardFrame[]
  onFrameUpdate?: (frameId: number, data: Partial<StoryboardFrame>) => void
  onFrameDelete?: (frameId: number) => void
  editable?: boolean
}

export const StoryboardViewer: React.FC<StoryboardViewerProps> = ({
  frames,
  onFrameUpdate,
  onFrameDelete,
  editable = false
}) => {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')

  const selected = frames.find(f => f.id === selectedFrame)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-indigo-600' : 'bg-gray-700'} text-white text-sm`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded ${viewMode === 'timeline' ? 'bg-indigo-600' : 'bg-gray-700'} text-white text-sm`}
          >
            Timeline
          </button>
        </div>
        <span className="text-gray-400 text-sm">{frames.length} frames</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4">
        {/* Frame Grid/Timeline */}
        <div className={`flex-1 ${viewMode === 'timeline' ? 'overflow-x-auto' : 'overflow-auto'}`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {frames.map((frame, idx) => (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => frame.id !== undefined && setSelectedFrame(frame.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedFrame === frame.id ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="aspect-video bg-gray-700 relative">
                    {frame.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={frame.image_url} alt={`Shot ${frame.shot_number}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                      {frame.shot_number}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-xs text-gray-300">
                      {frame.duration}s
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-400 truncate">{frame.camera_angle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 pb-4">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => frame.id !== undefined && setSelectedFrame(frame.id)}
                  className={`flex-shrink-0 w-32 cursor-pointer rounded-lg overflow-hidden border-2 ${
                    selectedFrame === frame.id ? 'border-indigo-500' : 'border-gray-700'
                  }`}
                >
                  <div className="aspect-video bg-gray-700">
                    {frame.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={frame.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        {frame.shot_number}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Shot {selected.shot_number}</h3>
              {editable && selected.id !== undefined && (
                <button
                  onClick={() => selected.id !== undefined && onFrameDelete?.(selected.id as number)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Camera Angle</label>
                <p className="text-white">{selected.camera_angle}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Camera Movement</label>
                <p className="text-white">{selected.camera_movement}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Duration</label>
                <p className="text-white">{selected.duration} seconds</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <p className="text-gray-300 text-sm">{selected.description}</p>
              </div>
              {selected.notes && (
                <div>
                  <label className="text-xs text-gray-500">Notes</label>
                  <p className="text-gray-400 text-sm">{selected.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Add New Frame Component
interface AddStoryboardFrameProps {
  sceneId: number
  nextShotNumber: number
  onAdd: (frame: Partial<StoryboardFrame>) => void
}

export const AddStoryboardFrame: React.FC<AddStoryboardFrameProps> = ({
  sceneId,
  nextShotNumber,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    camera_angle: 'Medium Shot',
    camera_movement: 'Static',
    description: '',
    duration: 3,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      scene_id: sceneId,
      shot_number: nextShotNumber,
      ...formData
    })
    setFormData({
      camera_angle: 'Medium Shot',
      camera_movement: 'Static',
      description: '',
      duration: 3,
      notes: ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Add New Frame</h3>
      <div className="grid grid-cols-2 gap-3">
        <select
          value={formData.camera_angle}
          onChange={(e) => setFormData({ ...formData, camera_angle: e.target.value })}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option>Extreme Wide Shot</option>
          <option>Wide Shot</option>
          <option>Medium Shot</option>
          <option>Close-Up</option>
          <option>Extreme Close-Up</option>
          <option>POV</option>
        </select>
        <select
          value={formData.camera_movement}
          onChange={(e) => setFormData({ ...formData, camera_movement: e.target.value })}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option>Static</option>
          <option>Pan</option>
          <option>Tilt</option>
          <option>Dolly</option>
          <option>Crane</option>
          <option>Tracking</option>
          <option>Handheld</option>
        </select>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          min="1"
          max="30"
        />
      </div>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Shot description..."
        className="w-full mt-3 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        rows={2}
      />
      <button
        type="submit"
        className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
      >
        Add Frame
      </button>
    </form>
  )
}

export default StoryboardViewer
