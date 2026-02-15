/**
 * CinePilot - Script Analysis Dashboard
 * Enhanced AI Analysis with Pacing, Characters, Emotional Arc, and Tags
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiAnalysis, scriptUpload, whatsappEnhanced, collaborationNew } from '../lib/api'

interface AnalysisResult {
  pacing_analysis?: any
  characters?: any
  emotional_journey?: any
  tags?: any
}

export default function ScriptAnalysisDashboard({ projectId }: { projectId?: number }) {
  const [scriptContent, setScriptContent] = useState('')
  const [language, setLanguage] = useState('tamil')
  const [activeTab, setActiveTab] = useState<'pacing' | 'characters' | 'emotions' | 'tags'>('pacing')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalysisResult>({})
  const [tasks, setTasks] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    if (!projectId) return
    try {
      const [tasksData, activityData, expensesData] = await Promise.all([
        collaborationNew.getTasks(projectId),
        collaborationNew.getActivity(projectId),
        collaborationNew.getExpenses(projectId)
      ])
      setTasks(tasksData.tasks || [])
      setActivity(activityData.activities || [])
      setExpenses(expensesData.expenses || [])
    } catch (e) {
      console.error('Failed to load project data:', e)
    }
  }

  const runAllAnalysis = async () => {
    if (!scriptContent.trim()) return
    setLoading(true)
    try {
      const [pacing, characters, emotions, tags] = await Promise.all([
        aiAnalysis.analyzePacing(scriptContent, language),
        aiAnalysis.analyzeCharacters(scriptContent, language),
        aiAnalysis.analyzeEmotionalArc(scriptContent, language),
        aiAnalysis.generateTags(scriptContent, language)
      ])
      setResults({ ...pacing, ...characters, ...emotions, ...tags })
    } catch (e) {
      console.error('Analysis failed:', e)
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'pacing', label: '⏱️ Pacing', icon: '⏱️' },
    { id: 'characters', label: '👥 Characters', icon: '👥' },
    { id: 'emotions', label: '💫 Emotions', icon: '💫' },
    { id: 'tags', label: '🏷️ Tags', icon: '🏷️' },
  ]

  return (
    <div className="space-y-6">
      {/* Script Input */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">📝 Script Analysis</h2>
        
        <div className="flex gap-4 mb-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
          >
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
          
          <button
            onClick={runAllAnalysis}
            disabled={loading || !scriptContent.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '🔄 Analyzing...' : '🔍 Run Full Analysis'}
          </button>
        </div>

        <textarea
          value={scriptContent}
          onChange={(e) => setScriptContent(e.target.value)}
          placeholder="Paste your script here for AI analysis..."
          className="w-full h-40 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
        />
      </div>

      {/* Analysis Results */}
      {Object.keys(results).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-800"
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-4 font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'pacing' && results.pacing_analysis && (
                <motion.div
                  key="pacing"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">{results.pacing_analysis.dialogue_ratio}%</div>
                      <div className="text-gray-400 text-sm">Dialogue</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">{results.pacing_analysis.action_ratio}%</div>
                      <div className="text-gray-400 text-sm">Action</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">{results.pacing_analysis.total_pages}</div>
                      <div className="text-gray-400 text-sm">Est. Pages</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">{results.pacing_analysis.pacing_score}</div>
                      <div className="text-gray-400 text-sm">Pacing</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3">📊 Scene Breakdown</h4>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-gray-300">
                        <p>• Avg Dialogue/Scene: {results.pacing_analysis.scene_lengths?.avg_dialogue_per_scene}</p>
                        <p>• Avg Action/Scene: {results.pacing_analysis.scene_lengths?.avg_action_per_scene}</p>
                        <p>• Estimated Runtime: {results.pacing_analysis.estimated_runtime}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'characters' && results.characters && (
                <motion.div
                  key="characters"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">{results.characters.summary?.total_characters}</div>
                      <div className="text-gray-400 text-sm">Total Characters</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">{results.characters.summary?.major_roles}</div>
                      <div className="text-gray-400 text-sm">Major Roles</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {results.characters.characters?.slice(0, 8).map((char: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                        <span className="text-white font-medium">{char.name}</span>
                        <span className="text-gray-400 text-sm">{char.role}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'emotions' && results.emotional_journey && (
                <motion.div
                  key="emotions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">🎭 Emotional Arc Shape</h4>
                    <div className="text-3xl font-bold text-purple-400">{results.emotional_journey.arc_shape?.replace('_', ' ')}</div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3">📈 Emotion Markers</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {Object.entries(results.emotional_journey.markers || {}).map(([emotion, count]: [string, any]) => (
                        <div key={emotion} className="bg-gray-800 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{count}</div>
                          <div className="text-gray-400 text-xs capitalize">{emotion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tags' && results.tags && (
                <motion.div
                  key="tags"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap gap-2">
                    {results.tags.genres?.map((genre: string, idx: number) => (
                      <span key={idx} className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm">
                        🎬 {genre}
                      </span>
                    ))}
                    {results.tags.moods?.map((mood: string, idx: number) => (
                      <span key={idx} className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm">
                        {mood}
                      </span>
                    ))}
                    {results.tags.settings?.map((setting: string, idx: number) => (
                      <span key={idx} className="bg-green-600/30 text-green-300 px-3 py-1 rounded-full text-sm">
                        📍 {setting}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Target Audience</div>
                      <div className="text-xl font-bold text-white">{results.tags.target_audience}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Certification</div>
                      <div className="text-xl font-bold text-yellow-400">{results.tags.certification_suggestion}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Project Collaboration Section */}
      {projectId && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">📋 Activity</h3>
            <div className="space-y-3">
              {activity.slice(0, 5).map((item: any) => (
                <div key={item.id} className="text-gray-300 text-sm">
                  <span className="text-white">{item.user}:</span> {item.description}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">✅ Tasks</h3>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' : 
                    task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-300 text-sm">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses Summary */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">💰 Expenses</h3>
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense: any) => (
                <div key={expense.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{expense.item}</span>
                  <span className="text-white">₹{(expense.actual / 100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
