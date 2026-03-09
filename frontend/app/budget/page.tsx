'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  RefreshCw, Loader2, Download, Filter, Plus, X, Keyboard, Search
} from 'lucide-react'

interface BudgetItemData {
  id: string
  category: string
  subcategory: string | null
  description: string | null
  quantity: string | null
  unit: string | null
  rate: string | null
  rateLow: string | null
  rateHigh: string | null
  total: string | null
  actualCost: string | null
  source: string
  notes: string | null
}

interface ExpenseData {
  id: string
  category: string
  description: string
  amount: string
  date: string
  vendor: string | null
  status: string
  notes: string | null
}

interface ForecastData {
  planned: number
  actual: number
  eacTotal: number
  variance: number
  percentSpent: number
  categories: { category: string; planned: number; actual: number; forecast: number; status: string }[]
}

type ActiveTab = 'overview' | 'breakdown' | 'expenses' | 'forecast'

const REGIONS = ['Tamil Nadu', 'Chennai', 'Madurai', 'Ooty']
const SCALES = [
  { key: 'micro', label: 'Micro (<50L)' },
  { key: 'indie', label: 'Indie (50L-2Cr)' },
  { key: 'mid', label: 'Mid (2-10Cr)' },
  { key: 'big', label: 'Big (10Cr+)' },
]

