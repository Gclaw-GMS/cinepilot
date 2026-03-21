'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  FileText,
  TrendingUp,
  Eye,
  Target,
  AlertCircle,
  Scale,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  X,
  Download,
  Printer,
  Filter,
  HelpCircle,
  Search,
  Keyboard,
  FileJson,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell, PieChart as RePieChart, Pie
} from 'recharts'

interface CensorSceneFlag {
  id: string
  category: string
  severity: number
  context: string
  scene: {
    sceneNumber: string
    headingRaw: string
  }
}

interface CensorSuggestion {
  id: string
  sceneNumber: string
  issue: string
  suggestedChange: string
  why: string
  expectedSeverityDelta: number
}

interface CensorAnalysis {
  id: string
  predictedCertificate: string
  deterministicScore: number
  confidence: string
  topDrivers: string[]
  highRiskScenes: string[]
  sceneFlags?: CensorSceneFlag[]
  suggestions?: CensorSuggestion[]
  uncertainties?: string[]
  createdAt: string
  _count?: {
    sceneFlags: number
    suggestions: number
  }
}

interface CensorStats {
  predictedCertificate: string
  sensitivityScore: number
  confidence: string
  highRiskCount: number
  suggestionCount: number
  isDemoMode?: boolean
}

const CERTIFICATE_INFO: Record<string, { label: string; color: string; bg: string; description: string; age: string }> = {
  'U': { 
    label: 'Universal', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20 border-emerald-500/30',
    description: 'Suitable for all ages',
    age: 'All ages'
  },
  'UA': { 
    label: 'UA 13+', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/20 border-cyan-500/30',
    description: 'Parental guidance for children under 13',
    age: '13+'
  },
  'A': { 
    label: 'Adults Only 18+', 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20 border-orange-500/30',
    description: 'Restricted to adults',
    age: '18+'
  },
  'S': { 
    label: 'Special', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20 border-purple-500/30',
    description: 'For specific audiences only',
    age: 'Special'
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Violence': '#ef4444',
  'Profanity': '#f97316',
  'Sexual Content': '#ec4899',
  'Drugs/Alcohol': '#8b5cf6',
  'Sensitive Theme': '#f59e0b',
  'Other': '#64748b',
}

const DEMO_ANALYSIS: CensorAnalysis = {
  id: 'demo-censor-001',
  predictedCertificate: 'UA 13+',
  deterministicScore: 0.685,
  confidence: 'high',
  topDrivers: ['Violence (moderate action sequences)', 'Language (some coarse words)', 'Theme (intense family drama)'],
  highRiskScenes: ['Scene 12', 'Scene 23', 'Scene 31'],
  uncertainties: ['Final edit may affect rating', 'Background score intensity unknown'],
  sceneFlags: [
    { id: 'f1', category: 'Violence', severity: 7, context: 'Temple fight sequence with blood', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE - NIGHT' } },
    { id: 'f2', category: 'Violence', severity: 5, context: 'Police confrontation with weapons', scene: { sceneNumber: '23', headingRaw: 'INT. POLICE STATION - DAY' } },
    { id: 'f3', category: 'Profanity', severity: 4, context: 'Emotional argument with harsh language', scene: { sceneNumber: '31', headingRaw: 'INT. HOUSE - NIGHT' } },
    { id: 'f4', category: 'Sensitive Theme', severity: 6, context: 'Suicide attempt reference', scene: { sceneNumber: '45', headingRaw: 'INT. APARTMENT - DAY' } },
    { id: 'f5', category: 'Drugs/Alcohol', severity: 3, context: 'Party scene with drinking', scene: { sceneNumber: '28', headingRaw: 'EXT. CLUB - NIGHT' } },
    { id: 'f6', category: 'Sexual Content', severity: 5, context: 'Romantic sequence', scene: { sceneNumber: '15', headingRaw: 'INT. BEACH - SUNSET' } },
  ],
  suggestions: [
    { id: 's1', sceneNumber: '12', issue: 'Fight sequence intensity', suggestedChange: 'Reduce graphic violence in temple fight', why: 'Lower the severity to avoid A rating', expectedSeverityDelta: -3 },
    { id: 's2', sceneNumber: '23', issue: 'Police violence', suggestedChange: 'Show consequences of violence', why: 'Add moral context to justify action', expectedSeverityDelta: -2 },
    { id: 's3', sceneNumber: '45', issue: 'Suicide reference', suggestedChange: 'Remove or alter the suicide attempt', why: 'CBFC is sensitive to this', expectedSeverityDelta: -4 },
    { id: 's4', sceneNumber: '31', issue: 'Profanity in argument', suggestedChange: 'Mild dialogue changes', why: 'Reduce harsh words', expectedSeverityDelta: -2 },
  ],
  createdAt: new Date().toISOString(),
  _count: {
    sceneFlags: 6,
    suggestions: 4,
  },
}

const DEMO_STATS: CensorStats = {
  predictedCertificate: 'UA 13+',
  sensitivityScore: 69,
  confidence: 'high',
  highRiskCount: 6,
  suggestionCount: 4,
  isDemoMode: true,
}

export default function CensorPage() {
  const [analysis, setAnalysis] = useState<CensorAnalysis | null>(null)
  const [stats, setStats] = useState<CensorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState('default-project')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'scene' | 'category' | 'severity'>('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // View mode state - press 1, 2, 3, 4 to switch views
  const [viewMode, setViewMode] = useState<'summary' | 'flags' | 'suggestions' | 'analytics'>('summary')
  
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Refs for keyboard shortcuts and click outside
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()
  
  // Refs for keyboard shortcut state access
  const analysisRef = useRef(analysis)
  const showFiltersRef = useRef(showFilters)
  const showExportDropdownRef = useRef(showExportDropdown)
  const handlePrintRef = useRef<() => void>(() => {})
  const handleExportMarkdownRef = useRef<() => void>()
  const sortOrderRef = useRef(sortOrder)
  const sortByRef = useRef(sortBy)
  const viewModeRef = useRef(viewMode)
  const filterCategoryRef = useRef(filterCategory)
  const filterSeverityRef = useRef(filterSeverity)
  const searchQueryRef = useRef(searchQuery)
  const clearFiltersRef = useRef<() => void>(() => {})
  
  // Sync refs with state
  useEffect(() => { showFiltersRef.current = showFilters }, [showFilters])
  useEffect(() => { sortOrderRef.current = sortOrder }, [sortOrder])
  useEffect(() => { sortByRef.current = sortBy }, [sortBy])
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])
  useEffect(() => { filterCategoryRef.current = filterCategory }, [filterCategory])
  useEffect(() => { filterSeverityRef.current = filterSeverity }, [filterSeverity])
  useEffect(() => { searchQueryRef.current = searchQuery }, [searchQuery])
  
  // Active filter count (includes searchQuery)
  const activeFilterCount = useMemo(() => {
    return (
      (filterCategory !== 'all' ? 1 : 0) +
      (filterSeverity !== 'all' ? 1 : 0) +
      (sortBy !== 'severity' || sortOrder !== 'desc' ? 1 : 0) +
      (searchQuery ? 1 : 0)
    )
  }, [filterCategory, filterSeverity, sortBy, sortOrder, searchQuery])
  
  // Clear all filters function
  const clearFilters = useCallback(() => {
    setFilterCategory('all')
    setFilterSeverity('all')
    setSortBy('severity')
    setSortOrder('desc')
    setSearchQuery('')
  }, [])
  
  // Update clearFilters ref
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      // Context-aware number keys
      if (e.key >= '0' && e.key <= '9') {
        const num = parseInt(e.key)
        
        if (showFiltersRef.current) {
          // When filter panel is OPEN: filter by category or severity
          e.preventDefault()
          
          if (e.shiftKey) {
            // Shift+1-3: Severity filter (toggle)
            if (num >= 1 && num <= 3) {
              const severityOptions = ['high', 'medium', 'low']
              const severity = severityOptions[num - 1]
              // Toggle: if same severity selected, clear to all
              setFilterSeverity(filterSeverityRef.current === severity ? 'all' : severity)
              return
            }
            // Shift+0 clears severity filter
            if (num === 0) {
              setFilterSeverity('all')
              return
            }
          } else {
            // 1-5: Category filter (toggle)
            if (num >= 1 && num <= 5) {
              const categoryOptions = ['all', 'content', 'language', 'technical', 'cultural']
              const category = categoryOptions[num - 1]
              // Toggle: if same category selected, clear to all
              setFilterCategory(filterCategoryRef.current === category ? 'all' : category)
              return
            }
            // 0 clears category filter
            if (num === 0) {
              setFilterCategory('all')
              return
            }
          }
        } else {
          // When filter panel is CLOSED: switch view modes
          e.preventDefault()
          switch (num) {
            case 1:
              setViewMode('summary')
              break
            case 2:
              setViewMode('flags')
              break
            case 3:
              setViewMode('suggestions')
              break
            case 4:
              setViewMode('analytics')
              break
          }
        }
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'f':
          e.preventDefault()
          setShowFilters(!showFiltersRef.current)
          break
        case 's':
          e.preventDefault()
          setSortOrder(sortOrderRef.current === 'asc' ? 'desc' : 'asc')
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCount > 0) {
            clearFiltersRef.current()
          }
          break
        case 'e':
          e.preventDefault()
          setShowExportDropdown(!showExportDropdownRef.current)
          break
        case 'm':
          e.preventDefault()
          if (analysisRef.current) {
            handleExportMarkdownRef.current?.()
          }
          break
        case 'p':
          e.preventDefault()
          if (analysisRef.current) {
            handlePrintRef.current?.()
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportDropdown(false)
          setShowFilters(false)
          setSearchQuery('')
          setFilterCategory('all')
          setFilterSeverity('all')
          setSortBy('severity')
          setSortOrder('desc')
          setViewMode('summary')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFilterCount])

  // Update refs when state changes
  useEffect(() => {
    analysisRef.current = analysis
  }, [analysis])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  useEffect(() => {
    showExportDropdownRef.current = showExportDropdown
  }, [showExportDropdown])

  useEffect(() => {
    sortOrderRef.current = sortOrder
  }, [sortOrder])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false)
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/censor?projectId=${selectedProject}&full=true`)
      const data = await res.json()
      
      if (data.analysis) {
        setAnalysis(data.analysis)
        if (data.analysis._count) {
          setStats({
            predictedCertificate: data.analysis.predictedCertificate,
            sensitivityScore: Math.round(data.analysis.deterministicScore * 100),
            confidence: data.analysis.confidence,
            highRiskCount: data.analysis._count.sceneFlags,
            suggestionCount: data.analysis._count.suggestions,
          })
        }
      } else if (data.predictedCertificate) {
        setStats(data)
      }
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis')
      setAnalysis(DEMO_ANALYSIS)
      setStats(DEMO_STATS)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setLastUpdated(new Date())
    }
  }, [selectedProject])

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = fetchAnalysis

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/censor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', projectId: selectedProject })
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      await fetchAnalysis()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = (format: 'json' | 'pdf') => {
    if (!analysis) return

    if (format === 'json') {
      const exportData = {
        project: selectedProject,
        generatedAt: new Date().toISOString(),
        certificate: analysis.predictedCertificate,
        sensitivityScore: Math.round(analysis.deterministicScore * 100),
        confidence: analysis.confidence,
        topDrivers: analysis.topDrivers,
        highRiskScenes: analysis.highRiskScenes,
        sceneFlags: analysis.sceneFlags || [],
        suggestions: analysis.suggestions || [],
        uncertainties: analysis.uncertainties || [],
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `censor-analysis-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      const html = `<!DOCTYPE html>
<html>
<head><title>Censor Analysis Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #06b6d4;padding-bottom:20px}.header h1{font-size:28px;color:#06b6d4;margin-bottom:5px}.header .date{color:#64748b;font-size:14px}.certificate{text-align:center;padding:30px;background:#f0f9ff;border-radius:12px;margin-bottom:30px}.certificate .cert{font-size:48px;font-weight:bold;color:#0891b2}.certificate .label{font-size:18px;color:#0e7490;margin-top:5px}.stats{display:flex;justify-content:space-around;margin-bottom:30px}.stat{text-align:center;padding:15px;background:#f8fafc;border-radius:8px}.stat-value{font-size:24px;font-weight:bold;color:#06b6d4}.stat-label{font-size:12px;color:#64748b}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#06b6d4;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #e2e8f0}.severity-high{color:#dc2626;font-weight:bold}.severity-medium{color:#d97706;font-weight:bold}.severity-low{color:#16a34a;font-weight:bold}.suggestion{background:#fef3c7;padding:15px;border-radius:8px;margin-bottom:10px}.suggestion h4{color:#92400e;margin-bottom:5px}.footer{margin-top:30px;text-align:center;color:#94a3b8;font-size:12px}</style>
</head>
<body>
<div class="header"><h1>📊 Censor Certification Analysis</h1><div class="date">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
<div class="certificate"><div class="cert">${analysis.predictedCertificate}</div><div class="label">${CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()]?.label || 'Certificate'}</div></div>
<div class="stats"><div class="stat"><div class="stat-value">${Math.round(analysis.deterministicScore * 100)}%</div><div class="stat-label">Sensitivity Score</div></div><div class="stat"><div class="stat-value">${analysis._count?.sceneFlags || 0}</div><div class="stat-label">Risk Flags</div></div><div class="stat"><div class="stat-value">${analysis._count?.suggestions || 0}</div><div class="stat-label">Suggestions</div></div><div class="stat"><div class="stat-value">${analysis.confidence}</div><div class="stat-label">Confidence</div></div></div>
<h3>🚨 Risk Flags</h3>
<table><thead><tr><th>Scene</th><th>Category</th><th>Severity</th><th>Context</th></tr></thead>
<tbody>${(analysis.sceneFlags || []).map(f => `<tr><td>${f.scene.sceneNumber}</td><td>${f.category}</td><td class="severity-${f.severity >= 6 ? 'high' : f.severity >= 4 ? 'medium' : 'low'}">${f.severity}/10</td><td>${f.context}</td></tr>`).join('')}</tbody></table>
<h3>💡 Suggestions</h3>
${(analysis.suggestions || []).map(s => `<div class="suggestion"><h4>Scene ${s.sceneNumber}: ${s.issue}</h4><p><strong>Change:</strong> ${s.suggestedChange}</p><p><strong>Why:</strong> ${s.why}</p></div>`).join('')}
<div class="footer">Generated by CinePilot • For reference only</div>
</body></html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => printWindow.print()
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `censor-report-${new Date().toISOString().split('T')[0]}.html`
        a.click()
      }
    }
  }

  // Markdown Export function
  const handleExportMarkdown = useCallback(() => {
    if (!analysis) return

    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const certInfo = CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()] || CERTIFICATE_INFO['UA']

    // Calculate severity distribution
    const severityCounts = { high: 0, medium: 0, low: 0 }
    ;(analysis.sceneFlags || []).forEach(flag => {
      if (flag.severity >= 6) severityCounts.high++
      else if (flag.severity >= 4) severityCounts.medium++
      else severityCounts.low++
    })

    // Calculate category distribution
    const categoryCounts: Record<string, number> = {}
    ;(analysis.sceneFlags || []).forEach(flag => {
      categoryCounts[flag.category] = (categoryCounts[flag.category] || 0) + 1
    })

    // Build markdown
    let md = `# 📊 Censor Certification Analysis - CinePilot

