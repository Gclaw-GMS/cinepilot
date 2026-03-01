'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Utensils, Plus, Edit2, Trash2, DollarSign, Users, Calendar, ChefHat,
  Phone, Mail, Star, Coffee, UtensilsCrossed, Leaf, AlertCircle, X,
  TrendingUp
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: '#f59e0b' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: '#10b981' },
  { key: 'snacks', label: 'Snacks', icon: Leaf, color: '#8b5cf6' },
  { key: 'dinner', label: 'Dinner', icon: UtensilsCrossed, color: '#3b82f6' },
]

const DIETARY_OPTIONS = [
  'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Egg', 'No Onion/Garlic',
  'Diabetic', 'Low Salt', 'Jain', 'Halal', 'Kosher'
]

const DEMO_PROJECT_ID = 'demo-project'

interface Meal {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  menu: string[]
  dietary: string[]
  budget: number
  actualCost?: number
  notes?: string
}

interface ShootDayMeal {
  date: string
  meals: Meal[]
  totalCrew: number
  totalCast: number
}

interface Caterer {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  specialty: string
  rating: number
}

interface CateringPlan {
  id: string
  projectId: string
  shootDays: ShootDayMeal[]
  catererId?: string
  dietaryRestrictions: Record<string, number>
  totalBudget: number
  totalSpent: number
}

