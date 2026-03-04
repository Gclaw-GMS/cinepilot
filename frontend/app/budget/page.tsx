'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, Keyboard, X, FileSpreadsheet, Printer } from 'lucide-react'

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

type ActiveTab = 'overview' | 'breakdown' | 'expenses' | 'forecast' | 'compare'

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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  const [region, setRegion] = useState('Tamil Nadu')
  const [scale, setScale] = useState('mid')

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState({ 
    category: 'Production', 
    description: '', 
    amount: '', 
    date: '', 
    vendor: '',
    notes: '',
    status: 'pending'
  })

  // Expense filtering
  const [expenseFilter, setExpenseFilter] = useState({
    category: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  })

  // Filtered expenses based on filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (expenseFilter.category !== 'all' && exp.category !== expenseFilter.category) return false
      if (expenseFilter.status !== 'all' && exp.status !== expenseFilter.status) return false
      if (expenseFilter.dateFrom && exp.date && new Date(exp.date) < new Date(expenseFilter.dateFrom)) return false
      if (expenseFilter.dateTo && exp.date && new Date(exp.date) > new Date(expenseFilter.dateTo)) return false
      return true
    })
  }, [expenses, expenseFilter])

  // Get unique categories from expenses for filter dropdown
  const expenseCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category))
    return Array.from(cats)
  }, [expenses])

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

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    switch (e.key) {
      case '?':
        if (e.shiftKey) {
          e.preventDefault()
          setShowKeyboardHelp(prev => !prev)
        }
        break
      case 'g':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleGenerate()
        }
        break
      case 'r':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          fetchData()
        }
        break
      case 'e':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleExportCSV()
        }
        break
      case 'Escape':
        setShowKeyboardHelp(false)
        break
      case '1':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setActiveTab('overview')
        }
        break
      case '2':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setActiveTab('breakdown')
        }
        break
      case '3':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setActiveTab('expenses')
        }
        break
      case '4':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setActiveTab('forecast')
        }
        break
    }
  }, [handleGenerate, fetchData])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return
    try {
      await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addExpense', 
          ...newExpense, 
          amount: parseFloat(newExpense.amount),
          status: newExpense.status || 'pending'
        }),
      })
      setShowAddExpense(false)
      setNewExpense({ category: 'Production', description: '', amount: '', date: '', vendor: '', notes: '', status: 'pending' })
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch('/api/budget', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteExpense', id }),
      })
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleUpdateExpenseStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateExpenseStatus', id, status }),
      })
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
    { key: 'compare', label: 'Compare' },
  ]

  // Industry benchmark data for comparison (percentages by category)
  const INDUSTRY_BENCHMARKS = {
    micro: { // < 50L
      'Production': 15, 'Art Department': 8, 'Costume': 5, 'Makeup & Hair': 4,
      'Locations': 12, 'Post Production': 18, 'Music': 10, 'Cast': 8, 'Crew': 12, 'Contingency': 8
    },
    indie: { // 50L - 2Cr
      'Production': 18, 'Art Department': 10, 'Costume': 6, 'Makeup & Hair': 5,
      'Locations': 10, 'Post Production': 15, 'Music': 8, 'Cast': 12, 'Crew': 10, 'Contingency': 6
    },
    mid: { // 2-10Cr
      'Production': 20, 'Art Department': 12, 'Costume': 7, 'Makeup & Hair': 5,
      'Locations': 8, 'Post Production': 12, 'Music': 8, 'Cast': 15, 'Crew': 8, 'Contingency': 5
    },
    big: { // 10Cr+
      'Production': 22, 'Art Department': 10, 'Costume': 5, 'Makeup & Hair': 4,
      'Locations': 6, 'Post Production': 10, 'Music': 8, 'Cast': 25, 'Crew': 6, 'Contingency': 4
    }
  }

  // Calculate actual percentages by category
  const categoryPercentages = Object.fromEntries(
    Object.entries(categoryGroups).map(([cat, catItems]) => [
      cat, totalPlanned > 0 ? (catItems.reduce((s, i) => s + Number(i.total || 0), 0) / totalPlanned) * 100 : 0
    ])
  )

  // Get comparison data for current scale
  const getComparisonData = () => {
    const benchmarks = INDUSTRY_BENCHMARKS[scale as keyof typeof INDUSTRY_BENCHMARKS] || INDUSTRY_BENCHMARKS.mid
    const categories = Object.keys(benchmarks)
    return categories.map(cat => ({
      category: cat,
      yourPercent: categoryPercentages[cat] || 0,
      benchmarkPercent: benchmarks[cat as keyof typeof benchmarks] || 0,
      difference: (categoryPercentages[cat] || 0) - (benchmarks[cat as keyof typeof benchmarks] || 0)
    }))
  }

  const comparisonData = getComparisonData()

  // Export budget to CSV
  const handleExportCSV = () => {
    if (items.length === 0) return
    
    const headers = ['Category', 'Subcategory', 'Description', 'Quantity', 'Unit', 'Rate', 'Total', 'Actual Cost', 'Notes']
    const rows = items.map(item => [
      item.category,
      item.subcategory || '',
      item.description || '',
      item.quantity || '',
      item.unit || '',
      item.rate || '',
      item.total || '',
      item.actualCost || '',
      item.notes || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
          {items.length > 0 && (
            <>
              <button onClick={handleExportCSV} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </>
          )}
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
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
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

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Generate Budget</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">G</div>
                <div className="text-gray-400">Refresh Data</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">R</div>
                <div className="text-gray-400">Export CSV</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">E</div>
              </div>
              <div className="border-t border-gray-700 my-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Overview Tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">1</div>
                <div className="text-gray-400">Breakdown Tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">2</div>
                <div className="text-gray-400">Expenses Tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">3</div>
                <div className="text-gray-400">Forecast Tab</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">4</div>
              </div>
              <div className="border-t border-gray-700 my-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Show Help</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Shift+?</div>
                <div className="text-gray-400">Close/Escape</div>
                <div className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">Esc</div>
              </div>
            </div>
          </div>
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
              <p className="text-gray-600 text-sm mb-4">Upload a script first, then click &quot;Generate Budget&quot; to create an AI-powered budget from your script breakdown.</p>
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
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
              <div className="grid grid-cols-6 gap-3 mb-3">
                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
                  {['Production', 'Art Department', 'Costume', 'Makeup & Hair', 'Locations', 'Post Production', 'Music', 'Cast', 'Crew', 'Marketing', 'Travel', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Description" value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm col-span-2" />
                <input type="number" placeholder="Amount (₹)" value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm" />
                <input type="date" value={newExpense.date}
                  onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm" />
                <select value={newExpense.status} onChange={e => setNewExpense({ ...newExpense, status: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="grid grid-cols-6 gap-3 mb-3">
                <input type="text" placeholder="Vendor (optional)" value={newExpense.vendor}
                  onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm col-span-2" />
                <input type="text" placeholder="Notes (optional)" value={newExpense.notes}
                  onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm col-span-3" />
                <div className="flex gap-2">
                  <button onClick={handleAddExpense} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">Save</button>
                  <button onClick={() => setShowAddExpense(false)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Section */}
          {expenses.length > 0 && (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs text-gray-500 font-medium uppercase">Filter:</span>
                <select 
                  value={expenseFilter.category} 
                  onChange={e => setExpenseFilter({ ...expenseFilter, category: e.target.value })}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select 
                  value={expenseFilter.status} 
                  onChange={e => setExpenseFilter({ ...expenseFilter, status: e.target.value })}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input 
                  type="date" 
                  value={expenseFilter.dateFrom}
                  onChange={e => setExpenseFilter({ ...expenseFilter, dateFrom: e.target.value })}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs" 
                  placeholder="From"
                />
                <span className="text-gray-600">to</span>
                <input 
                  type="date" 
                  value={expenseFilter.dateTo}
                  onChange={e => setExpenseFilter({ ...expenseFilter, dateTo: e.target.value })}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs" 
                  placeholder="To"
                />
                {(expenseFilter.category !== 'all' || expenseFilter.status !== 'all' || expenseFilter.dateFrom || expenseFilter.dateTo) && (
                  <button 
                    onClick={() => setExpenseFilter({ category: 'all', status: 'all', dateFrom: '', dateTo: '' })}
                    className="px-2 py-1.5 text-xs text-red-400 hover:text-red-300"
                  >
                    Clear Filters
                  </button>
                )}
                <span className="ml-auto text-xs text-gray-500">
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </span>
              </div>
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              {expenses.length === 0 ? 'No expenses recorded yet. Click "Add Expense" to track your first expense.' : 'No expenses match the selected filters.'}
            </div>
          ) : (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden divide-y divide-gray-800">
              <div className="px-4 py-2 bg-gray-800/50 grid grid-cols-12 gap-4 text-xs text-gray-500 font-medium uppercase">
                <div className="col-span-2">Category</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Vendor</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-center">Action</div>
              </div>
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-800/30">
                  <div className="col-span-2 text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded w-fit">{exp.category}</div>
                  <div className="col-span-3 text-sm text-gray-300">{exp.description}</div>
                  <div className="col-span-2 text-xs text-gray-500">{exp.vendor || '—'}</div>
                  <div className="col-span-2 text-xs text-gray-500">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '—'}</div>
                  <div className="col-span-2 text-sm font-medium text-gray-300 text-right">{formatINR(Number(exp.amount))}</div>
                  <div className="col-span-1 flex items-center justify-center gap-2">
                    <select 
                      value={exp.status} 
                      onChange={(e) => handleUpdateExpenseStatus(exp.id, e.target.value)}
                      className={`text-[10px] px-2 py-1 rounded border-0 cursor-pointer ${
                        exp.status === 'approved' ? 'bg-green-900/50 text-green-400' : 
                        exp.status === 'rejected' ? 'bg-red-900/50 text-red-400' : 
                        'bg-yellow-900/50 text-yellow-400'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                      title="Delete expense"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-8 text-center text-gray-500">
              Generate a budget first to see comparison analysis.
            </div>
          ) : (
            <>
              {/* Scale Selector */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Budget Scale Comparison
                  </h3>
                  <select 
                    value={scale} 
                    onChange={(e) => setScale(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
                  >
                    {SCALES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <p className="text-sm text-gray-500">
                  Compare your budget allocation against industry benchmarks for {SCALES.find(s => s.key === scale)?.label} productions.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Your Budget</div>
                  <div className="text-2xl font-bold text-cinepilot-accent">{formatINR(totalPlanned)}</div>
                </div>
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Est. Similar Scale</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {scale === 'micro' ? '~25L' : scale === 'indie' ? '~1Cr' : scale === 'mid' ? '~5Cr' : '~20Cr'}
                  </div>
                </div>
                <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Budget Efficiency</div>
                  <div className={`text-2xl font-bold ${
                    totalPlanned > (scale === 'micro' ? 2500000 : scale === 'indie' ? 10000000 : scale === 'mid' ? 50000000 : 200000000) 
                      ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {totalPlanned > (scale === 'micro' ? 2500000 : scale === 'indie' ? 10000000 : scale === 'mid' ? 50000000 : 200000000) 
                      ? 'Above Avg' : 'Efficient'}
                  </div>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-800/50 font-medium text-sm text-gray-300">
                  Category Allocation vs Industry Benchmark
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {comparisonData.map((item) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.category}</span>
                          <div className="flex gap-4">
                            <span className="text-cinepilot-accent">{item.yourPercent.toFixed(1)}%</span>
                            <span className="text-gray-500">vs {item.benchmarkPercent}%</span>
                            <span className={`font-medium ${
                              item.difference > 2 ? 'text-red-400' : 
                              item.difference < -2 ? 'text-green-400' : 
                              'text-gray-400'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                          {/* Benchmark marker */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                            style={{ left: `${Math.min(100, item.benchmarkPercent)}%` }}
                            title={`Benchmark: ${item.benchmarkPercent}%`}
                          />
                          {/* Your allocation */}
                          <div 
                            className="absolute top-0 bottom-0 bg-gradient-to-r from-cinepilot-accent to-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, item.yourPercent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-900/50 text-xs text-gray-500 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-cinepilot-accent to-purple-500 rounded-full"></div>
                    <span>Your Budget %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-white/50"></div>
                    <span>Industry Benchmark</span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Insights & Recommendations
                </h3>
                <div className="space-y-2">
                  {comparisonData
                    .filter(item => Math.abs(item.difference) > 3)
                    .map(item => (
                      <div key={item.category} className={`flex items-start gap-2 text-sm p-2 rounded ${
                        item.difference > 0 ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'
                      }`}>
                        {item.difference > 0 ? (
                          <>
                            <span className="text-red-400">↑</span>
                            <span><strong>{item.category}</strong> is {item.difference.toFixed(1)}% higher than typical for this scale. Consider reviewing allocations.</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-400">↓</span>
                            <span><strong>{item.category}</strong> is {Math.abs(item.difference).toFixed(1)}% lower than typical. Ensure adequate allocation.</span>
                          </>
                        )}
                      </div>
                    ))}
                  {comparisonData.filter(item => Math.abs(item.difference) > 3).length === 0 && (
                    <div className="text-gray-500 text-sm p-2">
                      Your budget allocation is well-aligned with industry benchmarks for this scale. ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Scale Reference Table */}
              <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-800/50 font-medium text-sm text-gray-300">
                  Industry Benchmark Reference ({SCALES.find(s => s.key === scale)?.label})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-medium">Category</th>
                        <th className="text-right p-3 text-gray-400 font-medium">Benchmark %</th>
                        <th className="text-right p-3 text-gray-400 font-medium">Your %</th>
                        <th className="text-right p-3 text-gray-400 font-medium">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {comparisonData.map(item => (
                        <tr key={item.category} className="hover:bg-gray-800/30">
                          <td className="p-3 text-gray-300">{item.category}</td>
                          <td className="p-3 text-right text-gray-500">{item.benchmarkPercent}%</td>
                          <td className="p-3 text-right text-cinepilot-accent">{item.yourPercent.toFixed(1)}%</td>
                          <td className={`p-3 text-right font-medium ${
                            item.difference > 0 ? 'text-red-400' : item.difference < 0 ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
