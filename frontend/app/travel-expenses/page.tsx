'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plane, Train, Bus, Car, Building, Wallet, Plus, Edit2, Trash2,
  DollarSign, Calendar, MapPin, Search, X, HelpCircle,
  Clock, CreditCard, Receipt, Filter, BarChart3, PieChart as PieChartIcon,
  Loader2
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

export default function TravelExpensesPage() {
  const [expenses, setExpenses] = useState<TravelExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('dashboard')
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    const matchesSearch = !searchQuery || e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesStatus && matchesSearch
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newExpense: TravelExpense = {
      id: editingExpense?.id || Date.now().toString(),
      projectId: DEMO_PROJECT_ID,
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
    if (editingExpense) {
      setExpenses(expenses.map(e => e.id === editingExpense.id ? newExpense : e))
    } else {
      setExpenses([newExpense, ...expenses])
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

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id))
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (showForm) resetForm() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); searchInputRef.current?.focus() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setShowForm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm])

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
                <p className="text-slate-400 text-sm">Track cast & crew travel costs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'dashboard' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}><BarChart3 className="w-4 h-4 inline mr-1" />Dashboard</button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}><Receipt className="w-4 h-4 inline mr-1" />List</button>
              </div>
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

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input ref={searchInputRef} type="text" placeholder="Search... (Ctrl+F)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

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
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Description</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Person</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Amount</th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
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
        )}
      </div>

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
