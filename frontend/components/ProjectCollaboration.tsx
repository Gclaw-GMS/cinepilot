// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { collaboration, type Activity, type ProjectTask, type ProjectExpenses } from '@/lib/api'

interface ProjectCollaborationProps {
  projectId: number
}

export default function ProjectCollaboration({ projectId }: ProjectCollaborationProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'expenses'>('activity')
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [expenses, setExpenses] = useState<ProjectExpenses | null>(null)
  const [loading, setLoading] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })

  useEffect(() => {
    loadData()
  }, [projectId, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'activity') {
        const data: any = await collaboration.getActivity(projectId)
        setActivities(data.activities)
      } else if (activeTab === 'expenses') {
        const data: any = await collaboration.getExpenses(projectId)
        setExpenses(data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const handleCreateTask = async () => {
    if (!newTask.title) return
    try {
      const result: any = await collaboration.createTask(projectId, newTask)
      setTasks([...tasks, result.task])
      setNewTask({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const tabs = [
    { id: 'activity', label: 'Activity', icon: '📋' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scene_completed': return '🎬'
      case 'budget_updated': return '💰'
      case 'location_added': return '📍'
      case 'crew_added': return '👥'
      case 'schedule_updated': return '📅'
      default: return '📝'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900 text-red-200'
      case 'medium': return 'bg-yellow-900 text-yellow-200'
      case 'low': return 'bg-green-900 text-green-200'
      default: return 'bg-gray-800 text-gray-300'
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <h3 className="text-xl font-bold mb-4">🤝 Project Collaboration</h3>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            activities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-800 p-3 rounded-lg">
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <p className="text-white">{activity.description}</p>
                  <div className="flex gap-2 text-sm text-gray-400 mt-1">
                    <span>👤 {activity.user}</span>
                    <span>•</span>
                    <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Add Task Form */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Add New Task</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Assigned to"
                value={newTask.assigned_to}
                onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={newTask.due_date}
                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button
              onClick={handleCreateTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              + Add Task
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No tasks yet. Create one above!</div>
            ) : (
              tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg">
                  <input type="checkbox" className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{task.title}</p>
                    <div className="flex gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.assigned_to && <span className="text-gray-400">→ {task.assigned_to}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Expenses */}
      {activeTab === 'expenses' && expenses && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xl font-bold text-red-400">₹{(expenses.totals.total_spent / 100000).toFixed(1)}L</div>
              <div className="text-xs text-gray-400">Total Spent</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xl font-bold text-green-400">₹{(expenses.totals.total_budget / 100000).toFixed(1)}L</div>
              <div className="text-xs text-gray-400">Total Budget</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-400">₹{(expenses.totals.remaining / 100000).toFixed(1)}L</div>
              <div className="text-xs text-gray-400">Remaining</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xl font-bold text-yellow-400">{expenses.totals.percent_used}%</div>
              <div className="text-xs text-gray-400">Used</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Budget Usage</span>
              <span>{expenses.totals.percent_used}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-red-500"
                style={{ width: `${expenses.totals.percent_used}%` }}
              />
            </div>
          </div>

          {/* Expense List */}
          <div className="space-y-2">
            {expenses.expenses.map((expense, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div>
                  <p className="text-white font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-400">{expense.category} • {expense.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">₹{expense.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
