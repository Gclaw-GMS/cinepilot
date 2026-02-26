'use client'

import { useState, useEffect, useCallback } from 'react'

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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/budget')
      const data = await res.json()
      setItems(data.items || [])
      setExpenses(data.expenses || [])
      setForecast(data.forecast || null)
    } catch (e) {
      console.error(e)
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
        <div>
          <h1 className="text-2xl font-bold">Budget Engine</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI-powered production budgeting</p>
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
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(categoryGroups).map(([cat, catItems]) => {
                const catTotal = catItems.reduce((s, i) => s + Number(i.total || 0), 0)
                const pct = totalPlanned > 0 ? (catTotal / totalPlanned) * 100 : 0
                return (
                  <div key={cat} className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-300">{cat}</h3>
                      <span className="text-sm text-cinepilot-accent">{formatINR(catTotal)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full">
                      <div className="h-full bg-cinepilot-accent rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{pct.toFixed(1)}% of total</div>
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
