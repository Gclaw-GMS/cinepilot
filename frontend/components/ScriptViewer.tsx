'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface ScriptElement {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'
  content: string
  scene_number?: number
  line_number?: number
}

interface ScriptViewerProps {
  content?: string
  filename?: string
}

export default function ScriptViewer({ content: initialContent, filename }: ScriptViewerProps) {
  const [content, setContent] = useState(initialContent || '')
  const [parsedScript, setParsedScript] = useState<ScriptElement[]>([])
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scene_heading': return 'text-cyan-400 bg-cyan-900/20'
      case 'character': return 'text-yellow-400 bg-yellow-900/20'
      case 'dialogue': return 'text-green-400 bg-green-900/20'
      case 'parenthetical': return 'text-gray-400 bg-gray-800'
      case 'transition': return 'text-purple-400 bg-purple-900/20'
      default: return 'text-gray-300'
    }
  }

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">📜 Script Viewer</h2>
          {filename && <p className="text-sm text-gray-500">{filename}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('parsed')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'parsed' ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            Parsed
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'raw' ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            Raw
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-lg font-bold text-cyan-400">{stats.scenes}</div>
          <div className="text-xs text-gray-500">Scenes</div>
        </div>
        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-lg font-bold text-yellow-400">{stats.characters}</div>
          <div className="text-xs text-gray-500">Characters</div>
        </div>
        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-lg font-bold text-green-400">{stats.dialogue}</div>
          <div className="text-xs text-gray-500">Dialogue</div>
        </div>
        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-lg font-bold text-purple-400">{stats.lines}</div>
          <div className="text-xs text-gray-500">Lines</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search script..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        >
          <option value="all">All Elements</option>
          <option value="scene_heading">Scene Headings</option>
          <option value="action">Action</option>
          <option value="character">Characters</option>
          <option value="dialogue">Dialogue</option>
          <option value="transition">Transitions</option>
        </select>
      </div>

      {/* Script Content */}
      <div className="flex-1 overflow-auto bg-gray-950 rounded-lg p-4 font-mono text-sm">
        {viewMode === 'parsed' ? (
          <div className="space-y-1">
            {filteredScript.map((el, i) => (
              <div 
                key={i} 
                className={`flex gap-2 p-1 rounded ${getTypeColor(el.type)} ${
                  searchQuery && el.content.toLowerCase().includes(searchQuery.toLowerCase()) 
                    ? 'bg-yellow-900/50' : ''
                }`}
              >
                <span className="text-xs text-gray-600 w-8 text-right opacity-50">
                  {el.line_number}
                </span>
                <span className="text-xs text-gray-500 w-10 shrink-0 opacity-50">
                  {getTypeLabel(el.type)}
                </span>
                <span className="flex-1 whitespace-pre-wrap">
                  {el.type === 'character' && '                    '}
                  {el.type === 'dialogue' && '          '}
                  {el.content}
                </span>
                {el.scene_number && el.type === 'scene_heading' && (
                  <span className="text-xs text-cyan-600">[{el.scene_number}]</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap">{content || 'No script loaded'}</pre>
        )}
      </div>
    </div>
  )
}
