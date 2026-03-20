'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Plane,
  Train,
  Bus,
  Car,
  Hotel,
  Wallet,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  X,
  Search,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  FileText,
  Keyboard,
  Printer,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'

const CATEGORIES = [
  { key: 'Flight', label: 'Flight', icon: Plane, color: '#3b82f6' },
  { key: 'Train', label: 'Train', icon: Train, color: '#8b5cf6' },
  { key: 'Bus', label: 'Bus', icon: Bus, color: '#06b6d4' },
  { key: 'Taxi', label: 'Taxi', icon: Car, color: '#f59e0b' },
  { key: 'Auto', label: 'Auto', icon: Car, color: '#f97316' },
  { key: 'Hotel', label: 'Hotel', icon: Hotel, color: '#ec4899' },
  { key: 'Stay', label: 'Stay', icon: Hotel, color: '#a855f7' },
  { key: 'Per Diem', label: 'Per Diem', icon: Wallet, color: '#10b981' },
  { key: 'Daily Allowance', label: 'Daily Allowance', icon: DollarSign, color: '#14b8a6' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  reimbursed: '#6366f1',
}

interface TravelExpense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  vendor?: string
  status: string
  notes?: string
}

interface Summary {
  totalAmount: number
  totalCount: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
}

const EMPTY_SUMMARY: Summary = {
  totalAmount: 0,
  totalCount: 0,
  byCategory: {},
  byStatus: {},
}

interface TravelConflict {
  id: string
  type: 'budget' | 'duplicate' | 'missing-receipt' | 'pending-too-long' | 'high-value'
  severity: 'high' | 'medium' | 'low'
  expenseId: string
  title: string
  description: string
  recommendation: string
}

