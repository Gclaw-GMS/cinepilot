/**
 * Script Uploader Component
 * Handles script file upload with drag & drop, parsing, and version control
 */
'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Sparkles, Loader2 } from 'lucide-react'

interface ScriptVersion {
  id: string
  versionNumber: number
  createdAt: string
  extractionScore?: number
  notes?: string
}

interface ScriptUploaderProps {
  projectId: number
  onUploadComplete?: (version: ScriptVersion) => void
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error'

interface Analysis {
  total_scenes: number
  total_locations: number
  total_characters: number
  estimated_shooting_days: number
  estimated_budget: number
  tags: string[]
  safety_warnings: string[]
  cultural_notes: string[]
}

interface ScriptAnalysisProps {
  analysis: Analysis
}

export function ScriptUploader({ projectId, onUploadComplete }: ScriptUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      validateAndSetFile(files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (f: File) => {
    const allowedTypes = ['.fountain', '.fdx', '.txt', '.pdf', '.fountain.txt']
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    
    if (!allowedTypes.includes(ext) && !f.name.toLowerCase().includes('screenplay')) {
      setError('Invalid file type. Please upload a screenplay file (.fountain, .fdx, .txt, .pdf)')
      return
    }
    
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB')
      return
    }
    
    setError(null)
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploadState('uploading')
    setProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 80))
      }, 200)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', String(projectId))
      if (notes) formData.append('notes', notes)
      
      const res = await fetch('/api/scripts', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      clearInterval(progressInterval)
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      setProgress(100)
      setUploadState('success')
      
      if (onUploadComplete) {
        onUploadComplete({
          id: data.versionId || data.scriptId || 'unknown',
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          extractionScore: data.summary?.extractionScore,
          notes: notes
        })
      }
      
      // Reset after delay
      setTimeout(() => {
        setUploadState('idle')
        setFile(null)
        setNotes('')
        setProgress(0)
      }, 3000)
      
    } catch (err) {
      setUploadState('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setNotes('')
    setUploadState('idle')
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-400 bg-cyan-400/10'
            : file
            ? 'border-green-500 bg-green-500/10'
            : uploadState === 'success'
            ? 'border-green-400 bg-green-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="script-upload"
          className="hidden"
          accept=".fountain,.fdx,.txt,.pdf,.fountain.txt"
          onChange={handleChange}
        />
        
        <label htmlFor="script-upload" className="cursor-pointer block">
          <div className="space-y-3">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
                <div className="font-medium text-white">{file.name}</div>
                <div className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    clearFile()
                  }}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </>
            ) : uploadState === 'success' ? (
              <>
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div className="font-medium text-green-400">Upload Complete!</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div className="font-medium text-white">
                  Drop your screenplay here
                </div>
                <div className="text-sm text-gray-400">
                  or click to browse (.fountain, .fdx, .txt, .pdf)
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB
                </div>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Version Notes */}
      {file && uploadState !== 'success' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Version Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe changes in this version..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Button / Progress */}
      {file && uploadState !== 'success' && (
        <div className="space-y-3">
          <button
            onClick={handleUpload}
            disabled={uploadState === 'uploading' || uploadState === 'parsing'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
          >
            {uploadState === 'uploading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading & Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Upload & Analyze Script
              </>
            )}
          </button>
          
          {uploadState === 'uploading' && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {uploadState === 'success' && (
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-xl text-center">
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-green-400 font-medium text-lg">Script uploaded successfully!</p>
          <p className="text-sm text-gray-400 mt-1">AI analysis is running in the background</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>You'll receive a notification when analysis completes</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Script Analysis Display Component
export function ScriptAnalysis({ analysis }: ScriptAnalysisProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-cyan-400">{analysis.total_scenes}</div>
        <div className="text-sm text-gray-400">Scenes</div>
      </div>
      
      <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-green-400">{analysis.total_locations}</div>
        <div className="text-sm text-gray-400">Locations</div>
      </div>
      
      <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-purple-400">{analysis.total_characters}</div>
        <div className="text-sm text-gray-400">Characters</div>
      </div>
      
      <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-orange-400">{analysis.estimated_shooting_days}</div>
        <div className="text-sm text-gray-400">Shoot Days</div>
      </div>

      {analysis.tags && analysis.tags.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Genres/Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag: string) => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.safety_warnings && analysis.safety_warnings.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Safety Notes
          </h4>
          <ul className="space-y-1">
            {analysis.safety_warnings.map((warning: string, i: number) => (
              <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-500">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.cultural_notes && analysis.cultural_notes.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
            🎭 Cultural Elements
          </h4>
          <ul className="space-y-1">
            {analysis.cultural_notes.map((note: string, i: number) => (
              <li key={i} className="text-sm text-purple-300 flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="col-span-2 md:col-span-4 mt-4 p-5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-gray-400">Estimated Budget</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ₹{analysis.estimated_budget >= 10000000 
              ? (analysis.estimated_budget / 10000000).toFixed(1) + 'Cr'
              : (analysis.estimated_budget / 100000).toFixed(1) + 'L'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScriptUploader
