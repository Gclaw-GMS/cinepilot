'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  Brain, Sparkles, FileText, Clapperboard, DollarSign, 
  Calendar, AlertTriangle, MessageSquare, Wand2,
  Play, ArrowRight, TrendingUp, Target, Zap, Loader2,
  BarChart3, PieChart as PieChartIcon, Activity, Gauge, AlertOctagon,
  CheckCircle, XCircle, Info, RefreshCw, Keyboard, Search, X,
  Download, Printer, Grid, List
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface AnalysisResult {
  success?: boolean;
  action?: string;
  result?: any;
  source?: string;
  timestamp?: string;
}

interface AITool {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: string;
  endpoint: string;
}

// Icon mapping for API data
const ICON_MAP: Record<string, typeof FileText> = {
  FileText,
  DollarSign,
  Clapperboard,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  CheckCircle,
}

// Color mapping
const COLORS_MAP: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  slate: '#64748b',
  blue: '#3b82f6',
  purple: '#a855f7',
}

// Default features if API fails
const DEFAULT_AI_FEATURES: AITool[] = [
  { id: 'script-analyzer', name: 'Script Intelligence', desc: 'Deep analysis of your script with scene breakdown', icon: 'FileText', color: 'indigo', category: 'Script', endpoint: '/api/scripts' },
  { id: 'budget-forecast', name: 'Budget Forecast', desc: 'AI-powered cost estimation and breakdown', icon: 'DollarSign', color: 'emerald', category: 'Finance', endpoint: '/api/budget?action=forecast' },
  { id: 'shot-suggest', name: 'Shot Recommender', desc: 'Cinematography suggestions per scene', icon: 'Clapperboard', color: 'violet', category: 'Production', endpoint: '/api/shots' },
  { id: 'schedule', name: 'Schedule Optimizer', desc: 'Optimize shooting schedule by location', icon: 'Calendar', color: 'amber', category: 'Planning', endpoint: '/api/schedule' },
  { id: 'risk-detect', name: 'Risk Detector', desc: 'Identify and mitigate production risks', icon: 'AlertTriangle', color: 'rose', category: 'Risk', endpoint: '/api/mission-control' },
  { id: 'dialogue', name: 'Dialogue Refiner', desc: 'Improve script dialogue and pacing', icon: 'MessageSquare', color: 'cyan', category: 'Script', endpoint: '/api/scripts' },
]

// Convert API tool to component format
function apiToolToFeature(tool: AITool) {
  const IconComponent = ICON_MAP[tool.icon] || FileText;
  return {
    ...tool,
    iconComponent: IconComponent,
    color: tool.color || 'slate',
  };
}

