// CinePilot - Script Uploader Component
// Enhanced script upload with format detection

'use client'

import { useState, useRef } from 'react'
import { scriptUpload, type ScriptUploadResult, type MultiScriptResult } from '../lib/api-phase24'

interface ScriptUploaderProps {
  onUploadComplete?: (result: ScriptUploadResult) => void
  onMultipleUpload?: (result: MultiScriptResult) => void
}

export default function ScriptUploader({ onUploadComplete, onMultipleUpload }: ScriptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ScriptUploadResult | null>(null)
  const [multiResult, setMultiResult] = useState<MultiScriptResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 1) {
      await uploadSingle(files[0])
    } else {
      await uploadMultiple(files)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    if (files.length === 1) {
      await uploadSingle(files[0])
    } else {
      await uploadMultiple(Array.from(files))
    }
  }

  const uploadSingle = async (file: File) => {
    setUploading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await scriptUpload.uploadAdvanced(file)
      setResult(res)
      onUploadComplete?.(res)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const uploadMultiple = async (files: File[]) => {
    setUploading(true)
    setError(null)
    setMultiResult(null)
    
    try {
      const res = await scriptUpload.uploadMultiple(files)
      setMultiResult(res)
      onMultipleUpload?.(res)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const supportedFormats = ['.fdx', '.fountain', '.txt', '.pdf', '.docx']

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">Analyzing script...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium text-gray-700 dark:text-gray-200">
              Drop script file here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports: {supportedFormats.join(', ')}
            </p>
          </>
        )}
      </div>

      {/* Multi-upload button */}
      <div className="text-center">
        <button
          onClick={() => multiFileInputRef.current?.click()}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Upload multiple scripts
        </button>
        <input
          ref={multiFileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Single File Result */}
      {result && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Upload Successful</h3>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
              {result.format_detected?.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Scenes Found</p>
              <p className="font-medium">{result.metadata?.scene_count || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Est. Pages</p>
              <p className="font-medium">{result.metadata?.estimated_pages || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Lines</p>
              <p className="font-medium">{result.metadata?.total_lines || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">File Size</p>
              <p className="font-medium">{(result.size || 0 / 1024).toFixed(1)} KB</p>
            </div>
          </div>

          {result.metadata?.locations && result.metadata.locations.length > 0 && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Locations</p>
              <div className="flex flex-wrap gap-1">
                {result.metadata.locations.slice(0, 5).map((loc, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-File Result */}
      {multiResult && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Multiple Upload Results
          </h3>
          <div className="space-y-2">
            {multiResult.files.map((file, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <span className="truncate">{file.filename}</span>
                <span className={`
                  px-2 py-0.5 text-xs rounded ml-2
                  ${file.status === 'sent' ? 'bg-green-100 text-green-700' : 
                    file.status === 'processed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-red-100 text-red-700'}
                `}>
                  {file.scene_count} scenes
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
            <span className="font-medium">{multiResult.total_scenes}</span> total scenes from{' '}
            <span className="font-medium">{multiResult.total_files}</span> files
          </div>
        </div>
      )}
    </div>
  )
}