export default function CateringPage() {
  const [plan, setPlan] = useState<CateringPlan | null>(null)
  const [caterers, setCaterers] = useState<Caterer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDayForm, setShowDayForm] = useState(false)
  const [showMealForm, setShowMealForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  
  const [dayFormData, setDayFormData] = useState({
    date: '', totalCrew: 50, totalCast: 10
  })

  const [mealFormData, setMealFormData] = useState({
    type: 'breakfast' as Meal['type'], menu: '', dietary: [] as string[],
    budget: '', actualCost: '', notes: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/catering?projectId=${DEMO_PROJECT_ID}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Check if API returned demo data
      setIsDemoMode(data.isDemoMode === true)
      setPlan(data.plan)
      setCaterers(data.caterers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddShootDay = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: DEMO_PROJECT_ID, type: 'addShootDay', data: dayFormData })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShowDayForm(false)
      setDayFormData({ date: '', totalCrew: 50, totalCast: 10 })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shoot day')
    }
  }

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return
    try {
      const res = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: DEMO_PROJECT_ID, type: 'addMeal',
          data: {
            date: selectedDate, type: mealFormData.type,
            menu: mealFormData.menu.split(',').map(m => m.trim()).filter(Boolean),
            dietary: mealFormData.dietary,
            budget: parseFloat(mealFormData.budget) || 0,
            actualCost: mealFormData.actualCost ? parseFloat(mealFormData.actualCost) : undefined,
            notes: mealFormData.notes || undefined
          }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShowMealForm(false)
      setMealFormData({ type: 'breakfast', menu: '', dietary: [], budget: '', actualCost: '', notes: '' })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal')
    }
  }

  const handleUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeal) return
    try {
      const res = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: DEMO_PROJECT_ID, type: 'updateMeal',
          data: {
            mealId: editingMeal.id,
            updates: {
              type: mealFormData.type,
              menu: mealFormData.menu.split(',').map(m => m.trim()).filter(Boolean),
              dietary: mealFormData.dietary,
              budget: parseFloat(mealFormData.budget) || 0,
              actualCost: mealFormData.actualCost ? parseFloat(mealFormData.actualCost) : undefined,
              notes: mealFormData.notes || undefined
            }
          }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditingMeal(null)
      setShowMealForm(false)
      setMealFormData({ type: 'breakfast', menu: '', dietary: [], budget: '', actualCost: '', notes: '' })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal')
    }
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Delete this meal?')) return
    try {
      await fetch(`/api/catering?id=${mealId}&projectId=${DEMO_PROJECT_ID}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const openMealForm = (date: string, meal?: Meal) => {
    setSelectedDate(date)
    if (meal) {
      setEditingMeal(meal)
      setMealFormData({
        type: meal.type, menu: meal.menu.join(', '), dietary: meal.dietary,
        budget: meal.budget.toString(), actualCost: meal.actualCost?.toString() || '', notes: meal.notes || ''
      })
    } else {
      setEditingMeal(null)
      setMealFormData({ type: 'breakfast', menu: '', dietary: [], budget: '', actualCost: '', notes: '' })
    }
    setShowMealForm(true)
  }

  const selectedCaterer = plan?.catererId ? caterers.find(c => c.id === plan.catererId) : null
  const getMealTotal = (meals: Meal[]) => meals.reduce((sum, m) => sum + (m.actualCost || m.budget), 0)
  const getTotalBudget = () => plan ? plan.shootDays.reduce((sum, sd) => sum + getMealTotal(sd.meals), 0) : 0

  const dietaryData = plan ? Object.entries(plan.dietaryRestrictions).map(([name, value]) => ({
    name, value,
    color: name.includes('Vegetarian') ? '#10b981' : name.includes('Non') ? '#ef4444' : '#8b5cf6'
  })) : []

  const mealTypeData = plan ? MEAL_TYPES.map(mt => {
    const total = plan.shootDays.reduce((sum, sd) =>
      sum + sd.meals.filter(m => m.type === mt.key).reduce((s, m) => s + (m.actualCost || m.budget), 0), 0)
    return { name: mt.label, value: total, color: mt.color }
  }) : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                Catering Management
                {isDemoMode && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                    Demo
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Meal planning & budget tracking</p>
            </div>
            <button onClick={() => setShowDayForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Shoot Day
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {error && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : !plan ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Catering Plan Yet</h3>
            <p className="text-slate-400 mb-6">Start planning meals for your production</p>
            <button onClick={() => setShowDayForm(true)}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium">
              <Plus className="w-4 h-4" /> Create Catering Plan
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20"><DollarSign className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-sm text-slate-400">Total Budget</span>
                </div>
                <p className="text-2xl font-semibold text-white">₹{plan.totalBudget.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-1">Planned: ₹{getTotalBudget().toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
                  <span className="text-sm text-slate-400">Total Spent</span>
                </div>
                <p className="text-2xl font-semibold text-white">₹{plan.totalSpent.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-1">{plan.totalBudget > 0 ? Math.round((plan.totalSpent / plan.totalBudget) * 100) : 0}% used</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20"><Calendar className="w-4 h-4 text-blue-400" /></div>
                  <span className="text-sm text-slate-400">Shoot Days</span>
                </div>
                <p className="text-2xl font-semibold text-white">{plan.shootDays.length}</p>
                <p className="text-xs text-slate-500 mt-1">{plan.shootDays.reduce((sum, sd) => sum + sd.meals.length, 0)} meals planned</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20"><Users className="w-4 h-4 text-purple-400" /></div>
                  <span className="text-sm text-slate-400">Total People</span>
                </div>
                <p className="text-2xl font-semibold text-white">{plan.shootDays.length > 0 ? plan.shootDays[0].totalCast + plan.shootDays[0].totalCrew : 0}</p>
                <p className="text-xs text-slate-500 mt-1">Cast + Crew per day</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400" /> Dietary Restrictions</h3>
                {dietaryData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dietaryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}
                          dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {dietaryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          formatter={(value: number) => `${value} people`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No dietary data yet</div>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UtensilsCrossed className="w-5 h-5 text-amber-400" /> Budget by Meal Type</h3>
                {mealTypeData.some(d => d.value > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mealTypeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {mealTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No meal data yet</div>
                )}
              </div>
            </div>

            {/* Caterer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-400" /> Caterer</h3>
              {selectedCaterer ? (
                <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-semibold text-white text-lg">{selectedCaterer.name}</h4>
                    <p className="text-sm text-slate-400">{selectedCaterer.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(selectedCaterer.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">{selectedCaterer.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" />{selectedCaterer.contactPerson}</div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{selectedCaterer.phone}</div>
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{selectedCaterer.email}</div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No caterer selected</p>
              )}
            </div>

            {/* Meal Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Meal Schedule</h3>
              {plan.shootDays.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-500">No shoot days added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plan.shootDays.map((shootDay) => (
                    <div key={shootDay.date} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-500/20 rounded-lg"><Calendar className="w-5 h-5 text-blue-400" /></div>
                          <div>
                            <h4 className="font-semibold text-white">{new Date(shootDay.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                            <p className="text-sm text-slate-400">{shootDay.totalCast} Cast + {shootDay.totalCrew} Crew = {shootDay.totalCast + shootDay.totalCrew} people</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-400">Day Total</p>
                            <p className="font-semibold text-white">₹{getMealTotal(shootDay.meals).toLocaleString('en-IN')}</p>
                          </div>
                          <button onClick={() => openMealForm(shootDay.date)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-sm">
                            <Plus className="w-4 h-4" /> Add Meal
                          </button>
                        </div>
                      </div>
                      {shootDay.meals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                          {shootDay.meals.map((meal) => {
                            const mealType = MEAL_TYPES.find(mt => mt.key === meal.type)
                            const isOverBudget = meal.actualCost && meal.actualCost > meal.budget
                            return (
                              <div key={meal.id} className={`bg-slate-800/50 rounded-xl p-4 border ${isOverBudget ? 'border-red-500/30' : 'border-slate-700/50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {mealType && <mealType.icon className="w-4 h-4" style={{ color: mealType.color }} />}
                                    <span className="font-medium text-white capitalize">{meal.type}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openMealForm(shootDay.date, meal)} className="p-1 text-slate-500 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteMeal(meal.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Menu</p>
                                    <p className="text-sm text-slate-300 line-clamp-2">{meal.menu.join(', ')}</p>
                                  </div>
                                  {meal.dietary.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {meal.dietary.map((d) => <span key={d} className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">{d}</span>)}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                    <div><p className="text-[10px] text-slate-500">Budget</p><p className="text-sm text-slate-300">₹{meal.budget.toLocaleString('en-IN')}</p></div>
                                    {meal.actualCost && (
                                      <div className="text-right">
                                        <p className="text-[10px] text-slate-500">Actual</p>
                                        <p className={`text-sm ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>₹{meal.actualCost.toLocaleString('en-IN')}</p>
                                      </div>
                                    )}
                                  </div>
                                  {meal.notes && <p className="text-xs text-slate-500 italic">{meal.notes}</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No meals planned for this day</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Shoot Day Modal */}
      {showDayForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Shoot Day</h3>
              <button onClick={() => setShowDayForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddShootDay} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <input type="date" value={dayFormData.date} onChange={(e) => setDayFormData({ ...dayFormData, date: e.target.value })} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Cast</label>
                  <input type="number" value={dayFormData.totalCast} onChange={(e) => setDayFormData({ ...dayFormData, totalCast: parseInt(e.target.value) || 0 })} min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Crew</label>
                  <input type="number" value={dayFormData.totalCrew} onChange={(e) => setDayFormData({ ...dayFormData, totalCrew: parseInt(e.target.value) || 0 })} min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDayForm(false)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">Add Day</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Meal Modal */}
      {showMealForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900">
              <h3 className="text-lg font-semibold">{editingMeal ? 'Edit Meal' : 'Add Meal'}</h3>
              <button onClick={() => { setShowMealForm(false); setEditingMeal(null) }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={editingMeal ? handleUpdateMeal : handleAddMeal} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Meal Type</label>
                <select value={mealFormData.type} onChange={(e) => setMealFormData({ ...mealFormData, type: e.target.value as Meal['type'] })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {MEAL_TYPES.map((mt) => <option key={mt.key} value={mt.key}>{mt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Menu Items</label>
                <textarea value={mealFormData.menu} onChange={(e) => setMealFormData({ ...mealFormData, menu: e.target.value })}
                  placeholder="Idli, Sambar, Vada, Coffee (comma separated)" rows={3} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Dietary Options</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => {
                      const dietary = mealFormData.dietary.includes(opt) ? mealFormData.dietary.filter(d => d !== opt) : [...mealFormData.dietary, opt]
                      setMealFormData({ ...mealFormData, dietary })
                    }} className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      mealFormData.dietary.includes(opt) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}>{opt}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Budget (₹)</label>
                  <input type="number" value={mealFormData.budget} onChange={(e) => setMealFormData({ ...mealFormData, budget: e.target.value })} placeholder="0" min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Actual Cost (₹)</label>
                  <input type="number" value={mealFormData.actualCost} onChange={(e) => setMealFormData({ ...mealFormData, actualCost: e.target.value })} placeholder="Optional" min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea value={mealFormData.notes} onChange={(e) => setMealFormData({ ...mealFormData, notes: e.target.value })} placeholder="Special instructions..." rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowMealForm(false); setEditingMeal(null) }} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">{editingMeal ? 'Save Changes' : 'Add Meal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