**Generated:** ${timestamp}
**Project:** ${selectedProject}

---

## 🎬 Certificate Prediction

| Metric | Value |
|--------|-------|
| **Predicted Certificate** | ${analysis.predictedCertificate} |
| **Certificate Label** | ${certInfo.label} |
| **Age Rating** | ${certInfo.age} |
| **Sensitivity Score** | ${Math.round(analysis.deterministicScore * 100)}% |
| **Confidence** | ${analysis.confidence} |

**Description:** ${certInfo.description}

---

## 📈 Analysis Summary

| Metric | Count |
|--------|-------|
| **Total Risk Flags** | ${analysis._count?.sceneFlags || analysis.sceneFlags?.length || 0} |
| **Suggestions** | ${analysis._count?.suggestions || analysis.suggestions?.length || 0} |
| **High Severity** | ${severityCounts.high} |
| **Medium Severity** | ${severityCounts.medium} |
| **Low Severity** | ${severityCounts.low} |

---

## 🚨 Top Risk Drivers

${analysis.topDrivers.map((driver, i) => `${i + 1}. ${driver}`).join('\n')}

---

## ⚠️ High Risk Scenes

${analysis.highRiskScenes.map(scene => `- ${scene}`).join('\n')}

---

## 🏷️ Risk Flags by Category

