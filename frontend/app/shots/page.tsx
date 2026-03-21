'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Camera, Film, Clock, AlertTriangle, Download, FileText, Filter, Search, RefreshCw, SortAsc, SortDesc, FileJson, Files, ChevronDown, ChevronUp, Keyboard, Printer, X } from 'lucide-react'

interface Scene { id: string; sceneNumber: string; headingRaw: string; intExt: string; timeOfDay: string; location: string; _count?: { shots: number } }
interface Shot { id: string; shotIndex: number; beatIndex: number; shotText: string; characters: string[]; shotSize: string; shotType: string; cameraAngle: string; cameraMovement: string; focalLengthMm: number; lensType: string; keyStyle: string; colorTemp: string; durationEstSec: number; confidenceCamera: number; confidenceLens: number; confidenceLight: number; confidenceDuration: number; isLocked: boolean; userEdited: boolean; notes: string; scene?: Scene }
interface Stats { totalShots: number; totalDuration: number; missingFields: number }

const SHOT_SIZES = ['EWS', 'WS', 'MWS', 'MS', 'MCU', 'CU', 'ECU', 'OTS']
const CAMERA_ANGLES = ['eye', 'high', 'low', 'bird', 'worm', 'dutch']
const CAMERA_MOVEMENTS = ['static', 'pan', 'tilt', 'dolly', 'crane', 'steadicam', 'handheld', 'drone', 'tracking']