export default function TravelExpensesPage() {
  const [expenses, setExpenses] = useState<TravelExpense[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const showFiltersRef = useRef(showFilters)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: 'Flight',
    personName: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    status: 'pending',
    notes: '',
  })
  
  // Search and keyboard shortcuts
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category' | 'status' | 'vendor'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()
  const exportToMarkdownRef = useRef<() => void>(() => {})
  const filterCategoryRef = useRef(filterCategory)
  const filterStatusRef = useRef(filterStatus)
  const activeFilterCountRef = useRef(0)
  
  // View mode for tabs
  const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'conflicts'>('list')
  // Budget limit for conflict detection
  const [budgetLimit, setBudgetLimit] = useState<number>(500000)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('projectId', 'demo-project')
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (dateRange.start) params.set('startDate', dateRange.start)
      if (dateRange.end) params.set('endDate', dateRange.end)
      
      const res = await fetch(`/api/travel?${params.toString()}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExpenses(data.expenses || [])
      setSummary(data.summary || EMPTY_SUMMARY)
      setIsDemoMode(data.isDemoMode === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, dateRange])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = fetchExpenses

  // Store expenses length in ref for keyboard shortcuts
  const expensesLengthRef = useRef(expenses.length)
  useEffect(() => {
    expensesLengthRef.current = expenses.length
  }, [expenses.length])

  // Store filter category in ref for keyboard shortcuts
  useEffect(() => {
    filterCategoryRef.current = filterCategory
  }, [filterCategory])

  // Store filter status in ref for keyboard shortcuts
  useEffect(() => {
    filterStatusRef.current = filterStatus
  }, [filterStatus])

  // Store showFilters state in ref for keyboard shortcuts
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
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
        case 'n':
          e.preventDefault()
          setShowForm(true)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          if (expensesLengthRef.current > 0) {
            exportToMarkdownRef.current()
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setSearchQuery('')
          setShowForm(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFiltersRef.current()
          }
          break
        case 'p':
          e.preventDefault()
          if (expensesLengthRef.current > 0) {
            setShowPrintMenu(prev => !prev)
          }
          break
        case 's':
          e.preventDefault()
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          break
        case 'l':
          e.preventDefault()
          setViewMode('list')
          break
        case 'a':
          e.preventDefault()
          setViewMode('analytics')
          break
        case 'c':
          e.preventDefault()
          setViewMode('conflicts')
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
            // When filter panel is OPEN: number keys filter by status
            // Status options: all, pending, approved, rejected, reimbursed
            const statusOptions = ['all', 'pending', 'approved', 'rejected', 'reimbursed']
            if (num >= 1 && num <= 5) {
              const statusIndex = num - 1
              const status = statusOptions[statusIndex]
              // Toggle: if same status selected, clear to all
              setFilterStatus(filterStatusRef.current === status ? 'all' : status)
            } else if (num === 0) {
              // 0 clears status filter
              setFilterStatus('all')
            }
          } else {
            // When filter panel is CLOSED: number keys switch view modes (1-3) or filter categories (1-9)
            if (num >= 1 && num <= 3) {
              // View mode switching
              switch (num) {
                case 1:
                  setViewMode('list')
                  break
                case 2:
                  setViewMode('analytics')
                  break
                case 3:
                  setViewMode('conflicts')
                  break
              }
            } else if (num >= 4 && num <= 9) {
              // Categories 4-9 map to CATEGORIES array indices 3-8
              const catIndex = num - 1
              if (catIndex < CATEGORIES.length) {
                const catKey = CATEGORIES[catIndex].key
                // Toggle: if same category selected, clear to all
                setFilterCategory(filterCategoryRef.current === catKey ? 'all' : catKey)
              }
            } else if (num === 0) {
              // 0 clears category filter when panel is closed
              setFilterCategory('all')
            }
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close export menu
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    if (showExportMenu || showPrintMenu) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  // Click outside to close filter panel
  useEffect(() => {
    const handleFilterClickOutside = (e: MouseEvent) => {
      if (showFilters && filterPanelRef.current) {
        const target = e.target as HTMLElement
        if (!filterPanelRef.current.contains(target) && !target.closest('.filter-toggle')) {
          setShowFilters(false)
        }
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleFilterClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleFilterClickOutside)
  }, [showFilters])

  // CSV Export function (uses sorted/filtered data)
  const exportToCSV = () => {
    const headers = ['Date', 'Person', 'Category', 'Description', 'Vendor', 'Amount', 'Status']
    const rows = filteredExpenses.map(exp => {
      const match = exp.description.match(/^([^:]+):\s*(.*)$/)
      const personName = match ? match[1] : ''
      const description = match ? match[2] : exp.description
      return [
        new Date(exp.date).toLocaleDateString('en-IN'),
        personName,
        exp.category,
        description,
        exp.vendor || '',
        exp.amount.toString(),
        exp.status
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // JSON Export function (uses sorted/filtered data)
  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalExpenses: filteredExpenses.length,
      totalAmount: summary.totalAmount,
      byCategory: summary.byCategory,
      byStatus: summary.byStatus,
      expenses: filteredExpenses.map(exp => ({
        date: exp.date,
        person: exp.description.match(/^([^:]+):/)?.[1] || '',
        category: exp.category,
        description: exp.description.replace(/^[^:]+:s*/, ''),
        vendor: exp.vendor || null,
        amount: exp.amount,
        status: exp.status,
        notes: exp.notes || null,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Markdown Export function (uses sorted/filtered data)
  const exportToMarkdown = () => {
    if (filteredExpenses.length === 0) return

    // Build summary statistics
    const totalExpenses = filteredExpenses.length
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Category breakdown
    const byCategory: Record<string, number> = {}
    const categoryCount: Record<string, number> = {}
    filteredExpenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
      categoryCount[exp.category] = (categoryCount[exp.category] || 0) + 1
    })
    
    // Status breakdown
    const byStatus: Record<string, number> = {}
    filteredExpenses.forEach(exp => {
      byStatus[exp.status] = (byStatus[exp.status] || 0) + 1
    })

    // Build markdown content
    let markdown = `# CinePilot Travel Expenses Report

**Generated:** ${new Date().toISOString().split('T')[0]}

## Summary

- **Total Expenses:** ${totalExpenses}
- **Total Amount:** ₹${totalAmount.toLocaleString('en-IN')}
- **Average per Expense:** ₹${Math.round(totalAmount / totalExpenses).toLocaleString('en-IN')}

### By Category

| Category | Count | Amount |
|----------|-------|--------|
`
    Object.entries(byCategory).forEach(([category, amount]) => {
      markdown += `| ${category} | ${categoryCount[category]} | ₹${amount.toLocaleString('en-IN')} |\n`
    })

    markdown += `
### By Status

| Status | Count |
|--------|-------|
`
    Object.entries(byStatus).forEach(([status, count]) => {
      const emoji = status === 'approved' ? '✅' : status === 'pending' ? '⏳' : status === 'rejected' ? '❌' : '💰'
      markdown += `| ${emoji} ${status.charAt(0).toUpperCase() + status.slice(1)} | ${count} |\n`
    })

    markdown += `
## Expenses Detail

| Date | Person | Category | Description | Vendor | Amount | Status |
|------|--------|----------|-------------|--------|--------|--------|
`
    filteredExpenses.forEach(exp => {
      const match = exp.description.match(/^([^:]+):\s*(.*)$/)
      const personName = match ? match[1] : ''
      const description = match ? match[2] : exp.description
      const statusEmoji = exp.status === 'approved' ? '✅' : exp.status === 'pending' ? '⏳' : exp.status === 'rejected' ? '❌' : '💰'
      markdown += `| ${new Date(exp.date).toLocaleDateString('en-IN')} | ${personName || '-'} | ${exp.category} | ${description} | ${exp.vendor || '-'} | ₹${exp.amount.toLocaleString('en-IN')} | ${statusEmoji} ${exp.status} |\n`
    })

    markdown += `
---

*Generated by CinePilot - Film Production Management*
`
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }
  
  // Assign to ref for keyboard shortcuts
  exportToMarkdownRef.current = exportToMarkdown

  // Print function
  const handlePrint = () => {
    const statusColors: Record<string, string> = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      reimbursed: '#6366f1',
    }

    const categoryColors: Record<string, string> = {
      Flight: '#3b82f6',
      Train: '#8b5cf6',
      Bus: '#06b6d4',
      Taxi: '#f59e0b',
      Auto: '#f97316',
      Hotel: '#ec4899',
      Stay: '#a855f7',
      'Per Diem': '#10b981',
      'Daily Allowance': '#14b8a6',
    }

    const expensesRows = filteredExpenses.map(exp => {
      const match = exp.description.match(/^([^:]+):\s*(.*)$/)
      const personName = match ? match[1] : ''
      const description = match ? match[2] : exp.description
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${personName || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span style="background: ${categoryColors[exp.category] || '#64748b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${exp.category}</span></td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${exp.vendor || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${exp.amount.toLocaleString('en-IN')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;"><span style="background: ${statusColors[exp.status] || '#64748b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${exp.status}</span></td>
        </tr>
      `
    }).join('')

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Travel Expenses Report - CinePilot</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .summary-card h3 { margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 24px; font-weight: bold; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #3b82f6; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
          td { font-size: 13px; }
          .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>✈️ Travel Expenses Report</h1>
        <div class="summary">
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <p>${expenses.length}</p>
          </div>
          <div class="summary-card">
            <h3>Total Amount</h3>
            <p>₹${summary.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p>${Object.keys(summary.byCategory).length}</p>
          </div>
          <div class="summary-card">
            <h3>Pending</h3>
            <p>${summary.byStatus.pending || 0}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Person</th>
              <th>Category</th>
              <th>Description</th>
              <th>Vendor</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${expensesRows}
          </tbody>
        </table>
        <div class="footer">
          Generated by CinePilot on ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

  const clearDateFilter = () => {
    setDateRange({ start: '', end: '' })
    setShowDateFilter(false)
  }

  const resetForm = () => {
    setFormData({
      category: 'Flight',
      personName: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      status: 'pending',
      notes: '',
    })
    setEditingId(null)
    setShowForm(false)
          setShowExportMenu(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return

    const payload = {
      category: formData.category,
      personName: formData.personName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      vendor: formData.vendor || null,
      status: formData.status,
      notes: formData.notes || null,
    }

    try {
      const url = editingId ? `/api/travel?id=${editingId}` : '/api/travel'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      resetForm()
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleEdit = (expense: TravelExpense) => {
    const match = expense.description.match(/^([^:]+):\s*(.*)$/)
    const personName = match ? match[1] : ''
    const description = match ? match[2] : expense.description
    setFormData({
      category: expense.category,
      personName,
      description,
      amount: expense.amount.toString(),
      date: expense.date.split('T')[0],
      vendor: expense.vendor || '',
      status: expense.status,
      notes: expense.notes || '',
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`/api/travel?id=${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const pieData = Object.entries(summary.byCategory).map(([name, value]) => ({
    name,
    value,
    color: CATEGORIES.find(c => c.key === name)?.color || '#64748b',
  }))

  const statusData = Object.entries(summary.byStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: STATUS_COLORS[name] || '#64748b',
  }))

  // Monthly trend data - group expenses by month
  const monthlyTrendData = useMemo(() => {
    const monthlyMap: Record<string, number> = {}
    expenses.forEach(exp => {
      const month = exp.date.substring(0, 7) // YYYY-MM format
      monthlyMap[month] = (monthlyMap[month] || 0) + exp.amount
    })
    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        amount,
      }))
  }, [expenses])

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(exp =>
        exp.description.toLowerCase().includes(query) ||
        exp.category.toLowerCase().includes(query) ||
        exp.vendor?.toLowerCase().includes(query) ||
        exp.status.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
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
    
    return result
  }, [expenses, searchQuery, sortBy, sortOrder])

  // Calculate active filter count (includes sort state)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterCategory !== 'all') count++
    if (filterStatus !== 'all') count++
    if (dateRange.start || dateRange.end) count++
    if (sortBy) count++ // Count sort as an active filter
    return count
  }, [filterCategory, filterStatus, dateRange, sortBy])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterCategory('all')
    setFilterStatus('all')
    setDateRange({ start: '', end: '' })
    setSearchQuery('')
    setSortBy('date')
    setSortOrder('desc')
  }, [])

  // Ref for clearFilters
  const clearFiltersRef = useRef(clearFilters)
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])

  // Update activeFilterCount ref
  useEffect(() => { activeFilterCountRef.current = activeFilterCount }, [activeFilterCount])

  // Conflict detection
  const travelConflicts = useMemo(() => {
    const conflicts: TravelConflict[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Budget Overrun: Total expenses exceed budget limit
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0)
    if (totalExpenses > budgetLimit) {
      const overrun = totalExpenses - budgetLimit
      conflicts.push({
        id: 'budget-overrun',
        type: 'budget',
        severity: overrun > budgetLimit * 0.5 ? 'high' : 'medium',
        expenseId: 'budget',
        title: 'Budget Overrun',
        description: `Total travel expenses (₹${totalExpenses.toLocaleString()}) exceed budget limit (₹${budgetLimit.toLocaleString()}) by ₹${overrun.toLocaleString()}`,
        recommendation: 'Review expenses and reduce non-essential travel or upgrade to higher budget'
      })
    }

    // 2. Duplicate Expenses: Same amount, same date, same vendor/category
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

    return conflicts
  }, [expenses, budgetLimit])

  // Conflict stats
  const conflictStats = useMemo(() => ({
    total: travelConflicts.length,
    high: travelConflicts.filter(c => c.severity === 'high').length,
    medium: travelConflicts.filter(c => c.severity === 'medium').length,
    low: travelConflicts.filter(c => c.severity === 'low').length,
  }), [travelConflicts])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                Travel Expenses
              </h1>
              <p className="text-slate-500 text-sm mt-1">Track cast & crew travel costs</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search expenses (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 w-64"
                />
              </div>
              {/* Refresh Button */}
              <button
                onClick={fetchExpenses}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
                title="Refresh (R)"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors filter-toggle ${
                  showFilters 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
                title="Toggle Filters (F)"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">{activeFilterCount}</span>
                )}
              </button>
              {/* Keyboard Help Button */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {error && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {isDemoMode && (
          <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Preview mode — Connect a PostgreSQL database to save travel expenses
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div 
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Filter & Sort:</span>
                <span className="text-xs text-cyan-400/70">(1-5 for status, 0 to clear)</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Categories (0)</option>
                  {CATEGORIES.map((cat, idx) => (
                    <option key={cat.key} value={cat.key}>{cat.label} ({idx + 1})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="reimbursed">Reimbursed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Date Range:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                  <option value="status">Status</option>
                  <option value="vendor">Vendor</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    sortOrder === 'asc' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title="Toggle sort order (S)"
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" /> Clear All ({activeFilterCount})
                </button>
              )}
              <div className="ml-auto text-sm text-slate-400">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </div>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Plane className="w-4 h-4 inline-block mr-2" />
            List
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'analytics'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setViewMode('conflicts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'conflicts'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline-block" />
            Conflicts
            {conflictStats.high > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {conflictStats.high}
              </span>
            )}
          </button>
          <span className="text-xs text-slate-500 ml-2">Press 1, 2, 3 to switch views</span>
        </div>

        {/* List/Analytics Views */}
        {(viewMode === 'list' || viewMode === 'analytics') && (
        <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400">Total Spent</span>
            </div>
            <p className="text-2xl font-semibold text-white">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">{summary.totalCount} transactions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Plane className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Transportation</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {formatCurrency((summary.byCategory['Flight'] || 0) + (summary.byCategory['Train'] || 0) + (summary.byCategory['Bus'] || 0) + (summary.byCategory['Taxi'] || 0) + (summary.byCategory['Auto'] || 0))}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Hotel className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-sm text-slate-400">Accommodation</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {formatCurrency((summary.byCategory['Hotel'] || 0) + (summary.byCategory['Stay'] || 0))}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Wallet className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-sm text-slate-400">Daily Allowances</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {formatCurrency((summary.byCategory['Per Diem'] || 0) + (summary.byCategory['Daily Allowance'] || 0))}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Category */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">By Category</h3>
            </div>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No expense data yet
              </div>
            )}
          </div>

          {/* By Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">By Status</h3>
            </div>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No expense data yet
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        {monthlyTrendData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Monthly Spending Trend</h3>
              <span className="text-sm text-slate-500">Last 6 months</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters & List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          {/* Filters */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">Filters:</span>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories (0)</option>
              {CATEGORIES.map((c, idx) => (
                <option key={c.key} value={c.key}>{c.label} ({idx + 1})</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="reimbursed">Reimbursed</option>
            </select>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showDateFilter || dateRange.start || dateRange.end
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {dateRange.start || dateRange.end ? 'Date Range Active' : 'Date Range'}
            </button>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={clearDateFilter}
                className="flex items-center gap-1 px-2 py-1 text-sm text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            {showDateFilter && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-transparent border-none text-sm text-slate-300 focus:outline-none"
                  placeholder="Start date"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-transparent border-none text-sm text-slate-300 focus:outline-none"
                  placeholder="End date"
                />
              </div>
            )}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(prev => !prev)}
                disabled={filteredExpenses.length === 0}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                    disabled={filteredExpenses.length === 0}
                    className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => { exportToJSON(); setShowExportMenu(false); }}
                    disabled={filteredExpenses.length === 0}
                    className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => { exportToMarkdown(); setShowExportMenu(false); }}
                    disabled={filteredExpenses.length === 0}
                    className="w-full px-4 py-2 text-left text-sm text-cyan-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export Markdown
                  </button>
                </div>
              )}
            </div>
            {/* Print Dropdown */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={filteredExpenses.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm transition-colors"
                title="Print (P)"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    disabled={filteredExpenses.length === 0}
                    className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Travel Report
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={fetchExpenses}
              className="ml-auto text-sm text-slate-400 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {searchQuery ? 'No expenses match your search.' : 'No travel expenses yet. Click "Add Expense" to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th 
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setSortBy('date')}
                    >
                      Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Person</th>
                    <th 
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setSortBy('category')}
                    >
                      Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Description</th>
                    <th 
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setSortBy('vendor')}
                    >
                      Vendor {sortBy === 'vendor' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setSortBy('amount')}
                    >
                      Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setSortBy('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExpenses.map((expense) => {
                    const cat = CATEGORIES.find(c => c.key === expense.category)
                    const match = expense.description.match(/^([^:]+):\s*(.*)$/)
                    const personName = match ? match[1] : ''
                    const description = match ? match[2] : expense.description
                    return (
                      <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{personName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {cat && <cat.icon className="w-4 h-4" style={{ color: cat.color }} />}
                            <span className="text-sm text-slate-300">{expense.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">{description}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{expense.vendor || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium text-right whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                            style={{
                              backgroundColor: `${STATUS_COLORS[expense.status]}20`,
                              color: STATUS_COLORS[expense.status],
                            }}
                          >
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {/* Conflicts View */}
        {viewMode === 'conflicts' && (
          <div className="space-y-6">
            {/* Budget Limit Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Budget Limit</h3>
                  <p className="text-sm text-slate-400">Set threshold for budget alerts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Conflict Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Issues</p>
                <p className="text-3xl font-bold mt-1">{conflictStats.total}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400 uppercase tracking-wider">High Priority</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{conflictStats.high}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs text-amber-400 uppercase tracking-wider">Medium</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{conflictStats.medium}</p>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Low</p>
                <p className="text-3xl font-bold text-slate-400 mt-1">{conflictStats.low}</p>
              </div>
            </div>

            {/* Conflicts List */}
            {travelConflicts.length > 0 ? (
              <div className="space-y-3">
                {travelConflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={`bg-slate-900 border rounded-xl p-4 ${
                      conflict.severity === 'high'
                        ? 'border-red-500/30'
                        : conflict.severity === 'medium'
                        ? 'border-amber-500/30'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        conflict.severity === 'high'
                          ? 'bg-red-500/20'
                          : conflict.severity === 'medium'
                          ? 'bg-amber-500/20'
                          : 'bg-slate-500/20'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          conflict.severity === 'high'
                            ? 'text-red-400'
                            : conflict.severity === 'medium'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{conflict.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            conflict.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : conflict.severity === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {conflict.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 capitalize">
                            {conflict.type.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{conflict.description}</p>
                        <p className="text-sm text-emerald-400">
                          <span className="text-slate-500">Recommendation: </span>
                          {conflict.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <div className="p-4 rounded-full bg-emerald-500/20 w-fit mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                <p className="text-slate-400">No travel conflicts detected. Your expenses are in good shape.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Expense' : 'Add Travel Expense'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Person Name</label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    placeholder="e.g., R. Madhavan"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Flight to Chennai for shoot"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Vendor</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="e.g., Indigo, OYO"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="reimbursed">Reimbursed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Refresh data</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Focus search</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">F</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Clear all filters (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">X</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Add new expense</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">N</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Export menu</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">E</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Export Markdown</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">M</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Print report</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-indigo-400">P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Switch to List view</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Switch to Analytics view</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Switch to Conflicts view</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Filter by category (1-9, when filters closed)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-indigo-400">1-9</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Clear category filter</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-indigo-400">0</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Filter to All Status (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Filter to Pending (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Filter to Approved (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Filter to Rejected (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">4</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Filter to Reimbursed (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">5</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-cyan-400">Clear status filter (when filters open)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">0</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
