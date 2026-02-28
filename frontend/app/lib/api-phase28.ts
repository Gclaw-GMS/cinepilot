/**
 * Phase 28 API - Notes, Tasks, and Activity
 * CinePilot Production Notes System
 */

const API_URL = '/api/notes';

export interface ProjectNote {
  id: number;
  projectId: string;
  content: string;
  category: 'general' | 'idea' | 'feedback' | 'decision' | 'todo';
  author: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Activity {
  id: number;
  projectId: string;
  activityType: string;
  description: string;
  userEmail: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Task {
  id: number;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// Demo data for when API fails
const DEMO_NOTES: ProjectNote[] = [
  { id: 1, projectId: 'default-project', content: 'Remember to get location permits for Temple shoot', category: 'todo', author: 'Director', isPinned: true, createdAt: new Date().toISOString() },
  { id: 2, projectId: 'default-project', content: 'Vijay confirmed for lead role! 🎬', category: 'decision', author: 'Producer', isPinned: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, projectId: 'default-project', content: 'Consider adding a flashback sequence in second act', category: 'idea', author: 'Writer', isPinned: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, projectId: 'default-project', content: 'Night shoot at Marina Beach needs extra security', category: 'feedback', author: 'Line Producer', isPinned: false, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: 1, projectId: 'default-project', activityType: 'note_created', description: 'New todo note added', userEmail: 'director@cinepilot.ai', createdAt: new Date().toISOString() },
  { id: 2, projectId: 'default-project', activityType: 'script_uploaded', description: 'Script "Kaadhal Enbadhu" uploaded', userEmail: 'writer@cinepilot.ai', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, projectId: 'default-project', activityType: 'budget_updated', description: 'Budget increased by ₹50L', userEmail: 'producer@cinepilot.ai', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const DEMO_TASKS: Task[] = [
  { id: 1, projectId: 'default-project', title: 'Confirm venue for song shoot', description: 'Need to bookStudio B for the romantic song', status: 'in_progress', priority: 'high', assignee: 'Line Producer', dueDate: '2026-03-01', createdAt: new Date().toISOString() },
  { id: 2, projectId: 'default-project', title: 'Get insurance approval', description: 'Production insurance for outdoor shoots', status: 'pending', priority: 'medium', assignee: 'Producer', dueDate: '2026-03-05', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, projectId: 'default-project', title: 'Finalize cast travel dates', description: 'Coordinate flights for lead actors', status: 'completed', priority: 'high', assignee: 'Assistant Director', dueDate: '2026-02-28', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

/**
 * Get all notes for a project
 */
export async function getNotes(projectId?: string | number): Promise<ProjectNote[]> {
  try {
    const url = projectId ? `${API_URL}?projectId=${projectId}` : API_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return await res.json();
  } catch (error) {
    console.warn('getNotes: Using demo data', error);
    return DEMO_NOTES;
  }
}

/**
 * Create a new note
 */
export async function createNote(
  projectId: string | number,
  data: { content: string; category?: string; author?: string; isPinned?: boolean }
): Promise<ProjectNote> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, projectId }),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return await res.json();
  } catch (error) {
    console.warn('createNote: Using demo fallback', error);
    const newNote: ProjectNote = {
      id: Date.now(),
      projectId: String(projectId),
      content: data.content,
      category: (data.category as any) || 'general',
      author: data.author || 'User',
      isPinned: data.isPinned || false,
      createdAt: new Date().toISOString(),
    };
    DEMO_NOTES.unshift(newNote);
    return newNote;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(projectId: string | number, noteId: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}?id=${noteId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return true;
  } catch (error) {
    console.warn('deleteNote: Using demo fallback', error);
    const index = DEMO_NOTES.findIndex(n => n.id === noteId);
    if (index >= 0) {
      DEMO_NOTES.splice(index, 1);
      return true;
    }
    return false;
  }
}

/**
 * Get recent activity for a project
 */
export async function getActivity(projectId?: string | number): Promise<Activity[]> {
  try {
    const url = projectId ? `/api/activity?projectId=${projectId}` : '/api/activity';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch activity');
    return await res.json();
  } catch (error) {
    console.warn('getActivity: Using demo data', error);
    return DEMO_ACTIVITIES;
  }
}

/**
 * Get tasks for a project
 */
export async function getTasks(projectId?: string | number): Promise<Task[]> {
  try {
    const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return await res.json();
  } catch (error) {
    console.warn('getTasks: Using demo data', error);
    return DEMO_TASKS;
  }
}

/**
 * Create a new task
 */
export async function createTask(
  projectId: string | number,
  data: { title: string; description?: string; priority?: string; assignee?: string; dueDate?: string }
): Promise<Task> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, projectId }),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return await res.json();
  } catch (error) {
    console.warn('createTask: Using demo fallback', error);
    const newTask: Task = {
      id: Date.now(),
      projectId: String(projectId),
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: (data.priority as any) || 'medium',
      assignee: data.assignee,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
    };
    DEMO_TASKS.push(newTask);
    return newTask;
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: number,
  data: Partial<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; priority: 'low' | 'medium' | 'high'; assignee: string; dueDate: string }>
): Promise<Task> {
  try {
    const res = await fetch(`/api/tasks?id=${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return await res.json();
  } catch (error) {
    console.warn('updateTask: Using demo fallback', error);
    const taskIndex = DEMO_TASKS.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const updated = { 
        ...DEMO_TASKS[taskIndex], 
        ...data, 
        updatedAt: new Date().toISOString() 
      } as Task;
      DEMO_TASKS[taskIndex] = updated;
      return updated;
    }
    throw new Error('Task not found');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks?id=${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return true;
  } catch (error) {
    console.warn('deleteTask: Using demo fallback', error);
    const index = DEMO_TASKS.findIndex(t => t.id === taskId);
    if (index >= 0) {
      DEMO_TASKS.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Event bus for real-time updates
export const eventBus = {
  listeners: new Map<string, Function[]>(),
  
  emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  },
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    };
  },
  
  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  }
};

// Event types
export const Events = {
  NOTE_CREATED: 'note:created',
  NOTE_UPDATED: 'note:updated',
  NOTE_DELETED: 'note:deleted',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  ACTIVITY_LOGGED: 'activity:logged',
} as const;
