/**
 * Script Uploader Component
 * Handles script file upload with drag & drop, parsing, and version control
 */
'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface ScriptVersion {
  id: string
  versionNumber: number
  extractionScore: number | null
  createdAt: string
}

interface ScriptUploaderProps {
  projectId?: string
  onUploadComplete?: (version: ScriptVersion) => void
  onAnalysisComplete?: (analysis: ScriptAnalysisResult) => void
}

interface ScriptAnalysisResult {
  total_scenes: number
  total_locations: number
  total_characters: number
  estimated_shooting_days: number
  estimated_budget: number
  tags: string[]
  safety_warnings: string[]
  cultural_notes: string[]
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error'

const ALLOWED_EXTENSIONS = ['.fountain', '.fdx', '.txt', '.pdf', '.fountain.txt']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ScriptUploader({ projectId = 'default-project', onUploadComplete, onAnalysisComplete }: ScriptUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [uploadedVersion, setUploadedVersion] = useState<ScriptVersion | null>(null)

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
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    
    if (!ALLOWED_EXTENSIONS.includes(ext) && !f.name.toLowerCase().includes('screenplay')) {
      setError('Invalid file type. Please upload a screenplay file (.fountain, .fdx, .txt, .pdf)')
      return
    }
    
    if (f.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB')
      return
    }
    
    setError(null)
    setFile(f)
    setUploadState('idle')
    setUploadedVersion(null)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploadState('uploading')
    setProgress(0)
    setError(null)
    
    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      if (notes) {
        formData.append('notes', notes)
      }
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 70))
      }, 200)
      
      // Upload to API
      const res = await fetch('/api/scripts', {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(progressInterval)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${res.status}`)
      }
      
      const data = await res.json()
      
      setProgress(100)
      setUploadState('success')
      
      // Set the uploaded version
      if (data.version) {
        setUploadedVersion(data.version)
        onUploadComplete?.(data.version)
      }
      
      // If analysis is included, pass it up
      if (data.analysis) {
        onAnalysisComplete?.(data.analysis)
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
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setUploadState('idle')
    setProgress(0)
    setNotes('')
    setUploadedVersion(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-400 bg-cyan-400/10'
            : file
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
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
          disabled={uploadState === 'uploading' || uploadState === 'parsing'}
        />
        
        <label htmlFor="script-upload" className={`cursor-pointer ${uploadState === 'uploading' ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="space-y-3">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">{file.name}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    Drop your screenplay here
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    or click to browse (.fountain, .fdx, .txt, .pdf)
                  </div>
                </div>
              </>
            )}
          </div>
        </label>

        {/* Clear button */}
        {file && uploadState === 'idle' && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              clearFile()
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Version Notes */}
      {file && uploadState !== 'success' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Version Notes <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe changes in this version..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            rows={2}
            disabled={uploadState === 'uploading'}
          />
        </div>
      )}

      {/* Upload Button / Progress */}
      {file && uploadState !== 'success' && (
        <div className="space-y-2">
          <button
            onClick={handleUpload}
            disabled={uploadState === 'uploading' || uploadState === 'parsing'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            {uploadState === 'uploading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Script
              </>
            )}
          </button>
          
          {uploadState === 'uploading' && progress > 0 && (
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {uploadState === 'success' && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-emerald-400 font-medium">Script uploaded successfully!</p>
          <p className="text-sm text-emerald-400/70 mt-1">AI analysis will begin shortly</p>
          {uploadedVersion && (
            <p className="text-xs text-slate-500 mt-2">
              Version {uploadedVersion.versionNumber} • Score: {uploadedVersion.extractionScore ? `${(uploadedVersion.extractionScore * 100).toFixed(0)}%` : 'N/A'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Script Analysis Display Component
interface ScriptAnalysisProps {
  analysis: ScriptAnalysisResult
}

export function ScriptAnalysis({ analysis }: ScriptAnalysisProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-cyan-400">{analysis.total_scenes}</div>
        <div className="text-sm text-slate-400 mt-1">Scenes</div>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-emerald-400">{analysis.total_locations}</div>
        <div className="text-sm text-slate-400 mt-1">Locations</div>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-purple-400">{analysis.total_characters}</div>
        <div className="text-sm text-slate-400 mt-1">Characters</div>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-amber-400">{analysis.estimated_shooting_days}</div>
        <div className="text-sm text-slate-400 mt-1">Shoot Days</div>
      </div>

      {analysis.tags && analysis.tags.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Genres/Tags</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700">
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
            {analysis.safety_warnings.map((warning, i) => (
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
          <h4 className="text-sm font-medium text-indigo-400 mb-2 flex items-center gap-2">
            🎭 Cultural Elements
          </h4>
          <ul className="space-y-1">
            {analysis.cultural_notes.map((note, i) => (
              <li key={i} className="text-sm text-indigo-300 flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="col-span-2 md:col-span-4 mt-2 p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-slate-400">Estimated Budget</div>
          <div className="text-3xl font-bold text-cyan-400 mt-1">
            ₹{analysis.estimated_budget >= 10000000 
              ? `${(analysis.estimated_budget / 10000000).toFixed(1)}Cr` 
              : analysis.estimated_budget >= 100000 
                ? `${(analysis.estimated_budget / 100000).toFixed(1)}L`
                : analysis.estimated_budget.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScriptUploader
