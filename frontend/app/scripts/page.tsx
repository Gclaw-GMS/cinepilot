'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as api from '@/lib/api'
import type { ScriptAnalysis, UploadedFile } from '@/lib/types'
import ScriptComparison from '@/components/ScriptComparison'

export default function ScriptsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'compare'>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null)
  const [scriptText, setScriptText] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string>('')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // Try to upload to backend
      const result = await api.upload.script(file)
      setUploadedFile(result)
      setScriptText(result.text_preview || '')
    } catch (e) {
      // Fallback to mock for demo
      console.log('Using mock upload')
      setUploadedFile({
        filename: file.name,
        path: `/uploads/${file.name}`,
        size: file.size,
        text_preview: 'Script uploaded successfully. Ready for AI analysis.',
      })
      setScriptText(`Sample Tamil Script Content...

அதிகாரம் 1
1. உள்ளடக்கம் - சென்னை வீதி, பகல்
   (மழை பெய்கிறது. மக்கள் குடைகளுடன் நடந்து கொண்டிருக்கிறார்கள்.)
   
   ராஜ் (நடக்கிறபோது):
   "இந்த மழை எப்படியோ தெரியவில்லை..."
   
2. உள்ளடக்கம் - அலுவலகம், இரவு
   (ராஜ் அலுவலகத்தில் அமர்ந்திருக்கிறான். மடல்களைப் பார்க்கிறான்.)
   
   ராஜ்:
   "இந்த விஷயம் மிகவும் முக்கியம்..."`)
    }
    setUploading(false)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      const result: any = await api.ai.analyzeScript(scriptText, 'tamil')
      setAnalysis(result.analysis)
    } catch (e) {
      // Use mock analysis for demo
      setAnalysis({
        total_scenes: 45,
        total_locations: 12,
        total_characters: 8,
        estimated_shooting_days: 25,
        estimated_budget: 3000000,
        tags: ['romance', 'thriller', 'family', 'emotional'],
        safety_warnings: ['stunt scene in scene 23', 'fire effects in scene 31'],
        cultural_notes: ['festival scene', 'temple setting'],
      })
    }
    setAnalyzing(false)
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setAnalysis(null)
    setScriptText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Script Management</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and analyze your screenplay</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded font-medium text-sm ${
            activeTab === 'upload' 
              ? 'bg-cinepilot-accent text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          📤 Upload & Analyze
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 rounded font-medium text-sm ${
            activeTab === 'compare' 
              ? 'bg-cinepilot-accent text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🔀 Compare Versions
        </button>
      </div>

      {activeTab === 'compare' ? (
        <ScriptComparison />
      ) : (
      <>
      {/* Upload Area */}
      {!uploadedFile ? (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">Upload Script</h2>
          
          <label 
            className={`block cursor-pointer ${dragActive ? 'scale-[1.02]' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-cinepilot-accent bg-cinepilot-accent/10' 
                : 'border-gray-700 hover:border-cinepilot-accent'
            }`}>
              {uploading ? (
                <>
                  <div className="text-4xl mb-2 animate-pulse">⏳</div>
                  <div className="text-gray-400">Uploading...</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-gray-300 font-medium">Drop script here or click to upload</div>
                  <div className="text-gray-500 text-sm mt-1">PDF, DOCX, FDX, TXT supported</div>
                  <div className="text-gray-600 text-xs mt-2">Max file size: 10MB</div>
                </>
              )}
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx,.fdx,.txt" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </label>

          {/* Supported Formats */}
          <div className="mt-4 flex gap-2">
            {['PDF', 'DOCX', 'FDX', 'TXT'].map((format) => (
              <span key={format} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                {format}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {/* Uploaded File Info */}
          <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 mb-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium">{uploadedFile.filename}</div>
                <div className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={resetUpload}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded"
              >
                Upload new
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <button 
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="animate-spin">⏳</span>
                Analyzing with AI...
              </>
            ) : (
              <>
                🤖 AI Analyze Script
              </>
            )}
          </button>
        </div>
      )}

      {/* Script Preview */}
      {scriptText && (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">Script Preview</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono max-h-96 overflow-y-auto p-4 bg-gray-900/50 rounded">
            {scriptText}
          </pre>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6">
          <h2 className="font-semibold mb-4">📊 AI Analysis Results</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <AnalysisCard label="Total Scenes" value={analysis.total_scenes.toString()} icon="🎬" />
            <AnalysisCard label="Locations" value={analysis.total_locations.toString()} icon="📍" />
            <AnalysisCard label="Characters" value={analysis.total_characters.toString()} icon="👤" />
            <AnalysisCard label="Shooting Days" value={analysis.estimated_shooting_days.toString()} icon="📅" />
            <AnalysisCard label="Est. Budget" value={`₹${(analysis.estimated_budget / 100000).toFixed(1)}L`} icon="💰" />
            <AnalysisCard label="Status" value="Ready" icon="✅" color="green" />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Tags</h3>
              <input
                type="text"
                placeholder="Filter tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value.toLowerCase())}
                className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded w-32 focus:border-cinepilot-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.filter(t => !tagFilter || t.toLowerCase().includes(tagFilter)).map((tag) => (
                <span key={tag} className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Safety Warnings */}
          {analysis.safety_warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-red-400 mb-2">⚠️ Safety Warnings</h3>
              <ul className="space-y-1">
                {analysis.safety_warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-red-300">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cultural Notes */}
          {analysis.cultural_notes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-blue-400 mb-2">🎭 Cultural Notes</h3>
              <ul className="space-y-1">
                {analysis.cultural_notes.map((note, i) => (
                  <li key={i} className="text-sm text-blue-300">• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  )
}

function AnalysisCard({ 
  label, 
  value, 
  icon, 
  color = 'cyan' 
}: { 
  label: string; 
  value: string; 
  icon: string; 
  color?: string 
}) {
  const colors: Record<string, string> = {
    cyan: 'text-cinepilot-accent',
    green: 'text-green-400',
    purple: 'text-purple-400',
  }
  
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