| Category | Count |
|----------|-------|
${Object.entries(categoryCounts).map(([cat, count]) => `| ${cat} | ${count} |`).join('\n')}

---

## 🚩 Scene Flags Detail

| Scene | Category | Severity | Context |
|-------|----------|----------|---------|
${(analysis.sceneFlags || []).map(flag => `| ${flag.scene.sceneNumber} | ${flag.category} | ${flag.severity}/10 | ${flag.context} |`).join('\n')}

---

## 💡 Suggestions

${(analysis.suggestions || []).map(s => 
`### Scene ${s.sceneNumber}: ${s.issue}

- **Suggested Change:** ${s.suggestedChange}
- **Why:** ${s.why}
- **Expected Impact:** ${s.expectedSeverityDelta > 0 ? '+' : ''}${s.expectedSeverityDelta} severity points

`).join('\n')}

---

## ❓ Uncertainties

${(analysis.uncertainties || []).map(u => `- ${u}`).join('\n')}

---

*Generated by CinePilot • For reference only*
`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `censor-analysis-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [analysis, selectedProject])

  // Print functionality
  const handlePrint = useCallback(() => {
    if (!analysisRef.current) return

    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const analysis = analysisRef.current
    const certInfo = CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()] || CERTIFICATE_INFO['UA']

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Censor Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 24px; color: #0f172a; }
    .header .timestamp { font-size: 12px; color: #64748b; }
    .certificate { text-align: center; padding: 30px; background: #f0f9ff; border-radius: 12px; margin-bottom: 30px; }
    .certificate .cert { font-size: 48px; font-weight: bold; color: #0891b2; }
    .certificate .label { font-size: 18px; color: #0e7490; margin-top: 5px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #06b6d4; }
    .section { margin-bottom: 30px; }
    .section h3 { font-size: 16px; color: #1e293b; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .severity-high { color: #dc2626; font-weight: bold; }
    .severity-medium { color: #d97706; font-weight: bold; }
    .severity-low { color: #16a34a; font-weight: bold; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-high { background: #fef2f2; color: #dc2626; }
    .badge-medium { background: #fffbeb; color: #d97706; }
    .badge-low { background: #f0fdf4; color: #16a34a; }
    .suggestion { background: #fefce8; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .suggestion h4 { color: #92400e; margin-bottom: 5px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 CinePilot - Censor Analysis Report</h1>
    <div class="timestamp">Generated: ${timestamp}</div>
  </div>
  <div class="certificate">
    <div class="cert">${analysis.predictedCertificate}</div>
    <div class="label">${certInfo.label}</div>
  </div>
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${Math.round(analysis.deterministicScore * 100)}%</div>
      <div class="stat-label">Sensitivity Score</div>
    </div>
    <div class="stat">
      <div class="stat-value">${analysis._count?.sceneFlags || 0}</div>
      <div class="stat-label">Risk Flags</div>
    </div>
    <div class="stat">
      <div class="stat-value">${analysis._count?.suggestions || 0}</div>
      <div class="stat-label">Suggestions</div>
    </div>
    <div class="stat">
      <div class="stat-value">${analysis.confidence}</div>
      <div class="stat-label">Confidence</div>
    </div>
  </div>
  <div class="section">
    <h3>🚨 Risk Flags (${analysis.sceneFlags?.length || 0})</h3>
    <table>
      <thead>
        <tr>
          <th>Scene</th>
          <th>Category</th>
          <th>Severity</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>
        ${(analysis.sceneFlags || []).map(f => `
          <tr>
            <td>${f.scene.sceneNumber}</td>
            <td>${f.category}</td>
            <td><span class="badge badge-${f.severity >= 6 ? 'high' : f.severity >= 4 ? 'medium' : 'low'}">${f.severity}/10</span></td>
            <td>${f.context}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="section">
    <h3>💡 Suggestions (${analysis.suggestions?.length || 0})</h3>
    ${(analysis.suggestions || []).map(s => `
      <div class="suggestion">
        <h4>Scene ${s.sceneNumber}: ${s.issue}</h4>
        <p><strong>Suggested Change:</strong> ${s.suggestedChange}</p>
        <p><strong>Reason:</strong> ${s.why}</p>
      </div>
    `).join('')}
  </div>
  <div class="footer">
    CinePilot - Film Production Management System | Generated by CinePilot AI
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setShowPrintMenu(false)
  }, [])

  // Update ref after handlePrint is defined
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  // Update ref after handleExportMarkdown is defined
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  const certInfo = analysis?.predictedCertificate 
    ? CERTIFICATE_INFO[analysis.predictedCertificate.replace(/\d+/g, '').trim()] || CERTIFICATE_INFO['UA']
    : CERTIFICATE_INFO['UA']

  const sensitivityValue = stats?.sensitivityScore ?? Math.round((analysis?.deterministicScore ?? 0) * 100)
  const sensitivityData = [{ name: 'score', value: sensitivityValue, fill: '#06b6d4' }]

  const riskData = [
    { name: 'Content', value: 35, fill: '#f59e0b' },
    { name: 'Violence', value: 25, fill: '#ef4444' },
    { name: 'Language', value: 20, fill: '#f97316' },
    { name: 'Theme', value: 15, fill: '#8b5cf6' },
    { name: 'Other', value: 5, fill: '#6b7280' },
  ]

  const categoryData = analysis?.sceneFlags 
    ? Object.entries(analysis.sceneFlags.reduce((acc, flag) => {
        acc[flag.category] = (acc[flag.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)).map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other']
      }))
    : []

  const filteredFlags = useMemo(() => {
    const flags = analysis?.sceneFlags?.filter(flag => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          flag.category.toLowerCase().includes(query) ||
          flag.context.toLowerCase().includes(query) ||
          flag.scene.sceneNumber.toLowerCase().includes(query) ||
          flag.scene.headingRaw.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      // Category filter
      if (filterCategory !== 'all' && flag.category !== filterCategory) return false
      // Severity filter
      if (filterSeverity === 'high' && flag.severity < 6) return false
      if (filterSeverity === 'medium' && (flag.severity < 4 || flag.severity >= 6)) return false
      if (filterSeverity === 'low' && flag.severity >= 4) return false
      return true
    }) || []
    
    // Sorting
    return [...flags].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'scene':
          comparison = a.scene.sceneNumber.localeCompare(b.scene.sceneNumber, undefined, { numeric: true })
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'severity':
          comparison = a.severity - b.severity
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [analysis?.sceneFlags, searchQuery, filterCategory, filterSeverity, sortBy, sortOrder])

  const confidenceLevel = analysis?.confidence || stats?.confidence || 'medium'
  const confidenceColors: Record<string, string> = {
    high: 'text-emerald-400 bg-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    low: 'text-red-400 bg-red-500/20',
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Censor Analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Censor Certification</h1>
              {isDemoMode && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                  Demo
                </span>
              )}
              {lastUpdated && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Predict certificate ratings & identify risky content
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search flags... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm w-48 placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter Toggle Button */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter & Sort
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-cyan-500 text-black text-xs font-medium rounded">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* Filter & Sort Panel */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400 mb-2 block">Category</label>
                    <span className="text-xs text-cyan-400">(1-5 to filter, 0 to clear)</span>
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="Violence">Violence</option>
                    <option value="Profanity">Profanity</option>
                    <option value="Sexual Content">Sexual Content</option>
                    <option value="Drugs/Alcohol">Drugs/Alcohol</option>
                    <option value="Sensitive Theme">Sensitive Theme</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400 mb-2 block">Severity</label>
                    <span className="text-xs text-emerald-400">(⇧1-3 to filter, ⇧0 to clear)</span>
                  </div>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High (7-10)</option>
                    <option value="medium">Medium (4-6)</option>
                    <option value="low">Low (1-3)</option>
                  </select>
                  
                  {/* Sort Options */}
                  <div className="border-t border-gray-700 pt-4">
                    <label className="text-xs text-gray-400 mb-2 block">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'scene' | 'category' | 'severity')}
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                      >
                        <option value="severity">Severity</option>
                        <option value="scene">Scene #</option>
                        <option value="category">Category</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortOrder === 'asc'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-cyan-500/50'
                        }`}
                      >
                        {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={clearFilters}
                    className={`w-full py-2 text-sm transition-colors ${
                      activeFilterCount > 0 
                        ? 'text-amber-400 hover:text-amber-300' 
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={activeFilterCount === 0}
                  >
                    {activeFilterCount > 0 ? `Clear All (${activeFilterCount})` : 'Clear All'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="default-project">இதயத்தின் ஒலி</option>
            <option value="project-2">Veera's Journey</option>
          </select>
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!analysis}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 border border-gray-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { handleExport('json'); setShowExportDropdown(false) }}
                  disabled={!analysis}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <FileJson className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm text-white">JSON</div>
                    <div className="text-xs text-gray-500">Full analysis data</div>
                  </div>
                </button>
                <button
                  onClick={() => { handleExport('pdf'); setShowExportDropdown(false) }}
                  disabled={!analysis}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-sm text-white">PDF</div>
                    <div className="text-xs text-gray-500">Print-ready report</div>
                  </div>
                </button>
                <button
                  onClick={() => { handleExportMarkdown(); setShowExportDropdown(false) }}
                  disabled={!analysis}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-sm text-white">Markdown</div>
                    <div className="text-xs text-gray-500">Formatted document</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          {/* Print Button */}
          <div className="relative" ref={printMenuRef}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              disabled={!analysis}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-sm font-medium border border-amber-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Report
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={() => { setIsRefreshing(true); fetchDataRef.current?.() }}
            disabled={isRefreshing || loading}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs">?</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-700/50 w-fit">
        <button
          onClick={() => setViewMode('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'summary' 
              ? 'bg-cyan-500 text-black shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Summary
          <span className="ml-1 text-xs opacity-70">(1)</span>
        </button>
        <button
          onClick={() => setViewMode('flags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'flags' 
              ? 'bg-cyan-500 text-black shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Scene Flags
          <span className="ml-1 px-1.5 py-0.5 bg-gray-700 text-white text-xs rounded">
            {analysis?.sceneFlags?.length || 0}
          </span>
          <span className="text-xs opacity-70">(2)</span>
        </button>
        <button
          onClick={() => setViewMode('suggestions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'suggestions' 
              ? 'bg-cyan-500 text-black shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Suggestions
          <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
            {analysis?.suggestions?.length || 0}
          </span>
          <span className="text-xs opacity-70">(3)</span>
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'analytics' 
              ? 'bg-cyan-500 text-black shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
          <span className="text-xs opacity-70">(4)</span>
        </button>
      </div>

      {/* Summary & Analytics View - Certificate Display */}
      {(viewMode === 'summary' || viewMode === 'analytics') && (
        <>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`px-8 py-6 rounded-2xl border-2 ${certInfo.bg} text-center`}>
              <div className={`text-4xl font-bold ${certInfo.color}`}>
                {analysis?.predictedCertificate || stats?.predictedCertificate || '--'}
              </div>
              <div className={`text-sm mt-1 ${certInfo.color}`}>{certInfo.label}</div>
              <div className={`text-xs mt-1 ${certInfo.color} opacity-75`}>Age: {certInfo.age}</div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Predicted Certificate</h2>
              <p className="text-gray-400 text-sm mb-3">{certInfo.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${confidenceColors[confidenceLevel]}`}>
                  {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence
                </span>
                <span className="text-xs text-gray-500">
                  Analysis: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={sensitivityData} startAngle={180} endAngle={0}>
                <RadialBar background={{ fill: '#1f2937' }} dataKey="value" cornerRadius={10} fill="#06b6d4" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-12 relative z-10">
              <div className="text-2xl font-bold text-cyan-400">
                {stats?.sensitivityScore || Math.round((analysis?.deterministicScore || 0) * 100)}
              </div>
              <div className="text-xs text-gray-500">Sensitivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-gray-400">High Risk Flags</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {analysis?.sceneFlags?.filter(f => f.severity >= 6).length || analysis?._count?.sceneFlags || stats?.highRiskCount || 0}
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-gray-400">Suggestions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {analysis?.suggestions?.length || analysis?._count?.suggestions || stats?.suggestionCount || 0}
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-gray-400">Content Score</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round((analysis?.deterministicScore || 0.5) * 100)}%
          </p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-400">Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {analysis ? 'Complete' : 'Not Run'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Risk by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.length > 0 ? categoryData : riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value} flags`, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {(categoryData.length > 0 ? categoryData : riskData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Top Risk Drivers
          </h3>
          <div className="space-y-3">
            {analysis?.topDrivers && analysis.topDrivers.length > 0 ? (
              analysis.topDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{driver}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No risk drivers identified</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Scene Flags Detail - Only in flags view */}
      {viewMode === 'flags' && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Scene-by-Scene Flags
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
            >
              <option value="all">All Severity</option>
              <option value="high">High (6-10)</option>
              <option value="medium">Medium (4-5)</option>
              <option value="low">Low (1-3)</option>
            </select>
          </div>
        </div>
        
        {filteredFlags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFlags.map((flag) => (
              <div 
                key={flag.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  flag.severity >= 6 ? 'bg-red-500/10 border-red-500/30' : 
                  flag.severity >= 4 ? 'bg-amber-500/10 border-amber-500/30' : 
                  'bg-green-500/10 border-green-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  flag.severity >= 6 ? 'bg-red-500/20 text-red-400' : 
                  flag.severity >= 4 ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-green-500/20 text-green-400'
                }`}>
                  {flag.severity}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{flag.scene?.sceneNumber || 'Scene'}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${CATEGORY_COLORS[flag.category]}30`, color: CATEGORY_COLORS[flag.category] }}
                    >
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{flag.context}</p>
                  {flag.scene?.headingRaw && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{flag.scene.headingRaw}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            <p>No flags match the selected filters</p>
          </div>
        )}
      </div>
      )}

      {/* Suggestions - Only in suggestions view */}
      {viewMode === 'suggestions' && analysis?.suggestions && analysis.suggestions.length > 0 && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Suggested Modifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Scene {suggestion.sceneNumber}</span>
                  <span className="text-xs text-amber-400">Severity -{Math.abs(suggestion.expectedSeverityDelta)}</span>
                </div>
                <p className="text-sm text-gray-300 mb-2"><strong>Issue:</strong> {suggestion.issue}</p>
                <p className="text-sm text-gray-400 mb-2"><strong>Change:</strong> {suggestion.suggestedChange}</p>
                <p className="text-xs text-gray-500"><strong>Why:</strong> {suggestion.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics View - Detailed Charts */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Header */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Censor Analytics Dashboard
            </h3>
            <p className="text-gray-400 text-sm">
              Detailed breakdown of content sensitivity, risk factors, and certification metrics
            </p>
          </div>

          {/* Category Breakdown Chart */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Risk by Category
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.length > 0 ? categoryData : riskData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Severity Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {analysis?.sceneFlags?.filter(f => f.severity >= 7).length || 0}
                </div>
                <div className="text-sm text-gray-400 mt-1">Critical (7-10)</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {analysis?.sceneFlags?.filter(f => f.severity >= 4 && f.severity < 7).length || 0}
                </div>
                <div className="text-sm text-gray-400 mt-1">Medium (4-6)</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {analysis?.sceneFlags?.filter(f => f.severity < 4).length || 0}
                </div>
                <div className="text-sm text-gray-400 mt-1">Low (1-3)</div>
              </div>
            </div>
          </div>

          {/* Pie Chart - Flag Categories */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Flag Category Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {(categoryData.length > 0 ? categoryData : riskData).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CATEGORY_COLORS)[index % Object.keys(CATEGORY_COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Reference Guide */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Indian Film Certificate Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CERTIFICATE_INFO).map(([key, info]) => (
            <div key={key} className={`p-4 rounded-xl border ${info.bg}`}>
              <div className={`text-xl font-bold ${info.color} mb-1`}>{key}</div>
              <div className={`text-sm font-medium ${info.color} mb-2`}>{info.label}</div>
              <div className="text-xs text-gray-400">{info.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600">
        <p>Last analysis: {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Never'}</p>
        <p className="mt-1">Powered by CinePilot AI • For reference only</p>
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {/* Filters Panel CLOSED - View Switching */}
              <div className="text-xs font-medium text-amber-400 uppercase tracking-wider mt-3 mb-2">When Filters Closed</div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Summary view</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Scene Flags view</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Suggestions view</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Analytics view</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">4</kbd>
              </div>
              
              {/* Filters Panel OPEN - Category/Severity Filtering */}
              <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider mt-3 mb-2">When Filters Open</div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: All Categories</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Content</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Language</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Technical</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">4</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Cultural</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">5</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Clear category filter</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-cyan-400">0</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: High Severity</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-emerald-400">⇧1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Medium Severity</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-emerald-400">⇧2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Filter: Low Severity</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-emerald-400">⇧3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Clear severity filter</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-emerald-400">⇧0</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Clear all filters</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-amber-400">X</kbd>
              </div>
              
              {/* General Shortcuts */}
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-3 mb-2">General</div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Refresh analysis</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Focus search</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">F</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Export menu</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">E</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Export Markdown</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">M</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Print report</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Close / Clear</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