// Demo data for budget preview
const DEMO_BUDGET_ITEMS: BudgetItemData[] = [
  { id: '1', category: 'Production', subcategory: 'Crew', description: 'Director Fee', quantity: '1', unit: 'lot', rate: '5000000', rateLow: '4000000', rateHigh: '6000000', total: '5000000', source: 'ai', notes: null, actualCost: null },
  { id: '2', category: 'Production', subcategory: 'Crew', description: 'Cinematographer Fee', quantity: '1', unit: 'lot', rate: '3000000', rateLow: '2500000', rateHigh: '4000000', total: '3000000', source: 'ai', notes: null, actualCost: null },
  { id: '3', category: 'Production', subcategory: 'Camera', description: 'RED Komodo Rental', quantity: '15', unit: 'days', rate: '15000', rateLow: '12000', rateHigh: '18000', total: '225000', source: 'ai', notes: null, actualCost: null },
  { id: '4', category: 'Production', subcategory: 'Camera', description: 'Arri Alexa Mini LF', quantity: '15', unit: 'days', rate: '35000', rateLow: '30000', rateHigh: '40000', total: '525000', source: 'ai', notes: null, actualCost: null },
  { id: '5', category: 'Production', subcategory: 'Lighting', description: 'Arri SkyPanel S60', quantity: '10', unit: 'days', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '80000', source: 'ai', notes: null, actualCost: null },
  { id: '6', category: 'Production', subcategory: 'Sound', description: 'Sound Equipment Package', quantity: '20', unit: 'days', rate: '5000', rateLow: '4000', rateHigh: '6000', total: '100000', source: 'ai', notes: null, actualCost: null },
  { id: '7', category: 'Talent', subcategory: 'Lead Actors', description: 'Lead Actor Fee', quantity: '1', unit: 'lot', rate: '15000000', rateLow: '12000000', rateHigh: '18000000', total: '15000000', source: 'ai', notes: null, actualCost: null },
  { id: '8', category: 'Talent', subcategory: 'Lead Actors', description: 'Lead Actress Fee', quantity: '1', unit: 'lot', rate: '10000000', rateLow: '8000000', rateHigh: '12000000', total: '10000000', source: 'ai', notes: null, actualCost: null },
  { id: '9', category: 'Talent', subcategory: 'Supporting', description: 'Supporting Cast', quantity: '15', unit: 'days', rate: '50000', rateLow: '40000', rateHigh: '60000', total: '750000', source: 'ai', notes: null, actualCost: null },
  { id: '10', category: 'Talent', subcategory: 'Extras', description: 'Background Artists', quantity: '500', unit: 'mandays', rate: '1500', rateLow: '1000', rateHigh: '2000', total: '750000', source: 'ai', notes: null, actualCost: null },
  { id: '11', category: 'Locations', subcategory: 'Location Fees', description: 'Temple Location', quantity: '3', unit: 'days', rate: '100000', rateLow: '80000', rateHigh: '120000', total: '300000', source: 'ai', notes: null, actualCost: null },
  { id: '12', category: 'Locations', subcategory: 'Location Fees', description: 'Beach Location', quantity: '2', unit: 'days', rate: '150000', rateLow: '100000', rateHigh: '200000', total: '300000', source: 'ai', notes: null, actualCost: null },
  { id: '13', category: 'Locations', subcategory: 'Permits', description: 'Government Permits', quantity: '1', unit: 'lot', rate: '200000', rateLow: '150000', rateHigh: '250000', total: '200000', source: 'ai', notes: null, actualCost: null },
  { id: '14', category: 'Post-Production', subcategory: 'Editing', description: 'Editor Fee', quantity: '1', unit: 'lot', rate: '2000000', rateLow: '1500000', rateHigh: '2500000', total: '2000000', source: 'ai', notes: null, actualCost: null },
  { id: '15', category: 'Post-Production', subcategory: 'VFX', description: 'VFX Work', quantity: '1', unit: 'lot', rate: '8000000', rateLow: '6000000', rateHigh: '10000000', total: '8000000', source: 'ai', notes: null, actualCost: null },
  { id: '16', category: 'Post-Production', subcategory: 'Color Grading', description: 'Digital Intermediate', quantity: '1', unit: 'lot', rate: '1500000', rateLow: '1000000', rateHigh: '2000000', total: '1500000', source: 'ai', notes: null, actualCost: null },
  { id: '17', category: 'Music', subcategory: 'Composition', description: 'Music Composer', quantity: '1', unit: 'lot', rate: '5000000', rateLow: '4000000', rateHigh: '6000000', total: '5000000', source: 'ai', notes: null, actualCost: null },
  { id: '18', category: 'Music', subcategory: 'Background Score', description: 'Orchestra & Recording', quantity: '1', unit: 'lot', rate: '2000000', rateLow: '1500000', rateHigh: '2500000', total: '2000000', source: 'ai', notes: null, actualCost: null },
  { id: '19', category: 'Music', subcategory: 'Lyrics', description: 'Lyricist', quantity: '5', unit: 'songs', rate: '100000', rateLow: '80000', rateHigh: '120000', total: '500000', source: 'ai', notes: null, actualCost: null },
  { id: '20', category: 'Marketing', subcategory: 'Promotions', description: 'First Look & Teasers', quantity: '1', unit: 'lot', rate: '3000000', rateLow: '2000000', rateHigh: '4000000', total: '3000000', source: 'ai', notes: null, actualCost: null },
  { id: '21', category: 'Marketing', subcategory: 'Promotions', description: 'Audio Launch', quantity: '1', unit: 'lot', rate: '2000000', rateLow: '1500000', rateHigh: '2500000', total: '2000000', source: 'ai', notes: null, actualCost: null },
  { id: '22', category: 'Marketing', subcategory: 'Publicity', description: 'Digital Marketing', quantity: '1', unit: 'lot', rate: '5000000', rateLow: '4000000', rateHigh: '6000000', total: '5000000', source: 'ai', notes: null, actualCost: null },
  { id: '23', category: 'Contingency', subcategory: 'Emergency', description: 'Contingency (10%)', quantity: '1', unit: 'lot', rate: '8500000', rateLow: '7000000', rateHigh: '10000000', total: '8500000', source: 'ai', notes: null, actualCost: null },
]

const DEMO_EXPENSES: ExpenseData[] = [
  { id: 'e1', category: 'Production', description: 'Director Advance', amount: '1000000', date: '2026-02-01', vendor: 'Director Account', status: 'approved', notes: 'First installment' },
  { id: 'e2', category: 'Production', description: 'Camera Rental Deposit', amount: '200000', date: '2026-02-05', vendor: 'Film Gear Chennai', status: 'approved', notes: 'Security deposit' },
  { id: 'e3', category: 'Talent', description: 'Lead Actor Signing Amount', amount: '3000000', date: '2026-02-10', vendor: 'Actor Manager', status: 'approved', notes: 'Signing amount' },
  { id: 'e4', category: 'Locations', description: 'Temple Permit Fee', amount: '50000', date: '2026-02-15', vendor: 'Temple Trust', status: 'approved', notes: 'Permit payment' },
  { id: 'e5', category: 'Production', description: 'Location Scouting Expenses', amount: '25000', date: '2026-02-18', vendor: 'Production Team', status: 'approved', notes: 'Travel & accommodation' },
  { id: 'e6', category: 'Post-Production', description: 'Editor Booking', amount: '500000', date: '2026-02-20', vendor: 'Editor Account', status: 'approved', notes: 'Advance booking' },
]

