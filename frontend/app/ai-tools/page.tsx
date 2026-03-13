'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Brain, Sparkles, FileText, Clapperboard, DollarSign, 
  Calendar, AlertTriangle, MessageSquare, Wand2,
  Play, ArrowRight, TrendingUp, Target, Zap, Loader2,
  BarChart3, PieChart, Activity, Gauge, AlertOctagon,
  CheckCircle, XCircle, Info, RefreshCw, Keyboard, Search, X,
  Download, Printer
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchToolsRef = useRef<() => void>(() => {})

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

  // Print functionality
  const handlePrint = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const toolCategories = allCategories.reduce((acc: Record<string, number>, cat) => {
      acc[cat] = filteredTools.filter(t => t.category === cat).length
      return acc
    }, {})

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
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${filteredTools.length}</div>
      <div class="stat-label">Total Tools</div>
    </div>
    <div class="stat">
      <div class="stat-value">${allCategories.length}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat">
      <div class="stat-value">${filteredTools.filter(t => t.endpoint?.includes('script')).length}</div>
      <div class="stat-label">Script Tools</div>
    </div>
    <div class="stat">
      <div class="stat-value">${filteredTools.filter(t => t.endpoint?.includes('budget')).length}</div>
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
        ${filteredTools.map(tool => `
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
  }

  // Click outside to close export menu
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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilterPanel])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFilterPanel(!showFilterPanel)
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleRefresh()
      } else if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setShowExportMenu(prev => !prev)
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handlePrint()
      } else if (e.key === '?') {
        e.preventDefault()
        setShowKeyboardHelp(true)
      } else if (e.key === 'Escape') {
        setShowKeyboardHelp(false)
        setShowExportMenu(false)
        setShowPrintMenu(false)
        setShowFilterPanel(false)
        setSearchQuery('')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRefresh, showFilterPanel])

  // Convert tools to renderable format with search and category filtering
  const filteredTools = tools.filter(t => {
    const matchesSearch = !searchQuery.trim() || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })
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
  const allCategories = categories.length > 0 
    ? categories 
    : [...new Set(aiFeatures.map(f => f.category))]

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
              
              {/* Filter Toggle Button */}
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    categoryFilter !== 'all' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle filters (F)"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                  {categoryFilter !== 'all' && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white text-indigo-500 text-xs rounded-full">1</span>
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
                          <option value="all">All Categories</option>
                          {categories.length > 0 ? categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          )) : (
                            <>
                              <option value="Script">Script</option>
                              <option value="Finance">Finance</option>
                              <option value="Production">Production</option>
                              <option value="Planning">Planning</option>
                              <option value="Risk">Risk</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
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

        {/* Feature Grid */}
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
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Toggle filters</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">F</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Refresh tools</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">R</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Focus search</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">/</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Export menu</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">E</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Print report</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">P</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">?</kbd>
                </div>
                <div className="flex items-center justify-between py-2">
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