// Production Input Form
function ProductionInput({ onRun, isLoading }: { onRun: (params: any) => void, isLoading: boolean }) {
  const [params, setParams] = useState({
    scene_count: 45,
    location_count: 8,
    cast_size: 12,
    duration_days: 30,
    is_outdoor: true,
    is_night_shoots: false,
  })

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <Target className="w-4 h-4" />
        Production Parameters
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Scenes</label>
          <input 
            type="number" 
            value={params.scene_count}
            onChange={(e) => setParams({...params, scene_count: parseInt(e.target.value) || 0})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Locations</label>
          <input 
            type="number" 
            value={params.location_count}
            onChange={(e) => setParams({...params, location_count: parseInt(e.target.value) || 0})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Cast Size</label>
          <input 
            type="number" 
            value={params.cast_size}
            onChange={(e) => setParams({...params, cast_size: parseInt(e.target.value) || 0})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Shoot Days</label>
          <input 
            type="number" 
            value={params.duration_days}
            onChange={(e) => setParams({...params, duration_days: parseInt(e.target.value) || 0})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Outdoor</label>
          <select 
            value={params.is_outdoor ? 'true' : 'false'}
            onChange={(e) => setParams({...params, is_outdoor: e.target.value === 'true'})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Night Shoots</label>
          <select 
            value={params.is_night_shoots ? 'true' : 'false'}
            onChange={(e) => setParams({...params, is_night_shoots: e.target.value === 'true'})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Risk Gauge Component
function RiskGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 60) return '#f43f5e'
    if (s >= 30) return '#f59e0b'
    return '#10b981'
  }
  
  const percentage = Math.min(score, 100)
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="64" cy="64" r="56" fill="none" stroke="#334155" strokeWidth="12" />
        <circle 
          cx="64" cy="64" r="56" fill="none" 
          stroke={getColor(score)} strokeWidth="12"
          strokeDasharray={`${percentage * 3.52} 352`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-500">Risk Score</span>
      </div>
    </div>
  )
}

// Budget Breakdown Chart
function BudgetChart({ data }: { data: any }) {
  if (!data?.breakdown) return null
  
  const chartData = [
    { name: 'Production', value: data.breakdown.production?.amount || 0, color: COLORS_MAP.indigo },
    { name: 'Post-Production', value: data.breakdown.postProduction?.amount || 0, color: COLORS_MAP.emerald },
    { name: 'Talent', value: data.breakdown.talent?.amount || 0, color: COLORS_MAP.violet },
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RePieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
        />
      </RePieChart>
    </ResponsiveContainer>
  )
}

// Scene Breakdown Chart
function SceneBreakdownChart({ data }: { data: any }) {
  if (!data?.sceneBreakdown) return null
  
  const chartData = [
    { name: 'Interior', value: data.sceneBreakdown.interior || 0, fill: COLORS_MAP.indigo },
    { name: 'Exterior', value: data.sceneBreakdown.exterior || 0, fill: COLORS_MAP.emerald },
    { name: 'Day', value: data.sceneBreakdown.day || 0, fill: COLORS_MAP.amber },
    { name: 'Night', value: data.sceneBreakdown.night || 0, fill: COLORS_MAP.violet },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={60} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Schedule Timeline
function ScheduleTimeline({ data }: { data: any }) {
  if (!data?.schedule) return null
  
  return (
    <div className="space-y-3">
      {data.schedule.map((item: any, i: number) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-24 text-sm text-slate-400">{item.phase}</div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">{item.focus}</span>
              <span className="text-indigo-400">{item.scenes} scenes</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{ width: `${(item.scenes / (data.schedule[0]?.scenes || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Risk Cards
function RiskCards({ risks }: { risks: any[] }) {
  if (!risks || risks.length === 0) return null
  
  const severityColors: Record<string, string> = {
    high: 'rose',
    medium: 'amber', 
    low: 'emerald',
  }
  
  return (
    <div className="space-y-3">
      {risks.map((risk, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-slate-700 hover:border-l-4 transition-all" style={{ borderColor: COLORS_MAP[severityColors[risk.severity] as keyof typeof COLORS_MAP] }}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-${severityColors[risk.severity]}-500/20 text-${severityColors[risk.severity]}-400`}>
                {risk.severity.toUpperCase()}
              </span>
              <h4 className="text-sm font-medium text-white mt-2">{risk.category}</h4>
              <p className="text-xs text-slate-400 mt-1">{risk.description}</p>
            </div>
            <span className="text-xs text-slate-500">{Math.round(risk.probability * 100)}%</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              <span className="text-emerald-400">Mitigation:</span> {risk.mitigation}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Stats Display
function StatsGrid({ stats }: { stats: any }) {
  if (!stats) return null
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {typeof value === 'number' ? (String(key).includes('Density') || String(key).includes('Length') ? (value as number).toFixed(1) : value) : String(value)}
          </div>
          <div className="text-xs text-slate-500 capitalize">{String(key).replace(/([A-Z])/g, ' $1')}</div>
        </div>
      ))}
    </div>
  )
}

// Recommendations List
function Recommendations({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null
  
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

// Main Component
export default function AIToolsPage() {
  const [tools, setTools] = useState<AITool[]>(DEFAULT_AI_FEATURES)
  const [categories, setCategories] = useState<string[]>([])
  const [loadingTools, setLoadingTools] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [params, setParams] = useState({
    scene_count: 45,
    location_count: 8,
    cast_size: 12,
    duration_days: 30,
    is_outdoor: true,
    is_night_shoots: false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'description'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const sortPanelRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  
  // View Mode state
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'analytics'>('list')
  const viewModeRef = useRef(viewMode)
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchToolsRef = useRef<() => void>(() => {})
  const handlePrintRef = useRef<() => void>(() => {})
  
  // Refs to store latest values for handlePrint function
  const filteredToolsRef = useRef<typeof tools>([])
  const allCategoriesRef = useRef<string[]>([])
  const sortByRef = useRef(sortBy)
  const sortOrderRef = useRef(sortOrder)
  const searchQueryRef = useRef(searchQuery)
  const categoryFilterRef = useRef(categoryFilter)

  // Fetch tools from API on mount
  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch('/api/ai-tools')
        const data = await res.json()
        if (data.tools && Array.isArray(data.tools) && data.tools.length > 0) {
          setTools(data.tools)
          if (data.categories) {
            setCategories(data.categories)
          }
        }
      } catch (e) {
        console.warn('Failed to fetch AI tools from API, using defaults:', e)
      } finally {
        setLoadingTools(false)
      }
    }
    fetchTools()
  }, [])

  // Set up fetch tools ref for keyboard shortcut
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/ai-tools')
      const data = await res.json()
      if (data.tools && Array.isArray(data.tools) && data.tools.length > 0) {
        setTools(data.tools)
        if (data.categories) {
          setCategories(data.categories)
        }
      }
    } catch (e) {
      console.warn('Failed to refresh AI tools:', e)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Export functions
  const handleExportCSV = () => {
    if (filteredTools.length === 0) return
    setExporting(true)
    setShowExportMenu(false)
    
    const headers = ['Name', 'Description', 'Category', 'Endpoint']
    const rows = filteredTools.map(tool => [
      tool.name,
      tool.desc,
      tool.category,
      tool.endpoint
    ])
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-tools-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleExportJSON = () => {
    if (filteredTools.length === 0) return
    setExporting(true)
    setShowExportMenu(false)
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTools: filteredTools.length,
      filters: {
        search: searchQuery || null,
        category: categoryFilter !== 'all' ? categoryFilter : null,
      },
      sort: {
        by: sortBy,
        order: sortOrder,
      },
      categories: allCategories,
      tools: filteredTools.map(tool => ({
        name: tool.name,
        description: tool.desc,
        category: tool.category,
        endpoint: tool.endpoint,
        icon: tool.icon,
        color: tool.color
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-tools-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  // Markdown Export
  const handleExportMarkdown = useCallback(() => {
    const currentFilteredTools = filteredToolsRef.current
    const currentAllCategories = allCategoriesRef.current
    const currentSearchQuery = searchQueryRef.current
    const currentCategoryFilter = categoryFilterRef.current
    const currentSortBy = sortByRef.current
    const currentSortOrder = sortOrderRef.current
    
    if (currentFilteredTools.length === 0) return
    setExporting(true)
    setShowExportMenu(false)
    
    // Group tools by category
    const toolsByCategory: Record<string, typeof currentFilteredTools> = {}
    currentFilteredTools.forEach(tool => {
      if (!toolsByCategory[tool.category]) {
        toolsByCategory[tool.category] = []
      }
      toolsByCategory[tool.category].push(tool)
    })
    
    // Build markdown
    let markdown = `# CinePilot AI Tools Report

> Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}

---

## Summary

- **Total Tools**: ${currentFilteredTools.length}
- **Categories**: ${currentAllCategories.length}
- **Search**: ${currentSearchQuery || 'None'}
- **Category Filter**: ${currentCategoryFilter !== 'all' ? currentCategoryFilter : 'All'}
- **Sort By**: ${currentSortBy} (${currentSortOrder})

---

## Categories Overview

`
    
    // Add category counts
    currentAllCategories.forEach(cat => {
      const count = currentFilteredTools.filter(t => t.category === cat).length
      markdown += `- **${cat}**: ${count} tool${count !== 1 ? 's' : ''}\n`
    })
    
    markdown += `\n---\n\n## Tools by Category\n\n`
    
    // Add tools grouped by category
    Object.entries(toolsByCategory).forEach(([category, tools]) => {
      markdown += `### ${category}\n\n`
      markdown += `| Name | Description | Endpoint |\n`
      markdown += `|------|-------------|----------|\n`
      tools.forEach(tool => {
        markdown += `| **${tool.name}** | ${tool.desc} | \`${tool.endpoint}\` |\n`
      })
      markdown += `\n`
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-tools-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }, [])

  // Print functionality
  // Print functionality - uses refs to avoid dependency issues
  const handlePrint = useCallback(() => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const currentFilteredTools = filteredToolsRef.current
    const currentAllCategories = allCategoriesRef.current
    const currentSortBy = sortByRef.current
    const currentSortOrder = sortOrderRef.current
    const currentSearchQuery = searchQueryRef.current
    const currentCategoryFilter = categoryFilterRef.current
    
    const toolCategories = currentAllCategories.reduce((acc: Record<string, number>, cat) => {
      acc[cat] = currentFilteredTools.filter(t => t.category === cat).length
      return acc
    }, {})
    
    // Build filter info string
    const filterParts = []
    if (currentSearchQuery) filterParts.push(`Search: "${currentSearchQuery}"`)
    if (currentCategoryFilter !== 'all') filterParts.push(`Category: ${currentCategoryFilter}`)
    if (currentSortBy !== 'name' || currentSortOrder !== 'asc') {
      filterParts.push(`Sort: ${currentSortBy} (${currentSortOrder})`)
    }
    const filterInfo = filterParts.length > 0 ? filterParts.join(' | ') : 'None'

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - AI Tools Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 24px; color: #0f172a; }
    .header .timestamp { font-size: 12px; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
    .section { margin-bottom: 30px; }
    .section h3 { font-size: 16px; color: #1e293b; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .tool-name { font-weight: bold; color: #1e293b; }
    .tool-desc { color: #64748b; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-Script { background: #e0e7ff; color: #4f46e5; }
    .badge-Finance { background: #d1fae5; color: #059669; }
    .badge-Production { background: #fce7f3; color: #db2777; }
    .badge-Planning { background: #fef3c7; color: #d97706; }
    .badge-Risk { background: #fee2e2; color: #dc2626; }
    .category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px; }
    .category-item { background: #f1f5f9; padding: 10px; border-radius: 6px; text-align: center; }
    .category-name { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .category-count { font-size: 18px; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤖 CinePilot - AI Tools Report</h1>
    <div class="timestamp">Generated: ${timestamp}</div>
  </div>
  <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
    <strong>Filters & Sort:</strong> ${filterInfo}
  </div>
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${currentFilteredTools.length}</div>
      <div class="stat-label">Total Tools</div>
    </div>
    <div class="stat">
      <div class="stat-value">${currentAllCategories.length}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat">
      <div class="stat-value">${currentFilteredTools.filter(t => t.endpoint?.includes('script')).length}</div>
      <div class="stat-label">Script Tools</div>
    </div>
    <div class="stat">
      <div class="stat-value">${currentFilteredTools.filter(t => t.endpoint?.includes('budget')).length}</div>
      <div class="stat-label">Budget Tools</div>
    </div>
  </div>
  <div class="category-grid">
    ${Object.entries(toolCategories).map(([cat, count]) => `
      <div class="category-item">
        <div class="category-count">${count}</div>
        <div class="category-name">${cat}</div>
      </div>
    `).join('')}
  </div>
  <div class="section">
    <h3>AI Tools Overview</h3>
    <table>
      <thead>
        <tr>
          <th>Tool</th>
          <th>Description</th>
          <th>Category</th>
          <th>Endpoint</th>
        </tr>
      </thead>
      <tbody>
        ${currentFilteredTools.map(tool => `
          <tr>
            <td class="tool-name">${tool.name}</td>
            <td class="tool-desc">${tool.desc}</td>
            <td><span class="badge badge-${tool.category}">${tool.category}</span></td>
            <td>${tool.endpoint || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">
    Generated by CinePilot - AI Pre-Production Platform
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
  }, [])  // Empty deps - uses refs

  // Update ref when handlePrint changes
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilterPanel && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
      if (showSortPanel && sortPanelRef.current && !sortPanelRef.current.contains(e.target as Node)) {
        setShowSortPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilterPanel, showSortPanel])

  // Keyboard shortcuts handler
  useEffect(() => {
    // Category mapping for number key shortcuts
    const CATEGORY_KEY_MAP: Record<string, string> = {
      '1': 'Script',
      '2': 'Finance',
      '3': 'Production',
      '4': 'Planning',
      '5': 'Risk',
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Number keys for category filtering (toggle behavior)
      if (CATEGORY_KEY_MAP[e.key]) {
        e.preventDefault()
        const targetCategory = CATEGORY_KEY_MAP[e.key]
        // Toggle: if same category selected, clear filter; otherwise set filter
        if (categoryFilterRef.current === targetCategory) {
          setCategoryFilter('all')
        } else {
          setCategoryFilter(targetCategory)
        }
      } else if (e.key === '0') {
        e.preventDefault()
        setCategoryFilter('all')
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        setViewMode('list')
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        setViewMode('grid')
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        setViewMode('analytics')
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFilterPanel(!showFilterPanel)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleRefresh()
      } else if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setShowExportMenu(prev => !prev)
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        handleExportMarkdown()
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handlePrintRef.current?.()
      } else if (e.key === '?') {
        e.preventDefault()
        setShowKeyboardHelp(true)
      } else if (e.key === 'Escape') {
        setShowKeyboardHelp(false)
        setShowExportMenu(false)
        setShowPrintMenu(false)
        setShowFilterPanel(false)
        setShowSortPanel(false)
        setSearchQuery('')
        setSortBy('name')
        setSortOrder('asc')
        setCategoryFilter('all')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRefresh, handleExportMarkdown, showFilterPanel, sortOrder, categoryFilter])

  // Active filter count (includes sort state)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (categoryFilter !== 'all') count++
    if (searchQuery.trim()) count++
    if (sortBy !== 'name' || sortOrder !== 'asc') count++
    return count
  }, [categoryFilter, searchQuery, sortBy, sortOrder])

  // Convert tools to renderable format with search, category filtering, and sorting
  const filteredTools = useMemo(() => {
    let result = tools.filter(t => {
      const matchesSearch = !searchQuery.trim() || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'description':
          comparison = a.desc.localeCompare(b.desc)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [tools, searchQuery, categoryFilter, sortBy, sortOrder])
  
  const aiFeatures = filteredTools.map(apiToolToFeature)

  const runAnalysis = async (featureId: string) => {
    setSelected(featureId)
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: featureId,
          ...params
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const getFeatureColor = (color: string) => COLORS_MAP[color] || COLORS_MAP.slate

  // Get unique categories from tools
  const allCategories = useMemo(() => {
    return categories.length > 0 
      ? categories 
      : [...new Set(aiFeatures.map(f => f.category))]
  }, [categories, aiFeatures])
  
  // Update refs when filteredTools or allCategories change
  useEffect(() => {
    filteredToolsRef.current = filteredTools
    allCategoriesRef.current = allCategories
    sortByRef.current = sortBy
    sortOrderRef.current = sortOrder
    searchQueryRef.current = searchQuery
    categoryFilterRef.current = categoryFilter
  }, [filteredTools, allCategories, sortBy, sortOrder, searchQuery, categoryFilter])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-indigo-400" />
                <h1 className="text-2xl font-semibold tracking-tight">AI Production Tools</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">Powered by AIML API — Intelligent film production analysis</p>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="List View (L)"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
                <span className="text-xs opacity-60">(L)</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Grid View (G)"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
                <span className="text-xs opacity-60">(G)</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'analytics' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Analytics View (A)"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="text-xs opacity-60">(A)</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tools... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm w-48 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">(/)</span>
              </div>
              
              {/* Filter & Sort Toggle Buttons */}
              <div className="flex items-center gap-2">
                {/* Filter Toggle Button */}
                <div className="relative" ref={filterRef}>
                  <button 
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      categoryFilter !== 'all' || searchQuery.trim()
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Toggle filters (F)"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-sm">Filters</span>
                    {(categoryFilter !== 'all' || searchQuery.trim()) && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white text-indigo-500 text-xs rounded-full">
                        {(categoryFilter !== 'all' ? 1 : 0) + (searchQuery.trim() ? 1 : 0)}
                      </span>
                    )}
                  </button>
                  {showFilterPanel && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Filter Tools</h3>
                          {categoryFilter !== 'all' && (
                            <button 
                              onClick={() => setCategoryFilter('all')}
                              className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Category</label>
                          <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="all">All Categories (0)</option>
                          {categories.length > 0 ? categories.map((cat, idx) => (
                            <option key={cat} value={cat}>{cat} ({idx + 1})</option>
                          )) : (
                            <>
                              <option value="Script">Script (1)</option>
                              <option value="Finance">Finance (2)</option>
                              <option value="Production">Production (3)</option>
                              <option value="Planning">Planning (4)</option>
                              <option value="Risk">Risk (5)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sort Toggle Button */}
              <div className="relative" ref={sortPanelRef}>
                <button 
                  onClick={() => setShowSortPanel(!showSortPanel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    sortBy !== 'name' || sortOrder !== 'asc'
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle sort (S)"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Sort</span>
                  {sortBy !== 'name' || sortOrder !== 'asc' ? (
                    <span className="ml-1 px-1.5 py-0.5 bg-white text-indigo-500 text-xs rounded-full">1</span>
                  ) : null}
                </button>
                {showSortPanel && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Sort Tools</h3>
                        {(sortBy !== 'name' || sortOrder !== 'asc') && (
                          <button 
                            onClick={() => { setSortBy('name'); setSortOrder('asc') }}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Sort By</label>
                          <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                          >
                            <option value="name">Name</option>
                            <option value="category">Category</option>
                            <option value="description">Description</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition ${
                            sortOrder === 'asc' 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          {sortOrder === 'asc' ? (
                            <>↑ Ascending</>
                          ) : (
                            <>↓ Descending</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Refresh (R)"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Keyboard Help Button */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Export Button with Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting || filteredTools.length === 0}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  title="Export (E)"
                >
                  <Download className={`w-4 h-4 text-slate-400 ${exporting ? 'animate-pulse' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 min-w-[140px]">
                    <button
                      onClick={handleExportCSV}
                      disabled={exporting}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      disabled={exporting}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      disabled={exporting}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Export Markdown
                    </button>
                  </div>
                )}
              </div>

              {/* Print Button with Dropdown */}
              <div className="relative" ref={printMenuRef}>
                <button
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  disabled={filteredTools.length === 0}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  title="Print (P)"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 min-w-[160px]">
                    <button
                      onClick={handlePrint}
                      disabled={filteredTools.length === 0}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      Print Report
                    </button>
                  </div>
                )}
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs ${result?.source === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {result?.source === 'ai' ? '🤖 AI' : '📊 Demo'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 border border-indigo-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-2xl font-bold text-white">{loadingTools ? '-' : filteredTools.length}</p>
                <p className="text-xs text-slate-400">AI Tools {searchQuery ? `(filtered from ${tools.length})` : ''}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <div>
                <p className="text-2xl font-bold text-white">{result ? '1' : '0'}</p>
                <p className="text-xs text-slate-400">Analyses Run</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">~2min</p>
                <p className="text-xs text-slate-400">Avg. Time Saved</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Gauge className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">99%</p>
                <p className="text-xs text-slate-400">Accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Production Parameters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Production Parameters
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Scenes</label>
              <input 
                type="number" 
                value={params.scene_count}
                onChange={(e) => setParams({...params, scene_count: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Locations</label>
              <input 
                type="number" 
                value={params.location_count}
                onChange={(e) => setParams({...params, location_count: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cast Size</label>
              <input 
                type="number" 
                value={params.cast_size}
                onChange={(e) => setParams({...params, cast_size: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Shoot Days</label>
              <input 
                type="number" 
                value={params.duration_days}
                onChange={(e) => setParams({...params, duration_days: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Outdoor</label>
              <select 
                value={params.is_outdoor ? 'true' : 'false'}
                onChange={(e) => setParams({...params, is_outdoor: e.target.value === 'true'})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Night Shoots</label>
              <select 
                value={params.is_night_shoots ? 'true' : 'false'}
                onChange={(e) => setParams({...params, is_night_shoots: e.target.value === 'true'})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature Grid - View Mode Conditional Rendering */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {loadingTools ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
                <span className="text-slate-400">Loading AI tools...</span>
              </div>
            ) : (
              aiFeatures.map((feature) => {
                const IconComponent = feature.iconComponent || FileText;
                return (
                  <button
                    key={feature.id}
                    onClick={() => runAnalysis(feature.id)}
                    disabled={loading}
                    style={{ 
                      borderColor: selected === feature.id ? getFeatureColor(feature.color) + '/50' : undefined,
                      boxShadow: selected === feature.id ? `0 0 20px ${getFeatureColor(feature.color)}/20` : undefined
                    }}
                    className={`text-left bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 hover:shadow-lg transition-all ${loading ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${getFeatureColor(feature.color)}20` }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: getFeatureColor(feature.color) }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">{feature.name}</h3>
                          {selected === feature.id && loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{feature.desc}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-500">{feature.category}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Grid View - Compact Visual Cards */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
            {loadingTools ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
                <span className="text-slate-400">Loading AI tools...</span>
              </div>
            ) : (
              aiFeatures.map((feature) => {
                const IconComponent = feature.iconComponent || FileText;
                return (
                  <button
                    key={feature.id}
                    onClick={() => runAnalysis(feature.id)}
                    disabled={loading}
                    style={{ 
                      borderColor: selected === feature.id ? getFeatureColor(feature.color) + '/50' : undefined,
                      backgroundColor: selected === feature.id ? `${getFeatureColor(feature.color)}10` : undefined
                    }}
                    className={`flex flex-col items-center justify-center text-center bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 hover:shadow-lg transition-all ${loading ? 'opacity-50' : ''}`}
                  >
                    <div 
                      className="p-3 rounded-xl mb-3"
                      style={{ backgroundColor: `${getFeatureColor(feature.color)}20` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: getFeatureColor(feature.color) }} />
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{feature.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-500">{feature.category}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Analytics View - Charts and Statistics */}
        {viewMode === 'analytics' && (
          <div className="space-y-6 mb-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Brain className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Total Tools</p>
                    <p className="text-2xl font-bold text-white">{aiFeatures.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <PieChartIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Categories</p>
                    <p className="text-2xl font-bold text-white">{allCategories.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Search Results</p>
                    <p className="text-2xl font-bold text-white">{filteredTools.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Active Filters</p>
                    <p className="text-2xl font-bold text-white">{activeFilterCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-400" />
                  Category Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={allCategories.map((cat, idx) => ({
                          name: cat,
                          value: aiFeatures.filter(f => f.category === cat).length,
                          color: Object.values(COLORS_MAP)[idx % Object.values(COLORS_MAP).length]
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {allCategories.map((cat, idx) => (
                          <Cell key={cat} fill={Object.values(COLORS_MAP)[idx % Object.values(COLORS_MAP).length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Tools by Category
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allCategories.map((cat) => ({
                        category: cat,
                        count: aiFeatures.filter(f => f.category === cat).length
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis type="category" dataKey="category" stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tools by Category Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Tools by Category
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Tools Count</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Tool Names</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.map((cat) => {
                      const categoryTools = aiFeatures.filter(f => f.category === cat)
                      return (
                        <tr key={cat} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{cat}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm">{categoryTools.length}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-sm">
                            {categoryTools.map(t => t.name).join(', ')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">AI is analyzing your production...</p>
          </div>
        )}

        {result?.result && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Result Header */}
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.source === 'ai' ? (
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Info className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-semibold text-white">
                  {aiFeatures.find(f => f.id === result.action)?.name} Results
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${result.source === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {result.source === 'ai' ? '🤖 AI Powered' : '📊 Demo Data'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(result.timestamp || '').toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Summary */}
              {result.result.summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Summary</h4>
                  <p className="text-white bg-slate-800/50 rounded-lg p-4">{result.result.summary}</p>
                </div>
              )}

              {/* Risk Score Special Display */}
              {result.result.riskScore !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex justify-center">
                    <RiskGauge score={result.result.riskScore} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Identified Risks</h4>
                    <RiskCards risks={result.result.risks} />
                  </div>
                </div>
              )}

              {/* Budget Display */}
              {result.result.estimatedTotal && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-slate-400">Budget Breakdown</h4>
                    <span className="text-2xl font-bold text-emerald-400">
                      ₹{(result.result.estimatedTotal / 10000000).toFixed(1)}Cr
                    </span>
                  </div>
                  <BudgetChart data={result.result} />
                </div>
              )}

              {/* Scene Breakdown */}
              {result.result.sceneBreakdown && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Scene Breakdown</h4>
                  <SceneBreakdownChart data={result.result} />
                </div>
              )}

              {/* Schedule Timeline */}
              {result.result.schedule && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-slate-400">Optimized Schedule</h4>
                    {result.result.savings && (
                      <span className="text-emerald-400 text-sm">
                        Save {result.result.savings} days
                      </span>
                    )}
                  </div>
                  <ScheduleTimeline data={result.result} />
                </div>
              )}

              {/* Stats Grid */}
              {result.result.stats && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Statistics</h4>
                  <StatsGrid stats={result.result.stats} />
                </div>
              )}

              {/* Recommendations */}
              {result.result.recommendations && result.result.recommendations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Recommendations</h4>
                  <Recommendations items={result.result.recommendations} />
                </div>
              )}

              {/* Overall Assessment */}
              {result.result.overallAssessment && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className={`px-4 py-3 rounded-lg ${result.result.riskScore >= 60 ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                    <p className="text-sm text-white">{result.result.overallAssessment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Analyze</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Select an AI tool above to analyze your production. Results will appear here with detailed insights and recommendations.
            </p>
          </div>
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-3">
                {/* View Mode Shortcuts */}
                <div className="pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">View Modes</h3>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">List View</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">L</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Grid View</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">G</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Analytics View</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">A</kbd>
                </div>
                
                {/* Category Filter Shortcuts */}
                <div className="pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Category Filter</h3>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">All Categories</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">0</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Script</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">1</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Finance</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">2</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Production</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">3</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Planning</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">4</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Risk</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">5</kbd>
                </div>
                
                {/* Other Shortcuts */}
                <div className="pt-2 pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Other Shortcuts</h3>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Toggle filters</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">F</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Toggle sort order</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">S</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Refresh tools</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">R</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Focus search</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">/</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Export menu</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">E</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Export Markdown</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">M</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Print report</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">P</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">?</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Close / Clear</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">Esc</kbd>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-6 text-center">
                Press the key to trigger the action instantly
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
