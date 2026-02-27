'use client'

import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

// Rich demo data to showcase all UI features
const DEMO_BUDGET_ITEMS: BudgetItemData[] = [
  { id: 'd1', category: 'Production', subcategory: 'Camera', description: 'RED Komodo Rental (15 days)', quantity: '15', unit: 'days', rate: '15000', rateLow: '12000', rateHigh: '18000', total: '225000', actualCost: null, source: 'ai', notes: null },
  { id: 'd2', category: 'Production', subcategory: 'Camera', description: 'Arri Alexa Mini LF (20 days)', quantity: '20', unit: 'days', rate: '35000', rateLow: '30000', rateHigh: '40000', total: '700000', actualCost: null, source: 'ai', notes: null },
  { id: 'd3', category: 'Production', subcategory: 'Camera', description: 'Cooke S7/i Full Frame Lens Set', quantity: '1', unit: 'set', rate: '250000', rateLow: '200000', rateHigh: '300000', total: '250000', actualCost: null, source: 'ai', notes: null },
  { id: 'd4', category: 'Production', subcategory: 'Lighting', description: 'Arri SkyPanel S60-C (10 days)', quantity: '10', unit: 'days', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '80000', actualCost: null, source: 'ai', notes: null },
  { id: 'd5', category: 'Production', subcategory: 'Lighting', description: 'ARRI M40 + M18 Package', quantity: '1', unit: 'package', rate: '120000', rateLow: '100000', rateHigh: '150000', total: '120000', actualCost: null, source: 'ai', notes: null },
  { id: 'd6', category: 'Production', subcategory: 'Grip', description: 'DJI Ronin RS3 Pro (12 days)', quantity: '12', unit: 'days', rate: '5000', rateLow: '4000', rateHigh: '6000', total: '60000', actualCost: null, source: 'ai', notes: null },
  { id: 'd7', category: 'Production', subcategory: 'Sound', description: 'Sennheiser MKH 416 Shotgun Kit', quantity: '2', unit: 'units', rate: '2500', rateLow: '2000', rateHigh: '3000', total: '50000', actualCost: null, source: 'ai', notes: null },
  { id: 'd8', category: 'Art Department', subcategory: 'Sets', description: 'Main Temple Set Construction', quantity: '1', unit: 'set', rate: '450000', rateLow: '350000', rateHigh: '550000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd9', category: 'Art Department', subcategory: 'Sets', description: 'Village Street Set', quantity: '1', unit: 'set', rate: '280000', rateLow: '220000', rateHigh: '350000', total: '280000', actualCost: null, source: 'ai', notes: null },
  { id: 'd10', category: 'Art Department', subcategory: 'Props', description: 'Period Props Package', quantity: '1', unit: 'package', rate: '180000', rateLow: '150000', rateHigh: '220000', total: '180000', actualCost: null, source: 'ai', notes: null },
  { id: 'd11', category: 'Costume', subcategory: 'Lead', description: 'Lead Actor Costumes (4 looks)', quantity: '4', unit: 'looks', rate: '45000', rateLow: '35000', rateHigh: '55000', total: '180000', actualCost: null, source: 'ai', notes: null },
  { id: 'd12', category: 'Costume', subcategory: 'Supporting', description: 'Supporting Cast Costumes (25 pax)', quantity: '25', unit: 'pax', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '200000', actualCost: null, source: 'ai', notes: null },
  { id: 'd13', category: 'Makeup & Hair', subcategory: 'Lead', description: 'Lead Makeup Artist (30 days)', quantity: '30', unit: 'days', rate: '15000', rateLow: '12000', rateHigh: '18000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd14', category: 'Makeup & Hair', subcategory: 'Team', description: 'Makeup Team (4 pax, 30 days)', quantity: '120', unit: 'pax-days', rate: '5000', rateLow: '4000', rateHigh: '6000', total: '600000', actualCost: null, source: 'ai', notes: null },
  { id: 'd15', category: 'Locations', subcategory: 'Studio', description: 'AVM Studios Rental (10 days)', quantity: '10', unit: 'days', rate: '85000', rateLow: '70000', rateHigh: '100000', total: '850000', actualCost: null, source: 'ai', notes: null },
  { id: 'd16', category: 'Locations', subcategory: 'Location', description: 'Outdoor Location Fees (5 locations)', quantity: '5', unit: 'locations', rate: '75000', rateLow: '50000', rateHigh: '100000', total: '375000', actualCost: null, source: 'ai', notes: null },
  { id: 'd17', category: 'Locations', subcategory: 'Permits', description: 'Film Permits & Clearances', quantity: '1', unit: 'package', rate: '120000', rateLow: '80000', rateHigh: '150000', total: '120000', actualCost: null, source: 'ai', notes: null },
  { id: 'd18', category: 'Post Production', subcategory: 'Editing', description: 'Offline Editing Suite (45 days)', quantity: '45', unit: 'days', rate: '8000', rateLow: '6000', rateHigh: '10000', total: '360000', actualCost: null, source: 'ai', notes: null },
  { id: 'd19', category: 'Post Production', subcategory: 'VFX', description: 'VFX Budget (estimated shots)', quantity: '120', unit: 'shots', rate: '25000', rateLow: '15000', rateHigh: '40000', total: '3000000', actualCost: null, source: 'ai', notes: 'Average ₹25K per shot, depends on complexity' },
  { id: 'd20', category: 'Post Production', subcategory: 'Color', description: 'Digital Intermediate (DI)', quantity: '1', unit: 'film', rate: '450000', rateLow: '350000', rateHigh: '550000', total: '450000', actualCost: null, source: 'ai', notes: null },
  { id: 'd21', category: 'Music', subcategory: 'Composition', description: 'Background Score', quantity: '1', unit: 'film', rate: '1500000', rateLow: '1000000', rateHigh: '2000000', total: '1500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd22', category: 'Music', subcategory: 'Songs', description: 'Song Composition + Recording (5 songs)', quantity: '5', unit: 'songs', rate: '400000', rateLow: '300000', rateHigh: '500000', total: '2000000', actualCost: null, source: 'ai', notes: null },
  { id: 'd23', category: 'Music', subcategory: 'Lyrics', description: 'Lyricist Fee', quantity: '5', unit: 'songs', rate: '100000', rateLow: '75000', rateHigh: '125000', total: '500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd24', category: 'Cast', subcategory: 'Lead', description: 'Lead Actor Fee', quantity: '30', unit: 'days', rate: '500000', rateLow: '300000', rateHigh: '1000000', total: '15000000', actualCost: null, source: 'ai', notes: 'Negotiable based on BO potential' },
  { id: 'd25', category: 'Cast', subcategory: 'Lead', description: 'Lead Actress Fee', quantity: '25', unit: 'days', rate: '350000', rateLow: '200000', rateHigh: '500000', total: '8750000', actualCost: null, source: 'ai', notes: null },
  { id: 'd26', category: 'Cast', subcategory: 'Supporting', description: 'Supporting Cast (15 pax avg)', quantity: '1', unit: 'package', rate: '2500000', rateLow: '2000000', rateHigh: '3000000', total: '2500000', actualCost: null, source: 'ai', notes: null },
  { id: 'd27', category: 'Crew', subcategory: 'Direction', description: 'Director Fee + Team', quantity: '1', unit: 'package', rate: '5000000', rateLow: '3000000', rateHigh: '8000000', total: '5000000', actualCost: null, source: 'ai', notes: 'Includes director, ADs, script supervisor' },
  { id: 'd28', category: 'Crew', subcategory: 'Production', description: 'Production Team (30 days)', quantity: '1', unit: 'package', rate: '1800000', rateLow: '1500000', rateHigh: '2200000', total: '1800000', actualCost: null, source: 'ai', notes: 'Producer, production manager, coordinators' },
  { id: 'd29', category: 'Contingency', subcategory: 'Emergency', description: 'Contingency (10%)', quantity: '1', unit: 'buffer', rate: '0', rateLow: null, rateHigh: null, total: '3855000', actualCost: null, source: 'ai', notes: 'Standard 10% production buffer' },
]

