'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  MapPin, Search, Filter, RefreshCw, Loader2, 
  Star, ExternalLink, TrendingUp, AlertTriangle,
  Building2, Trees, Warehouse, Waves, Users,
  ChevronRight, Info, Target, Award, X, Keyboard, Download, Printer, FileText, Clock
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts'

interface SceneWithIntent {
  id: string
  sceneNumber: string
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  locationIntents: {
    id: string
    keywords: string[]
    terrainType: string | null
    _count: { candidates: number }
  }[]
}

interface CandidateData {
  id: string
  name: string | null
  latitude: string
  longitude: string
  placeType: string | null
  scoreTotal: number
  scoreAccess: number | null
  scoreLocality: number | null
  riskFlags: string[]
  explanation: string | null
  isFavorite?: boolean
}

// Place type filter options with keyboard shortcuts
const PLACE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types (0)', shortcut: '0' },
  { value: 'beach', label: 'Beach (1)', shortcut: '1' },
  { value: 'restaurant', label: 'Restaurant (2)', shortcut: '2' },
  { value: 'park', label: 'Park (3)', shortcut: '3' },
  { value: 'warehouse', label: 'Warehouse (4)', shortcut: '4' },
  { value: 'hotel', label: 'Hotel (5)', shortcut: '5' },
  { value: 'temple', label: 'Temple (6)', shortcut: '6' },
  { value: 'office', label: 'Office (7)', shortcut: '7' },
  { value: 'resort', label: 'Resort (8)', shortcut: '8' },
  { value: 'mountain', label: 'Mountain (9)', shortcut: '9' },
  { value: 'forest', label: 'Forest', shortcut: '' },
  { value: 'studio', label: 'Studio', shortcut: '' },
]

// Map number keys to place types
const PLACE_TYPE_SHORTCUTS: Record<string, string> = {
  '1': 'beach',
  '2': 'restaurant',
  '3': 'park',
  '4': 'warehouse',
  '5': 'hotel',
  '6': 'temple',
  '7': 'office',
  '8': 'resort',
  '9': 'mountain',
}

// Place type icons mapping
const PLACE_TYPE_ICONS: Record<string, typeof Building2> = {
  'restaurant': Building2,
  'park': Trees,
  'warehouse': Warehouse,
  'beach': Waves,
  'hotel': Building2,
  'temple': Building2,
  'office': Building2,
  'resort': Building2,
  'mountain': Trees,
  'forest': Trees,
  'studio': Building2,
  'default': MapPin,
}

const PLACE_TYPE_COLORS: Record<string, string> = {
  'restaurant': '#f59e0b',
  'park': '#10b981',
  'warehouse': '#6366f1',
  'beach': '#06b6d4',
  'hotel': '#8b5cf6',
  'temple': '#f97316',
  'office': '#3b82f6',
  'resort': '#ec4899',
  'mountain': '#14b8a6',
  'forest': '#22c55e',
  'studio': '#a855f7',
  'default': '#64748b',
}

function getPlaceTypeIcon(placeType: string | null) {
  if (!placeType) return PLACE_TYPE_ICONS.default
  const key = placeType.toLowerCase()
  return PLACE_TYPE_ICONS[key] || PLACE_TYPE_ICONS.default
}

