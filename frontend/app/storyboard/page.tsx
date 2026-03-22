'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Search, RefreshCw, HelpCircle, X, Download, Printer, ChevronDown, Keyboard, Filter, FileText, Clock, BarChart3, PieChart as RePieChart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface FrameData {
  id: string
  imageUrl: string | null
  prompt: string | null
  style: string
  status: string
  directorNotes: string | null
  isApproved: boolean
  shot: {
    id: string
    shotIndex: number
    shotText: string
    shotSize: string | null
    characters: string[]
    scene: {
      id: string
      sceneNumber: number
      headingRaw: string | null
      intExt: string | null
      timeOfDay: string | null
    }
  }
}

interface SceneGroup {
  sceneId: string
  sceneNumber: number
  heading: string
  frames: FrameData[]
}

interface ScriptOption {
  id: string
  title: string
}

const STYLES = [
  { key: 'cleanLineArt', label: 'Clean Line Art', icon: '✏' },
  { key: 'pencilSketch', label: 'Pencil Sketch', icon: '✎' },
  { key: 'markerLine', label: 'Marker & Ink', icon: '✒' },
  { key: 'blueprint', label: 'Blueprint', icon: '▦' },
]

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6']

export default function StoryboardPage() {
  const [scripts, setScripts] = useState<ScriptOption[]>([])
  const [selectedScript, setSelectedScript] = useState<string>('')
  const [scenes, setScenes] = useState<SceneGroup[]>([])
  const [totalFrames, setTotalFrames] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('cleanLineArt')
  const [generatingScene, setGeneratingScene] = useState<string | null>(null)
  const [generatingShot, setGeneratingShot] = useState<string | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null)
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [maxFrames, setMaxFrames] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sceneFilter, setSceneFilter] = useState<string>('all')
  const [printing, setPrinting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<'scene' | 'shot' | 'status' | 'approved'>('scene')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds
  
  // Refs for keyboard shortcuts and data
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedScriptRef = useRef(selectedScript)
  const scenesLengthRef = useRef(scenes.length)
  const handleRefreshRef = useRef<() => void>(() => {})
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const handleExportMarkdownRef = useRef<() => void>(() => {})
  
  // Refs for context-aware keyboard shortcuts
  const showFiltersRef = useRef(showFilters)
  const statusFilterRef = useRef(statusFilter)
  const selectedStyleRef = useRef(selectedStyle)
  const activeFilterCountRef = useRef(0)
  const clearFiltersRef = useRef<() => void>(() => {})
  
  // Refs for auto-refresh
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)

  useEffect(() => {
    selectedScriptRef.current = selectedScript
  }, [selectedScript])

  useEffect(() => {
    scenesLengthRef.current = scenes.length
  }, [scenes.length])

  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    statusFilterRef.current = statusFilter
  }, [statusFilter])

  useEffect(() => {
    selectedStyleRef.current = selectedStyle
  }, [selectedStyle])

  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  useEffect(() => {
    fetch('/api/scripts')
      .then(r => r.json())
      .then(data => {
        const s = (data.scripts || []).map((sc: { id: string; title: string }) => ({
          id: sc.id,
          title: sc.title,
        }))
        setScripts(s)
        if (s.length > 0 && !selectedScriptRef.current) setSelectedScript(s[0].id)
      })
      .catch(console.error)
  }, [])

  const fetchFrames = useCallback(async () => {
    if (!selectedScript) return
    setLoading(true)
    try {
      const res = await fetch(`/api/storyboard?scriptId=${selectedScript}`)
      const data = await res.json()
      setScenes(data.scenes || [])
      setTotalFrames(data.totalFrames || 0)
    } catch (err) {
      console.error('Failed to load frames:', err)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [selectedScript])

  // Handle refresh with animation - MUST be before the useEffect that refs it
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchFrames()
    setIsRefreshing(false)
  }, [fetchFrames])

  // Update ref after handleRefresh is defined
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      handleRefreshRef.current?.()
    }, autoRefreshInterval * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, fetchFrames])

  // Export functions using filtered/sorted data
  const handleExportCSV = () => {
    if (filteredScenes.length === 0) return
    const headers = ['Scene', 'Shot', 'Frame ID', 'Status', 'Approved', 'Style', 'Prompt']
    const rows: string[][] = []
    filteredScenes.forEach(scene => {
      scene.frames.forEach(frame => {
        rows.push([
          scene.sceneNumber.toString(),
          frame.shot.shotIndex.toString(),
          frame.id,
          frame.status,
          frame.isApproved ? 'Yes' : 'No',
          frame.style,
          frame.prompt || '',
        ])
      })
    })
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storyboard-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    if (filteredScenes.length === 0) return
    const data = {
      exportDate: new Date().toISOString(),
      filters: {
        searchQuery,
        statusFilter,
        sceneFilter,
        sortBy,
        sortOrder,
      },
      totalScenes: filteredScenes.length,
      totalFrames: filteredScenes.reduce((sum, s) => sum + s.frames.length, 0),
      summary: {
        approved: filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0),
        pending: filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'pending').length, 0),
        failed: filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0),
      },
      scenes: filteredScenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        heading: scene.heading,
        frames: scene.frames.map(frame => ({
          id: frame.id,
          shotIndex: frame.shot.shotIndex,
          status: frame.status,
          isApproved: frame.isApproved,
          style: frame.style,
          prompt: frame.prompt,
          directorNotes: frame.directorNotes,
        })),
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storyboard-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleExportMarkdown = () => {
    // Compute filtered scenes inline (same logic as filteredScenes useMemo)
    let filtered = scenes
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(scene => 
        scene.sceneNumber.toString().includes(query) ||
        (scene.heading?.toLowerCase().includes(query)) ||
        scene.frames.some(frame => 
          frame.shot.shotText?.toLowerCase().includes(query) ||
          frame.shot.shotSize?.toLowerCase().includes(query) ||
          frame.directorNotes?.toLowerCase().includes(query)
        )
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(scene => {
        if (statusFilter === 'approved') {
          return scene.frames.some(f => f.isApproved)
        } else if (statusFilter === 'pending') {
          return scene.frames.some(f => !f.isApproved && f.status !== 'failed')
        } else if (statusFilter === 'failed') {
          return scene.frames.some(f => f.status === 'failed')
        }
        return true
      })
    }
    if (sceneFilter !== 'all') {
      filtered = filtered.filter(scene => scene.sceneId === sceneFilter)
    }
    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'scene':
          comparison = a.sceneNumber - b.sceneNumber
          break
        case 'shot':
          const aShot = a.frames[0]?.shot.shotIndex || 0
          const bShot = b.frames[0]?.shot.shotIndex || 0
          comparison = aShot - bShot
          break
        case 'status':
          comparison = (a.frames[0]?.status || '').localeCompare(b.frames[0]?.status || '')
          break
        case 'approved':
          comparison = (a.frames.some(f => f.isApproved) ? 1 : 0) - (b.frames.some(f => f.isApproved) ? 1 : 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    if (filtered.length === 0) return

    // Calculate summary stats
    const totalFrames = filtered.reduce((sum, s) => sum + s.frames.length, 0)
    const approvedFrames = filtered.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
    const pendingFrames = filtered.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'pending').length, 0)
    const failedFrames = filtered.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)
    const generatingFrames = filtered.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'generating').length, 0)

    // Build filter info
    const filterInfo: string[] = []
    if (searchQuery) filterInfo.push(`Search: "${searchQuery}"`)
    if (statusFilter !== 'all') filterInfo.push(`Status: ${statusFilter}`)
    if (sceneFilter !== 'all') filterInfo.push(`Scene: ${sceneFilter}`)
    filterInfo.push(`Sort: ${sortBy} (${sortOrder})`)
    filterInfo.push(`Style: ${selectedStyle}`)

    // Get script title
    const scriptTitle = scripts.find(s => s.id === selectedScript)?.title || 'Unknown Script'

    let markdown = `# 🎬 CinePilot Storyboard Export

> Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

---

## 📋 Overview

| Metric | Value |
|--------|-------|
| **Script** | ${scriptTitle} |
| **Total Scenes** | ${filteredScenes.length} |
| **Total Frames** | ${totalFrames} |
| **Approved** | ${approvedFrames} |
| **Pending** | ${pendingFrames} |
| **Generating** | ${generatingFrames} |
| **Failed** | ${failedFrames} |
| **Export Date** | ${new Date().toLocaleDateString('en-IN')} |

### Filters Applied
${filterInfo.map(f => `- ${f}`).join('\n')}

---

## 🎨 Style: ${STYLES.find(s => s.key === selectedStyle)?.label || selectedStyle}

---

## 📽️ Scene Breakdown

${filteredScenes.map(scene => {
  const sceneApproved = scene.frames.filter(f => f.isApproved).length
  const scenePending = scene.frames.filter(f => f.status === 'pending').length
  const sceneGenerating = scene.frames.filter(f => f.status === 'generating').length
  const sceneFailed = scene.frames.filter(f => f.status === 'failed').length
  
  return `### Scene ${scene.sceneNumber}: ${scene.heading || 'Untitled'}

