/**
 * CinePilot Phase 28 API - Tasks, Notes, Activity
 * Provides typed API functions for task management, project notes, and activity tracking
 */

const DEFAULT_PROJECT_ID = 'default-project';

// ============================================================================
// TYPES
// ============================================================================

export interface Task {
  id: string | number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt?: string
}

export interface ProjectNote {
  id: string | number
  content: string
  category: 'todo' | 'decision' | 'idea' | 'feedback' | 'general'
  author?: string
  isPinned?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Activity {
  id: string | number
  type: string
  message: string
  user?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface NewTaskData {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: string
}

export interface NewNoteData {
  content: string
  category?: 'todo' | 'decision' | 'idea' | 'feedback' | 'general'
  author?: string
  isPinned?: boolean
}

// ============================================================================
// TASK API
// ============================================================================

export async function getTasks(projectId: string | number = DEFAULT_PROJECT_ID): Promise<Task[]> {
  try {
    const res = await fetch(`/api/tasks?projectId=${projectId}`)
    if (!res.ok) throw new Error('Failed to fetch tasks')
    const data = await res.json()
    // Handle both { data: [...] } and [...] response formats
    return data.data || data.tasks || data || []
  } catch (error) {
    console.error('getTasks error:', error)
    return []
  }
}

export async function createTask(
  projectId: string | number, 
  task: NewTaskData
): Promise<Task | null> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, projectId }),
    })
    if (!res.ok) throw new Error('Failed to create task')
    return await res.json()
  } catch (error) {
    console.error('createTask error:', error)
    return null
  }
}

export async function updateTask(
  taskId: string | number, 
  updates: Partial<Task>
): Promise<Task | null> {
  try {
    const res = await fetch(`/api/tasks?id=${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update task')
    return await res.json()
  } catch (error) {
    console.error('updateTask error:', error)
    return null
  }
}

export async function deleteTask(taskId: string | number): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks?id=${taskId}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (error) {
    console.error('deleteTask error:', error)
    return false
  }
}

// ============================================================================
// NOTES API
// ============================================================================

export async function getNotes(projectId: string | number = DEFAULT_PROJECT_ID): Promise<ProjectNote[]> {
  try {
    const res = await fetch(`/api/notes?projectId=${projectId}`)
    if (!res.ok) throw new Error('Failed to fetch notes')
    const data = await res.json()
    // Handle both array and { notes: [...] } response formats
    return Array.isArray(data) ? data : data.notes || []
  } catch (error) {
    console.error('getNotes error:', error)
    return []
  }
}

export async function createNote(
  projectId: string | number, 
  note: NewNoteData
): Promise<ProjectNote | null> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...note, projectId }),
    })
    if (!res.ok) throw new Error('Failed to create note')
    return await res.json()
  } catch (error) {
    console.error('createNote error:', error)
    return null
  }
}

export async function updateNote(
  noteId: string | number, 
  updates: Partial<ProjectNote>
): Promise<ProjectNote | null> {
  try {
    const res = await fetch(`/api/notes?id=${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update note')
    return await res.json()
  } catch (error) {
    console.error('updateNote error:', error)
    return null
  }
}

export async function deleteNote(noteId: string | number): Promise<boolean> {
  try {
    const res = await fetch(`/api/notes?id=${noteId}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (error) {
    console.error('deleteNote error:', error)
    return false
  }
}

// ============================================================================
// ACTIVITY API
// ============================================================================

export async function getActivity(
  projectId: string | number = DEFAULT_PROJECT_ID,
  limit: number = 50
): Promise<Activity[]> {
  try {
    const res = await fetch(`/api/activity?projectId=${projectId}&limit=${limit}`)
    if (!res.ok) throw new Error('Failed to fetch activity')
    const data = await res.json()
    // Handle both { activities: [...] } and [...] response formats
    return Array.isArray(data) ? data : data.activities || []
  } catch (error) {
    console.error('getActivity error:', error)
    return []
  }
}

export async function logActivity(
  projectId: string | number,
  activity: {
    type: string
    message: string
    user?: string
    metadata?: Record<string, unknown>
  }
): Promise<Activity | null> {
  try {
    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...activity, projectId }),
    })
    if (!res.ok) throw new Error('Failed to log activity')
    return await res.json()
  } catch (error) {
    console.error('logActivity error:', error)
    return null
  }
}