const DEMO_FORECAST: ForecastData = {
  planned: 85000000,
  actual: 7850000,
  eacTotal: 92000000,
  variance: -7000000,
  percentSpent: 9.2,
  categories: [
    { category: 'Production', planned: 12000000, actual: 1600000, forecast: 13000000, status: 'warning' },
    { category: 'Talent', planned: 26500000, actual: 4000000, forecast: 26500000, status: 'on_track' },
    { category: 'Locations', planned: 800000, actual: 75000, forecast: 850000, status: 'on_track' },
    { category: 'Post-Production', planned: 11500000, actual: 500000, forecast: 12000000, status: 'over' },
    { category: 'Music', planned: 7500000, actual: 0, forecast: 7500000, status: 'on_track' },
    { category: 'Marketing', planned: 10000000, actual: 0, forecast: 10000000, status: 'on_track' },
    { category: 'Contingency', planned: 8500000, actual: 0, forecast: 10000000, status: 'warning' },
  ]
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItemData[]>([])
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [error, setError] = useState<string | null>(null)

  const [region, setRegion] = useState('Tamil Nadu')
  const [scale, setScale] = useState('mid')

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'Production', description: '', amount: '', date: '', vendor: '' })
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/budget')
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        setItems(data.items || [])
        setExpenses(data.expenses || [])
        setForecast(data.forecast || null)
      } else {
        // Use demo data for preview
        setItems(DEMO_BUDGET_ITEMS)
        setExpenses(DEMO_EXPENSES)
        setForecast(DEMO_FORECAST)
      }
    } catch (e) {
      console.error(e)
      // Fallback to demo data
      setItems(DEMO_BUDGET_ITEMS)
      setExpenses(DEMO_EXPENSES)
      setForecast(DEMO_FORECAST)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefresh()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          setShowAddExpense(true)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowAddExpense(false)
          setSearchQuery('')
          searchInputRef.current?.blur()
          break
        case '1':
          e.preventDefault()
          setActiveTab('overview')
          break
        case '2':
          e.preventDefault()
          setActiveTab('breakdown')
          break
        case '3':
          e.preventDefault()
          setActiveTab('expenses')
          break
        case '4':
          e.preventDefault()
          setActiveTab('forecast')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', region, targetScale: scale }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
      setActiveTab('breakdown')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchData()
    } catch (e) {
      console.error('Refresh failed:', e)
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return
    try {
      await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addExpense', ...newExpense, amount: parseFloat(newExpense.amount) }),
      })
      setShowAddExpense(false)
      setNewExpense({ category: 'Production', description: '', amount: '', date: '', vendor: '' })
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const formatINR = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
    if (n >= 100000) return `${(n / 100000).toFixed(1)} L`
    return `₹${n.toLocaleString('en-IN')}`
  }

  // Filter items and expenses based on search query
  const filteredItems = searchQuery 
    ? items.filter(item => 
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subcategory?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : items

  const filteredExpenses = searchQuery
    ? expenses.filter(exp =>
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.vendor?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : expenses

  const totalPlanned = filteredItems.reduce((s, i) => s + Number(i.total || 0), 0)
  const totalActual = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const variance = totalPlanned - totalActual

  const categoryGroups = filteredItems.reduce<Record<string, BudgetItemData[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'breakdown', label: `Breakdown (${filteredItems.length})` },
    { key: 'expenses', label: `Expenses (${filteredExpenses.length})` },
    { key: 'forecast', label: 'Forecast' },
  ]

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading budget...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Budget Engine</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI-powered production budgeting</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search budget..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded text-sm w-48 focus:outline-none focus:border-cinepilot-accent"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">/</span>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-sm flex items-center gap-2"
            title="Refresh (R)"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <select value={region} onChange={e => setRegion(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={scale} onChange={e => setScale(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
            {SCALES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-medium text-sm">
            {generating ? 'Generating...' : 'Generate Budget'}
          </button>
          <button 
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
        </div>
      )}

      {/* Filtered Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-400">
          Showing {filteredItems.length} budget items and {filteredExpenses.length} expenses matching "{searchQuery}"
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Planned Budget</div>
          <div className="text-2xl font-bold text-cinepilot-accent">{formatINR(totalPlanned)}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Actual Spend</div>
          <div className="text-2xl font-bold text-gray-300">{formatINR(totalActual)}</div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Variance</div>
          <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {variance >= 0 ? '+' : ''}{formatINR(Math.abs(variance))}
          </div>
        </div>
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Forecast (EAC)</div>
          <div className="text-2xl font-bold text-yellow-400">{forecast ? formatINR(forecast.eacTotal) : '—'}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.key ? 'bg-cinepilot-card text-cinepilot-accent border border-b-0 border-cinepilot-border' : 'text-gray-500 hover:text-gray-300'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Distribution Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Budget Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(categoryGroups).map(([cat, catItems], idx) => ({
                        name: cat,
                        value: catItems.reduce((s, i) => s + Number(i.total || 0), 0),
                        color: CHART_COLORS[idx % CHART_COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {Object.entries(categoryGroups).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatINR(value)}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spending Progress Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Category Spending
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(categoryGroups).map(([cat, catItems]) => ({
                      category: cat,
                      planned: catItems.reduce((s, i) => s + Number(i.total || 0), 0),
                      actual: forecast?.categories?.find(c => c.category === cat)?.actual || 0,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tickFormatter={(v) => formatINR(v)} stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      formatter={(value: number) => formatINR(value)}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" name="Spent" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Cards */}
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <div className="text-slate-400 mb-3">{searchQuery ? `No items match "${searchQuery}"` : 'No budget generated yet'}</div>
              {!searchQuery && <p className="text-slate-500 text-sm mb-4">Upload a script first, then click "Generate Budget" to create an AI-powered budget from your script breakdown.</p>}
              {!searchQuery && <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium">
                Generate Budget from Script
              </button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(categoryGroups).map(([cat, catItems], idx) => {
                const catTotal = catItems.reduce((s, i) => s + Number(i.total || 0), 0)
                const pct = totalPlanned > 0 ? (catTotal / totalPlanned) * 100 : 0
                const catActual = forecast?.categories?.find(c => c.category === cat)?.actual || 0
                const catPctSpent = catTotal > 0 ? (catActual / catTotal) * 100 : 0
                return (
                  <div key={cat} className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <h3 className="font-medium text-slate-200">{cat}</h3>
                    </div>
                    <div className="text-xl font-bold text-white mb-1">{formatINR(catTotal)}</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{pct.toFixed(1)}% of total</span>
                      <span className={catPctSpent > 80 ? 'text-amber-400' : 'text-slate-500'}>
                        {catPctSpent.toFixed(1)}% spent
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4">
          {Object.entries(categoryGroups).map(([cat, catItems]) => (
            <div key={cat} className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-800/50 font-medium text-sm text-gray-300 flex justify-between">
                <span>{cat}</span>
                <span className="text-cinepilot-accent">{formatINR(catItems.reduce((s, i) => s + Number(i.total || 0), 0))}</span>
              </div>
              <div className="divide-y divide-gray-800">
                {catItems.map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300">{item.description}</div>
                      {item.subcategory && <span className="text-xs text-gray-600">{item.subcategory}</span>}
                    </div>
                    <div className="text-xs text-gray-500 w-20 text-right">{item.quantity} {item.unit || ''}</div>
                    <div className="text-xs text-gray-500 w-24 text-right">
                      {item.rateLow && item.rateHigh ? `${formatINR(Number(item.rateLow))} - ${formatINR(Number(item.rateHigh))}` : '—'}
                    </div>
                    <div className="text-sm font-medium text-gray-300 w-24 text-right">{formatINR(Number(item.total || 0))}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.source === 'ai' ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                      {item.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-300">Expense Tracking</h2>
            <button onClick={() => setShowAddExpense(!showAddExpense)} className="px-3 py-1.5 bg-cinepilot-accent text-black rounded text-sm font-medium">
              + Add Expense
            </button>
          </div>

          {showAddExpense && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 grid grid-cols-5 gap-3">
              <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
                {Object.keys(categoryGroups).map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
              <input type="text" placeholder="Description" value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm" />
              <input type="number" placeholder="Amount (₹)" value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm" />
              <input type="date" value={newExpense.date}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm" />
              <button onClick={handleAddExpense} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">Save</button>
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              {searchQuery ? `No expenses match "${searchQuery}"` : 'No expenses recorded yet.'}
            </div>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden divide-y divide-gray-800">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">{exp.category}</span>
                  <div className="flex-1 text-sm text-gray-300">{exp.description}</div>
                  {exp.vendor && <span className="text-xs text-gray-500">{exp.vendor}</span>}
                  <span className="text-xs text-gray-500">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '—'}</span>
                  <span className="text-sm font-medium text-gray-300">{formatINR(Number(exp.amount))}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    exp.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                  }`}>{exp.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {!forecast || forecast.planned === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-500">
              Generate a budget first to see forecasting data.
            </div>
          ) : (
            <>
              {/* Forecast Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">Budget Utilization</span>
                    {forecast.percentSpent > 80 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{forecast.percentSpent}%</div>
                  <div className="w-full h-2 bg-slate-800 rounded-full">
                    <div className={`h-full rounded-full ${forecast.percentSpent > 100 ? 'bg-red-500' : forecast.percentSpent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, forecast.percentSpent)}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-2">{formatINR(forecast.actual)} of {formatINR(forecast.planned)}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">EAC (Forecast)</span>
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold text-blue-400 mb-2">{formatINR(forecast.eacTotal)}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {forecast.eacTotal > forecast.planned ? (
                      <span className="text-amber-400">+{formatINR(forecast.eacTotal - forecast.planned)} over budget</span>
                    ) : (
                      <span className="text-emerald-400">{formatINR(forecast.planned - forecast.eacTotal)} under budget</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">Variance</span>
                    {forecast.variance >= 0 ? <TrendingDown className="w-5 h-5 text-red-400" /> : <TrendingUp className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${forecast.variance >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {forecast.variance >= 0 ? '+' : ''}{formatINR(forecast.variance)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {forecast.variance >= 0 ? 'Over budget' : 'Under budget'}
                  </div>
                </div>
              </div>

              {/* Forecast Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Planned vs Actual by Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={forecast.categories}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                        <YAxis tickFormatter={(v) => formatINR(v)} stroke="#64748b" fontSize={11} />
                        <Tooltip 
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Forecast vs Budget</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={forecast.categories.map(cat => ({
                          category: cat.category,
                          budget: cat.planned,
                          forecast: cat.forecast,
                          variance: cat.forecast - cat.planned,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                        <YAxis tickFormatter={(v) => formatINR(v)} stroke="#64748b" fontSize={11} />
                        <Tooltip 
                          formatter={(value: number) => formatINR(value)}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="forecast" name="Forecast" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category Forecast Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-800/50 font-medium text-sm text-slate-200">Category Forecasts</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Planned</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actual</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Forecast</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Variance</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {forecast.categories.map(cat => {
                        const variance = cat.forecast - cat.planned
                        const variancePct = cat.planned > 0 ? (variance / cat.planned) * 100 : 0
                        return (
                          <tr key={cat.category} className="hover:bg-slate-800/30">
                            <td className="px-6 py-4 text-sm text-slate-200 font-medium">{cat.category}</td>
                            <td className="px-6 py-4 text-sm text-slate-400 text-right">{formatINR(cat.planned)}</td>
                            <td className="px-6 py-4 text-sm text-slate-400 text-right">{formatINR(cat.actual)}</td>
                            <td className="px-6 py-4 text-sm text-white text-right font-medium">{formatINR(cat.forecast)}</td>
                            <td className={`px-6 py-4 text-sm text-right font-medium ${variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {variance > 0 ? '+' : ''}{formatINR(variance)} ({variancePct.toFixed(1)}%)
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                cat.status === 'over' ? 'bg-red-500/20 text-red-400' :
                                cat.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {cat.status === 'on_track' ? 'On Track' : cat.status === 'warning' ? 'Warning' : 'Over'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: 'R', action: 'Refresh budget data' },
                { key: '/', action: 'Search budget items' },
                { key: 'N', action: 'Add new expense' },
                { key: '1', action: 'Switch to Overview tab' },
                { key: '2', action: 'Switch to Breakdown tab' },
                { key: '3', action: 'Switch to Expenses tab' },
                { key: '4', action: 'Switch to Forecast tab' },
                { key: '?', action: 'Show this help' },
                { key: 'Esc', action: 'Close modal / Clear search' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400">{action}</span>
                  <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm font-mono text-white">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
