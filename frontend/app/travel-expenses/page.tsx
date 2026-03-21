'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Plane, Train, Bus, Car, Building, Wallet, Plus, Edit2, Trash2,
  DollarSign, Calendar, MapPin, Search, X, HelpCircle,
  Clock, CreditCard, Receipt, Filter, BarChart3, PieChart as PieChartIcon,
  Loader2, RefreshCw, Download, Printer, ChevronDown, FileJson, FileSpreadsheet,
  AlertCircle, CheckCircle, FileText
} from 'lucide-react'
import {
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const EXPENSE_CATEGORIES = [
  { key: 'flight', label: 'Flight', icon: Plane, color: '#3b82f6' },
  { key: 'train', label: 'Train', icon: Train, color: '#8b5cf6' },
  { key: 'bus', label: 'Bus', icon: Bus, color: '#06b6d4' },
  { key: 'taxi', label: 'Taxi', icon: Car, color: '#f59e0b' },
  { key: 'auto', label: 'Auto', icon: Car, color: '#eab308' },
  { key: 'hotel', label: 'Hotel', icon: Building, color: '#10b981' },
  { key: 'stay', label: 'Stay', icon: Building, color: '#059669' },
  { key: 'per_diem', label: 'Per Diem', icon: Wallet, color: '#ef4444' },
  { key: 'daily_allowance', label: 'Daily Allowance', icon: DollarSign, color: '#dc2626' },
]

const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pending', color: '#f59e0b' },
  { key: 'approved', label: 'Approved', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: 'reimbursed', label: 'Reimbursed', color: '#3b82f6' },
]

const DEMO_PROJECT_ID = 'demo-project'

interface TravelExpense {
  id: string
  projectId: string
  category: string
  description: string
  amount: number
  date: string
  vendor?: string
  status: string
  notes?: string
  personName?: string
  personRole?: string
  fromLocation?: string
  toLocation?: string
}

interface CategorySummary {
  category: string
  total: number
  count: number
  pending: number
  approved: number
}

interface TravelExpenseConflict {
  id: string
  type: 'budget' | 'duplicate' | 'missing-receipt' | 'pending-too-long' | 'high-value' | 'suspicious' | 'missing-info'
  severity: 'high' | 'medium' | 'low'
  expenseId: string
  title: string
  description: string
  recommendation: string
}