const DEMO_SHOTS: Shot[] = [
  { id: 'shot-1', shotIndex: 1, beatIndex: 1, shotText: 'Wide shot of the office', characters: ['RAM'], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Establish the office environment with natural light from windows', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-2', shotIndex: 2, beatIndex: 1, shotText: 'Medium shot of RAM entering', characters: ['RAM'], shotSize: 'MS', shotType: 'medium', cameraAngle: 'eye', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 5, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.75, isLocked: false, userEdited: false, notes: 'Track subject entering frame from left', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-3', shotIndex: 3, beatIndex: 2, shotText: 'Close-up of documents on desk', characters: [], shotSize: 'CU', shotType: 'close-up', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'detail', colorTemp: '5600K', durationEstSec: 3, confidenceCamera: 0.8, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.6, isLocked: false, userEdited: false, notes: 'Focus on key plot documents', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-4', shotIndex: 4, beatIndex: 2, shotText: 'Over-the-shoulder shot', characters: ['RAM', 'PRIYA'], shotSize: 'OTS', shotType: 'over-shoulder', cameraAngle: 'eye', cameraMovement: 'pan', focalLengthMm: 50, lensType: 'zoom', keyStyle: 'conversational', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Standard conversation coverage', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-5', shotIndex: 5, beatIndex: 3, shotText: 'Wide establishing shot', characters: [], shotSize: 'EWS', shotType: 'establishing', cameraAngle: 'bird', cameraMovement: 'drone', focalLengthMm: 24, lensType: 'wide', keyStyle: 'establishing', colorTemp: '4300K', durationEstSec: 10, confidenceCamera: 0.95, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, notes: 'Aerial establishing shot of the building', scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office' } },
  { id: 'shot-6', shotIndex: 6, beatIndex: 1, shotText: 'Night street establishing', characters: [], shotSize: 'WS', shotType: 'wide', cameraAngle: 'low', cameraMovement: 'steadicam', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'noir', colorTemp: '3200K', durationEstSec: 8, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Noir style with harsh street lighting', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-7', shotIndex: 7, beatIndex: 1, shotText: 'Car driving POV', characters: ['RAM'], shotSize: 'MCU', shotType: 'pov', cameraAngle: 'eye', cameraMovement: 'handheld', focalLengthMm: 50, lensType: 'action', keyStyle: 'kinetic', colorTemp: '3200K', durationEstSec: 4, confidenceCamera: 0.8, confidenceLens: 0.75, confidenceLight: 0.7, confidenceDuration: 0.65, isLocked: false, userEdited: false, notes: 'POV from driver seat with reflections', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-8', shotIndex: 8, beatIndex: 2, shotText: 'Reflection in rain puddle', characters: [], shotSize: 'ECU', shotType: 'extreme-close-up', cameraAngle: 'worm', cameraMovement: 'static', focalLengthMm: 100, lensType: 'macro', keyStyle: 'artistic', colorTemp: '3200K', durationEstSec: 5, confidenceCamera: 0.9, confidenceLens: 0.95, confidenceLight: 0.85, confidenceDuration: 0.6, isLocked: false, userEdited: false, notes: 'Artistic reflection shot with rain effects', scene: { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street' } },
  { id: 'shot-9', shotIndex: 9, beatIndex: 1, shotText: 'House exterior', characters: [], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'crane', focalLengthMm: 24, lensType: 'wide', keyStyle: 'motivated', colorTemp: '5600K', durationEstSec: 6, confidenceCamera: 0.9, confidenceLens: 0.85, confidenceLight: 0.8, confidenceDuration: 0.75, isLocked: false, userEdited: false, notes: 'Crane up reveal of the house', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-10', shotIndex: 10, beatIndex: 1, shotText: 'Living room wide', characters: ['PRIYA'], shotSize: 'WS', shotType: 'wide', cameraAngle: 'eye', cameraMovement: 'static', focalLengthMm: 35, lensType: 'zoom', keyStyle: 'natural', colorTemp: '5600K', durationEstSec: 7, confidenceCamera: 0.85, confidenceLens: 0.8, confidenceLight: 0.75, confidenceDuration: 0.7, isLocked: false, userEdited: false, notes: 'Natural lighting with soft fill', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-11', shotIndex: 11, beatIndex: 2, shotText: 'Priya sitting on couch', characters: ['PRIYA'], shotSize: 'MS', shotType: 'medium', cameraAngle: 'low', cameraMovement: 'dolly', focalLengthMm: 50, lensType: 'prime', keyStyle: 'emotional', colorTemp: '4300K', durationEstSec: 8, confidenceCamera: 0.9, confidenceLens: 0.9, confidenceLight: 0.85, confidenceDuration: 0.8, isLocked: false, userEdited: false, notes: 'Emotional beat - subtle camera move', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
  { id: 'shot-12', shotIndex: 12, beatIndex: 2, shotText: 'Close-up of photo frame', characters: [], shotSize: 'CU', shotType: 'close-up', cameraAngle: 'high', cameraMovement: 'static', focalLengthMm: 85, lensType: 'prime', keyStyle: 'symbolic', colorTemp: '5600K', durationEstSec: 4, confidenceCamera: 0.85, confidenceLens: 0.9, confidenceLight: 0.8, confidenceDuration: 0.65, isLocked: false, userEdited: false, notes: 'Symbolic shot - photo of family', scene: { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House' } },
]
const DEMO_SCENES: Scene[] = [
  { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. OFFICE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Office', _count: { shots: 5 } },
  { id: 'scene-2', sceneNumber: '2', headingRaw: 'EXT. STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Street', _count: { shots: 3 } },
  { id: 'scene-3', sceneNumber: '3', headingRaw: 'INT. HOUSE - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'House', _count: { shots: 4 } },
]
const DEMO_STATS = { totalShots: 12, totalDuration: 74, missingFields: 2 }

export default function ShotsPage() {
  const [shots, setShots] = useState<Shot[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterScene, setFilterScene] = useState('all')
  const [filterSize, setFilterSize] = useState('all')
  const [filterAngle, setFilterAngle] = useState('all')
  const [filterMovement, setFilterMovement] = useState('all')
  const [sortBy, setSortBy] = useState<'index' | 'duration' | 'focal'>('index')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const showFiltersRef = useRef(showFilters)
  const filterSizeRef = useRef(filterSize)
  const filterSceneRef = useRef(filterScene)
  const filterAngleRef = useRef(filterAngle)
  const filterMovementRef = useRef(filterMovement)
  const sortByRef = useRef(sortBy)
  const sortOrderRef = useRef(sortOrder)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (filterScene !== 'all') count++
    if (filterSize !== 'all') count++
    if (filterAngle !== 'all') count++
    if (filterMovement !== 'all') count++
    return count
  }, [searchQuery, filterScene, filterSize, filterAngle, filterMovement])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterScene('all')
    setFilterSize('all')
    setFilterAngle('all')
    setFilterMovement('all')
  }, [])

  useEffect(() => { showFiltersRef.current = showFilters }, [showFilters])
  useEffect(() => { filterSizeRef.current = filterSize }, [filterSize])
  useEffect(() => { filterSceneRef.current = filterScene }, [filterScene])
  useEffect(() => { filterAngleRef.current = filterAngle }, [filterAngle])
  useEffect(() => { filterMovementRef.current = filterMovement }, [filterMovement])
  useEffect(() => { sortByRef.current = sortBy }, [sortBy])
  useEffect(() => { sortOrderRef.current = sortOrder }, [sortOrder])

  const fetchShots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shots')
      const data = await res.json()
      if (data.shots?.length > 0) { setShots(data.shots); setScenes(data.scenes || []); setStats(data.stats || null); setIsDemoMode(data._demo || false) }
      else { setShots(DEMO_SHOTS); setScenes(DEMO_SCENES); setStats(DEMO_STATS); setIsDemoMode(true) }
    } catch { setShots(DEMO_SHOTS); setScenes(DEMO_SCENES); setStats(DEMO_STATS); setIsDemoMode(true) }
    finally { setLoading(false); setLastUpdated(new Date()) }
  }, [])
  useEffect(() => { fetchShots() }, [fetchShots])

  const filteredShots = useMemo(() => {
    let r = [...shots]
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(s => s.shotText?.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q) || s.scene?.location?.toLowerCase().includes(q) || s.characters?.some(c => c.toLowerCase().includes(q))) }
    if (filterScene !== 'all') r = r.filter(s => s.scene?.id === filterScene)
    if (filterSize !== 'all') r = r.filter(s => s.shotSize === filterSize)
    if (filterAngle !== 'all') r = r.filter(s => s.cameraAngle === filterAngle)
    if (filterMovement !== 'all') r = r.filter(s => s.cameraMovement === filterMovement)
    r.sort((a, b) => { let c = 0; if (sortBy === 'index') c = a.shotIndex - b.shotIndex; else if (sortBy === 'duration') c = a.durationEstSec - b.durationEstSec; else if (sortBy === 'focal') c = a.focalLengthMm - b.focalLengthMm; return sortOrder === 'asc' ? c : -c })
    return r
  }, [shots, searchQuery, filterScene, filterSize, filterAngle, filterMovement, sortBy, sortOrder])

  const getConfColor = (v: number) => v >= 0.85 ? 'text-emerald-400' : v >= 0.7 ? 'text-amber-400' : 'text-red-400'

  const handleExport = useCallback((fmt: 'json' | 'csv' | 'markdown') => {
    let content = '', filename = `shots-${new Date().toISOString().split('T')[0]}`, mimeType = 'application/json'
    if (fmt === 'json') { content = JSON.stringify({ shots: filteredShots, scenes, stats }, null, 2); filename += '.json' }
    else if (fmt === 'csv') { const h = ['#', 'Scene', 'Location', 'Size', 'Angle', 'Movement', 'Focal', 'Duration', 'Notes']; const r = filteredShots.map(s => [s.shotIndex, s.scene?.sceneNumber||'', s.scene?.location||'', s.shotSize, s.cameraAngle, s.cameraMovement, s.focalLengthMm, s.durationEstSec, `"${(s.notes||'').replace(/"/g,'""')}"`]); content = [h.join(','), ...r.map(x=>x.join(','))].join('\n'); filename += '.csv'; mimeType = 'text/csv' }
    else { const l = ['# CinePilot Shots Export','',`**Generated:** ${new Date().toLocaleString()}`,`**Total:** ${filteredShots.length}`,'', '| # | Scene | Location | Size | Angle | Movement | Focal | Duration |', '|---|-------|----------|------|-------|----------|-------|----------|', ...filteredShots.map(s=>`| ${s.shotIndex} | ${s.scene?.sceneNumber||'-'} | ${s.scene?.location||'-'} | ${s.shotSize} | ${s.cameraAngle} | ${s.cameraMovement} | ${s.focalLengthMm}mm | ${s.durationEstSec}s |`)]; content = l.join('\n'); filename += '.md'; mimeType = 'text/markdown' }
    const b = new Blob([content], { type: mimeType }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; a.click(); URL.revokeObjectURL(u); setShowExportMenu(false)
  }, [filteredShots, scenes, stats])

  // Refs for keyboard shortcuts
  const handleExportMarkdownRef = useRef(() => handleExport('markdown'))
  const handlePrintRef = useRef(() => window.print())
  
  useEffect(() => { handleExportMarkdownRef.current = () => handleExport('markdown') }, [handleExport])
  useEffect(() => { handlePrintRef.current = () => window.print() }, [])

  const toggleNote = (id: string) => setExpandedNotes(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const clearFiltersRef = useRef(clearFilters)
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      // When filters panel OPEN: Number keys 1-8 filter by shot size (toggle)
      if (showFiltersRef.current && e.key >= '1' && e.key <= '8' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); const s = SHOT_SIZES; const i = parseInt(e.key) - 1; setFilterSize(filterSizeRef.current === s[i] ? 'all' : s[i]); return }
      // When filters panel OPEN: Shift+1-3 filter by scene (toggle)
      if (showFiltersRef.current && e.shiftKey && e.key >= '1' && e.key <= '3') { e.preventDefault(); const sceneList = scenes.length >= 3 ? scenes : DEMO_SCENES; const i = parseInt(e.key) - 1; if (sceneList[i]) { setFilterScene(filterSceneRef.current === sceneList[i].id ? 'all' : sceneList[i].id) }; return }
      // When filters panel OPEN: Shift+4-9 filter by angle (toggle)
      if (showFiltersRef.current && e.shiftKey && e.key >= '4' && e.key <= '9') { e.preventDefault(); const angles = CAMERA_ANGLES; const i = parseInt(e.key) - 4; if (angles[i]) { setFilterAngle(filterAngleRef.current === angles[i] ? 'all' : angles[i]) }; return }
      // When filters panel OPEN: Ctrl+1-9 filter by movement (toggle)
      if (showFiltersRef.current && e.ctrlKey && e.key >= '1' && e.key <= '9') { e.preventDefault(); const movements = CAMERA_MOVEMENTS; const i = parseInt(e.key) - 1; if (movements[i]) { setFilterMovement(filterMovementRef.current === movements[i] ? 'all' : movements[i]) }; return }
      // When filters panel CLOSED: Number keys 1-2 switch view mode
      if (!showFiltersRef.current) { if (e.key === '1') { setViewMode('cards'); return } if (e.key === '2') { setViewMode('table'); return } }
      // When filters panel OPEN: Key 0 clears size filter
      if (showFiltersRef.current && e.key === '0' && !e.shiftKey) { e.preventDefault(); setFilterSize('all'); return }
      // When filters panel OPEN: Shift+0 clears scene filter
      if (showFiltersRef.current && e.shiftKey && e.key === '0') { e.preventDefault(); setFilterScene('all'); return }
      switch (e.key) { 
        case '/': e.preventDefault(); searchInputRef.current?.focus(); break; 
        case 'f': setShowFilters(p => !p); break; 
        case 's': if (!e.shiftKey) { e.preventDefault(); setSortOrder(sortOrderRef.current === 'asc' ? 'desc' : 'asc'); }; break; 
        case 'r': fetchShots(); break; 
        case 'e': setShowExportMenu(p => !p); break; 
        case 'm': e.preventDefault(); handleExportMarkdownRef.current(); break;
        case 'p': e.preventDefault(); handlePrintRef.current(); break;
        case 'x': e.preventDefault(); clearFiltersRef.current(); break;
        case '?': e.preventDefault(); setShowKeyboardHelp(true); break;
        case 'Escape': setShowExportMenu(false); setShowKeyboardHelp(false); setSearchQuery(''); break 
      }
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [fetchShots, clearFilters, scenes])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-400">Loading shots...</p></div></div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Camera className="w-6 h-6 text-cyan-400" /><h1 className="text-xl font-bold">Shots</h1>{isDemoMode && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-mono">DEMO</span>}</div>
              {stats && <div className="flex items-center gap-4 text-sm text-slate-400"><span className="flex items-center gap-1"><Film className="w-4 h-4" />{stats.totalShots} shots</span><span className="flex items-center gap-1"><Clock className="w-4 h-4" />{stats.totalDuration}s</span>{stats.missingFields > 0 && <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-4 h-4" />{stats.missingFields} incomplete</span>}{lastUpdated && <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />Updated: {lastUpdated.toLocaleTimeString('en-GB')}</span>}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowExportMenu(p => !p)} className="p-2 hover:bg-slate-800 rounded-lg" title="Export (E)"><Download className="w-5 h-5 text-slate-400" /></button>
              <button onClick={() => setShowKeyboardHelp(true)} className="p-2 hover:bg-slate-800 rounded-lg" title="Keyboard Shortcuts (?)"><Keyboard className="w-5 h-5 text-slate-400" /></button>
              <button onClick={fetchShots} className="p-2 hover:bg-slate-800 rounded-lg" title="Refresh (R)"><RefreshCw className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input ref={searchInputRef} type="text" placeholder="Search shots... (press /)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500" /></div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-lg text-sm font-medium ${showFilters ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}><Filter className="w-4 h-4 inline mr-2" />Filters {showFilters ? 'ON' : 'OFF'}</button>
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button onClick={() => setViewMode('cards')} className={`px-3 py-1 rounded text-sm ${viewMode === 'cards' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>Cards</button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>Table</button>
            </div>
          </div>
          {showFilters && <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Scene:</span><select value={filterScene} onChange={e => setFilterScene(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"><option value="all">All Scenes</option>{scenes.map(s => <option key={s.id} value={s.id}>{s.sceneNumber} - {s.location}</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Size:</span><select value={filterSize} onChange={e => setFilterSize(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"><option value="all">All Sizes (1-8)</option>{SHOT_SIZES.map((s,i) => <option key={s} value={s}>{s} ({i+1})</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Angle:</span><select value={filterAngle} onChange={e => setFilterAngle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"><option value="all">All Angles</option>{CAMERA_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Movement:</span><select value={filterMovement} onChange={e => setFilterMovement(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"><option value="all">All Movements</option>{CAMERA_MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Sort:</span><select value={sortBy} onChange={e => setSortBy(e.target.value as 'index'|'duration'|'focal')} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"><option value="index">Shot #</option><option value="duration">Duration</option><option value="focal">Focal Length</option></select><button onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')} className="p-1.5 hover:bg-slate-700 rounded">{sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</button></div>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm flex items-center gap-1"><X className="w-3 h-3" />Clear All ({activeFilterCount})</button>}
            <span className="text-xs text-cyan-400 ml-auto">(<span className="text-amber-400">1-8</span> size, <span className="text-amber-400">⇧1-3</span> scene, <span className="text-amber-400">⇧4-9</span> angle, <span className="text-amber-400">⌃1-9</span> move, <span className="text-emerald-400">0</span> clear size, <span className="text-emerald-400">X</span> clear all)</span>
          </div>}
        </div>
      </header>
      {showExportMenu && <div className="fixed top-20 right-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 min-w-[160px]"><button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2"><FileJson className="w-4 h-4 text-cyan-400" />JSON</button><button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2"><Files className="w-4 h-4 text-emerald-400" />CSV</button><button onClick={() => handleExport('markdown')} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" />Markdown</button></div>}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold flex items-center gap-2"><Keyboard className="w-5 h-5 text-cyan-400" />Keyboard Shortcuts</h2><button onClick={() => setShowKeyboardHelp(false)} className="p-1 hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3 text-sm">
              <div><span className="text-amber-400 font-mono">/</span> - Focus search</div>
              <div><span className="text-amber-400 font-mono">?</span> - Toggle this help</div>
              <div className="border-t border-slate-700 pt-2"><span className="text-emerald-400 font-bold">Actions</span></div>
              <div><span className="text-amber-400 font-mono">R</span> - Refresh shots</div>
              <div><span className="text-amber-400 font-mono">F</span> - Toggle filters panel</div>
              <div><span className="text-amber-400 font-mono">S</span> - Toggle sort order</div>
              <div><span className="text-amber-400 font-mono">E</span> - Open export menu</div>
              <div><span className="text-amber-400 font-mono">M</span> - Export to Markdown</div>
              <div><span className="text-amber-400 font-mono">P</span> - Print shots</div>
              <div><span className="text-amber-400 font-mono">X</span> - Clear all filters</div>
              <div className="border-t border-slate-700 pt-2"><span className="text-cyan-400 font-bold">When Filters Closed</span></div>
              <div><span className="text-amber-400 font-mono">1</span> - Switch to Cards view</div>
              <div><span className="text-amber-400 font-mono">2</span> - Switch to Table view</div>
              <div className="border-t border-slate-700 pt-2"><span className="text-cyan-400 font-bold">When Filters Open</span></div>
              <div><span className="text-amber-400 font-mono">1-8</span> - Filter by shot size (EWS→OTS)</div>
              <div><span className="text-amber-400 font-mono">⇧1-3</span> - Filter by scene</div>
              <div><span className="text-amber-400 font-mono">⇧4-9</span> - Filter by camera angle</div>
              <div><span className="text-amber-400 font-mono">⌃1-9</span> - Filter by movement</div>
              <div><span className="text-emerald-400 font-mono">0</span> - Clear shot size filter</div>
              <div><span className="text-emerald-400 font-mono">⇧0</span> - Clear scene filter</div>
              <div><span className="text-slate-500">Esc</span> - Close menus / Clear search</div>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredShots.length === 0 ? <div className="text-center py-12"><Film className="w-16 h-16 text-slate-600 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-400">No shots found</h3><p className="text-slate-500">Try adjusting your filters</p></div> : viewMode === 'cards' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredShots.map(shot => <div key={shot.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors">
          <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-sm font-mono rounded">#{shot.shotIndex}</span><span className="text-xs text-slate-500">{shot.scene?.sceneNumber}</span></div><div className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3 text-slate-500" /><span className="text-slate-400">{shot.durationEstSec}s</span></div></div>
          <p className="text-sm text-slate-300 mb-3 line-clamp-2">{shot.shotText}</p>
          <div className="flex flex-wrap gap-1 mb-3"><span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">{shot.shotSize}</span><span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">{shot.cameraAngle}</span><span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">{shot.cameraMovement}</span><span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded">{shot.focalLengthMm}mm</span></div>
          <div className="flex items-center gap-3 text-xs mb-3"><span className={getConfColor(shot.confidenceCamera)}>Cam: {(shot.confidenceCamera*100).toFixed(0)}%</span><span className={getConfColor(shot.confidenceLens)}>Lens: {(shot.confidenceLens*100).toFixed(0)}%</span><span className={getConfColor(shot.confidenceLight)}>Light: {(shot.confidenceLight*100).toFixed(0)}%</span></div>
          {shot.characters?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{shot.characters.map(c => <span key={c} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">{c}</span>)}</div>}
          {shot.notes && <button onClick={() => toggleNote(shot.id)} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">{expandedNotes.has(shot.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{expandedNotes.has(shot.id) ? 'Hide' : 'Show'} notes</button>}
          {expandedNotes.has(shot.id) && shot.notes && <p className="mt-2 text-xs text-slate-400 italic border-t border-slate-800 pt-2">{shot.notes}</p>}
        </div>)}</div> : <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-slate-800/50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">#</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Scene</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Shot</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Size</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Angle</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Movement</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Focal</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Duration</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Confidence</th></tr></thead><tbody>{filteredShots.map((shot, i) => <tr key={shot.id} className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/30'}><td className="px-4 py-3 text-sm font-mono text-cyan-400">#{shot.shotIndex}</td><td className="px-4 py-3 text-sm text-slate-400">{shot.scene?.sceneNumber}</td><td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">{shot.shotText}</td><td className="px-4 py-3 text-sm text-slate-300">{shot.shotSize}</td><td className="px-4 py-3 text-sm text-slate-300">{shot.cameraAngle}</td><td className="px-4 py-3 text-sm text-slate-300">{shot.cameraMovement}</td><td className="px-4 py-3 text-sm text-slate-300">{shot.focalLengthMm}mm</td><td className="px-4 py-3 text-sm text-slate-300">{shot.durationEstSec}s</td><td className="px-4 py-3 text-xs"><span className={getConfColor(shot.confidenceCamera)}>{(shot.confidenceCamera*100).toFixed(0)}%</span></td></tr>)}</tbody></table></div>}
      </main>
    </div>
  )
}
