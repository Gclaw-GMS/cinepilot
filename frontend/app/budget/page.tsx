'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  RefreshCw, Loader2, Download, Filter, Plus, X, Keyboard, Search,
  FileText, FileJson, Printer, Clock
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

type ActiveTab = 'overview' | 'breakdown' | 'expenses' | 'forecast' | 'scenarios'

// Scenario Planning Types
interface BudgetScenario {
  id: string
  name: string
  description: string
  type: 'optimistic' | 'pessimistic' | 'realistic' | 'custom'
  adjustments: ScenarioAdjustment[]
  totalBudget: number
  createdAt: string
}

interface ScenarioAdjustment {
  category: string
  percentageChange: number // -50 to +50
  notes: string
}

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
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
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Sorting state
  const [sortBy, setSortBy] = useState<'category' | 'description' | 'subcategory' | 'total' | 'rate' | 'date' | 'amount' | 'vendor'>('category')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const handleRefreshRef = useRef<() => Promise<void>>()
  const handleExportMarkdownRef = useRef<() => void>(() => {})
  
  // Refs for keyboard shortcuts (to avoid dependency issues in useEffect)
  const categoryFilterRef = useRef(categoryFilter)
  const subcategoryFilterRef = useRef(subcategoryFilter)
  const sourceFilterRef = useRef(sourceFilter)
  const sortByRef = useRef(sortBy)
  const sortOrderRef = useRef(sortOrder)
  const searchQueryRef = useRef(searchQuery)
  const showFiltersRef = useRef(showFilters)
  const clearFiltersRef = useRef<() => void>(() => {})

  // Keep refs in sync with state
  useEffect(() => {
    categoryFilterRef.current = categoryFilter
  }, [categoryFilter])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  useEffect(() => {
    subcategoryFilterRef.current = subcategoryFilter
  }, [subcategoryFilter])

  useEffect(() => {
    sourceFilterRef.current = sourceFilter
  }, [sourceFilter])

  useEffect(() => {
    sortByRef.current = sortBy
  }, [sortBy])

  useEffect(() => {
    sortOrderRef.current = sortOrder
  }, [sortOrder])

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  // Get unique categories from items
  const categories = [...new Set(items.map(item => item.category))].sort()
  const subcategories = [...new Set(items.map(item => item.subcategory).filter(Boolean))].sort() as string[]
  const sources = [...new Set(items.map(item => item.source))].sort()

  // Scenario Planning State - initialized after categories
  const defaultScenarios: BudgetScenario[] = [
    {
      id: 'baseline',
      name: 'Baseline',
      description: 'Original budget plan',
      type: 'realistic',
      adjustments: [],
      totalBudget: 85000000,
      createdAt: new Date().toISOString()
    },
    {
      id: 'optimistic',
      name: 'Optimistic',
      description: 'Best case scenario - all costs at lower end',
      type: 'optimistic',
      adjustments: categories.map(cat => ({ category: cat, percentageChange: -15, notes: 'Lower end of estimates' })),
      totalBudget: 72250000,
      createdAt: new Date().toISOString()
    },
    {
      id: 'pessimistic',
      name: 'Pessimistic',
      description: 'Worst case scenario - costs at upper end',
      type: 'pessimistic',
      adjustments: categories.map(cat => ({ category: cat, percentageChange: 20, notes: 'Upper end with buffer' })),
      totalBudget: 102000000,
      createdAt: new Date().toISOString()
    }
  ]
  const [scenarios, setScenarios] = useState<BudgetScenario[]>(defaultScenarios)
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline')
  const [showScenarioEditor, setShowScenarioEditor] = useState(false)
  const [editingScenario, setEditingScenario] = useState<BudgetScenario | null>(null)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [newScenarioType, setNewScenarioType] = useState<'optimistic' | 'pessimistic' | 'realistic' | 'custom'>('custom')
  const [scenarioAdjustments, setScenarioAdjustments] = useState<ScenarioAdjustment[]>([])

  // Count active filters
  const activeFilterCount = useMemo(() => 
    [categoryFilter, subcategoryFilter, sourceFilter].filter(f => f !== 'all').length + 
    (sortBy !== 'category' || sortOrder !== 'asc' ? 1 : 0) + 
    (searchQuery ? 1 : 0),
    [categoryFilter, subcategoryFilter, sourceFilter, sortBy, sortOrder, searchQuery]
  )

  // Ref for activeFilterCount to avoid dependency issues in keyboard handler
  const activeFilterCountRef = useRef(activeFilterCount)

  // Clear all filters function
  const clearFilters = useCallback(() => {
    setCategoryFilter('all')
    setSubcategoryFilter('all')
    setSourceFilter('all')
    setSortBy('category')
    setSortOrder('asc')
    setSearchQuery('')
  }, [])

  // Update clearFilters ref
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  // Update activeFilterCount ref
  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  // Helper to sort items (used by exports) - wrapped in useCallback to fix dependency warning
  const sortItems = useCallback((itemsToSort: BudgetItemData[]) => {
    return [...itemsToSort].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '')
          break
        case 'subcategory':
          comparison = (a.subcategory || '').localeCompare(b.subcategory || '')
          break
        case 'total':
          comparison = Number(a.total || 0) - Number(b.total || 0)
          break
        case 'rate':
          comparison = Number(a.rate || 0) - Number(b.rate || 0)
          break
        default:
          comparison = (a.category || '').localeCompare(b.category || '')
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [sortBy, sortOrder])

  // Export functions
  const handleExportCSV = () => {
    const sortedItems = sortItems(items)
    const headers = ['Category', 'Description', 'Subcategory', 'Quantity', 'Unit', 'Rate Low', 'Rate High', 'Total', 'Source']
    const rows = sortedItems.map(item => [
      item.category,
      item.description,
      item.subcategory || '',
      item.quantity,
      item.unit || '',
      item.rateLow || '',
      item.rateHigh || '',
      item.total,
      item.source || 'manual'
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    const sortedItems = sortItems(items)
    // Build filter info for export metadata
    const filterInfo: string[] = []
    if (categoryFilter !== 'all') filterInfo.push(`Category: ${categoryFilter}`)
    if (subcategoryFilter !== 'all') filterInfo.push(`Subcategory: ${subcategoryFilter}`)
    if (sourceFilter !== 'all') filterInfo.push(`Source: ${sourceFilter}`)
    if (sortBy !== 'category' || sortOrder !== 'asc') filterInfo.push(`Sort: ${sortBy} (${sortOrder})`)
    
    const exportData = {
      items: sortedItems,
      expenses,
      forecast,
      exportedAt: new Date().toISOString(),
      totalPlanned: items.reduce((s, i) => s + Number(i.total || 0), 0),
      totalSpent: expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
      filterMetadata: {
        activeFilters: filterInfo,
        categoryFilter,
        subcategoryFilter,
        sourceFilter,
        sortBy,
        sortOrder
      }
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportMarkdown = useCallback(() => {
    // Filter items based on current filters
    const sortedItems = sortItems(items.filter(item => {
      // Search filter
      if (searchQuery && 
          !item.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(item.subcategory?.toLowerCase() || '').includes(searchQuery.toLowerCase()) &&
          !(item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      ) return false
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      // Subcategory filter
      if (subcategoryFilter !== 'all' && item.subcategory !== subcategoryFilter) return false
      // Source filter
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false
      return true
    }))

    // Filter expenses based on current filters
    const sortedExpenses = expenses.filter(exp => {
      // Search filter
      if (searchQuery && 
          !exp.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !exp.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(exp.vendor?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      ) return false
      // Category filter for expenses
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false
      return true
    }).sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '')
          break
        case 'amount':
          comparison = Number(a.amount || 0) - Number(b.amount || 0)
          break
        case 'date':
          comparison = (a.date || '').localeCompare(b.date || '')
          break
        case 'vendor':
          comparison = (a.vendor || '').localeCompare(b.vendor || '')
          break
        default:
          comparison = (a.date || '').localeCompare(b.date || '')
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Build filter info for export metadata
    const filterInfo: string[] = []
    if (categoryFilter !== 'all') filterInfo.push(`Category: ${categoryFilter}`)
    if (subcategoryFilter !== 'all') filterInfo.push(`Subcategory: ${subcategoryFilter}`)
    if (sourceFilter !== 'all') filterInfo.push(`Source: ${sourceFilter}`)
    if (searchQuery) filterInfo.push(`Search: ${searchQuery}`)

    // Calculate totals from sortedItems
    const totalPlanned = sortedItems.reduce((s, i) => s + Number(i.total || 0), 0)
    const totalActual = sortedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const variance = totalPlanned - totalActual

    // Calculate category totals
    const categoryTotals: Record<string, number> = {}
    sortedItems.forEach(item => {
      const cat = item.category
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.total || 0)
    })

    // Calculate expense totals by category
    const expenseByCategory: Record<string, number> = {}
    sortedExpenses.forEach(exp => {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + Number(exp.amount)
    })

    let markdown = `# 🎬 CinePilot Budget Report

> Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Planned Budget** | ₹${totalPlanned.toLocaleString('en-IN')} |
| **Total Actual Spend** | ₹${totalActual.toLocaleString('en-IN')} |
| **Budget Variance** | ${variance >= 0 ? '+' : '-'}₹${Math.abs(variance).toLocaleString('en-IN')} |
| **Budget Used** | ${totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}% |
| **Forecast (EAC)** | ₹${forecast?.eacTotal.toLocaleString('en-IN') || '—'} |
| **Items Count** | ${sortedItems.length} |
| **Expenses Count** | ${sortedExpenses.length} |

${filterInfo.length > 0 ? `### 🔍 Filters Applied\n${filterInfo.map(f => `- ${f}`).join('\n')}\n` : ''}
---

## 📁 Budget Breakdown by Category

| Category | Planned | Expenses | Remaining |
|----------|---------|----------|-----------|
${Object.entries(categoryTotals).map(([cat, planned]) => {
  const expenses = expenseByCategory[cat] || 0
  const remaining = planned - expenses
  return `| ${cat} | ₹${Number(planned).toLocaleString('en-IN')} | ₹${expenses.toLocaleString('en-IN')} | ₹${remaining.toLocaleString('en-IN')} |`
}).join('\n')}

**Total Planned:** ₹${totalPlanned.toLocaleString('en-IN')} | **Total Expenses:** ₹${totalActual.toLocaleString('en-IN')} | **Remaining:** ₹${(totalPlanned - totalActual).toLocaleString('en-IN')}

---

## 💰 Detailed Budget Items

| Category | Subcategory | Description | Quantity | Unit | Rate | Total |
|----------|-------------|-------------|----------|------|------|-------|
${sortedItems.map(item => `| ${item.category} | ${item.subcategory || '-'} | ${item.description || '-'} | ${item.quantity || '-'} | ${item.unit || '-'} | ₹${Number(item.rate || 0).toLocaleString('en-IN')} | ₹${Number(item.total || 0).toLocaleString('en-IN')} |`).join('\n')}

---

## 🧾 Recent Expenses

| Date | Category | Description | Vendor | Amount | Status |
|------|----------|-------------|--------|--------|--------|
${sortedExpenses.length > 0 ? sortedExpenses.map(exp => `| ${exp.date || '-'} | ${exp.category} | ${exp.description} | ${exp.vendor || '-'} | ₹${Number(exp.amount).toLocaleString('en-IN')} | ${exp.status} |`).join('\n') : '| - | - | No expenses recorded | - | - | - |'}

---

## 📈 Forecast Analysis

${forecast ? `| Category | Planned | Actual | Forecast | Status |
|----------|---------|--------|----------|--------|
${forecast.categories.map(cat => `| ${cat.category} | ₹${cat.planned.toLocaleString('en-IN')} | ₹${cat.actual.toLocaleString('en-IN')} | ₹${cat.forecast.toLocaleString('en-IN')} | ${cat.status === 'on_track' ? '✅ On Track' : cat.status === 'warning' ? '⚠️ Warning' : '❌ Over'} |`).join('\n')}

### Forecast Summary
- **Planned Total:** ₹${forecast.planned.toLocaleString('en-IN')}
- **Actual Spent:** ₹${forecast.actual.toLocaleString('en-IN')}
- **Forecast Total (EAC):** ₹${forecast.eacTotal.toLocaleString('en-IN')}
- **Variance:** ${forecast.variance >= 0 ? '+' : '-'}₹${Math.abs(forecast.variance).toLocaleString('en-IN')}
- **Percent Spent:** ${forecast.percentSpent}%
` : '*No forecast data available*'}

---

*Report generated by CinePilot - Film Production Management System*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [items, expenses, sortItems, sortBy, sortOrder, categoryFilter, subcategoryFilter, sourceFilter, searchQuery, forecast])

  // Update ref when function changes
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  const handlePrint = () => {
    // Use sorted items for print output
    const sortedItems = sortItems(items)
    
    // Get category totals
    const categoryTotals: Record<string, number> = {}
    sortedItems.forEach(item => {
      const cat = item.category
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.total || 0)
    })

    // Get category breakdown for expenses (also sorted)
    const sortedExpenses = [...expenses].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '')
          break
        case 'amount':
          comparison = Number(a.amount || 0) - Number(b.amount || 0)
          break
        case 'date':
          comparison = (a.date || '').localeCompare(b.date || '')
          break
        case 'vendor':
          comparison = (a.vendor || '').localeCompare(b.vendor || '')
          break
        default:
          comparison = (a.date || '').localeCompare(b.date || '')
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    const expenseByCategory: Record<string, number> = {}
    sortedExpenses.forEach(exp => {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + Number(exp.amount)
    })

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Budget Report - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
    .summary-card { text-align: center; padding: 15px 25px; background: #f5f5f5; border-radius: 8px; }
    .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
    .summary-card.planned .value { color: #6366f1; }
    .summary-card.spent .value { color: #10b981; }
    .summary-card.variance .value { color: ${variance >= 0 ? '#10b981' : '#ef4444'}; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f0f0f0; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ccc; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #fafafa; }
    .category-header { background: #e8e8e8; font-weight: bold; }
    .category-total { background: #f5f5f5; font-weight: bold; }
    .status-approved { color: #10b981; }
    .status-pending { color: #f59e0b; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Production Budget Report</h1>
    <p>CinePilot • Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="summary">
    <div class="summary-card planned">
      <div class="label">Total Planned</div>
      <div class="value">${formatINR(totalPlanned)}</div>
    </div>
    <div class="summary-card spent">
      <div class="label">Total Spent</div>
      <div class="value">${formatINR(totalActual)}</div>
    </div>
    <div class="summary-card variance">
      <div class="label">Variance</div>
      <div class="value">${formatINR(Math.abs(variance))} ${variance >= 0 ? 'Under' : 'Over'}</div>
    </div>
  </div>

  <div class="section">
    <h2>📋 Budget Breakdown by Category</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Subcategory</th>
          <th>Description</th>
          <th style="text-align:right">Quantity</th>
          <th style="text-align:right">Unit</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(categoryTotals).map(([cat, total]) => {
          const catItems = sortedItems.filter(i => i.category === cat)
          return catItems.map((item, idx) => `
            <tr ${idx === 0 ? 'class="category-header"' : ''}>
              ${idx === 0 ? `<td rowspan="${catItems.length}" style="vertical-align:top;font-weight:bold">${cat}</td>` : ''}
              <td>${item.subcategory || '-'}</td>
              <td>${item.description || '-'}</td>
              <td style="text-align:right">${item.quantity || '-'}</td>
              <td style="text-align:right">${item.unit || '-'}</td>
              <td style="text-align:right">${formatINR(Number(item.total || 0))}</td>
            </tr>
          `).join('')
        }).join('')}
        <tr class="category-total">
          <td colspan="5" style="text-align:right">TOTAL</td>
          <td style="text-align:right">${formatINR(totalPlanned)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${sortedExpenses.length > 0 ? `
  <div class="section">
    <h2>💰 Expenses Details</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Vendor</th>
          <th style="text-align:right">Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${sortedExpenses.map(exp => `
          <tr>
            <td>${exp.date}</td>
            <td>${exp.category}</td>
            <td>${exp.description}</td>
            <td>${exp.vendor || '-'}</td>
            <td style="text-align:right">${formatINR(Number(exp.amount))}</td>
            <td class="status-${exp.status}">${exp.status}</td>
          </tr>
        `).join('')}
        <tr class="category-total">
          <td colspan="4" style="text-align:right">TOTAL SPENT</td>
          <td style="text-align:right">${formatINR(totalActual)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by CinePilot • AI-Powered Film Production Management</p>
  </div>
</body>
</html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
    setShowPrintMenu(false)
  }

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/budget')
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`)
      }
      const data = await res.json()
      // Check if real data exists, otherwise use demo
      if (data.items && data.items.length > 0 && !data._demo) {
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
      console.error('Budget fetch error:', e)
      // Fallback to demo data with error logged
      setItems(DEMO_BUDGET_ITEMS)
      setExpenses(DEMO_EXPENSES)
      setForecast(DEMO_FORECAST)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
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
          handleRefreshRef.current?.()
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
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearchQuery('')
          setSortBy('category')
          setSortOrder('asc')
          searchInputRef.current?.blur()
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          e.preventDefault()
          const num = parseInt(e.key)
          if (showFiltersRef.current) {
            // When filters panel is OPEN: number keys filter by category
            if (num >= 1 && num <= 9) {
              const catIndex = num - 1
              if (catIndex < categories.length) {
                const cat = categories[catIndex]
                // Toggle: if same category selected, clear to all
                setCategoryFilter(categoryFilterRef.current === cat ? 'all' : cat)
              }
            } else if (num === 0) {
              // 0 clears category filter
              setCategoryFilter('all')
            }
          } else {
            // When filters panel is CLOSED: number keys switch tabs
            switch (e.key) {
              case '1':
                setActiveTab('overview')
                break
              case '2':
                setActiveTab('breakdown')
                break
              case '3':
                setActiveTab('expenses')
                break
              case '4':
                setActiveTab('forecast')
                break
              case '5':
                setActiveTab('scenarios')
                break
            }
          }
          break
        case 'm':
          e.preventDefault()
          handleExportMarkdownRef.current()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          e.preventDefault()
          setShowPrintMenu(prev => !prev)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [categories])

  // Click outside to close filter panel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button
        const filterButton = document.querySelector('[data-filter-toggle]')
        if (filterButton && filterButton.contains(e.target as Node)) return
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters])

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchData()
    } catch (e) {
      console.error('Refresh failed:', e)
    } finally {
      setRefreshing(false)
      setLastUpdated(new Date())
    }
  }, [fetchData])

  // Update handleRefresh ref when function changes
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      setError('Please fill in description and amount')
      return
    }
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addExpense', ...newExpense, amount: parseFloat(newExpense.amount) }),
      })
      if (!res.ok) {
        throw new Error('Failed to add expense')
      }
      setShowAddExpense(false)
      setNewExpense({ category: 'Production', description: '', amount: '', date: '', vendor: '' })
      await fetchData()
    } catch (e: any) {
      setError(e.message || 'Failed to add expense')
    }
  }

  const formatINR = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
    if (n >= 100000) return `${(n / 100000).toFixed(1)} L`
    return `₹${n.toLocaleString('en-IN')}`
  }

  // Filter items and expenses based on search query and filters
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery && 
        !item.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(item.subcategory?.toLowerCase() || '').includes(searchQuery.toLowerCase()) &&
        !(item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ) return false
    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    // Subcategory filter
    if (subcategoryFilter !== 'all' && item.subcategory !== subcategoryFilter) return false
    // Source filter
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false
    return true
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '')
        break
      case 'subcategory':
        comparison = (a.subcategory || '').localeCompare(b.subcategory || '')
        break
      case 'total':
        comparison = Number(a.total || 0) - Number(b.total || 0)
        break
      case 'rate':
        comparison = Number(a.rate || 0) - Number(b.rate || 0)
        break
      default:
        comparison = (a.category || '').localeCompare(b.category || '')
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const filteredExpenses = expenses.filter(exp => {
    // Search filter
    if (searchQuery && 
        !exp.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !exp.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(exp.vendor?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ) return false
    // Category filter for expenses
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false
    return true
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '')
        break
      case 'amount':
        comparison = Number(a.amount || 0) - Number(b.amount || 0)
        break
      case 'date':
        comparison = (a.date || '').localeCompare(b.date || '')
        break
      case 'vendor':
        comparison = (a.vendor || '').localeCompare(b.vendor || '')
        break
      default:
        comparison = (a.date || '').localeCompare(b.date || '')
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

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
    { key: 'scenarios', label: 'Scenarios' },
  ]

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-200 rounded-full animate-ping opacity-30"></div>
        </div>
        <p className="text-slate-400 mt-4 animate-pulse">Loading budget data...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Budget Engine</h1>
            <p className="text-gray-500 text-sm mt-0.5">AI-powered production budgeting</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search budget... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded text-sm w-48 focus:outline-none focus:border-cinepilot-accent"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">/</span>
          </div>
          {/* Filter & Sort Toggle Button */}
          <button
            data-filter-toggle
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              showFilters 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Toggle Filters & Sort (F)"
          >
            <Filter className="w-4 h-4" />
            Filter & Sort
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">{activeFilterCount}</span>
            )}
          </button>
          <span className="text-sm text-gray-500">{filteredItems.length} of {items.length}</span>
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
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm flex items-center gap-2"
              title="Export (E)"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <button 
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Export Markdown
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export CSV
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                >
                  <FileJson className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
          {/* Print Dropdown */}
          <div className="relative" ref={printMenuRef}>
            <button 
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm flex items-center gap-2"
              title="Print (P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {showPrintMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <button 
                  onClick={handlePrint}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  Print Budget Report
                </button>
              </div>
            )}
          </div>
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
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Budget Utilization Gauge */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500 mb-2">Budget Used</div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="12" />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="42" 
                fill="none" 
                stroke={totalPlanned > 0 ? (totalActual / totalPlanned > 0.9 ? '#ef4444' : totalActual / totalPlanned > 0.7 ? '#f59e0b' : '#10b981') : '#64748b'} 
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 264, 264) : 0} 264`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${totalPlanned > 0 ? (totalActual / totalPlanned > 0.9 ? 'text-red-400' : totalActual / totalPlanned > 0.7 ? 'text-amber-400' : 'text-emerald-400') : 'text-gray-400'}`}>
                {totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {totalPlanned > 0 ? (totalActual / totalPlanned > 1 ? 'Over Budget!' : 'On Track') : 'No Data'}
          </div>
        </div>
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
          {forecast && totalPlanned > 0 && (
            <div className={`text-xs mt-1 ${forecast.eacTotal > totalPlanned ? 'text-red-400' : 'text-green-400'}`}>
              {forecast.eacTotal > totalPlanned ? `+${formatINR(forecast.eacTotal - totalPlanned)} over` : `${formatINR(totalPlanned - forecast.eacTotal)} under`}
            </div>
          )}
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

      {/* Filter & Sort Panel */}
      {showFilters && (
        <div 
          ref={filterPanelRef}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">Filter & Sort:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories (0)</option>
                {categories.map((cat, idx) => (<option key={cat} value={cat}>{cat} ({idx + 1})</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Subcategory:</label>
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Subcategories</option>
                {subcategories.map((sub) => (<option key={sub} value={sub}>{sub}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Source:</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Sources</option>
                {sources.map((src) => (<option key={src} value={src}>{src === 'ai' ? 'AI Generated' : 'Manual'}</option>))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
              <label className="text-sm text-slate-400">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="category">Category</option>
                <option value="description">Description</option>
                <option value="subcategory">Subcategory</option>
                <option value="total">Total</option>
                <option value="rate">Rate</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  sortBy !== 'category' || sortOrder !== 'asc'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
                title="Toggle sort order (S)"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <span>↑</span> <span>ASC</span>
                  </>
                ) : (
                  <>
                    <span>↓</span> <span>DESC</span>
                  </>
                )}
              </button>
            </div>
            
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30"
              >
                <X className="w-3.5 h-3.5" />
                Clear All ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                {/* Burn Rate Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">Daily Burn Rate</span>
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {formatINR(Math.round(forecast.actual / 30))}
                  </div>
                  <div className="text-xs text-slate-500">per day (30-day avg)</div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-400">
                      Days remaining: <span className="text-white font-medium">{Math.max(0, 30 - Math.floor(forecast.actual / (forecast.actual / 30 || 1)))}</span>
                    </div>
                  </div>
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

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Scenario Header */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  What-If Scenario Planner
                </h2>
                <p className="text-slate-400 text-sm mt-1">Model different budget scenarios and compare outcomes</p>
              </div>
              <button
                onClick={() => {
                  setNewScenarioName('')
                  setNewScenarioType('custom')
                  setScenarioAdjustments(categories.map(cat => ({ category: cat, percentageChange: 0, notes: '' })))
                  setShowScenarioEditor(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Scenario
              </button>
            </div>

            {/* Scenario Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedScenario === scenario.id
                      ? 'bg-indigo-600/20 border-indigo-500/50'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      scenario.type === 'optimistic' ? 'bg-emerald-500/20 text-emerald-400' :
                      scenario.type === 'pessimistic' ? 'bg-red-500/20 text-red-400' :
                      scenario.type === 'realistic' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)}
                    </span>
                    {scenario.id !== 'baseline' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setScenarios(scenarios.filter(s => s.id !== scenario.id))
                        }}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{scenario.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{scenario.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">₹{(scenario.totalBudget / 10000000).toFixed(1)}Cr</span>
                    <span className={`text-xs ${scenario.totalBudget > totalPlanned ? 'text-red-400' : 'text-emerald-400'}`}>
                      {scenario.totalBudget > totalPlanned ? '+' : ''}{((scenario.totalBudget - totalPlanned) / totalPlanned * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Comparison Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarios.map(s => ({
                  name: s.name,
                  budget: s.totalBudget,
                  variance: s.totalBudget - totalPlanned
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${(v/10000000).toFixed(1)}Cr`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${(value/10000000).toFixed(2)}Cr`, 'Budget']}
                  />
                  <Bar dataKey="budget" fill="#6366f1" radius={[4, 4, 0, 0]} name="Budget" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Selected Scenario Details */}
          {selectedScenario && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                {scenarios.find(s => s.id === selectedScenario)?.name} - Category Adjustments
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Base Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Adjustment</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Adjusted Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const scenario = scenarios.find(s => s.id === selectedScenario)
                      const adjustment = scenario?.adjustments.find(a => a.category === category)
                      const baseAmount = items.filter(i => i.category === category).reduce((sum, i) => sum + Number(i.total || 0), 0)
                      const percentageChange = adjustment?.percentageChange || 0
                      const adjustedAmount = baseAmount * (1 + percentageChange / 100)
                      const impact = adjustedAmount - baseAmount

                      return (
                        <tr key={category} className="border-b border-slate-700/50">
                          <td className="py-3 px-4 text-sm text-white">{category}</td>
                          <td className="py-3 px-4 text-sm text-slate-300 text-right">₹{(baseAmount/100000).toFixed(1)}L</td>
                          <td className={`py-3 px-4 text-sm text-right ${percentageChange >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {percentageChange > 0 ? '+' : ''}{percentageChange}%
                          </td>
                          <td className="py-3 px-4 text-sm text-white text-right font-medium">₹{(adjustedAmount/100000).toFixed(1)}L</td>
                          <td className={`py-3 px-4 text-sm text-right ${impact >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {impact >= 0 ? '+' : ''}₹{(impact/100000).toFixed(1)}L
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-900/50">
                      <td className="py-3 px-4 text-sm font-semibold text-white">Total</td>
                      <td className="py-3 px-4 text-sm text-slate-300 text-right font-semibold">₹{(totalPlanned/10000000).toFixed(1)}Cr</td>
                      <td className="py-3 px-4 text-sm text-slate-300 text-right">-</td>
                      <td className="py-3 px-4 text-sm text-indigo-400 text-right font-semibold">
                        ₹{((scenarios.find(s => s.id === selectedScenario)?.totalBudget || 0) / 10000000).toFixed(1)}Cr
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${
                        (scenarios.find(s => s.id === selectedScenario)?.totalBudget || 0) > totalPlanned ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {((scenarios.find(s => s.id === selectedScenario)?.totalBudget || 0) > totalPlanned ? '+' : '')}
                        ₹{(((scenarios.find(s => s.id === selectedScenario)?.totalBudget || 0) - totalPlanned) / 10000000).toFixed(1)}Cr
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              AI Recommendations
            </h3>
            <div className="space-y-3">
              {scenarios.find(s => s.id === selectedScenario)?.type === 'pessimistic' && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">High Budget Warning</p>
                    <p className="text-xs text-slate-400 mt-1">Consider increasing contingency to 15% in pessimistic scenarios or negotiating better rates with vendors.</p>
                  </div>
                </div>
              )}
              {scenarios.find(s => s.id === selectedScenario)?.type === 'optimistic' && (
                <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">Cost Optimization</p>
                    <p className="text-xs text-slate-400 mt-1">This scenario assumes vendors agree to lower rates. Consider locking in prices early to secure these savings.</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 font-medium">Production Phase Allocation</p>
                  <p className="text-xs text-slate-400 mt-1">Based on your shooting schedule, allocate at least 45% of budget for the production phase. Current: 53%.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">Contingency Recommendation</p>
                  <p className="text-xs text-slate-400 mt-1">Industry standard suggests 10-15% contingency. Current: 10% (₹85L). Consider increasing to ₹1.2Cr for safety.</p>
                </div>
              </div>
            </div>
          </div>
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
                { key: 'F', action: 'Toggle filters' },
                { key: 'S', action: 'Toggle sort order (ASC/DESC)' },
                { key: 'X', action: 'Clear all filters (when filters open)' },
                { key: 'N', action: 'Add new expense' },
                { key: 'M', action: 'Export as Markdown' },
                { key: 'E', action: 'Toggle export menu' },
                { key: 'P', action: 'Print budget report' },
                { key: '1-5', action: 'Switch tabs (when filters closed)' },
                { key: '1-7', action: 'Filter by category (when filters open)' },
                { key: '0', action: 'Clear category filter (when filters open)' },
                { key: '?', action: 'Show this help' },
                { key: 'Esc', action: 'Close modal / Clear search / Reset filters' },
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