const DEMO_EXPENSES: ExpenseData[] = [
  { id: 'e1', category: 'Production', description: 'RED Komodo Deposit', amount: '50000', date: '2026-02-15', vendor: 'Film Gear Rentals', status: 'approved', notes: 'Security deposit - refundable' },
  { id: 'e2', category: 'Locations', description: 'AVM Studios Advance', amount: '250000', date: '2026-02-20', vendor: 'AVM Studios', status: 'approved', notes: '50% advance for 10 days booking' },
  { id: 'e3', category: 'Cast', description: 'Lead Actor Signing Amount', amount: '2000000', date: '2026-02-10', vendor: 'Agent', status: 'approved', notes: 'Signing amount - non refundable' },
  { id: 'e4', category: 'Art Department', description: 'Set Construction Materials', amount: '180000', date: '2026-02-25', vendor: 'Art Fusion', status: 'approved', notes: 'Temple set materials' },
  { id: 'e5', category: 'Music', description: 'Background Score Advance', amount: '300000', date: '2026-02-28', vendor: 'Music Director', status: 'approved', notes: '30% advance to composer' },
  { id: 'e6', category: 'Crew', description: 'Director Fee - First Installment', amount: '1500000', date: '2026-02-05', vendor: 'Director', status: 'approved', notes: '30% of total fee' },
  { id: 'e7', category: 'Production', description: 'Location Scouting Expenses', amount: '45000', date: '2026-02-18', vendor: 'Production Team', status: 'pending', notes: 'Travel, accommodation for location recce' },
  { id: 'e8', category: 'Costume', description: 'Lead Actor Costume Deposit', amount: '75000', date: '2026-03-01', vendor: 'Costume Designer', status: 'pending', notes: 'Fabric and measurement advance' },
]