function getPlaceTypeColor(placeType: string | null) {
  if (!placeType) return PLACE_TYPE_COLORS.default
  const key = placeType.toLowerCase()
  return PLACE_TYPE_COLORS[key] || PLACE_TYPE_COLORS.default
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

// Demo data for when API returns nothing
const DEMO_SCENES: SceneWithIntent[] = [
  { id: '1', sceneNumber: '1', headingRaw: 'EXT. CHENNAI STREET - NIGHT', intExt: 'EXT', timeOfDay: 'NIGHT', location: 'Chennai Street', locationIntents: [{ id: '1', keywords: ['street', 'urban', 'night'], terrainType: 'urban', _count: { candidates: 3 } }] },
  { id: '2', sceneNumber: '5', headingRaw: 'EXT. BEACH - SUNSET', intExt: 'EXT', timeOfDay: 'SUNSET', location: 'Marina Beach', locationIntents: [{ id: '2', keywords: ['beach', 'sunset', 'coastal'], terrainType: 'coastal', _count: { candidates: 2 } }] },
  { id: '3', sceneNumber: '12', headingRaw: 'INT. RESTAURANT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'Tamil Restaurant', locationIntents: [{ id: '3', keywords: ['restaurant', 'indoor', 'traditional'], terrainType: 'indoor', _count: { candidates: 4 } }] },
  { id: '4', sceneNumber: '18', headingRaw: 'EXT. TEMPLE - MORNING', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Kapaleeshwarar Temple', locationIntents: [{ id: '4', keywords: ['temple', 'heritage', 'morning'], terrainType: 'heritage', _count: { candidates: 2 } }] },
]

const DEMO_CANDIDATES: CandidateData[] = [
  { id: '1', name: 'Marina Beach Promenade', latitude: '13.0500', longitude: '80.2824', placeType: 'beach', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: [], explanation: 'Wide open space perfect for night shoots with excellent crowd control options. Multiple access points from the main road.' },
  { id: '2', name: 'Edward Elliot\'s Beach', latitude: '13.0333', longitude: '80.2833', placeType: 'beach', scoreTotal: 78, scoreAccess: 75, scoreLocality: 82, riskFlags: ['Tourist crowd'], explanation: 'Less crowded than Marina but limited parking. Good for early morning shoots.' },
  { id: '3', name: 'Besant Nagar Beach', latitude: '12.9989', longitude: '80.2678', placeType: 'beach', scoreTotal: 72, scoreAccess: 70, scoreLocality: 75, riskFlags: ['Weekend crowd', 'Limited space'], explanation: 'More local feel, good for village/realistic sequences. Requires early morning permit.' },
]

export default function LocationsPage() {
  const [scenes, setScenes] = useState<SceneWithIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [scouting, setScouting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filterScore, setFilterScore] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'type' | 'access' | 'locality'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30) // seconds
  const [filters, setFilters] = useState({
    placeType: 'all',
    intExt: 'all',
    timeOfDay: 'all',
    favoritesOnly: false,
    minScore: 0, // Minimum score filter (0-100)
    riskFree: false, // Filter to show only locations without risk flags
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts to avoid dependency issues
  const filtersRef = useRef(filters)
  const showFiltersRef = useRef(showFilters)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)
  
  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])
  
  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  // Clear all filters function
  const clearFilters = useCallback(() => {
    setFilters({
      placeType: 'all',
      intExt: 'all',
      timeOfDay: 'all',
      favoritesOnly: false,
      minScore: 0,
      riskFree: false,
    })
  }, [])

  // Calculate active filter count (includes sort state)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.placeType !== 'all') count++
    if (filters.intExt !== 'all') count++
    if (filters.timeOfDay !== 'all') count++
    if (filters.favoritesOnly) count++
    if (filters.minScore > 0) count++
    if (filters.riskFree) count++
    if (sortBy !== 'score' || sortOrder !== 'desc') count++
    return count
  }, [filters, sortBy, sortOrder])

  // Ref for active filter count (for keyboard shortcut)
  const activeFilterCountRef = useRef(0)

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  const fetchScenes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      if (data.scenes && data.scenes.length > 0) {
        setScenes(data.scenes)
      } else {
        // Use demo data
        setScenes(DEMO_SCENES)
      }
    } catch (e) {
      console.error(e)
      setScenes(DEMO_SCENES)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
      if (isRefresh) setRefreshing(false)
    }
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchScenes(true)
  }, [fetchScenes])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchScenes(true)
    }, autoRefreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, fetchScenes])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur()
          setSearchQuery('')
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          handleRefresh()
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        // Context-aware number key shortcuts
        // When filters panel CLOSED: Opens filter panel and applies filter
        // When filters panel OPEN: Toggles filter (press again to clear)
        case '1':
          e.preventDefault()
          if (!showFiltersRef.current) {
            // Filters closed: Open filter panel and apply place type filter
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'beach' }))
          } else {
            // Filters open: Toggle filter
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'beach' ? 'all' : 'beach' }))
          }
          break
        case '2':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'restaurant' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'restaurant' ? 'all' : 'restaurant' }))
          }
          break
        case '3':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'park' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'park' ? 'all' : 'park' }))
          }
          break
        case '4':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'warehouse' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'warehouse' ? 'all' : 'warehouse' }))
          }
          break
        case '5':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'hotel' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'hotel' ? 'all' : 'hotel' }))
          }
          break
        case '6':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'temple' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'temple' ? 'all' : 'temple' }))
          }
          break
        case '7':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'office' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'office' ? 'all' : 'office' }))
          }
          break
        case '8':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'resort' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'resort' ? 'all' : 'resort' }))
          }
          break
        case '9':
          e.preventDefault()
          if (!showFiltersRef.current) {
            setShowFilters(true)
            setFilters(prev => ({ ...prev, placeType: 'mountain' }))
          } else {
            setFilters(prev => ({ ...prev, placeType: prev.placeType === 'mountain' ? 'all' : 'mountain' }))
          }
          break
        case '0':
          e.preventDefault()
          if (!showFiltersRef.current) {
            // Filters closed: Open filter panel
            setShowFilters(true)
          } else {
            // Filters open: Clear all filters
            setFilters({ placeType: 'all', intExt: 'all', timeOfDay: 'all', favoritesOnly: false, minScore: 0, riskFree: false })
          }
          break
        case 'm':
          // Toggle risk-free filter
          if (showFiltersRef.current) {
            setFilters(prev => ({ ...prev, riskFree: !prev.riskFree }))
          }
          break
        case 'f':
          setShowFilters(prev => !prev)
          break
        case 's':
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'e':
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          setShowPrintMenu(prev => !prev)
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFilters()
          }
          break
        case '?':
          setShowShortcuts(true)
          break
        case 'escape':
          setShowShortcuts(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearchQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRefresh, sortOrder])

  const handleSelectScene = async (sceneId: string) => {
    setSelectedSceneId(sceneId)
    setCandidates([])
    setError(null)
    try {
      const res = await fetch(`/api/locations?sceneId=${sceneId}`)
      const data = await res.json()
      if (data.intent?.candidates && data.intent.candidates.length > 0) {
        setCandidates(data.intent.candidates)
      } else {
        // Use demo candidates for preview
        setCandidates(DEMO_CANDIDATES)
      }
    } catch (e) {
      console.error(e)
      setCandidates(DEMO_CANDIDATES)
    }
  }

  const handleScout = async () => {
    if (!selectedSceneId) return
    setScouting(true)
    setError(null)
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scout', sceneId: selectedSceneId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCandidates(data.candidates || [])
      await fetchScenes()
    } catch (e: any) {
      setError(e.message || 'Failed to scout locations')
      // Still show demo data for preview
      setCandidates(DEMO_CANDIDATES)
    } finally {
      setScouting(false)
    }
  }

  const toggleFavorite = (candidateId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
  }

  // Export functions
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) return
    const headers = ['Scene', 'Location', 'Candidate', 'Type', 'Score', 'Access', 'Locality', 'Risk Flags', 'Favorite']
    const rows = filteredCandidates.map(c => [
      selectedScene?.sceneNumber || 'N/A',
      selectedScene?.location || 'N/A',
      c.name || 'Unknown',
      c.placeType || 'N/A',
      c.scoreTotal.toString(),
      c.scoreAccess?.toString() || 'N/A',
      c.scoreLocality?.toString() || 'N/A',
      c.riskFlags?.join('; ') || '',
      favorites.has(c.id || '') ? 'Yes' : 'No',
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    if (filteredCandidates.length === 0) return
    const data = {
      exportDate: new Date().toISOString(),
      sceneCount: scenes.length,
      selectedScene: selectedScene ? {
        sceneNumber: selectedScene.sceneNumber,
        heading: selectedScene.headingRaw,
        location: selectedScene.location,
        intExt: selectedScene.intExt,
        timeOfDay: selectedScene.timeOfDay,
      } : null,
      candidateCount: filteredCandidates.length,
      summary: {
        averageScore: filteredCandidates.reduce((sum, c) => sum + c.scoreTotal, 0) / filteredCandidates.length,
        totalCandidates: filteredCandidates.length,
        favoritesCount: filteredCandidates.filter(c => favorites.has(c.id || '')).length,
        byPlaceType: Object.entries(filteredCandidates.reduce((acc, c) => {
          const type = c.placeType || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>)),
      },
      candidates: filteredCandidates.map(c => ({
        ...c,
        isFavorite: favorites.has(c.id || ''),
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locations-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Markdown export handler
  const handleExportMarkdown = () => {
    if (filteredCandidates.length === 0) return
    
    // Build summary statistics
    const totalCandidates = filteredCandidates.length
    const favoritesCount = filteredCandidates.filter((c: CandidateData) => favorites.has(c.id || '')).length
    const avgScore = filteredCandidates.reduce((sum: number, c: CandidateData) => sum + (c.scoreTotal || 0), 0) / totalCandidates
    
    // Group by place type
    const byPlaceType = filteredCandidates.reduce((acc: Record<string, number>, c: CandidateData) => {
      const type = c.placeType || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    // Top scored locations
    const topLocations = [...filteredCandidates]
      .sort((a: CandidateData, b: CandidateData) => b.scoreTotal - a.scoreTotal)
      .slice(0, 5)
    
    // Build markdown content
    let markdown = `# CinePilot Location Report

**Generated:** ${new Date().toISOString().split('T')[0]}

${selectedScene ? `## Scene: ${selectedScene.sceneNumber}
- **Heading:** ${selectedScene.headingRaw || 'N/A'}
- **Location:** ${selectedScene.location || 'N/A'}
- **Int/Ext:** ${selectedScene.intExt || 'N/A'}
- **Time of Day:** ${selectedScene.timeOfDay || 'N/A'}

` : ''}## Summary

- **Total Candidates:** ${totalCandidates}
- **Favorites:** ${favoritesCount}
- **Average Score:** ${avgScore.toFixed(1)}
- **Scenes with Intents:** ${scenes.length}

### By Place Type

`
    
    // Add place type breakdown
    Object.entries(byPlaceType).forEach(([type, count]) => {
      markdown += `- **${type}:** ${count}\n`
    })
    
    markdown += `\n## Top Locations (by score)

| Rank | Name | Type | Score | Access | Locality | Favorite |
|------|------|------|-------|--------|----------|----------|
`
    
    topLocations.forEach((c: CandidateData, idx: number) => {
      const isFav = favorites.has(c.id || '') ? '⭐' : ''
      markdown += `| ${idx + 1} | ${c.name || 'Unknown'} | ${c.placeType || 'N/A'} | ${c.scoreTotal} | ${c.scoreAccess || 'N/A'} | ${c.scoreLocality || 'N/A'} | ${isFav} |\n`
    })
    
    markdown += `\n## All Locations

`
    
    // Add all candidates sorted by score
    const sortedCandidates = [...filteredCandidates].sort((a: CandidateData, b: CandidateData) => b.scoreTotal - a.scoreTotal)
    sortedCandidates.forEach((c: CandidateData) => {
      const isFav = favorites.has(c.id || '') ? '⭐ ' : ''
      markdown += `### ${isFav}${c.name || 'Unknown'}\n`
      markdown += `- **Type:** ${c.placeType || 'N/A'}\n`
      markdown += `- **Score:** ${c.scoreTotal} (Access: ${c.scoreAccess || 'N/A'}, Locality: ${c.scoreLocality || 'N/A'})\n`
      if (c.riskFlags && c.riskFlags.length > 0) {
        markdown += `- **Risk Flags:** ${c.riskFlags.join(', ')}\n`
      }
      if (c.explanation) {
        markdown += `- **Notes:** ${c.explanation}\n`
      }
      markdown += '\n'
    })
    
    markdown += `---\n*Generated by CinePilot - Film Production Management*\n`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locations-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Print handler
  const handlePrint = () => {
    if (scenes.length === 0) return
    
    const selectedScene = scenes.find(s => s.id === selectedSceneId)
    const candidatesToPrint = selectedSceneId ? filteredCandidates : candidates
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const totalCandidates = scenes.reduce((acc, s) => acc + s.locationIntents.reduce((a, li) => a + (li._count?.candidates || 0), 0), 0)
    const favoritesCount = candidatesToPrint.filter((c: CandidateData) => favorites.has(c.id || '')).length
    const avgScore = candidatesToPrint.length > 0 
      ? candidatesToPrint.reduce((sum: number, c: CandidateData) => sum + (c.scoreTotal || 0), 0) / candidatesToPrint.length 
      : 0
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Location Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #0f172a; }
    .header .subtitle { color: #64748b; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    .summary-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .summary-card .value { font-size: 32px; font-weight: 700; color: #0f172a; }
    .summary-card .label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; margin-bottom: 16px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-restaurant { background: #fef3c7; color: #92400e; }
    .badge-park { background: #d1fae5; color: #065f46; }
    .badge-warehouse { background: #e0e7ff; color: #3730a3; }
    .badge-beach { background: #cffafe; color: #0e7490; }
    .badge-hotel { background: #ede9fe; color: #6d28d9; }
    .badge-temple { background: #ffedd5; color: #9a3412; }
    .badge-office { background: #dbeafe; color: #1e40af; }
    .badge-resort { background: #fce7f3; color: #9d174d; }
    .badge-mountain { background: #ccfbf1; color: #0f766e; }
    .badge-forest { background: #dcfce7; color: #166534; }
    .badge-studio { background: #f3e8ff; color: #7e22ce; }
    .badge-default { background: #f1f5f9; color: #475569; }
    .score { font-weight: 600; color: #0f172a; }
    .score-high { color: #059669; }
    .score-medium { color: #d97706; }
    .score-low { color: #dc2626; }
    .favorite { color: #f59e0b; }
    .risk { display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 2px; }
    .no-data { text-align: center; padding: 40px; color: #94a3b8; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📍 Location Scouter Report</h1>
      <p class="subtitle">Generated by CinePilot - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="value">${scenes.length}</div>
      <div class="label">Scenes</div>
    </div>
    <div class="summary-card">
      <div class="value">${totalCandidates}</div>
      <div class="label">Total Candidates</div>
    </div>
    <div class="summary-card">
      <div class="value">${avgScore.toFixed(1)}</div>
      <div class="label">Avg Score</div>
    </div>
    <div class="summary-card">
      <div class="value">${favoritesCount}</div>
      <div class="label">Favorites</div>
    </div>
  </div>
  
  ${selectedScene ? `
  <div class="section">
    <h2>📌 Selected Scene: ${selectedScene.sceneNumber}</h2>
    <p style="color: #64748b; margin-bottom: 16px;">${selectedScene.headingRaw || 'N/A'} • ${selectedScene.intExt || ''} • ${selectedScene.timeOfDay || ''}</p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Location Name</th>
          <th>Type</th>
          <th>Score</th>
          <th>Address</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${filteredCandidates.length > 0 ? filteredCandidates.map((c: CandidateData, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${c.name || 'N/A'} ${favorites.has(c.id || '') ? '⭐' : ''}</td>
          <td><span class="badge badge-${(c.placeType || 'default').toLowerCase()}">${c.placeType || 'N/A'}</span></td>
          <td class="score ${c.scoreTotal >= 80 ? 'score-high' : c.scoreTotal >= 60 ? 'score-medium' : 'score-low'}">${c.scoreTotal?.toFixed(1) || 'N/A'}</td>
          <td>${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'N/A'}</td>
          <td>${c.explanation || '-'} ${c.riskFlags?.length ? `<br/>${c.riskFlags.map((r: string) => `<span class="risk">${r}</span>`).join('')}` : ''}</td>
        </tr>
        `).join('') : `<tr><td colspan="6" class="no-data">No location candidates found for this scene</td></tr>`}
      </tbody>
    </table>
  </div>
  ` : `
  <div class="section">
    <h2>📋 All Location Scenes</h2>
    <table>
      <thead>
        <tr>
          <th>Scene</th>
          <th>Heading</th>
          <th>Int/Ext</th>
          <th>Time</th>
          <th>Candidates</th>
        </tr>
      </thead>
      <tbody>
        ${scenes.map(s => `
        <tr>
          <td><strong>${s.sceneNumber}</strong></td>
          <td>${s.headingRaw || 'N/A'}</td>
          <td>${s.intExt || '-'}</td>
          <td>${s.timeOfDay || '-'}</td>
          <td>${s.locationIntents.reduce((a, li) => a + (li._count?.candidates || 0), 0)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  `}
  
  <div class="footer">
    CinePilot Production Management • Location Scouting Report
  </div>
</body>
</html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setShowPrintMenu(false)
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
      if (showFilters && filterPanelRef.current) {
        const target = e.target as HTMLElement
        if (!filterPanelRef.current.contains(target) && !target.closest('.filter-toggle')) {
          setShowFilters(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  const selectedScene = scenes.find(s => s.id === selectedSceneId)
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) return scenes
    const query = searchQuery.toLowerCase()
    return scenes.filter(s => 
      s.sceneNumber?.toLowerCase().includes(query) ||
      s.headingRaw?.toLowerCase().includes(query) ||
      s.location?.toLowerCase().includes(query) ||
      s.intExt?.toLowerCase().includes(query) ||
      s.timeOfDay?.toLowerCase().includes(query)
    )
  }, [scenes, searchQuery])
  
  // Apply additional scene filters
  const finalFilteredScenes = useMemo(() => {
    let result = filteredScenes
    if (filters.intExt !== 'all') {
      result = result.filter(s => s.intExt === filters.intExt)
    }
    if (filters.timeOfDay !== 'all') {
      result = result.filter(s => s.timeOfDay?.toUpperCase() === filters.timeOfDay.toUpperCase())
    }
    return result
  }, [filteredScenes, filters])
  
  const extScenes = finalFilteredScenes.filter(s => s.intExt === 'EXT')
  const intScenes = finalFilteredScenes.filter(s => s.intExt !== 'EXT')

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => c.scoreTotal >= filterScore)
    
    // Apply place type filter
    if (filters.placeType !== 'all') {
      result = result.filter(c => c.placeType?.toLowerCase() === filters.placeType)
    }
    
    // Apply favorites filter
    if (filters.favoritesOnly) {
      result = result.filter(c => c.id && favorites.has(c.id))
    }
    
    // Apply minimum score filter
    if (filters.minScore > 0) {
      result = result.filter(c => c.scoreTotal >= filters.minScore)
    }
    
    // Apply risk-free filter (show only locations without risk flags)
    if (filters.riskFree) {
      result = result.filter(c => !c.riskFlags || c.riskFlags.length === 0)
    }
    
    if (sortBy === 'score') {
      return result.sort((a, b) => sortOrder === 'desc' ? b.scoreTotal - a.scoreTotal : a.scoreTotal - b.scoreTotal)
    }
    if (sortBy === 'access') {
      return result.sort((a, b) => {
        const aVal = a.scoreAccess || 0
        const bVal = b.scoreAccess || 0
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
      })
    }
    if (sortBy === 'locality') {
      return result.sort((a, b) => {
        const aVal = a.scoreLocality || 0
        const bVal = b.scoreLocality || 0
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
      })
    }
    if (sortBy === 'type') {
      return result.sort((a, b) => {
        const aVal = a.placeType || ''
        const bVal = b.placeType || ''
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      })
    }
    return result.sort((a, b) => sortOrder === 'desc' ? (b.name || '').localeCompare(a.name || '') : (a.name || '').localeCompare(b.name || ''))
  }, [candidates, filterScore, sortBy, sortOrder, filters, favorites])

  // Statistics
  const stats = useMemo(() => {
    const total = candidates.length
    const avgScore = total > 0 ? candidates.reduce((s, c) => s + c.scoreTotal, 0) / total : 0
    const highScore = total > 0 ? Math.max(...candidates.map(c => c.scoreTotal)) : 0
    const withRisks = candidates.filter(c => c.riskFlags.length > 0).length
    return { total, avgScore: Math.round(avgScore), highScore, withRisks }
  }, [candidates])

  // Chart data
  const scoreChartData = useMemo(() => {
    return filteredCandidates.map(c => ({
      name: c.name?.substring(0, 15) || 'Unknown',
      score: c.scoreTotal,
      access: c.scoreAccess || 0,
      locality: c.scoreLocality || 0,
    }))
  }, [filteredCandidates])

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    candidates.forEach(c => {
      const type = c.placeType || 'other'
      counts[type] = (counts[type] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [candidates])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Location Scouter</h1>
            <p className="text-slate-400 text-sm mt-0.5">AI-powered script-aware location discovery</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && <span className="ml-2 text-emerald-400">Auto: {autoRefreshInterval}s</span>}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search scenes... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || autoRefresh}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Auto-Refresh Toggle */}
          <div className="relative">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                autoRefresh 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              Auto
            </button>
            {/* Interval selector dropdown - only show when auto-refresh is on */}
            {autoRefresh && (
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="absolute top-full mt-1 left-0 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 cursor-pointer hover:bg-slate-600"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors filter-toggle ${
              showFilters 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
            title="Toggle Filters (F)"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{activeFilterCount}</span>
            )}
          </button>
          {/* Shortcut hint */}
          <span className="text-xs text-slate-500 hidden md:inline">(1-9 place type, 0 clear)</span>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-5 h-5 text-slate-400" />
          </button>

          {/* Export Dropdown */}
          <div className="relative export-menu">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1"
              title="Export (E)"
            >
              <Download className="w-5 h-5 text-slate-400" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-violet-400" />
                  Export JSON
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Export Markdown
                </button>
              </div>
            )}
          </div>

          {/* Print Dropdown */}
          <div className="relative print-menu">
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1"
              title="Print (P)"
            >
              <Printer className="w-5 h-5 text-slate-400" />
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Print Location Report
                </button>
              </div>
            )}
          </div>

          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'cards' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'chart' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div 
          ref={filterPanelRef}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Filters:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Place Type:</label>
              <select
                value={filters.placeType}
                onChange={(e) => setFilters(prev => ({ ...prev, placeType: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Types (0)</option>
                <option value="beach">🏖️ Beach (1)</option>
                <option value="restaurant">🍽️ Restaurant (2)</option>
                <option value="park">🌳 Park (3)</option>
                <option value="warehouse">🏭 Warehouse (4)</option>
                <option value="hotel">🏨 Hotel (5)</option>
                <option value="temple">🛕 Temple (6)</option>
                <option value="office">🏢 Office (7)</option>
                <option value="resort">🏝️ Resort (8)</option>
                <option value="mountain">⛰️ Mountain (9)</option>
                <option value="forest">🌲 Forest</option>
                <option value="studio">🎬 Studio</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Int/Ext:</label>
              <select
                value={filters.intExt}
                onChange={(e) => setFilters(prev => ({ ...prev, intExt: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All</option>
                <option value="EXT">Exterior</option>
                <option value="INT">Interior</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Time:</label>
              <select
                value={filters.timeOfDay}
                onChange={(e) => setFilters(prev => ({ ...prev, timeOfDay: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Times</option>
                <option value="DAY">Day</option>
                <option value="NIGHT">Night</option>
                <option value="MORNING">Morning</option>
                <option value="EVENING">Evening</option>
                <option value="SUNSET">Sunset</option>
                <option value="DUSK">Dusk</option>
                <option value="DAWN">Dawn</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.favoritesOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, favoritesOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-300">Favorites Only</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.riskFree}
                  onChange={(e) => setFilters(prev => ({ ...prev, riskFree: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-300">Risk Free Only</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Min Score:</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-emerald-400 font-medium w-12">{filters.minScore > 0 ? `${filters.minScore}+` : 'All'}</span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear Filters (X)
              </button>
            )}
            <span className="text-sm text-slate-500 ml-auto">
              {finalFilteredScenes.length} scenes, {filteredCandidates.length} candidates
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
           <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {/* When filters panel is OPEN */}
              <div className="mt-3 mb-1 px-2">
                <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">When Filters Open:</span>
              </div>
              {[
                { key: '1', action: 'Filter by Beach (toggle)' },
                { key: '2', action: 'Filter by Restaurant (toggle)' },
                { key: '3', action: 'Filter by Park (toggle)' },
                { key: '4', action: 'Filter by Warehouse (toggle)' },
                { key: '5', action: 'Filter by Hotel (toggle)' },
                { key: '6', action: 'Filter by Temple (toggle)' },
                { key: '7', action: 'Filter by Office (toggle)' },
                { key: '8', action: 'Filter by Resort (toggle)' },
                { key: '9', action: 'Filter by Mountain (toggle)' },
                { key: '0', action: 'Clear all filters' },
                { key: 'M', action: 'Toggle risk-free filter' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50">
                  <span className="text-cyan-300">{action}</span>
                  <kbd className="bg-slate-800 border border-cyan-700 text-cyan-300 px-3 py-1 rounded-lg text-sm font-mono">{key}</kbd>
                </div>
              ))}
              {/* When filters panel is CLOSED */}
              <div className="mt-3 mb-1 px-2">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">When Filters Closed:</span>
              </div>
              {[
                { key: '1', action: 'Open filters & filter by Beach' },
                { key: '2', action: 'Open filters & filter by Restaurant' },
                { key: '3', action: 'Open filters & filter by Park' },
                { key: '4', action: 'Open filters & filter by Warehouse' },
                { key: '5', action: 'Open filters & filter by Hotel' },
                { key: '6', action: 'Open filters & filter by Temple' },
                { key: '7', action: 'Open filters & filter by Office' },
                { key: '8', action: 'Open filters & filter by Resort' },
                { key: '9', action: 'Open filters & filter by Mountain' },
                { key: '0', action: 'Open filters panel' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50">
                  <span className="text-amber-300">{action}</span>
                  <kbd className="bg-slate-800 border border-amber-700 text-amber-300 px-3 py-1 rounded-lg text-sm font-mono">{key}</kbd>
                </div>
              ))}
              {/* General shortcuts */}
              <div className="mt-3 mb-1 px-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">General:</span>
              </div>
              {[
                { key: 'R', action: 'Refresh location data' },
                { key: 'A', action: 'Toggle auto-refresh' },
                { key: '/', action: 'Focus search input' },
                { key: 'F', action: 'Toggle filters panel' },
                { key: 'S', action: 'Toggle sort order (ASC/DESC)' },
                { key: 'E', action: 'Toggle export menu' },
                { key: 'P', action: 'Toggle print menu' },
                { key: 'X', action: 'Clear all filters' },
                { key: '?', action: 'Show keyboard shortcuts' },
                { key: 'Esc', action: 'Close modal / Clear search' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50">
                  <span className="text-slate-400">{action}</span>
                  <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg text-sm font-mono">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Scenes Found</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Upload and parse a script first to see location suggestions for each scene.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Scene List Panel */}
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Script Scenes</h3>
                {(searchQuery || activeFilterCount > 0) && (
                  <span className="text-xs text-emerald-400">
                    {finalFilteredScenes.length} found
                  </span>
                )}
              </div>
              
              {extScenes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-amber-400 uppercase">Exterior</span>
                    <span className="text-xs text-slate-600">({extScenes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {extScenes.map(scene => (
                      <SceneButton 
                        key={scene.id} 
                        scene={scene} 
                        selected={selectedSceneId === scene.id} 
                        onClick={handleSelectScene}
                        candidateCount={scene.locationIntents?.[0]?._count?.candidates || 0}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {intScenes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-blue-400 uppercase">Interior</span>
                    <span className="text-xs text-slate-600">({intScenes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {intScenes.map(scene => (
                      <SceneButton 
                        key={scene.id} 
                        scene={scene} 
                        selected={selectedSceneId === scene.id} 
                        onClick={handleSelectScene}
                        candidateCount={scene.locationIntents?.[0]?._count?.candidates || 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Panel */}
          <div className="col-span-9 space-y-4">
            {!selectedSceneId ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Select a Scene</h3>
                <p className="text-slate-500">Choose a scene from the list to scout locations</p>
              </div>
            ) : (
              <>
                {/* Scene Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-lg text-slate-300">
                          {selectedScene?.sceneNumber}
                        </span>
                        {selectedScene?.intExt && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            selectedScene.intExt === 'EXT' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {selectedScene.intExt}
                          </span>
                        )}
                        {selectedScene?.timeOfDay && (
                          <span className="text-xs px-3 py-1 bg-slate-800 rounded-full text-slate-400">
                            {selectedScene.timeOfDay}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-medium text-white mb-2">
                        {selectedScene?.headingRaw || selectedScene?.location || 'Unknown Location'}
                      </h2>
                      {selectedScene?.locationIntents?.[0]?.keywords && (
                        <div className="flex flex-wrap gap-2">
                          {selectedScene.locationIntents[0].keywords.map((k, i) => (
                            <span 
                              key={i} 
                              className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleScout} 
                      disabled={scouting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {scouting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {scouting ? 'Scouting...' : 'Find Locations'}
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                {candidates.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-slate-500 uppercase">Total Spots</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-500 uppercase">Avg Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                        {stats.avgScore}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-500 uppercase">Best Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(stats.highScore)}`}>
                        {stats.highScore}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-500 uppercase">With Risks</span>
                      </div>
                      <p className="text-2xl font-bold text-red-400">{stats.withRisks}</p>
                    </div>
                  </div>
                )}

                {/* Filters */}
                {candidates.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">Min Score:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filterScore}
                        onChange={(e) => setFilterScore(Number(e.target.value))}
                        className="w-32 accent-emerald-500"
                      />
                      <span className="text-sm font-medium text-emerald-400 w-12">{filterScore}+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'type' | 'access' | 'locality')}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="score">By Score</option>
                        <option value="name">By Name</option>
                        <option value="type">By Type</option>
                        <option value="access">By Access</option>
                        <option value="locality">By Locality</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-400 transition-colors"
                        title="Toggle sort order"
                      >
                        {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                      </button>
                    </div>
                    <div className="ml-auto text-sm text-slate-500">
                      Showing {filteredCandidates.length} of {candidates.length} locations
                    </div>
                  </div>
                )}

                {/* Candidates */}
                {candidates.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                    {scouting ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Searching for Locations</h3>
                        <p className="text-slate-500">Analyzing scene requirements and finding matches...</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Ready to Scout</h3>
                        <p className="text-slate-500">Click "Find Locations" to discover potential filming spots</p>
                      </>
                    )}
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Locations Match Your Filters</h3>
                    <p className="text-slate-500 mb-6">Try adjusting your filters to see more results</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => setFilters({ placeType: 'all', intExt: 'all', timeOfDay: 'all', favoritesOnly: false, minScore: 0, riskFree: false })}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear All Filters
                      </button>
                    )}
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCandidates.map((c, idx) => {
                      const PlaceIcon = getPlaceTypeIcon(c.placeType)
                      const placeColor = getPlaceTypeColor(c.placeType)
                      
                      return (
                        <div 
                          key={c.id || idx} 
                          className={`bg-slate-900 border rounded-xl p-5 transition-all hover:border-slate-600 ${
                            favorites.has(c.id || '') ? 'border-emerald-500/50' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${placeColor}20` }}
                              >
                                <PlaceIcon className="w-6 h-6" style={{ color: placeColor }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-emerald-400">#{idx + 1}</span>
                                  {favorites.has(c.id || '') && (
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  )}
                                </div>
                                <h4 className="font-medium text-white">{c.name || 'Unnamed Location'}</h4>
                                {c.placeType && (
                                  <span className="text-xs text-slate-500 capitalize">{c.placeType}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleFavorite(c.id || '')}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Star 
                                  className={`w-5 h-5 ${
                                    favorites.has(c.id || '') 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-slate-600'
                                  }`} 
                                />
                              </button>
                              <a
                                href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-5 h-5 text-slate-400" />
                              </a>
                            </div>
                          </div>

                          {c.explanation && (
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{c.explanation}</p>
                          )}

                          {/* Score bars */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Total</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${getScoreBg(c.scoreTotal)}`}
                                  style={{ width: `${c.scoreTotal}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold w-8 ${getScoreColor(c.scoreTotal)}`}>
                                {c.scoreTotal}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Access</span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${c.scoreAccess || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{c.scoreAccess || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-16">Locality</span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${c.scoreLocality || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{c.scoreLocality || '-'}</span>
                            </div>
                          </div>

                          {c.riskFlags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                              {c.riskFlags.map((f, i) => (
                                <span 
                                  key={i} 
                                  className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Score Comparison Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Score Comparison
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} name="Total" />
                            <Bar dataKey="access" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Access" />
                            <Bar dataKey="locality" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Locality" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Type Distribution */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        Location Types
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={typeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {typeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getPlaceTypeColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneButton({
  scene,
  selected,
  onClick,
  candidateCount = 0,
}: {
  scene: SceneWithIntent
  selected: boolean
  onClick: (id: string) => void
  candidateCount?: number
}) {
  return (
    <button
      onClick={() => onClick(scene.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
        selected
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs font-medium">{scene.sceneNumber}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${selected ? 'text-emerald-400' : 'text-slate-600'}`} />
      </div>
      <div className="text-xs text-slate-500 truncate">
        {scene.location || scene.headingRaw?.substring(0, 30) || 'Untitled'}
      </div>
      {candidateCount > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400">{candidateCount} spots</span>
        </div>
      )}
    </button>
  )
}
