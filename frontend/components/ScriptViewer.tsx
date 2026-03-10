'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, FileText, Search, Filter, Eye, Code } from 'lucide-react'

interface ScriptElement {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'
  content: string
  scene_number?: number
  line_number?: number
}

interface ScriptViewerProps {
  content?: string
  filename?: string
  scriptId?: string
}

export default function ScriptViewer({ content: initialContent, filename, scriptId }: ScriptViewerProps) {
  const [content, setContent] = useState(initialContent || '')
  const [parsedScript, setParsedScript] = useState<ScriptElement[]>([])
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch script content if scriptId is provided
  const fetchScript = useCallback(async () => {
    if (!scriptId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/scripts/${scriptId}`)
      if (!response.ok) {
        throw new Error('Failed to load script')
      }
      const data = await response.json()
      if (data.content) {
        setContent(data.content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [scriptId])

  useEffect(() => {
    if (scriptId) {
      fetchScript()
    }
  }, [scriptId, fetchScript])

  // Parse script content into elements
  useEffect(() => {
    if (!content) return
    
    const elements: ScriptElement[] = []
    const lines = content.split('\n')
    let currentScene = 0

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (!trimmed) return

      // Scene heading
      if (/^(INT\.|EXT\.|INT\/EXT\.)\s+/i.test(trimmed)) {
        currentScene++
        elements.push({
          type: 'scene_heading',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
      // Transition (CUT TO:, FADE OUT:, etc.)
      else if (/^(CUT TO|FADE (IN|OUT)|DISSOLVE TO|SMASH CUT|MATCH CUT):/i.test(trimmed)) {
        elements.push({
          type: 'transition',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
      // Character (ALL CAPS with parenthesis for extension)
      else if (/^[A-Z][A-Z\s]+(\s*\(.+\))?$/.test(trimmed) && trimmed.length < 50) {
        elements.push({
          type: 'character',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
      // Parenthetical
      else if (/^\(.+\)$/.test(trimmed)) {
        elements.push({
          type: 'parenthetical',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
      // Dialogue (after character)
      else if (elements.length > 0 && 
               elements[elements.length - 1].type === 'character') {
        elements.push({
          type: 'dialogue',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
      // Action
      else {
        elements.push({
          type: 'action',
          content: trimmed,
          scene_number: currentScene,
          line_number: index + 1
        })
      }
    })

    setParsedScript(elements)
  }, [content])

  const filteredScript = parsedScript.filter(el => {
    if (filter !== 'all' && el.type !== filter) return false
    if (searchQuery && !el.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'scene_heading': return 'SCENE'
      case 'character': return 'CHAR'
      case 'dialogue': return 'DIAL'
      case 'parenthetical': return '( )'
      case 'transition': return 'TRANS'
      default: return 'ACTION'
    }
  }

  // Stats
  const stats = {
    scenes: parsedScript.filter(e => e.type === 'scene_heading').length,
    characters: new Set(parsedScript.filter(e => e.type === 'character').map(e => e.content)).size,
    dialogue: parsedScript.filter(e => e.type === 'dialogue').length,
    lines: parsedScript.length,
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Script Viewer</h2>
            {filename && <p className="text-xs text-slate-500">{filename}</p>}
          </div>
        </div>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('parsed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${
              viewMode === 'parsed' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Parsed
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${
              viewMode === 'raw' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Raw
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading script...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium mb-1">Failed to load script</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <button 
              onClick={fetchScript}
              className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
            <div className="bg-slate-900 p-3 text-center">
              <div className="text-xl font-bold text-cyan-400">{stats.scenes}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Scenes</div>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <div className="text-xl font-bold text-yellow-400">{stats.characters}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Characters</div>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <div className="text-xl font-bold text-green-400">{stats.dialogue}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Dialogue</div>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <div className="text-xl font-bold text-purple-400">{stats.lines}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Lines</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 p-4 border-b border-slate-800 bg-slate-900/30">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search script..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-8 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50"
              >
                <option value="all">All Elements</option>
                <option value="scene_heading">Scene Headings</option>
                <option value="action">Action</option>
                <option value="character">Characters</option>
                <option value="dialogue">Dialogue</option>
                <option value="transition">Transitions</option>
              </select>
            </div>
          </div>

          {/* Script Content */}
          <div className="flex-1 overflow-auto p-4 bg-slate-950">
            {viewMode === 'parsed' ? (
              <div className="space-y-0.5 font-mono text-sm">
                {filteredScript.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No script content to display</p>
                    {scriptId && <p className="text-sm mt-1">Select a script to view</p>}
                  </div>
                ) : (
                  filteredScript.map((el, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 p-1.5 rounded transition-colors ${
                        searchQuery && el.content.toLowerCase().includes(searchQuery.toLowerCase()) 
                          ? 'bg-yellow-500/20' : 'hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-xs text-slate-600 w-8 text-right shrink-0 select-none">
                        {el.line_number}
                      </span>
                      <span className={`text-xs w-10 shrink-0 font-medium px-1.5 py-0.5 rounded ${
                        el.type === 'scene_heading' ? 'bg-cyan-500/20 text-cyan-400' :
                        el.type === 'character' ? 'bg-yellow-500/20 text-yellow-400' :
                        el.type === 'dialogue' ? 'bg-green-500/20 text-green-400' :
                        el.type === 'parenthetical' ? 'bg-slate-700 text-slate-400' :
                        el.type === 'transition' ? 'bg-purple-500/20 text-purple-400' :
                        'text-slate-500'
                      }`}>
                        {getTypeLabel(el.type)}
                      </span>
                      <span className={`flex-1 whitespace-pre-wrap ${
                        el.type === 'scene_heading' ? 'text-cyan-400 font-semibold' :
                        el.type === 'character' ? 'text-yellow-400' :
                        el.type === 'dialogue' ? 'text-green-400' :
                        el.type === 'parenthetical' ? 'text-slate-400 italic' :
                        el.type === 'transition' ? 'text-purple-400' :
                        'text-slate-300'
                      }`}>
                        {el.type === 'character' && '               '}
                        {el.type === 'dialogue' && '     '}
                        {el.content}
                      </span>
                      {el.scene_number && el.type === 'scene_heading' && (
                        <span className="text-xs text-cyan-600 shrink-0">#{el.scene_number}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">{content || 'No script loaded'}</pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