const DEMO_FORECAST: ForecastData = {
  planned: 38550000,
  actual: 6630000,
  eacTotal: 41200000,
  variance: -2650000,
  percentSpent: 17.2,
  categories: [
    { category: 'Production', planned: 1865000, actual: 350000, forecast: 1950000, status: 'on_track' },
    { category: 'Art Department', planned: 910000, actual: 180000, forecast: 950000, status: 'on_track' },
    { category: 'Costume', planned: 380000, actual: 75000, forecast: 400000, status: 'on_track' },
    { category: 'Makeup & Hair', planned: 1050000, actual: 0, forecast: 1100000, status: 'warning' },
    { category: 'Locations', planned: 1345000, actual: 250000, forecast: 1400000, status: 'on_track' },
    { category: 'Post Production', planned: 5160000, actual: 0, forecast: 5500000, status: 'warning' },
    { category: 'Music', planned: 4500000, actual: 300000, forecast: 4800000, status: 'on_track' },
    { category: 'Cast', planned: 21250000, actual: 2000000, forecast: 22000000, status: 'on_track' },
    { category: 'Crew', planned: 6800000, actual: 1500000, forecast: 7000000, status: 'on_track' },
    { category: 'Contingency', planned: 1530510, actual: 0, forecast: 1650000, status: 'on_track' },
  ]
}

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItemData[]>([])
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const [region, setRegion] = useState('Tamil Nadu')
  const [scale, setScale] = useState('mid')

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'Production', description: '', amount: '', date: '', vendor: '' })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/budget')
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        setItems(data.items)
        setExpenses(data.expenses || [])
        setForecast(data.forecast || null)
        setIsDemoMode(false)
      } else {
        // Use rich demo data to showcase UI when no database
        setItems(DEMO_BUDGET_ITEMS)
        setExpenses(DEMO_EXPENSES)
        setForecast(DEMO_FORECAST)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.error(e)
      // Use rich demo data on error
      setItems(DEMO_BUDGET_ITEMS)
      setExpenses(DEMO_EXPENSES)
      setForecast(DEMO_FORECAST)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  const totalPlanned = items.reduce((s, i) => s + Number(i.total || 0), 0)
  const totalActual = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const variance = totalPlanned - totalActual

  const categoryGroups = items.reduce<Record<string, BudgetItemData[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'breakdown', label: `Breakdown (${items.length})` },
    { key: 'expenses', label: `Expenses (${expenses.length})` },
    { key: 'forecast', label: 'Forecast' },
  ]

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading budget...</div></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Budget Engine</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">AI-powered production budgeting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={region} onChange={e => setRegion(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={scale} onChange={e => setScale(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
            {SCALES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-medium text-sm">
            {generating ? 'Generating...' : 'Generate Budget'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">Dismiss</button>
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
          {items.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-12 text-center">
              <div className="text-gray-500 mb-3">No budget generated yet</div>
              <p className="text-gray-600 text-sm mb-4">Upload a script first, then click "Generate Budget" to create an AI-powered budget from your script breakdown.</p>
              <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">
                Generate Budget from Script
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="col-span-1 bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Budget Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(categoryGroups).map(([cat, catItems]) => ({
                          name: cat,
                          value: catItems.reduce((s, i) => s + Number(i.total || 0), 0),
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {Object.keys(categoryGroups).map((_, i) => (
                          <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#84cc16', '#f97316'][i % 10]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatINR(value), 'Amount']}
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend 
                        formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Category Cards */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {Object.entries(categoryGroups).map(([cat, catItems]) => {
                  const catTotal = catItems.reduce((s, i) => s + Number(i.total || 0), 0)
                  const pct = totalPlanned > 0 ? (catTotal / totalPlanned) * 100 : 0
                  const colorIdx = Object.keys(categoryGroups).indexOf(cat) % 10
                  const color = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#84cc16', '#f97316'][colorIdx]
                  return (
                    <div key={cat} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-300">{cat}</h3>
                        <span className="text-sm font-semibold" style={{ color }}>{formatINR(catTotal)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{pct.toFixed(1)}% of total • {catItems.length} items</div>
                    </div>
                  )
                })}
              </div>
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
                {['Production', 'Art Department', 'Costume', 'Makeup & Hair', 'Locations', 'Post Production', 'Music', 'Cast', 'Crew', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
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

          {expenses.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden divide-y divide-gray-800">
              {expenses.map(exp => (
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
        <div className="space-y-4">
          {!forecast || forecast.planned === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              Generate a budget first to see forecasting data.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">% Spent</div>
                  <div className="text-3xl font-bold text-cinepilot-accent">{forecast.percentSpent}%</div>
                  <div className="w-full h-2 bg-gray-800 rounded-full mt-2">
                    <div className={`h-full rounded-full ${forecast.percentSpent > 100 ? 'bg-red-500' : 'bg-cinepilot-accent'}`}
                      style={{ width: `${Math.min(100, forecast.percentSpent)}%` }} />
                  </div>
                </div>
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">EAC (Forecast)</div>
                  <div className="text-3xl font-bold text-yellow-400">{formatINR(forecast.eacTotal)}</div>
                </div>
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Variance</div>
                  <div className={`text-3xl font-bold ${forecast.variance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {forecast.variance >= 0 ? '+' : ''}{formatINR(Math.abs(forecast.variance))}
                  </div>
                </div>
              </div>

              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-800/50 font-medium text-sm text-gray-300">Category Forecasts</div>
                <div className="divide-y divide-gray-800">
                  {forecast.categories.map(cat => (
                    <div key={cat.category} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 text-sm text-gray-300">{cat.category}</div>
                      <div className="text-xs text-gray-500 w-24 text-right">Planned: {formatINR(cat.planned)}</div>
                      <div className="text-xs text-gray-500 w-24 text-right">Actual: {formatINR(cat.actual)}</div>
                      <div className="text-sm font-medium w-24 text-right text-gray-300">EAC: {formatINR(cat.forecast)}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        cat.status === 'over' ? 'bg-red-900/30 text-red-400' :
                        cat.status === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>{cat.status === 'on_track' ? 'On Track' : cat.status === 'warning' ? 'Warning' : 'Over Budget'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
