/**
 * Script Uploader Component
 * Handles script file upload with drag & drop, parsing, and version control
 */
'use client'

import { useState, useCallback } from 'react'
import { scriptVersions, type ScriptVersion } from '../lib/api'

interface ScriptUploaderProps {
  projectId: number
  onUploadComplete?: (version: ScriptVersion) => void
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error'

export function ScriptUploader({ projectId, onUploadComplete }: ScriptUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
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
      
      const version = await scriptVersions.upload(projectId, file, notes)
      
      clearInterval(progressInterval)
      setProgress(100)
      setUploadState('success')
      
      if (onUploadComplete) {
        onUploadComplete(version)
      }
      
      // Reset after delay
      setTimeout(() => {
        setUploadState('idle')
        setFile(null)
        setNotes('')
        setProgress(0)
      }, 2000)
      
    } catch (err) {
      setUploadState('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
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
        
        <label htmlFor="script-upload" className="cursor-pointer">
          <div className="space-y-2">
            {file ? (
              <>
                <div className="text-4xl">📄</div>
                <div className="font-medium text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl">📜</div>
                <div className="font-medium text-gray-900">
                  Drop your screenplay here
                </div>
                <div className="text-sm text-gray-500">
                  or click to browse (.fountain, .fdx, .txt, .pdf)
                </div>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Version Notes */}
      {file && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe changes in this version..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Button / Progress */}
      {file && uploadState !== 'success' && (
        <div className="space-y-2">
          <button
            onClick={handleUpload}
            disabled={uploadState === 'uploading' || uploadState === 'parsing'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadState === 'uploading' ? 'Uploading...' : 'Upload Script'}
          </button>
          
          {uploadState === 'uploading' && progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {uploadState === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-green-800 font-medium">Script uploaded successfully!</p>
          <p className="text-sm text-green-600">AI analysis will begin shortly</p>
        </div>
      )}
    </div>
  )
}

// Script Analysis Display Component
interface ScriptAnalysisProps {
  analysis: {
    total_scenes: number
    total_locations: number
    total_characters: number
    estimated_shooting_days: number
    estimated_budget: number
    tags: string[]
    safety_warnings: string[]
    cultural_notes: string[]
  }
}

export function ScriptAnalysis({ analysis }: ScriptAnalysisProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-blue-600">{analysis.total_scenes}</div>
        <div className="text-sm text-gray-600">Scenes</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-green-600">{analysis.total_locations}</div>
        <div className="text-sm text-gray-600">Locations</div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-purple-600">{analysis.total_characters}</div>
        <div className="text-sm text-gray-600">Characters</div>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-orange-600">{analysis.estimated_shooting_days}</div>
        <div className="text-sm text-gray-600">Shoot Days</div>
      </div>

      {analysis.tags.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Genres/Tags</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.safety_warnings.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">⚠️ Safety Notes</h4>
          <ul className="space-y-1">
            {analysis.safety_warnings.map((warning, i) => (
              <li key={i} className="text-sm text-red-600">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.cultural_notes.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-indigo-700 mb-2">🎭 Cultural Elements</h4>
          <ul className="space-y-1">
            {analysis.cultural_notes.map((note, i) => (
              <li key={i} className="text-sm text-indigo-600">• {note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="col-span-2 md:col-span-4 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600">Estimated Budget</div>
          <div className="text-3xl font-bold text-indigo-600">
            ₹{(analysis.estimated_budget / 100000).toFixed(1)}L
          </div>
        </div>
      </div>
    </div>
  )
}
