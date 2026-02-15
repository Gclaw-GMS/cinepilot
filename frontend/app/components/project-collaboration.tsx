/**
 * CinePilot - Project Collaboration Hub
 * Activity Feed, Tasks, and Expense Tracking
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collaborationNew } from '../lib/api'

interface Activity {
  id: number
  type: string
  user: string
  description: string
  timestamp: string
}

interface Task {
  id: number
  title: string
  status: string
  assignee: string
  due_date: string
}

interface Expense {
  id: number
  category: string
  item: string
  estimated: number
  actual: number
  date: string
}

export default function ProjectCollaboration({ projectId }: { projectId: number }) {
  const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'expenses'>('activity')
  const [activity, setActivity] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [activityData, tasksData, expensesData] = await Promise.all([
        collaborationNew.getActivity(projectId),
        collaborationNew.getTasks(projectId),
        collaborationNew.getExpenses(projectId)
      ])
      setActivity(activityData.activities || [])
      setTasks(tasksData.tasks || [])
      setExpenses(expensesData.expenses || [])
    } catch (e) {
      console.error('Failed to load collaboration data:', e)
    }
    setLoading(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim() || !projectId) return
    try {
      const result = await collaborationNew.createTask(projectId, newTaskTitle, 'Unassigned', '2026-03-01')
      if (result.task) {
        setTasks([...tasks, result.task])
        setNewTaskTitle('')
      }
    } catch (e) {
      console.error('Failed to create task:', e)
    }
  }

  const tabs = [
    { id: 'activity', label: '📋 Activity', icon: '📋' },
    { id: 'tasks', label: '✅ Tasks', icon: '✅' },
    { id: 'expenses', label: '💰 Expenses', icon: '💰' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scene_added': return '🎬'
      case 'budget_updated': return '💵'
      case 'crew_added': return '👥'
      case 'location_added': return '📍'
      case 'script_uploaded': return '📝'
      default: return '📌'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  const totalEstimated = expenses.reduce((sum, e) => sum + e.estimated, 0)
  const totalActual = expenses.reduce((sum, e) => sum + e.actual, 0)

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Loading collaboration data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-purple-400">{activity.length}</div>
          <div className="text-gray-400 text-sm">Recent Activities</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-yellow-400">{tasks.filter(t => t.status !== 'completed').length}</div>
          <div className="text-gray-400 text-sm">Pending Tasks</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{formatCurrency(totalActual)}</div>
          <div className="text-gray-400 text-sm">Spent</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-4 font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {activity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-2xl">{getActivityIcon(item.type)}</span>
                      <div className="flex-1">
                        <p className="text-white">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-purple-400 text-sm">{item.user}</span>
                          <span className="text-gray-600 text-xs">•</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Add Task */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  />
                  <button
                    onClick={addTask}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tasks yet</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={async () => {
                              // Toggle task status
                              const newStatus = task.status === 'completed' ? 'pending' : 'completed'
                              setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
                            }}
                            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                          />
                          <span className={`text-white ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs border ${getTaskStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className="text-gray-500 text-sm">{task.assignee}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Estimated</div>
                    <div className="text-xl font-bold text-white">{formatCurrency(totalEstimated)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Actual</div>
                    <div className="text-xl font-bold text-green-400">{formatCurrency(totalActual)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Remaining</div>
                    <div className="text-xl font-bold text-yellow-400">{formatCurrency(totalEstimated - totalActual)}</div>
                  </div>
                </div>

                {/* Expense List */}
                <div className="space-y-2">
                  {expenses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No expenses recorded</p>
                  ) : (
                    expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{expense.item}</p>
                          <p className="text-gray-500 text-sm">{expense.category} • {expense.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{formatCurrency(expense.actual)}</p>
                          <p className="text-gray-500 text-sm">Est: {formatCurrency(expense.estimated)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
