/**
 * CinePilot Phase 28 API Client
 * Team Tasks, Activity Timeline, Notes & Budget Categories
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============== TASKS ==============
export interface Task {
  id: number
  project_id: number
  title: string
  description?: string
  assignee?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  created_at: string
  completed_at?: string
}

// ============== PROJECT NOTES ==============
export interface ProjectNote {
  id: number
  project_id: number
  content: string
  author: string
  category: 'general' | 'idea' | 'feedback' | 'decision' | 'todo'
  created_at: string
}

// ============== BUDGET CATEGORY ==============
export interface BudgetCategory {
  id: number
  project_id: number
  name: string
  allocated: number
  spent: number
  color: string
}

// ============== ACTIVITY ==============
export interface Activity {
  id: number
  project_id: number
  type: 'scene' | 'budget' | 'crew' | 'schedule' | 'task' | 'note'
  action: string
  details: string
  user: string
  created_at: string
}

// ============== API FUNCTIONS ==============

// Tasks
export async function getTasks(projectId: number): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`)
  return res.json()
}

export async function createTask(projectId: number, task: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })
  return res.json()
}

export async function updateTask(projectId: number, taskId: number, task: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })
  return res.json()
}

export async function deleteTask(projectId: number, taskId: number): Promise<void> {
  await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' })
}

// Project Notes
export async function getNotes(projectId: number): Promise<ProjectNote[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/notes`)
  return res.json()
}

export async function createNote(projectId: number, note: Partial<ProjectNote>): Promise<ProjectNote> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  })
  return res.json()
}

export async function deleteNote(projectId: number, noteId: number): Promise<void> {
  await fetch(`${API_BASE}/api/projects/${projectId}/notes/${noteId}`, { method: 'DELETE' })
}

// Budget Categories
export async function getBudgetCategories(projectId: number): Promise<BudgetCategory[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/categories`)
  return res.json()
}

export async function createBudgetCategory(projectId: number, category: Partial<BudgetCategory>): Promise<BudgetCategory> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })
  return res.json()
}

export async function updateBudgetCategory(projectId: number, categoryId: number, category: Partial<BudgetCategory>): Promise<BudgetCategory> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })
  return res.json()
}

// Activity Timeline
export async function getActivity(projectId: number, limit = 20): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/activity?limit=${limit}`)
  return res.json()
}

// Phase 28: Batch Operations
export async function batchUpdateTasks(projectId: number, taskIds: number[], action: 'complete' | 'delete'): Promise<void> {
  await fetch(`${API_BASE}/api/projects/${projectId}/tasks/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds, action })
  })
}

export async function exportProjectData(projectId: number, format: 'json' | 'csv'): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/export?format=${format}`)
  return res.blob()
}
