/**
 * Task Manager Component
 * CinePilot Phase 28
 */

'use client'

import { useState, useEffect } from 'react'
import { Task, getTasks, createTask, updateTask, deleteTask } from '../lib/api-phase28'

interface TaskManagerProps {
  projectId: number
}

export default function TaskManager({ projectId }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const, assignee: '' })

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      const data = await getTasks(projectId)
      setTasks(data)
    } catch (e) {
      setTasks([])
    }
  }

  const handleCreate = async () => {
    if (!newTask.title.trim()) return
    try {
      await createTask(projectId, newTask)
      setNewTask({ title: '', description: '', priority: 'medium', assignee: '' })
      setShowForm(false)
      loadTasks()
    } catch (e) {
      console.error('Failed to create task')
    }
  }

  const handleToggle = async (task: Task) => {
    try {
      await updateTask(projectId, task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed'
      })
      loadTasks()
    } catch (e) {
      console.error('Failed to update task')
    }
  }

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(projectId, taskId)
      loadTasks()
    } catch (e) {
      console.error('Failed to delete task')
    }
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📋 Task Manager</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <textarea
            placeholder="Description (optional)..."
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <div className="flex gap-2">
            <select
              value={newTask.priority}
              onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
              className="px-3 py-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="text"
              placeholder="Assignee..."
              value={newTask.assignee}
              onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-gray-500 text-center py-4">No tasks yet. Create one to get started!</p>
        )}
        
        {pendingTasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={() => handleToggle(task)}
              className="mt-1 w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="font-medium">{task.title}</span>
              </div>
              {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
              {task.assignee && <p className="text-xs text-gray-500 mt-1">👤 {task.assignee}</p>}
            </div>
            <button
              onClick={() => handleDelete(task.id)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">✓ Completed ({completedTasks.length})</h4>
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded opacity-60">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => handleToggle(task)}
                  className="w-4 h-4"
                />
                <span className="line-through text-gray-500">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="ml-auto text-red-400 hover:text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
