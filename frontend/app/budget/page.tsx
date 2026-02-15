'use client'

import { useState } from 'react'

interface Expense {
  id: number
  category: string
  item: string
  estimated: number
  actual: number
  date: string
  notes?: string
}

const DEMO_EXPENSES: Expense[] = [
  { id: 1, category: 'Pre-production', item: 'Script Writing', estimated: 150000, actual: 125000, date: '2026-01-15' },
  { id: 2, category: 'Pre-production', item: 'Location Scouting', estimated: 75000, actual: 80000, date: '2026-01-20' },
  { id: 3, category: 'Production', item: 'Camera Equipment', estimated: 500000, actual: 480000, date: '2026-02-01' },
  { id: 4, category: 'Production', item: 'Lighting Gear', estimated: 250000, actual: 260000, date: '2026-02-01' },
  { id: 5, category: 'Production', item: 'Crew Wages', estimated: 1000000, actual: 850000, date: '2026-02-10' },
  { id: 6, category: 'Post-production', item: 'Editing', estimated: 300000, actual: 0, date: '' },
  { id: 7, category: 'Post-production', item: 'VFX', estimated: 400000, actual: 0, date: '' },
  { id: 8, category: 'Contingency', item: 'Emergency Fund', estimated: 250000, actual: 50000, date: '2026-02-05' },
]

const CATEGORIES = ['Pre-production', 'Production', 'Post-production', 'Contingency']

export default function BudgetPage() {
  const [expenses, setExpenses] = useState(DEMO_EXPENSES)
  const [showAdd, setShowAdd] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'Production', item: '', estimated: 0, actual: 0 })

  const totalEstimated = expenses.reduce((a, e) => a + e.estimated, 0)
  const totalActual = expenses.reduce((a, e) => a + e.actual, 0)
  const totalRemaining = totalEstimated - totalActual

  const byCategory = CATEGORIES.map(cat => ({
    name: cat,
    estimated: expenses.filter(e => e.category === cat).reduce((a, e) => a + e.estimated, 0),
    actual: expenses.filter(e => e.category === cat).reduce((a, e) => a + e.actual, 0),
  }))

  const addExpense = () => {
    if (!newExpense.item) return
    setExpenses([...expenses, { ...newExpense, id: Date.now(), date: new Date().toISOString().split('T')[0] }])
    setNewExpense({ category: 'Production', item: '', estimated: 0, actual: 0 })
    setShowAdd(false)
  }

  const progressPercent = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">💰 Budget</h1>
          <p className="text-gray-500 mt-1">Track and manage production expenses</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-medium"
        >
          + Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Total Budget</div>
          <div className="text-2xl font-bold text-white">₹{totalEstimated.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Spent</div>
          <div className="text-2xl font-bold text-red-400">₹{totalActual.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Remaining</div>
          <div className="text-2xl font-bold text-green-400">₹{totalRemaining.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Utilization</div>
          <div className="text-2xl font-bold text-amber-400">{progressPercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 p-4 rounded mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Budget Utilization</span>
          <span>₹{totalActual.toLocaleString()} / ₹{totalEstimated.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="col-span-1">
          <h3 className="font-bold mb-3">By Category</h3>
          <div className="space-y-3">
            {byCategory.map(cat => (
              <div key={cat.name} className="bg-slate-800 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-cyan-400">₹{cat.actual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400">Est: ₹{cat.estimated.toLocaleString()}</div>
                <div className="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500"
                    style={{ width: `${cat.estimated > 0 ? (cat.actual / cat.estimated) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense List */}
        <div className="col-span-2">
          <h3 className="font-bold mb-3">All Expenses</h3>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-gray-400">
                <tr>
                  <th className="text-left p-3">Item</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Estimated</th>
                  <th className="text-right p-3">Actual</th>
                  <th className="text-right p-3">Variance</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => {
                  const variance = expense.estimated - expense.actual
                  return (
                    <tr key={expense.id} className="border-t border-slate-700 hover:bg-slate-750">
                      <td className="p-3">
                        <div className="font-medium">{expense.item}</div>
                        <div className="text-xs text-gray-500">{expense.date}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          expense.category === 'Production' ? 'bg-blue-600/30 text-blue-300' :
                          expense.category === 'Pre-production' ? 'bg-purple-600/30 text-purple-300' :
                          expense.category === 'Post-production' ? 'bg-amber-600/30 text-amber-300' :
                          'bg-red-600/30 text-red-300'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-3 text-right">₹{expense.estimated.toLocaleString()}</td>
                      <td className="p-3 text-right">₹{expense.actual.toLocaleString()}</td>
                      <td className={`p-3 text-right ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {variance >= 0 ? '↓' : '↑'} ₹{Math.abs(variance).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                >
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Item</label>
                <input
                  type="text"
                  value={newExpense.item}
                  onChange={(e) => setNewExpense({ ...newExpense, item: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  placeholder="Expense description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Estimated (₹)</label>
                  <input
                    type="number"
                    value={newExpense.estimated || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, estimated: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Actual (₹)</label>
                  <input
                    type="number"
                    value={newExpense.actual || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, actual: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-700 py-2 rounded">Cancel</button>
              <button onClick={addExpense} className="flex-1 bg-cyan-500 py-2 rounded text-black font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
