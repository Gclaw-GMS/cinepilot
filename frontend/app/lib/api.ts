/**
 * CinePilot API Client
 * Connects frontend to backend API
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types
export interface Project {
  id: number
  name: string
  description?: string
  language: string
  status: string
  budget?: number
  created_at: string
}

export interface Scene {
  id: number
  scene_number: number
  heading?: string
  location?: string
  location_tamil?: string
  time_of_day?: string
  interior_exterior?: string
  description?: string
}

export interface Character {
  id: number
  name: string
  name_tamil?: string
  role: string
  age?: number
  description?: string
}

export interface Location {
  id: number
  name: string
  name_tamil?: string
  type: string
  address?: string
  estimated_cost: number
}

export interface Crew {
  id: number
  name: string
  department: string
  role: string
  daily_rate: number
}

export interface Equipment {
  id: number
  project_id: number
  name: string
  category: string
  quantity: number
  daily_rate: number
  vendor?: string
  status: string
  notes?: string
  created_at: string
}

export interface Milestone {
  id: number
  name: string
  date: string
  status: 'completed' | 'in_progress' | 'pending'
  tasks: number
}

export interface ScriptVersion {
  id: number
  version: string
  uploaded_at: string
  uploaded_by: string
  notes?: string
}

export interface CastMember {
  id: number
  name: string
  role: string
  availability: string[]
}

export interface Equipment {
  id: number
  name: string
  category: string
  daily_rate: number
  available: boolean
}

export interface BudgetItem {
  category: string
  amount: number
  description?: string
}

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}

// Projects API
export const projects = {
  list: () => fetchApi<Project[]>('/api/projects'),
  
  get: (id: number) => fetchApi<Project>(`/api/projects/${id}`),
  
  create: (data: { name: string; description?: string; language?: string; budget?: number }) =>
    fetchApi<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id: number, data: Partial<Project>) =>
    fetchApi<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (id: number) =>
    fetchApi<void>(`/api/projects/${id}`, { method: 'DELETE' }),
}

// Scenes API
export const scenes = {
  list: (projectId: number) => fetchApi<Scene[]>(`/api/projects/${projectId}/scenes`),
  
  get: (projectId: number, sceneId: number) =>
    fetchApi<Scene>(`/api/projects/${projectId}/scenes/${sceneId}`),
  
  create: (projectId: number, data: Partial<Scene>) =>
    fetchApi<Scene>(`/api/projects/${projectId}/scenes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (projectId: number, sceneId: number, data: Partial<Scene>) =>
    fetchApi<Scene>(`/api/projects/${projectId}/scenes/${sceneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (projectId: number, sceneId: number) =>
    fetchApi<void>(`/api/projects/${projectId}/scenes/${sceneId}`, { method: 'DELETE' }),
}

// Characters API
export const characters = {
  list: (projectId: number) =>
    fetchApi<Character[]>(`/api/projects/${projectId}/characters`),
  
  create: (projectId: number, data: Partial<Character>) =>
    fetchApi<Character>(`/api/projects/${projectId}/characters`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Locations API
export const locations = {
  list: (projectId: number) =>
    fetchApi<Location[]>(`/api/projects/${projectId}/locations`),
  
  create: (projectId: number, data: Partial<Location>) =>
    fetchApi<Location>(`/api/projects/${projectId}/locations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Crew API
export const crew = {
  list: (projectId: number) =>
    fetchApi<Crew[]>(`/api/projects/${projectId}/crew`),
  
  create: (projectId: number, data: Partial<Crew>) =>
    fetchApi<Crew>(`/api/projects/${projectId}/crew`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Production Timeline API
export const productionTimeline = {
  get: (projectId: number) =>
    fetchApi<{ milestones: Milestone[] }>(`/api/projects/${projectId}/timeline`),
}

// Progress API
export const progress = {
  get: (projectId: number) =>
    fetchApi<{ phases: any[]; tasks: any[] }>(`/api/projects/${projectId}/progress`),
}

// Cast Availability API
export const castAvailability = {
  get: (projectId: number) =>
    fetchApi<CastMember[]>(`/api/projects/${projectId}/cast-availability`),
}

// Equipment API
export const equipment = {
  list: (projectId?: number) =>
    fetchApi<Equipment[]>(projectId ? `/api/equipment?project_id=${projectId}` : '/api/equipment'),
  create: async (equipment: Partial<Equipment>) => {
    return fetchApi<Equipment>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(equipment),
    })
  },
  update: async (id: number, data: Partial<Equipment>) => {
    return fetchApi<Equipment>(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id: number) => {
    return fetchApi<{ status: string }>(`/api/equipment/${id}`, {
      method: 'DELETE',
    })
  },
}

// Script Versions API
export const scriptVersions = {
  list: (projectId: number) =>
    fetchApi<ScriptVersion[]>(`/api/projects/${projectId}/script/versions`),
  
  upload: async (projectId: number, file: File, notes?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (notes) formData.append('notes', notes)
    
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/script/versions`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) throw new Error('Upload failed')
    return response.json()
  },
}

// AI Analysis API
export const ai = {
  analyzeScript: (scriptContent: string, language?: string) =>
    fetchApi<{
      analysis: {
        total_scenes: number
        total_locations: number
        total_characters: number
        estimated_shooting_days: number
        estimated_budget: number
        tags: string[]
        safety_warnings: string[]
        cultural_notes: string[]
      }
    }>('/api/ai/analyze-script', {
      method: 'POST',
      body: JSON.stringify({ script_content: scriptContent, language }),
    }),
  
  generateShotList: (sceneDescription: string) =>
    fetchApi<{ shots: any[] }>('/api/ai/generate-shot-list', {
      method: 'POST',
      body: JSON.stringify({ scene_description: sceneDescription }),
    }),
  
  estimateBudget: (scenes: any[], locations: any[], castSize: number) =>
    fetchApi<{ estimated_total: number; breakdown: any }>('/api/ai/estimate-budget', {
      method: 'POST',
      body: JSON.stringify({ scenes, locations, cast_size: castSize }),
    }),
  
  generateSchedule: (scenes: any[], locations: any[], cast: any[]) =>
    fetchApi<{ schedule: any[] }>('/api/ai/generate-schedule', {
      method: 'POST',
      body: JSON.stringify({ scenes, locations, cast }),
    }),
  
  getScheduleRecommendations: (projectId: number, constraints?: any) =>
    fetchApi<{ recommendations: any[] }>(`/api/schedule/recommendations`, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, constraints }),
    }),
  
  compareScriptVersions: (projectId: number, version1: number, version2: number) =>
    fetchApi<{ changes: any[] }>(`/api/scripts/compare`, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, version1, version2 }),
    }),
}

// Notifications API
export const notifications = {
  sendEmail: (to: string, subject: string, body: string) =>
    fetchApi<{ success: boolean }>('/api/notifications/email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    }),
  
  sendWhatsApp: (to: string, message: string) =>
    fetchApi<{ success: boolean }>('/api/notifications/whatsapp', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    }),
  
  getWhatsAppTemplates: () =>
    fetchApi<{ templates: any[] }>('/api/notifications/whatsapp/templates'),
  
  sendWhatsAppTemplate: (to: string, templateId: string, params?: Record<string, string>) =>
    fetchApi<{ success: boolean }>('/api/notifications/whatsapp/template', {
      method: 'POST',
      body: JSON.stringify({ to, template_id: templateId, params }),
    }),
  
  sendWhatsAppInteractive: (to: string, body: string, buttons: { id: string; title: string }[]) =>
    fetchApi<{ success: boolean }>('/api/notifications/whatsapp/interactive', {
      method: 'POST',
      body: JSON.stringify({ to, body, buttons }),
    }),
}

// Export API
export const exportAPI = {
  pdf: (type: string, projectId: number) =>
    fetchApi<{ content: string; filename: string }>('/api/export/pdf', {
      method: 'POST',
      body: JSON.stringify({ type, project_id: projectId }),
    }),
  
  excel: (type: string, projectId: number) =>
    fetchApi<{ content: string; filename: string }>('/api/export/excel', {
      method: 'POST',
      body: JSON.stringify({ type, project_id: projectId }),
    }),
  
  calendar: (projectId: number) =>
    fetchApi<{ content: string; filename: string }>('/api/export/calendar', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),
}

// AI Shot List API
export const aiShotList = {
  generate: (data: {
    scene_description: string
    scene_number: number
    location: string
    time_of_day: string
    characters?: string[]
  }) =>
    fetchApi<any>('/api/ai/generate-shot-list', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getShotTypeSuggestions: (context: string, shotCount: number = 5) =>
    fetchApi<any>('/api/ai/shot-type-suggestions', {
      method: 'POST',
      body: JSON.stringify({ context, shot_count: shotCount }),
    }),
  
  getCameraMovementSuggestions: (sceneType: string, shotCount: number = 5) =>
    fetchApi<any>('/api/ai/camera-movement-suggestions', {
      method: 'POST',
      body: JSON.stringify({ scene_type: sceneType, shot_count: shotCount }),
    }),
}

// Character Arc API
export const characterArc = {
  getArc: (projectId: number, characterId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/characters/${characterId}/arc`),
  
  getScenes: (projectId: number, characterId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/characters/${characterId}/scenes`),
  
  getCastCallsheet: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/cast/callsheet`),
}

// Webhooks API
export const webhooks = {
  list: () => fetchApi<any[]>('/api/webhooks'),
  
  register: (url: string, events: string[]) =>
    fetchApi<any>('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    }),
  
  delete: (webhookId: string) =>
    fetchApi<void>(`/api/webhooks/${webhookId}`, { method: 'DELETE' }),
}

// Budget API
export const budget = {
  get: (projectId: number) =>
    fetchApi<{ items: BudgetItem[]; total: number }>(`/api/projects/${projectId}/budget`),
  
  update: (projectId: number, items: BudgetItem[]) =>
    fetchApi<{ total: number }>(`/api/projects/${projectId}/budget`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
}

// Schedule API
export const schedule = {
  get: (projectId: number) =>
    fetchApi<any[]>(`/api/projects/${projectId}/schedule`),
  
  generate: (projectId: number) =>
    fetchApi<any[]>(`/api/projects/${projectId}/schedule/generate`, {
      method: 'POST',
    }),
  
  update: (projectId: number, schedule: any[]) =>
    fetchApi<any[]>(`/api/projects/${projectId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    }),
}

// Analytics API
export const analytics = {
  get: (projectId: number) =>
    fetchApi<{
      overview: any
      weekly_progress: any[]
      upcoming: any
    }>(`/api/projects/${projectId}/analytics`),
}

// Collaboration API
export const collaboration = {
  getCollaborators: (projectId: number) =>
    fetchApi<any[]>(`/api/projects/${projectId}/collaborators`),
  
  addCollaborator: (projectId: number, userId: string, role: string) =>
    fetchApi<any>(`/api/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    }),
}

// Activity API
export const activity = {
  getRecent: (projectId: number) =>
    fetchApi<{ activities: any[] }>(`/api/projects/${projectId}/activity`),
}

// Promotional Materials API
export const promo = {
  getMaterials: (projectId: number) =>
    fetchApi<{
      taglines: string[]
      social_posts: any[]
      poster_suggestions: any[]
    }>(`/api/projects/${projectId}/promo-materials`),
}

// File Upload API
export const upload = {
  script: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${API_BASE}/api/upload/script`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json())
  },
  
  media: (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return fetch(`${API_BASE}/api/upload/media`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json())
  },
}

// Export API
export const exportProject = {
  json: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/export/json`),
  
  csv: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/export/csv`),
  
  pdf: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/export/pdf`),
}

// AI Analysis Enhanced
export const aiEnhanced = {
  characterArc: (scriptContent: string, characters: string[]) =>
    fetchApi<any>('/api/ai/character-arc', {
      method: 'POST',
      body: JSON.stringify({ script_content: scriptContent, characters }),
    }),
  
  pacingAnalysis: (scenes: any[]) =>
    fetchApi<any>('/api/ai/pacing-analysis', {
      method: 'POST',
      body: JSON.stringify({ scenes }),
    }),
  
  culturalAnalysis: (scriptContent: string, region?: string) =>
    fetchApi<any>('/api/ai/cultural-analysis', {
      method: 'POST',
      body: JSON.stringify({ script_content: scriptContent, region }),
    }),
  
  safetyAnalysis: (scriptContent: string) =>
    fetchApi<any>('/api/ai/safety-analysis', {
      method: 'POST',
      body: JSON.stringify({ script_content: scriptContent }),
    }),
}

// AI Analysis - New Enhanced Endpoints
export const aiAnalysis = {
  analyzePacing: (scriptContent: string, language?: string) =>
    fetchApi<any>('/api/ai/analyze-pacing', {
      method: 'POST',
      body: JSON.stringify({ content: scriptContent, language: language || 'tamil' }),
    }),
  
  analyzeCharacters: (scriptContent: string, language?: string) =>
    fetchApi<any>('/api/ai/analyze-characters', {
      method: 'POST',
      body: JSON.stringify({ content: scriptContent, language: language || 'tamil' }),
    }),
  
  analyzeEmotionalArc: (scriptContent: string, language?: string) =>
    fetchApi<any>('/api/ai/analyze-emotional-arc', {
      method: 'POST',
      body: JSON.stringify({ content: scriptContent, language: language || 'tamil' }),
    }),
  
  generateTags: (scriptContent: string, language?: string) =>
    fetchApi<any>('/api/ai/generate-tags', {
      method: 'POST',
      body: JSON.stringify({ content: scriptContent, language: language || 'tamil' }),
    }),
}

// Script Upload - Multi-file
export const scriptUpload = {
  uploadMultiple: async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    const response = await fetch(`${API_BASE}/api/upload/script-multi`, {
      method: 'POST',
      body: formData,
    })
    return response.json()
  },
}

// WhatsApp Enhanced Notifications
export const whatsappEnhanced = {
  scheduleReminder: (recipient: string, projectName: string, date: string, callTime: string, location: string) =>
    fetchApi<any>('/api/whatsapp/schedule-reminder', {
      method: 'POST',
      body: JSON.stringify({ recipient, project_name: projectName, date, call_time: callTime, location }),
    }),
  
  locationUpdate: (recipient: string, oldLocation: string, newLocation: string, effectiveDate: string) =>
    fetchApi<any>('/api/whatsapp/location-update', {
      method: 'POST',
      body: JSON.stringify({ recipient, old_location: oldLocation, new_location: newLocation, effective_date: effectiveDate }),
    }),
  
  castCall: (recipient: string, characterName: string, shootDate: string, callTime: string, scenes: number[]) =>
    fetchApi<any>('/api/whatsapp/cast-call', {
      method: 'POST',
      body: JSON.stringify({ recipient, character_name: characterName, shoot_date: shootDate, call_time: callTime, scenes }),
    }),
}

// Collaboration - Activity, Tasks, Expenses
export const collaborationNew = {
  getActivity: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/activity`),
  
  getTasks: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/tasks`),
  
  createTask: (projectId: number, title: string, assignee: string, dueDate: string) =>
    fetchApi<any>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, assignee, due_date: dueDate }),
    }),
  
  getExpenses: (projectId: number) =>
    fetchApi<any>(`/api/projects/${projectId}/expenses`),
}

// Export
export default {
  projects,
  scenes,
  characters,
  locations,
  crew,
  productionTimeline,
  progress,
  castAvailability,
  equipment,
  scriptVersions,
  ai,
  notifications,
  webhooks,
  budget,
  schedule,
  analytics,
  collaboration,
  activity,
  promo,
  upload,
  exportProject,
  aiEnhanced,
  aiAnalysis,
  scriptUpload,
  whatsappEnhanced,
  collaborationNew,
}
