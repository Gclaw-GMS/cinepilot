'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (dateRange.start) params.set('startDate', dateRange.start)
      if (dateRange.end) params.set('endDate', dateRange.end)
      
      const res = await fetch(`/api/travel?${params}`)
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

  // CSV Export function
  const exportToCSV = () => {
    const headers = ['Date', 'Person', 'Category', 'Description', 'Vendor', 'Amount', 'Status']
    const rows = expenses.map(exp => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                Travel Expenses
              </h1>
              {isDemoMode && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Demo Data
                </span>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
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
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
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
            <button
              onClick={exportToCSV}
              disabled={expenses.length === 0}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
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
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No travel expenses yet. Click "Add Expense" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Person</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Vendor</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((expense) => {
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
    </div>
  )
}