| Shot | Frame ID | Status | Approved | Style | Prompt |
|------|----------|--------|----------|-------|--------|
${scene.frames.map(frame => `| ${frame.shot.shotIndex} | ${frame.id.slice(0, 8)}... | ${frame.status} | ${frame.isApproved ? '✅' : '❌'} | ${frame.style} | ${frame.prompt ? frame.prompt.slice(0, 50) + (frame.prompt.length > 50 ? '...' : '') : '-'} |`).join('\n')}

**Scene Summary:** ${sceneApproved} approved, ${scenePending} pending, ${sceneGenerating} generating, ${sceneFailed} failed
`
}).join('\n---\n\n')}

---

## 📝 Director Notes

${filteredScenes.map(scene => 
  scene.frames.filter(f => f.directorNotes).map(frame => 
    `- **Scene ${scene.sceneNumber}, Shot ${frame.shot.shotIndex}:** ${frame.directorNotes}`
  ).join('\n')
).filter(n => n).join('\n') || '*No director notes recorded*'}

---

## 🔍 Frame Details

${filteredScenes.map(scene => 
  scene.frames.map(frame => 
    `### Scene ${scene.sceneNumber} - Shot ${frame.shot.shotIndex} (${frame.id})

- **Status:** ${frame.status}
- **Approved:** ${frame.isApproved ? 'Yes' : 'No'}
- **Style:** ${frame.style}
- **Prompt:** ${frame.prompt || '*None*'}
- **Director Notes:** ${frame.directorNotes || '*None*'}
- **Shot Text:** ${frame.shot.shotText || '*None*'}
- **Shot Size:** ${frame.shot.shotSize || '*None*'}
- **Characters:** ${frame.shot.characters?.join(', ') || '*None*'}
- **Scene Info:** ${frame.shot.scene.headingRaw || '*None*'} (${frame.shot.scene.intExt || '-'} / ${frame.shot.scene.timeOfDay || '-'})