export default function TravelExpensesPage() {
  const [expenses, setExpenses] = useState<TravelExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category' | 'status' | 'vendor'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'dashboard' | 'conflicts'>('dashboard')
  const [budgetLimit, setBudgetLimit] = useState<number>(500000) // Default ₹5L budget
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Calculate active filter count using useMemo for efficiency
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (categoryFilter !== 'all') count++
    if (statusFilter !== 'all') count++
    if (searchQuery) count++
    if (sortBy !== 'date' || sortOrder !== 'desc') count++
    return count
  }, [categoryFilter, statusFilter, searchQuery, sortBy, sortOrder])

  // Clear all filters function
  const clearFilters = useCallback(() => {
    setCategoryFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    setSortBy('date')
    setSortOrder('desc')
  }, [])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const handleExportMarkdownRef = useRef<(() => void) | null>(null)
  const viewModeRef = useRef(viewMode)
  const showFiltersRef = useRef(showFilters)
  const categoryFilterRef = useRef(categoryFilter)
  const statusFilterRef = useRef(statusFilter)
  const activeFilterCountRef = useRef(0)
  const clearFiltersRef = useRef<(() => void) | null>(null)
  const expensesLengthRef = useRef(expenses.length)

  // Sync refs with state
  useEffect(() => { showFiltersRef.current = showFilters }, [showFilters])
  useEffect(() => { categoryFilterRef.current = categoryFilter }, [categoryFilter])
  useEffect(() => { statusFilterRef.current = statusFilter }, [statusFilter])
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])
  useEffect(() => { activeFilterCountRef.current = activeFilterCount }, [activeFilterCount])
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])
  useEffect(() => { expensesLengthRef.current = expenses.length }, [expenses.length])

  const [formData, setFormData] = useState({
    category: 'flight',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    status: 'pending',
    notes: '',
    personName: '',
    personRole: '',
    fromLocation: '',
    toLocation: '',
  })

  const loadExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/travel-expenses')
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      } else {
        // Fallback to demo data if API fails
        const demoExpenses: TravelExpense[] = [
          { id: '1', projectId: DEMO_PROJECT_ID, category: 'flight', description: 'Flight tickets for Lead Actor - Chennai to Bangalore', amount: 12500, date: '2026-03-10', vendor: 'IndiGo', status: 'reimbursed', personName: 'Vijay Sethupathi', personRole: 'Lead Actor', fromLocation: 'Chennai', toLocation: 'Bangalore' },
          { id: '2', projectId: DEMO_PROJECT_ID, category: 'hotel', description: 'Hotel stay for director - 3 nights', amount: 18000, date: '2026-03-10', vendor: 'Taj Coromandel', status: 'approved', notes: 'Suite room for 3 nights' },
          { id: '3', projectId: DEMO_PROJECT_ID, category: 'train', description: 'Train tickets for crew', amount: 4500, date: '2026-03-12', vendor: 'Indian Railways', status: 'pending', personName: 'Camera Team', personRole: 'Crew' },
          { id: '4', projectId: DEMO_PROJECT_ID, category: 'taxi', description: 'Airport pickup for lead actress', amount: 2500, date: '2026-03-15', vendor: 'Ola', status: 'approved', personName: 'Nayanthara' },
          { id: '5', projectId: DEMO_PROJECT_ID, category: 'per_diem', description: 'Daily allowance for lead actor', amount: 10000, date: '2026-03-15', status: 'approved', personName: 'Vijay Sethupathi' },
          { id: '6', projectId: DEMO_PROJECT_ID, category: 'bus', description: 'Bus booking for junior artists', amount: 3200, date: '2026-03-16', vendor: 'SETC', status: 'pending' },
          { id: '7', projectId: DEMO_PROJECT_ID, category: 'auto', description: 'Auto for location recce', amount: 450, date: '2026-03-18', status: 'reimbursed' },
          { id: '8', projectId: DEMO_PROJECT_ID, category: 'stay', description: 'PG for assistant director', amount: 15000, date: '2026-03-10', vendor: 'Zolo Stays', status: 'approved', personName: 'AD Team' },
          { id: '9', projectId: DEMO_PROJECT_ID, category: 'daily_allowance', description: 'Daily allowance for costume designer', amount: 7500, date: '2026-03-20', status: 'pending', personName: 'Costume Dept' },
          { id: '10', projectId: DEMO_PROJECT_ID, category: 'flight', description: 'Return flight for cinematographer', amount: 9800, date: '2026-03-25', vendor: 'Air India', status: 'pending', personName: 'Cinematographer' }
        ]
        setExpenses(demoExpenses)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadExpenses()
    setRefreshing(false)
    setLastUpdated(new Date())
  }, [loadExpenses])

  // Store handleRefresh in ref for keyboard shortcuts
  const handleRefreshRef = useRef(handleRefresh)
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  // Keep viewModeRef in sync with viewMode state
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Click outside handlers for dropdowns and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters])

  const filteredExpenses = useMemo(() => {
    const filtered = expenses.filter(e => {
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      const matchesSearch = !searchQuery || e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesStatus && matchesSearch
    })
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'vendor':
          comparison = (a.vendor || '').localeCompare(b.vendor || '')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [expenses, categoryFilter, statusFilter, searchQuery, sortBy, sortOrder])

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
  const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0)
  const reimbursedExpenses = expenses.filter(e => e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0)

  const categorySummary: CategorySummary[] = EXPENSE_CATEGORIES.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat.key)
    return {
      category: cat.key,
      total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      count: catExpenses.length,
      pending: catExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
      approved: catExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
    }
  }).filter(c => c.count > 0)

  const pieChartData = categorySummary.map(c => ({
    name: EXPENSE_CATEGORIES.find(cat => cat.key === c.category)?.label || c.category,
    value: c.total,
    color: EXPENSE_CATEGORIES.find(cat => cat.key === c.category)?.color || '#6b7280'
  }))

  const statusChartData = STATUS_OPTIONS.map(s => ({
    name: s.label,
    value: expenses.filter(e => e.status === s.key).reduce((sum, e) => sum + e.amount, 0),
    color: s.color
  })).filter(d => d.value > 0)

  // Budget tracking calculations
  const budgetUsedPercent = Math.round((totalExpenses / budgetLimit) * 100)
  const budgetRemaining = budgetLimit - totalExpenses
  const isOverBudget = totalExpenses > budgetLimit
  const isWarning = budgetUsedPercent >= 80 && !isOverBudget
  const budgetStatus = isOverBudget ? 'over' : isWarning ? 'warning' : 'ok'

  // Conflict detection
  const expenseConflicts = useMemo((): TravelExpenseConflict[] => {
    const conflicts: TravelExpenseConflict[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Budget Overrun: Total expenses exceed budget limit
    if (totalExpenses > budgetLimit) {
      const overrun = totalExpenses - budgetLimit
      conflicts.push({
        id: 'budget-overrun',
        type: 'budget',
        severity: overrun > budgetLimit * 0.5 ? 'high' : 'medium',
        expenseId: 'budget',
        title: 'Budget Overrun',
        description: `Total travel expenses (₹${totalExpenses.toLocaleString()}) exceed budget limit (₹${budgetLimit.toLocaleString()}) by ₹${overrun.toLocaleString()}`,
        recommendation: 'Review expenses and reduce non-essential travel or request budget increase'
      })
    }

    // 2. Duplicate Expenses: Same amount, same date, same category
    const expenseMap: Record<string, TravelExpense[]> = {}
    expenses.forEach(exp => {
      const key = `${exp.date}-${exp.amount}-${exp.category}`
      if (!expenseMap[key]) expenseMap[key] = []
      expenseMap[key].push(exp)
    })
    Object.entries(expenseMap).forEach(([key, exps]) => {
      if (exps.length > 1) {
        exps.forEach(exp => {
          conflicts.push({
            id: `duplicate-${exp.id}`,
            type: 'duplicate',
            severity: 'medium',
            expenseId: exp.id,
            title: 'Possible Duplicate',
            description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} on ${exp.date} may be a duplicate`,
            recommendation: 'Verify this expense is unique and not a duplicate entry'
          })
        })
      }
    })

    // 3. Missing Receipts: Expenses over ₹10,000 without notes
    expenses.forEach(exp => {
      if (exp.amount > 10000 && (!exp.notes || exp.notes.trim() === '')) {
        conflicts.push({
          id: `missing-receipt-${exp.id}`,
          type: 'missing-receipt',
          severity: 'high',
          expenseId: exp.id,
          title: 'Missing Receipt Documentation',
          description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} on ${exp.date} has no notes/receipt reference`,
          recommendation: 'Add receipt details or note explaining the expense'
        })
      }
    })

    // 4. Pending Too Long: Pending expenses older than 30 days
    expenses.forEach(exp => {
      if (exp.status === 'pending') {
        const expenseDate = new Date(exp.date)
        const daysPending = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysPending > 30) {
          conflicts.push({
            id: `pending-${exp.id}`,
            type: 'pending-too-long',
            severity: daysPending > 60 ? 'high' : 'medium',
            expenseId: exp.id,
            title: 'Pending Expense Overdue',
            description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} has been pending for ${daysPending} days`,
            recommendation: 'Follow up with finance to process this pending expense'
          })
        }
      }
    })

    // 5. High Value Items: Single expense over ₹50,000
    expenses.forEach(exp => {
      if (exp.amount > 50000) {
        conflicts.push({
          id: `high-value-${exp.id}`,
          type: 'high-value',
          severity: exp.amount > 100000 ? 'high' : 'medium',
          expenseId: exp.id,
          title: 'High Value Expense',
          description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} on ${exp.date} exceeds ₹50,000 threshold`,
          recommendation: 'Ensure proper approval and documentation for this high-value expense'
        })
      }
    })

    // 6. Missing Person Info: Expenses without person name for cast/crew
    expenses.forEach(exp => {
      if ((exp.category === 'flight' || exp.category === 'hotel' || exp.category === 'per_diem' || exp.category === 'daily_allowance') && 
          (!exp.personName || exp.personName.trim() === '')) {
        conflicts.push({
          id: `missing-info-${exp.id}`,
          type: 'missing-info',
          severity: 'low',
          expenseId: exp.id,
          title: 'Missing Person Information',
          description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} on ${exp.date} has no person name`,
          recommendation: 'Add the person name who incurred this expense'
        })
      }
    })

    // 7. Suspicious Amount: Unusually high for the category
    const categoryAverages: Record<string, number> = {}
    EXPENSE_CATEGORIES.forEach(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.key)
      if (catExpenses.length > 0) {
        categoryAverages[cat.key] = catExpenses.reduce((sum, e) => sum + e.amount, 0) / catExpenses.length
      }
    })
    expenses.forEach(exp => {
      const avg = categoryAverages[exp.category]
      if (avg && exp.amount > avg * 3) {
        conflicts.push({
          id: `suspicious-${exp.id}`,
          type: 'suspicious',
          severity: 'medium',
          expenseId: exp.id,
          title: 'Unusually High Amount',
          description: `${exp.category} expense of ₹${exp.amount.toLocaleString()} is 3x the average (₹${Math.round(avg).toLocaleString()})`,
          recommendation: 'Verify this expense is correct and not a data entry error'
        })
      }
    })

    return conflicts
  }, [expenses, budgetLimit, totalExpenses])

  // Conflict stats
  const conflictStats = useMemo(() => ({
    total: expenseConflicts.length,
    high: expenseConflicts.filter(c => c.severity === 'high').length,
    medium: expenseConflicts.filter(c => c.severity === 'medium').length,
    low: expenseConflicts.filter(c => c.severity === 'low').length,
  }), [expenseConflicts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const expenseData = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount) || 0,
      date: formData.date,
      vendor: formData.vendor || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
      personName: formData.personName || undefined,
      personRole: formData.personRole || undefined,
      fromLocation: formData.fromLocation || undefined,
      toLocation: formData.toLocation || undefined,
    }

    try {
      if (editingExpense) {
        const res = await fetch('/api/travel-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', id: editingExpense.id, ...expenseData })
        })
        if (res.ok) {
          const updated = await res.json()
          setExpenses(expenses.map(e => e.id === editingExpense.id ? updated : e))
        }
      } else {
        const res = await fetch('/api/travel-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', projectId: DEMO_PROJECT_ID, ...expenseData })
        })
        if (res.ok) {
          const created = await res.json()
          setExpenses([created, ...expenses])
        }
      }
    } catch (err) {
      console.error('Error saving expense:', err)
    }
    resetForm()
  }

  const handleEdit = (expense: TravelExpense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      vendor: expense.vendor || '',
      status: expense.status,
      notes: expense.notes || '',
      personName: expense.personName || '',
      personRole: expense.personRole || '',
      fromLocation: expense.fromLocation || '',
      toLocation: expense.toLocation || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      try {
        const res = await fetch('/api/travel-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        })
        if (res.ok) {
          setExpenses(expenses.filter(e => e.id !== id))
        }
      } catch (err) {
        console.error('Error deleting expense:', err)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      category: 'flight',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      status: 'pending',
      notes: '',
      personName: '',
      personRole: '',
      fromLocation: '',
      toLocation: '',
    })
    setEditingExpense(null)
    setShowForm(false)
  }

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Category', 'Description', 'Person', 'Role', 'Date', 'Vendor', 'From', 'To', 'Amount', 'Status', 'Notes']
    const rows = filteredExpenses.map(e => [
      EXPENSE_CATEGORIES.find(c => c.key === e.category)?.label || e.category,
      e.description,
      e.personName || '',
      e.personRole || '',
      e.date,
      e.vendor || '',
      e.fromLocation || '',
      e.toLocation || '',
      e.amount.toString(),
      STATUS_OPTIONS.find(s => s.key === e.status)?.label || e.status,
      e.notes || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalExpenses: expenses.length,
        totalAmount: totalExpenses,
        pendingAmount: pendingExpenses,
        approvedAmount: approvedExpenses,
        reimbursedAmount: reimbursedExpenses,
        categories: EXPENSE_CATEGORIES.map(cat => ({
          name: cat.label,
          count: expenses.filter(e => e.category === cat.key).length,
          total: expenses.filter(e => e.category === cat.key).reduce((sum, e) => sum + e.amount, 0)
        })),
        statuses: STATUS_OPTIONS.map(s => ({
          name: s.label,
          count: expenses.filter(e => e.status === s.key).length,
          total: expenses.filter(e => e.status === s.key).reduce((sum, e) => sum + e.amount, 0)
        }))
      },
      filters: { search: searchQuery, category: categoryFilter, status: statusFilter, sortBy, sortOrder },
      expenses: filteredExpenses
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Markdown export function
  const handleExportMarkdown = useCallback(() => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export')
      return
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    // Generate markdown content
    let markdown = `# Travel Expenses Report - CinePilot

**Generated:** ${new Date().toLocaleString()}

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Expenses | ${expenses.length} |
| Total Amount | ${formatCurrency(totalExpenses)} |
| Pending Amount | ${formatCurrency(pendingExpenses)} |
| Approved Amount | ${formatCurrency(approvedExpenses)} |
| Reimbursed Amount | ${formatCurrency(reimbursedExpenses)} |
| Budget Limit | ${formatCurrency(budgetLimit)} |
| Budget Remaining | ${formatCurrency(budgetLimit - totalExpenses)} |

---

## Category Breakdown

| Category | Count | Total Amount |
|----------|-------|--------------|
${EXPENSE_CATEGORIES.map(cat => {
  const count = expenses.filter(e => e.category === cat.key).length
  const total = expenses.filter(e => e.category === cat.key).reduce((sum, e) => sum + e.amount, 0)
  return `| ${cat.label} | ${count} | ${formatCurrency(total)} |`
}).join('\n')}

---

## Status Breakdown

| Status | Count | Total Amount |
|--------|-------|--------------|
${STATUS_OPTIONS.map(s => {
  const count = expenses.filter(e => e.status === s.key).length
  const total = expenses.filter(e => e.status === s.key).reduce((sum, e) => sum + e.amount, 0)
  return `| ${s.label} | ${count} | ${formatCurrency(total)} |`
}).join('\n')}

---

## Expense Details

| Date | Category | Person | Description | Amount | Status |
|------|----------|--------|-------------|--------|--------|
${filteredExpenses.map(e => {
  const cat = EXPENSE_CATEGORIES.find(c => c.key === e.category)?.label || e.category
  const status = STATUS_OPTIONS.find(s => s.key === e.status)?.label || e.status
  return `| ${e.date} | ${cat} | ${e.personName || '-'} | ${e.description} | ${formatCurrency(e.amount)} | ${status} |`
}).join('\n')}

${searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' ? `---

*Filters applied: ${searchQuery ? `search="${searchQuery}" ` : ''}${categoryFilter !== 'all' ? `category=${categoryFilter} ` : ''}${statusFilter !== 'all' ? `status=${statusFilter}` : ''}*` : ''}

---

*Generated by CinePilot - Travel Expenses Manager*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [filteredExpenses, expenses, totalExpenses, pendingExpenses, approvedExpenses, reimbursedExpenses, budgetLimit, searchQuery, categoryFilter, statusFilter])

  // Store handleExportMarkdown in ref for keyboard shortcuts
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const categoryColors: Record<string, string> = {}
    EXPENSE_CATEGORIES.forEach(cat => { categoryColors[cat.key] = cat.color })
    const statusColors: Record<string, string> = {}
    STATUS_OPTIONS.forEach(s => { statusColors[s.key] = s.color })

    const html = `<!DOCTYPE html>
<html><head><title>Travel Expenses Report - CinePilot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #6366f1}
.header h1{font-size:28px;color:#6366f1}.header .date{color:#64748b;font-size:14px}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:30px}
.summary-card{background:#f8fafc;padding:20px;border-radius:10px;border-left:4px solid #6366f1}
.summary-card .label{font-size:12px;color:#64748b;text-transform:uppercase}
.summary-card .value{font-size:24px;font-weight:bold;color:#1e293b}
.summary-card.pending{border-left-color:#f59e0b}.summary-card.approved{border-left-color:#10b981}
.summary-card.reimbursed{border-left-color:#3b82f6}
table{width:100%;border-collapse:collapse;margin-top:20px}
th{background:#6366f1;color:white;padding:12px;text-align:left;font-size:12px}
td{padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px}
tr:nth-child(even){background:#f8fafc}
.category-badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500}
.status-badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500}
.amount{font-weight:600;text-align:right}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px}
@media print{body{padding:20px}}
</style></head>
<body>
<div class="header"><h1>Travel Expenses Report</h1><div class="date">Generated: ${new Date().toLocaleString()}</div></div>
<div class="summary">
<div class="summary-card"><div class="label">Total</div><div class="value">${formatCurrency(totalExpenses)}</div></div>
<div class="summary-card pending"><div class="label">Pending</div><div class="value">${formatCurrency(pendingExpenses)}</div></div>
<div class="summary-card approved"><div class="label">Approved</div><div class="value">${formatCurrency(approvedExpenses)}</div></div>
<div class="summary-card reimbursed"><div class="label">Reimbursed</div><div class="value">${formatCurrency(reimbursedExpenses)}</div></div>
</div>
<table><thead><tr><th>#</th><th>Category</th><th>Description</th><th>Person</th><th>Date</th><th>Vendor</th><th>Route</th><th>Amount</th><th>Status</th></tr></thead>
<tbody>
${filteredExpenses.map((e, i) => `<tr><td>${i + 1}</td><td><span class="category-badge" style="background:${categoryColors[e.category]}20;color:${categoryColors[e.category]}">${EXPENSE_CATEGORIES.find(c => c.key === e.category)?.label}</span></td><td>${e.description}</td><td>${e.personName || '-'}</td><td>${new Date(e.date).toLocaleDateString('en-IN')}</td><td>${e.vendor || '-'}</td><td>${e.fromLocation && e.toLocation ? e.fromLocation + ' → ' + e.toLocation : '-'}</td><td class="amount">${formatCurrency(e.amount)}</td><td><span class="status-badge" style="background:${statusColors[e.status]}20;color:${statusColors[e.status]}">${STATUS_OPTIONS.find(s => s.key === e.status)?.label}</span></td></tr>`).join('')}
</tbody></table>
<div class="footer">CinePilot - AI Pre-Production Platform | Travel Expenses Report</div>
<script>window.onload=function(){window.print()}</script></body></html>`

    printWindow.document.write(html)
    printWindow.document.close()
    setShowPrintMenu(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur()
        }
        return
      }
      
      if (e.key === 'Escape') { 
        if (showForm) resetForm()
        else if (showExportMenu) setShowExportMenu(false)
        else if (showPrintMenu) setShowPrintMenu(false)
        else if (showHelp) setShowHelp(false)
        else if (showFilters) setShowFilters(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); searchInputRef.current?.focus() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setShowForm(true) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') { e.preventDefault(); setShowExportMenu(!showExportMenu) }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { setShowHelp(true) }
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setShowFilters(!showFilters) }
      if (e.key === 's' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }
      if (e.key === 'x' && !e.metaKey && !e.ctrlKey && !e.altKey && showFiltersRef.current && activeFilterCountRef.current > 0) { e.preventDefault(); clearFiltersRef.current?.() }
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey && expensesLengthRef.current > 0) { e.preventDefault(); setShowPrintMenu(prev => !prev) }
      // Context-aware number key shortcuts
      // When filters panel OPEN: filter by category (1-9) or status (Shift+1-4)
      // When filters panel CLOSED: switch view modes (1-3)
      const categoryKeys = ['flight', 'train', 'bus', 'taxi', 'auto', 'hotel', 'stay', 'per_diem', 'daily_allowance']
      const statusKeys = ['pending', 'approved', 'rejected', 'reimbursed']
      
      switch (e.key) {
        case '1':
          e.preventDefault()
          if (showFiltersRef.current) {
            setCategoryFilter(prev => prev === 'flight' ? 'all' : 'flight')
          } else {
            setViewMode('dashboard')
          }
          break
        case '2':
          e.preventDefault()
          if (showFiltersRef.current) {
            setCategoryFilter(prev => prev === 'train' ? 'all' : 'train')
          } else {
            setViewMode('list')
          }
          break
        case '3':
          e.preventDefault()
          if (showFiltersRef.current) {
            setCategoryFilter(prev => prev === 'bus' ? 'all' : 'bus')
          } else {
            setViewMode('conflicts')
          }
          break
        case '4':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'taxi' ? 'all' : 'taxi')
          }
          break
        case '5':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'auto' ? 'all' : 'auto')
          }
          break
        case '6':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'hotel' ? 'all' : 'hotel')
          }
          break
        case '7':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'stay' ? 'all' : 'stay')
          }
          break
        case '8':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'per_diem' ? 'all' : 'per_diem')
          }
          break
        case '9':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter(prev => prev === 'daily_allowance' ? 'all' : 'daily_allowance')
          }
          break
        case '0':
          if (showFiltersRef.current) {
            e.preventDefault()
            setCategoryFilter('all')
          }
          break
      }
      
      // Shift+number for status filters when filters panel is open
      if (e.shiftKey && showFiltersRef.current) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            setStatusFilter(prev => prev === 'pending' ? 'all' : 'pending')
            break
          case '2':
            e.preventDefault()
            setStatusFilter(prev => prev === 'approved' ? 'all' : 'approved')
            break
          case '3':
            e.preventDefault()
            setStatusFilter(prev => prev === 'rejected' ? 'all' : 'rejected')
            break
          case '4':
            e.preventDefault()
            setStatusFilter(prev => prev === 'reimbursed' ? 'all' : 'reimbursed')
            break
          case '0':
            e.preventDefault()
            setStatusFilter('all')
            break
        }
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        handleRefreshRef.current?.()
      }
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey && !showForm) {
        e.preventDefault()
        handleExportMarkdownRef.current?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showExportMenu, showPrintMenu, showHelp, showFilters, sortOrder])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  const getCategoryInfo = (category: string) => EXPENSE_CATEGORIES.find(c => c.key === category) || { key: category, label: category, icon: DollarSign, color: '#6b7280' }
  const getStatusInfo = (status: string) => STATUS_OPTIONS.find(s => s.key === status) || { key: status, label: status, color: '#6b7280' }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading travel expenses...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl"><Plane className="w-6 h-6 text-amber-500" /></div>
              <div>
                <h1 className="text-2xl font-bold">Travel Expenses</h1>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Track cast & crew travel costs</span>
                  {lastUpdated && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                title="Refresh (R)"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                  disabled={expenses.length === 0}
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition text-left">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <div><div className="text-sm font-medium">Export CSV</div><div className="text-xs text-slate-400">Spreadsheet format</div></div>
                    </button>
                    <button onClick={handleExportJSON} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition text-left">
                      <FileJson className="w-4 h-4 text-amber-500" />
                      <div><div className="text-sm font-medium">Export JSON</div><div className="text-xs text-slate-400">Full data export</div></div>
                    </button>
                    <button onClick={handleExportMarkdown} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition text-left">
                      <FileText className="w-4 h-4 text-cyan-500" />
                      <div><div className="text-sm font-medium">Export Markdown</div><div className="text-xs text-slate-400">Formatted report</div></div>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Dropdown */}
              <div className="relative" ref={printMenuRef}>
                <button 
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition"
                  disabled={expenses.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition text-left">
                      <Printer className="w-4 h-4 text-amber-500" />
                      <div><div className="text-sm font-medium">Print Report</div><div className="text-xs text-slate-400">Full expenses with summary</div></div>
                    </button>
                  </div>
                )}
              </div>

              {/* Help Button */}
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button onClick={() => setViewMode('dashboard')} title="Press 1" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'dashboard' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}><BarChart3 className="w-4 h-4 inline mr-1" />Dashboard <span className="ml-1 text-xs opacity-50">(1)</span></button>
                <button onClick={() => setViewMode('list')} title="Press 2" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}><Receipt className="w-4 h-4 inline mr-1" />List <span className="ml-1 text-xs opacity-50">(2)</span></button>
                <button onClick={() => setViewMode('conflicts')} title="Press 3" className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${viewMode === 'conflicts' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}><AlertCircle className="w-4 h-4" />Conflicts {conflictStats.total > 0 && <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${conflictStats.high > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-900'}`}>{conflictStats.total}</span>} <span className="text-xs opacity-50">(3)</span></button>
              </div>

              {/* Add Button */}
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition"><Plus className="w-4 h-4" />Add Expense</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Total</span><DollarSign className="w-5 h-5 text-amber-500" /></div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-slate-500 text-sm mt-1">{expenses.length} transactions</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Pending</span><Clock className="w-5 h-5 text-amber-500" /></div>
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(pendingExpenses)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Approved</span><CreditCard className="w-5 h-5 text-emerald-500" /></div>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(approvedExpenses)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Reimbursed</span><CreditCard className="w-5 h-5 text-blue-500" /></div>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(reimbursedExpenses)}</p>
          </div>
        </div>

        {/* Budget Tracking Card */}
        <div className={`mb-6 rounded-xl border p-5 ${
          budgetStatus === 'over' ? 'bg-red-900/20 border-red-700/50' :
          budgetStatus === 'warning' ? 'bg-amber-900/20 border-amber-700/50' :
          'bg-slate-800/50 border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                budgetStatus === 'over' ? 'bg-red-500/20' :
                budgetStatus === 'warning' ? 'bg-amber-500/20' :
                'bg-emerald-500/20'
              }`}>
                <Wallet className={`w-5 h-5 ${
                  budgetStatus === 'over' ? 'text-red-400' :
                  budgetStatus === 'warning' ? 'text-amber-400' :
                  'text-emerald-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Travel Budget</h3>
                <p className="text-sm text-slate-400">Budget limit: {formatCurrency(budgetLimit)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  budgetStatus === 'over' ? 'text-red-400' :
                  budgetStatus === 'warning' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {budgetUsedPercent}%
                </p>
                <p className="text-xs text-slate-500">used</p>
              </div>
              {/* Budget input */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Limit:</span>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(parseInt(e.target.value) || 0)}
                  className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Budget limit"
                />
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                budgetStatus === 'over' ? 'bg-red-500' :
                budgetStatus === 'warning' ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            />
            {budgetStatus === 'over' && (
              <div className="absolute left-0 top-0 h-full bg-red-500 animate-pulse" style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }} />
            )}
          </div>
          
          {/* Budget Status Messages */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-sm ${
              budgetStatus === 'over' ? 'text-red-400' :
              budgetStatus === 'warning' ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {budgetStatus === 'over' ? (
                <><AlertCircle className="w-4 h-4" /> Over budget by {formatCurrency(Math.abs(budgetRemaining))}</>
              ) : budgetStatus === 'warning' ? (
                <><AlertCircle className="w-4 h-4" /> Warning: Approaching budget limit</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Within budget - {formatCurrency(budgetRemaining)} remaining</>
              )}
            </div>
            <div className="text-sm text-slate-500">
              Remaining: <span className={budgetRemaining < 0 ? 'text-red-400' : 'text-white'}>{formatCurrency(budgetRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Filters Row with Toggle */}
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search expenses... (Press /)" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-amber-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Toggle Filters (F)"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-400 hover:text-white transition-colors"
              title="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>

        {/* Collapsible Filter & Sort Panel */}
        {showFilters && (
          <div 
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-300">Filters:</span>
              <span className="text-xs text-cyan-400">(Press 1-9 for category, Shift+1-4 for status, 0 to clear, X for all)</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">Category (1-9):</span>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)} 
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((cat, idx) => <option key={cat.key} value={cat.key}>{idx + 1}. {cat.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">Status (Shift+1-4):</span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map((s, idx) => <option key={s.key} value={s.key}>Shift+{idx + 1}. {s.label}</option>)}
                </select>
              </div>
              <div className="h-6 w-px bg-slate-600" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)} 
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                  <option value="status">Status</option>
                  <option value="vendor">Vendor</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                  title="Toggle sort order"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-amber-500" />By Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart><Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} /></RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" />By Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={100} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Category Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySummary.map(cat => {
                  const catInfo = getCategoryInfo(cat.category)
                  const Icon = catInfo.icon
                  return (
                    <div key={cat.category} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-amber-500/50 transition cursor-pointer" onClick={() => setCategoryFilter(cat.category)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${catInfo.color}20` }}><Icon className="w-5 h-5" style={{ color: catInfo.color }} /></div>
                        <span className="font-medium">{catInfo.label}</span>
                      </div>
                      <p className="text-2xl font-bold mb-2">{formatCurrency(cat.total)}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{cat.count} items</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs">{formatCurrency(cat.pending)} pending</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy('category'); setSortOrder(sortBy === 'category' && sortOrder === 'asc' ? 'desc' : 'asc') }}>
                      Category {sortBy === 'category' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Description</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Person</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy('date'); setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc') }}>
                      Date {sortBy === 'date' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy('amount'); setSortOrder(sortBy === 'amount' && sortOrder === 'asc' ? 'desc' : 'asc') }}>
                      Amount {sortBy === 'amount' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy('status'); setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc') }}>
                      Status {sortBy === 'status' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No expenses found</p></td></tr>
                  ) : (
                    filteredExpenses.map(expense => {
                      const catInfo = getCategoryInfo(expense.category)
                      const statusInfo = getStatusInfo(expense.status)
                      const Icon = catInfo.icon
                      return (
                        <tr key={expense.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className="w-4 h-4" style={{ color: catInfo.color }} /><span className="text-sm">{catInfo.label}</span></div></td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{expense.description}</p>
                              {expense.vendor && <p className="text-xs text-slate-400">{expense.vendor}</p>}
                              {(expense.fromLocation || expense.toLocation) && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{expense.fromLocation} → {expense.toLocation}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">{expense.personName && <div><p className="text-sm">{expense.personName}</p>{expense.personRole && <p className="text-xs text-slate-400">{expense.personRole}</p>}</div>}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-1 text-sm text-slate-300"><Calendar className="w-4 h-4 text-slate-400" />{new Date(expense.date).toLocaleDateString('en-IN')}</div></td>
                          <td className="px-4 py-3 text-right"><span className="font-semibold">{formatCurrency(expense.amount)}</span></td>
                          <td className="px-4 py-3 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>{statusInfo.label}</span></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(expense)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conflict Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Total Conflicts</span>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-white">{conflictStats.total}</div>
              </div>
              <div className="bg-slate-800/50 border border-red-900/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">High Priority</span>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-400">{conflictStats.high}</div>
              </div>
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Medium Priority</span>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-400">{conflictStats.medium}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Low Priority</span>
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-400">{conflictStats.low}</div>
              </div>
            </div>

            {/* Budget Limit Input */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-slate-400 mb-2 block">Budget Limit (₹)</label>
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-slate-400 mb-2 block">Current Status</label>
                  <div className={`px-4 py-2 rounded-lg border ${
                    isOverBudget ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                    isWarning ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isOverBudget ? `Over Budget by ₹${Math.abs(budgetRemaining).toLocaleString()}` :
                     isWarning ? `Warning: ${budgetUsedPercent}% used` :
                     `${budgetUsedPercent}% used - ₹${budgetRemaining.toLocaleString()} remaining`}
                  </div>
                </div>
              </div>
            </div>

            {/* Conflicts List */}
            {expenseConflicts.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
                <p className="text-slate-400">No conflicts detected in your travel expenses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenseConflicts.map(conflict => (
                  <div key={conflict.id} className={`bg-slate-800/50 border rounded-xl p-5 ${
                    conflict.severity === 'high' ? 'border-red-500/30' :
                    conflict.severity === 'medium' ? 'border-amber-500/30' :
                    'border-slate-600'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        conflict.severity === 'high' ? 'bg-red-500/20' :
                        conflict.severity === 'medium' ? 'bg-amber-500/20' :
                        'bg-slate-700'
                      }`}>
                        <AlertCircle className={`w-5 h-5 ${
                          conflict.severity === 'high' ? 'text-red-400' :
                          conflict.severity === 'medium' ? 'text-amber-400' :
                          'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white">{conflict.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            conflict.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                            conflict.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {conflict.severity.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                            {conflict.type.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-3">{conflict.description}</p>
                        <div className="bg-slate-700/50 rounded-lg p-3">
                          <span className="text-sm text-slate-400">Recommendation: </span>
                          <span className="text-sm text-amber-400">{conflict.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-700 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm font-medium text-amber-400 mb-2">When Filters Panel CLOSED</div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Switch to Dashboard (1)</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">1</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Switch to List (2)</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">2</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Switch to Conflicts (3)</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">3</kbd></div>
              <div className="border-t border-slate-700 my-2"></div>
              <div className="text-sm font-medium text-cyan-400 mb-2">When Filters Panel OPEN</div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Flight</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">1</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Train</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">2</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Bus</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">3</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Taxi</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">4</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Auto</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">5</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Hotel</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">6</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Stay</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">7</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Per Diem</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">8</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Daily Allowance</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">9</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Clear category filter</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">0</kbd></div>
              <div className="flex items-center justify-between"><span className="text-cyan-400">Clear all filters</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm text-cyan-400">X</kbd></div>
              <div className="border-t border-slate-700 my-2"></div>
              <div className="text-sm font-medium text-cyan-400 mb-2">Status Filters (Shift+Number)</div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Pending</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Shift+1</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Approved</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Shift+2</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Rejected</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Shift+3</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Filter by Reimbursed</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Shift+4</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Clear status filter</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Shift+0</kbd></div>
              <div className="border-t border-slate-700 my-2"></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Toggle filters</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">F</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Toggle sort order</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">S</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Focus search</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">/</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Refresh data</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">R</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Export Markdown</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">M</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Print report</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">P</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Add new expense</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Ctrl+N</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Export menu</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Ctrl+E</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Close modal / Clear</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Esc</kbd></div>
              <div className="flex items-center justify-between"><span className="text-slate-300">Show shortcuts</span><kbd className="px-2 py-1 bg-slate-700 rounded text-sm">?</kbd></div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={formRef} className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-700 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" required>
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Enter description" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Vendor (optional)</label>
                <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="e.g., Ola, Indian Railways" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">From</label>
                  <input type="text" value={formData.fromLocation} onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">To</label>
                  <input type="text" value={formData.toLocation} onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="City" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Person Name</label>
                  <input type="text" value={formData.personName} onChange={(e) => setFormData({ ...formData, personName: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  <input type="text" value={formData.personRole} onChange={(e) => setFormData({ ...formData, personRole: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="e.g., Lead Actor" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" rows={2} placeholder="Additional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition">{editingExpense ? 'Update' : 'Add'} Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