`
  ).join('\n')
).join('\n---\n\n')}

---

*Storyboard exported by CinePilot - Film Production Management System*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storyboard-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Update ref when function changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  // Print functionality using filtered/sorted data
  const handlePrint = () => {
    if (filteredScenes.length === 0) return
    setPrinting(true)

    // Calculate stats from filtered data
    const totalFrames = filteredScenes.reduce((sum, s) => sum + s.frames.length, 0)
    const approvedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
    const pendingCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'pending' || f.status === 'generating').length, 0)
    const failedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)

    // Build scenes HTML from filtered data
    const scenesHtml = filteredScenes.map(scene => {
      const framesHtml = scene.frames.map(frame => `
        <div style="page-break-inside: avoid; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <strong style="font-size: 14px;">Shot ${frame.shot.shotIndex + 1}</strong>
              <span style="margin-left: 10px; font-size: 12px; color: #666;">${frame.shot.shotSize || 'N/A'}</span>
            </div>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; ${
              frame.isApproved ? 'background: #d1fae5; color: #065f46;' :
              frame.status === 'failed' ? 'background: #fee2e2; color: #991b1b;' :
              'background: #fef3c7; color: #92400e;'
            }">
              ${frame.isApproved ? 'Approved' : frame.status === 'failed' ? 'Failed' : 'Pending'}
            </span>
          </div>
          <p style="font-size: 12px; color: #444; margin: 0 0 10px 0;">${frame.shot.shotText || 'No shot description'}</p>
          ${frame.directorNotes ? `<p style="font-size: 11px; color: #666; font-style: italic; margin: 0;">📝 ${frame.directorNotes}</p>` : ''}
          <div style="font-size: 10px; color: #999; margin-top: 8px;">
            ${frame.shot.characters?.length > 0 ? `Characters: ${frame.shot.characters.join(', ')}` : ''}
          </div>
        </div>
      `).join('')

      return `
        <div style="margin-bottom: 30px;">
          <h3 style="background: #374151; color: white; padding: 10px 15px; margin: 0; border-radius: 8px 8px 0 0;">
            Scene ${scene.sceneNumber} - ${scene.heading || 'Untitled'}
          </h3>
          <div style="padding: 15px; background: #fff; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            ${framesHtml || '<p style="color: #999; font-style: italic;">No frames generated</p>'}
          </div>
        </div>
      `
    }).join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Storyboard Report - CinePilot</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 40px; 
              background: #f5f5f5;
            }
            .header {
              background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 0; opacity: 0.9; }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value { font-size: 28px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .stat-total { color: #8b5cf6; }
            .stat-approved { color: #10b981; }
            .stat-pending { color: #f59e0b; }
            .stat-failed { color: #ef4444; }
            .footer {
              text-align: center;
              padding: 20px;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; background: white; }
              .stat-card { box-shadow: none; border: 1px solid #ddd; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎬 CinePilot Storyboard Report</h1>
            <p>Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value stat-total">${totalFrames}</div>
              <div class="stat-label">Total Frames</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-approved">${approvedCount}</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-pending">${pendingCount}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-failed">${failedCount}</div>
              <div class="stat-label">Failed</div>
            </div>
          </div>

          ${scenesHtml}

          <div class="footer">
            <p> CinePilot AI - Film Production Management</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setPrinting(false)
      return
    }

    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      setPrinting(false)
      setShowPrintMenu(false)
    }, 250)
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.export-menu')) {
          setShowExportMenu(false)
        }
      }
      if (showPrintMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.print-menu')) {
          setShowPrintMenu(false)
        }
      }
      if (showFilters) {
        const target = e.target as HTMLElement
        if (!target.closest('.filter-menu')) {
          setShowFilters(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  useEffect(() => {
    fetchFrames()
  }, [fetchFrames])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefreshRef.current?.()
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters open: show all status
            setStatusFilter('all')
          } else {
            // When filters closed: switch style
            setSelectedStyle('cleanLineArt')
          }
          break
        case '2':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Toggle status filter (all, approved, pending, failed)
            const current = statusFilterRef.current
            if (current === 'approved') {
              setStatusFilter('all')
            } else {
              setStatusFilter('approved')
            }
          } else {
            setSelectedStyle('pencilSketch')
          }
          break
        case '3':
          e.preventDefault()
          if (showFiltersRef.current) {
            const current = statusFilterRef.current
            if (current === 'pending') {
              setStatusFilter('all')
            } else {
              setStatusFilter('pending')
            }
          } else {
            setSelectedStyle('markerLine')
          }
          break
        case '4':
          e.preventDefault()
          if (showFiltersRef.current) {
            const current = statusFilterRef.current
            if (current === 'failed') {
              setStatusFilter('all')
            } else {
              setStatusFilter('failed')
            }
          } else {
            setSelectedStyle('blueprint')
          }
          break
        case '0':
          e.preventDefault()
          if (showFiltersRef.current) {
            setStatusFilter('all')
          }
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current()
          }
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          handleExportMarkdownRef.current()
          break
        case 'p':
          e.preventDefault()
          if (scenesLengthRef.current > 0) {
            setShowPrintMenu(prev => !prev)
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearchQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Chart data computation
  const allFrames = useMemo(() => scenes.flatMap(s => s.frames), [scenes])
  
  const statusChartData = useMemo(() => {
    const statusCounts = allFrames.reduce((acc, f) => {
      const status = f.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [allFrames])

  const styleChartData = useMemo(() => {
    const styleCounts = allFrames.reduce((acc, f) => {
      const style = f.style || 'unknown'
      acc[style] = (acc[style] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(styleCounts).map(([style, count]) => ({
      name: style.replace(/([A-Z])/g, ' $1').trim(),
      value: count,
    }))
  }, [allFrames])

  const sceneChartData = useMemo(() => {
    return scenes.slice(0, 10).map(scene => ({
      name: `Scene ${scene.sceneNumber}`,
      frames: scene.frames.length,
    }))
  }, [scenes])

  const approvalChartData = useMemo(() => {
    const approved = allFrames.filter(f => f.isApproved).length
    const pending = allFrames.length - approved
    return [
      { name: 'Approved', value: approved },
      { name: 'Pending', value: pending },
    ]
  }, [allFrames])

  // Filter and sort scenes based on search query and filters
  const filteredScenes = useMemo(() => {
    let result = scenes
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(scene => 
        scene.sceneNumber.toString().includes(query) ||
        (scene.heading?.toLowerCase().includes(query)) ||
        scene.frames.some(frame => 
          frame.shot.shotText?.toLowerCase().includes(query) ||
          frame.shot.shotSize?.toLowerCase().includes(query) ||
          frame.directorNotes?.toLowerCase().includes(query)
        )
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(scene => {
        if (statusFilter === 'approved') {
          return scene.frames.some(f => f.isApproved)
        } else if (statusFilter === 'pending') {
          return scene.frames.some(f => !f.isApproved && f.status !== 'failed')
        } else if (statusFilter === 'failed') {
          return scene.frames.some(f => f.status === 'failed')
        }
        return true
      })
    }
    
    // Apply scene filter
    if (sceneFilter !== 'all') {
      result = result.filter(scene => 
        scene.sceneNumber.toString() === sceneFilter
      )
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'scene':
          comparison = a.sceneNumber - b.sceneNumber
          break
        case 'shot':
          // Sort by the first shot's index in each scene
          const aMinShot = a.frames.length > 0 ? Math.min(...a.frames.map(f => f.shot.shotIndex)) : 0
          const bMinShot = b.frames.length > 0 ? Math.min(...b.frames.map(f => f.shot.shotIndex)) : 0
          comparison = aMinShot - bMinShot
          break
        case 'status':
          // Sort by worst status (failed > pending > generating > complete)
          const getWorstStatus = (frames: FrameData[]) => {
            if (frames.some(f => f.status === 'failed')) return 3
            if (frames.some(f => f.status === 'pending')) return 2
            if (frames.some(f => f.status === 'generating')) return 1
            return 0
          }
          comparison = getWorstStatus(a.frames) - getWorstStatus(b.frames)
          break
        case 'approved':
          // Sort by approval percentage
          const aApproval = a.frames.length > 0 ? a.frames.filter(f => f.isApproved).length / a.frames.length : 0
          const bApproval = b.frames.length > 0 ? b.frames.filter(f => f.isApproved).length / b.frames.length : 0
          comparison = aApproval - bApproval
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [scenes, searchQuery, statusFilter, sceneFilter, sortBy, sortOrder])
  
  // Calculate active filter count (includes sort state)
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (sceneFilter !== 'all' ? 1 : 0) + (sortBy !== 'scene' || sortOrder !== 'asc' ? 1 : 0)
  
  // Clear all filters and sort
  const clearFilters = useCallback(() => {
    setStatusFilter('all')
    setSceneFilter('all')
    setSearchQuery('')
    setSortBy('scene')
    setSortOrder('asc')
  }, [])
  
  // Sync refs with state
  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])
  
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleGenerateScene = async (sceneId: string) => {
    setGeneratingScene(sceneId)
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateScene',
          sceneId,
          style: selectedStyle,
          maxFrames,
        }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Generate scene failed:', err)
    } finally {
      setGeneratingScene(null)
    }
  }

  const handleRegenerateFrame = async (shotId: string) => {
    setGeneratingShot(shotId)
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateFrame',
          shotId,
          style: selectedStyle,
          regenerate: true,
        }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Regenerate failed:', err)
    } finally {
      setGeneratingShot(null)
    }
  }

  const handleApprove = async (frameId: string, approved: boolean) => {
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', frameId, approved }),
      })
      await fetchFrames()
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  const handleSaveNote = async (frameId: string) => {
    try {
      await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addNote', frameId, note: noteText }),
      })
      await fetchFrames()
      setSelectedFrame(null)
      setNoteText('')
    } catch (err) {
      console.error('Save note failed:', err)
    }
  }

  const approvedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
  const failedCount = scenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)
  const sceneIds = scenes.map(s => s.sceneId)

  // Calculate filtered stats
  const filteredApprovedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.isApproved).length, 0)
  const filteredFailedCount = filteredScenes.reduce((sum, s) => sum + s.frames.filter(f => f.status === 'failed').length, 0)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
                &larr; Dashboard
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Storyboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                AI-generated storyboard frames from your shot list
              </p>
            </div>
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {autoRefresh && <span className="ml-2 text-emerald-400">Auto: {autoRefreshInterval}s</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search scenes, shots... (/)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={selectedScript}
              onChange={e => setSelectedScript(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || autoRefresh}
              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {/* Auto-Refresh Toggle */}
            <div className="relative">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                  autoRefresh
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-[#1a1a1a] border-gray-700 hover:bg-[#222] text-gray-400'
                }`}
                title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              </button>
              {autoRefresh && (
                <select
                  value={autoRefreshInterval}
                  onChange={e => setAutoRefreshInterval(Number(e.target.value))}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 w-16"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              )}
            </div>
            {/* Filter Toggle Button */}
            <div className="relative filter-menu">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-[#1a1a1a] border-gray-700 hover:bg-[#222] text-gray-400'
                }`}
                title={`Filter & Sort (F)${activeFilterCount > 0 ? ' - X to clear all' : ''}`}
              >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Filter & Sort</span>
                      <span className="text-xs text-cyan-400">(1-4 for status, 0 to clear, X for all)</span>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Sort Options */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Sort By</label>
                        <button
                          onClick={toggleSortOrder}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                            sortOrder === 'asc' 
                              ? 'bg-cyan-600 text-white' 
                              : 'bg-cyan-600 text-white'
                          }`}
                          title="Toggle sort order (S)"
                        >
                          {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'scene', label: 'Scene' },
                          { key: 'shot', label: 'Shot' },
                          { key: 'status', label: 'Status' },
                          { key: 'approved', label: 'Approved' },
                        ].map(sort => (
                          <button
                            key={sort.key}
                            onClick={() => setSortBy(sort.key as typeof sortBy)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              sortBy === sort.key
                                ? 'bg-cyan-600 text-white'
                                : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                            }`}
                          >
                            {sort.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Status Filter */}
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'all', label: 'All (1)', shortcut: '1' },
                          { key: 'approved', label: 'Approved (2)', shortcut: '2' },
                          { key: 'pending', label: 'Pending (3)', shortcut: '3' },
                          { key: 'failed', label: 'Failed (4)', shortcut: '4' },
                        ].map(status => (
                          <button
                            key={status.key}
                            onClick={() => setStatusFilter(status.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              statusFilter === status.key
                                ? 'bg-violet-600 text-white'
                                : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Scene Filter */}
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Scene</label>
                      <select
                        value={sceneFilter}
                        onChange={e => setSceneFilter(e.target.value)}
                        className="w-full bg-[#222] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All Scenes</option>
                        {scenes.map(scene => (
                          <option key={scene.sceneId} value={scene.sceneNumber.toString()}>
                            Scene {scene.sceneNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Keyboard Help Button */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-5 h-5 text-gray-400" />
            </button>
            {/* Export Dropdown */}
            <div className="relative export-menu">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors flex items-center gap-1"
                title="Export (E)"
              >
                <Download className="w-5 h-5 text-gray-400" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Export Markdown
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-violet-400" />
                    Export JSON
                  </button>
                </div>
              )}
            </div>
            {/* Print Dropdown */}
            <div className="relative print-menu">
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:bg-[#222] transition-colors flex items-center gap-1"
                title="Print (P)"
                disabled={scenes.length === 0}
              >
                {printing ? (
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <Printer className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showPrintMenu && scenes.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    Print Report
                  </button>
                  <button
                    onClick={() => { handlePrint(); setShowPrintMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    Print & Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Frames', value: searchQuery ? filteredScenes.reduce((sum, s) => sum + s.frames.length, 0) : totalFrames, color: 'text-violet-400' },
            { label: 'Scenes Covered', value: searchQuery ? filteredScenes.length : scenes.length, color: 'text-blue-400' },
            { label: 'Approved', value: searchQuery ? filteredApprovedCount : approvedCount, color: 'text-emerald-400' },
            { label: 'Failed', value: searchQuery ? filteredFailedCount : failedCount, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
          {searchQuery && (
            <div className="col-span-4 text-center text-sm text-gray-500">
              Showing {filteredScenes.length} of {scenes.length} scenes
            </div>
          )}
        </div>

        {/* Charts Section */}
        {allFrames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Frame Status Distribution */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <RePieChart className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Frame Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Style Distribution */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Art Style</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={styleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {styleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Frames per Scene */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Frames per Scene</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sceneChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="frames" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Approval Status */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Approval Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={approvalChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {approvalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8 bg-[#141414] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Style</span>
            {STYLES.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedStyle === s.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
                }`}
                title={`Press ${idx + 1} to select`}
              >
                <span className="mr-1">{s.icon}</span>
                {s.label}
                <span className="ml-2 text-xs text-gray-600">({idx + 1})</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Max Frames/Scene</label>
            <select
              value={maxFrames}
              onChange={e => setMaxFrames(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading storyboard...</div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No scripts uploaded yet</p>
            <Link href="/scripts" className="text-violet-400 hover:text-violet-300 underline">
              Upload a script first
            </Link>
          </div>
        ) : filteredScenes.length === 0 && searchQuery ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No scenes match your search</p>
            <p className="text-gray-600 text-sm mb-4">
              Try searching for a different scene number, shot text, or director notes.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-violet-400 hover:text-violet-300 underline"
            >
              Clear search
            </button>
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No storyboard frames yet</p>
            <p className="text-gray-600 text-sm mb-4">
              Generate shots from the Shot Hub first, then come here to create storyboard frames.
            </p>
            <Link href="/shot-list" className="text-violet-400 hover:text-violet-300 underline">
              Go to Shot Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredScenes.map(scene => (
              <div key={scene.sceneId} className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden">
                {/* Scene Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Scene {scene.sceneNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{scene.heading}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {scene.frames.length} frame{scene.frames.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleGenerateScene(scene.sceneId)}
                      disabled={generatingScene === scene.sceneId}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm rounded-lg transition-colors"
                    >
                      {generatingScene === scene.sceneId ? 'Generating...' : 'Generate Frames'}
                    </button>
                  </div>
                </div>

                {/* Frames Grid */}
                {scene.frames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {scene.frames.map(frame => (
                      <div
                        key={frame.id}
                        className={`relative bg-[#0d0d0d] border rounded-xl overflow-hidden group transition-all ${
                          frame.isApproved ? 'border-emerald-600/50' : 'border-gray-700'
                        }`}
                      >
                        {/* Image */}
                        <div className="aspect-video bg-[#111] flex items-center justify-center relative overflow-hidden">
                          {frame.status === 'generating' ? (
                            <div className="text-gray-500 text-sm animate-pulse">
                              Generating...
                            </div>
                          ) : frame.status === 'failed' ? (
                            <div className="text-red-500 text-sm">Generation failed</div>
                          ) : frame.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={frame.imageUrl}
                              alt={`Shot ${frame.shot.shotIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-600 text-sm">No image</div>
                          )}

                          {/* Overlay controls */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleRegenerateFrame(frame.shot.id)}
                              disabled={generatingShot === frame.shot.id}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs disabled:bg-gray-700"
                            >
                              {generatingShot === frame.shot.id ? '...' : 'Regenerate'}
                            </button>
                            <button
                              onClick={() => handleApprove(frame.id, !frame.isApproved)}
                              className={`px-3 py-1.5 rounded-lg text-xs ${
                                frame.isApproved
                                  ? 'bg-gray-600 hover:bg-gray-500'
                                  : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              {frame.isApproved ? 'Unapprove' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFrame(frame)
                                setNoteText(frame.directorNotes || '')
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs"
                            >
                              Notes
                            </button>
                          </div>

                          {frame.isApproved && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                              Approved
                            </div>
                          )}
                        </div>

                        {/* Shot Info */}
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-violet-400">
                              Shot {frame.shot.shotIndex + 1}
                            </span>
                            {frame.shot.shotSize && (
                              <span className="text-xs bg-[#1a1a1a] text-gray-400 px-1.5 py-0.5 rounded">
                                {frame.shot.shotSize}
                              </span>
                            )}
                            <span className="text-xs text-gray-600 capitalize">{frame.style}</span>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{frame.shot.shotText}</p>
                          {frame.directorNotes && (
                            <p className="text-xs text-amber-400/70 mt-1 italic line-clamp-1">
                              Note: {frame.directorNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-600 text-sm">
                    No frames generated yet. Click &quot;Generate Frames&quot; above.
                  </div>
                )}
              </div>
            ))}

            {/* Empty scenes (that have shots but no frames) */}
            {selectedScript && (
              <SceneSelector
                scriptId={selectedScript}
                existingSceneIds={sceneIds}
                onGenerate={handleGenerateScene}
                generating={generatingScene}
              />
            )}
          </div>
        )}

        {/* Director Notes Modal */}
        {selectedFrame && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-1">Director Notes</h3>
              <p className="text-xs text-gray-500 mb-4">
                Shot {selectedFrame.shot.shotIndex + 1} &mdash; Scene {selectedFrame.shot.scene.sceneNumber}
              </p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={4}
                placeholder="Add production notes, revision feedback, or framing guidance..."
                className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setSelectedFrame(null); setNoteText(''); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveNote(selectedFrame.id)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                {/* Filters Closed Section */}
                <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">Filters Closed</div>
                {[
                  { key: '1', action: 'Clean Line Art style' },
                  { key: '2', action: 'Pencil Sketch style' },
                  { key: '3', action: 'Marker & Ink style' },
                  { key: '4', action: 'Blueprint style' },
                ].map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
                
                {/* Filters Open Section */}
                <div className="text-xs text-cyan-400 uppercase tracking-wider mt-4 mb-2">Filters Open</div>
                {[
                  { key: '1', action: 'Show all status' },
                  { key: '2', action: 'Filter by Approved (toggle)' },
                  { key: '3', action: 'Filter by Pending (toggle)' },
                  { key: '4', action: 'Filter by Failed (toggle)' },
                  { key: '0', action: 'Clear status filter' },
                  { key: 'X', action: 'Clear all filters', color: 'amber' },
                ].map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{shortcut.action}</span>
                    <kbd className={`px-2 py-1 bg-gray-800 text-xs rounded font-mono ${shortcut.color === 'amber' ? 'text-amber-400' : shortcut.color === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
                
                {/* General Shortcuts */}
                <div className="text-xs text-emerald-400 uppercase tracking-wider mt-4 mb-2">General</div>
                {[
                  { key: 'R', action: 'Refresh storyboard data' },
                  { key: 'A', action: 'Toggle auto-refresh', color: 'emerald' },
                  { key: 'F', action: 'Toggle filters & sort' },
                  { key: 'S', action: 'Toggle sort order (asc/desc)' },
                  { key: 'P', action: 'Print storyboard report' },
                  { key: '/', action: 'Focus search input' },
                  { key: 'E', action: 'Export menu' },
                  { key: 'M', action: 'Export as Markdown' },
                  { key: '?', action: 'Show this help modal' },
                  { key: 'Esc', action: 'Close modal / Clear search' },
                ].map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SceneSelector({
  scriptId,
  existingSceneIds,
  onGenerate,
  generating,
}: {
  scriptId: string
  existingSceneIds: string[]
  onGenerate: (sceneId: string) => void
  generating: string | null
}) {
  const [availableScenes, setAvailableScenes] = useState<{ id: string; sceneNumber: number; headingRaw: string | null; _count: { shots: number } }[]>([])

  useEffect(() => {
    fetch(`/api/shots?scriptId=${scriptId}&scenesOnly=true`)
      .then(r => r.json())
      .then(data => {
        const allScenes = data.scenes || []
        const ungenerated = allScenes.filter((s: { id: string; _count: { shots: number } }) =>
          !existingSceneIds.includes(s.id) && s._count.shots > 0
        )
        setAvailableScenes(ungenerated)
      })
      .catch(console.error)
  }, [scriptId, existingSceneIds])

  if (availableScenes.length === 0) return null

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Scenes Without Storyboard
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableScenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => onGenerate(scene.id)}
            disabled={generating === scene.id}
            className="text-left bg-[#0d0d0d] border border-gray-700 hover:border-violet-600 rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            <p className="text-sm font-medium text-white">Scene {scene.sceneNumber}</p>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{scene.headingRaw || 'Untitled'}</p>
            <p className="text-xs text-gray-600 mt-1">{scene._count.shots} shots</p>
          </button>
        ))}
      </div>
    </div>
  )
}
