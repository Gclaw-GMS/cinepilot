// CinePilot API Service
import type { Project, Scene, Character, Location, CrewMember, Schedule } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Default export for backward compatibility
const api = {}
export default api

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
  return res.json()
}

// Projects
export const projects = {
  list: (): Promise<Project[]> => fetchAPI('/api/projects'),
  get: (id: string): Promise<any> => fetchAPI(`/api/projects/${id}`),
  create: (data: Partial<Project>): Promise<any> => 
    fetchAPI('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>): Promise<any> =>
    fetchAPI(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/api/projects/${id}`, { method: 'DELETE' }),
}

// Scenes
export const scenes = {
  list: (projectId?: string): Promise<any> => 
    fetchAPI(projectId ? `/api/scenes?project_id=${projectId}` : '/api/scenes'),
  create: (data: Partial<Scene>): Promise<any> =>
    fetchAPI('/api/scenes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Scene>): Promise<any> =>
    fetchAPI(`/api/scenes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/api/scenes/${id}`, { method: 'DELETE' }),
}

// Locations
export const locations = {
  list: (): Promise<any> => fetchAPI('/api/locations'),
  create: (data: Partial<Location>): Promise<any> =>
    fetchAPI('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
}

// Crew
export const crew = {
  list: (projectId?: string): Promise<any> =>
    fetchAPI(projectId ? `/api/crew?project_id=${projectId}` : '/api/crew'),
  create: (data: Partial<CrewMember>): Promise<any> =>
    fetchAPI('/api/crew', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/api/crew/${id}`, { method: 'DELETE' }),
}

// Schedule
export const schedule = {
  get: (projectId: string): Promise<any> => fetchAPI(`/api/schedule/${projectId}`),
  create: (data: Partial<Schedule>): Promise<any> =>
    fetchAPI('/api/schedule', { method: 'POST', body: JSON.stringify(data) }),
}

// Budget
export const budget = {
  get: (projectId: string) => fetchAPI(`/api/budget/${projectId}`),
  addExpense: (data: any) => fetchAPI('/api/budget/expense', { method: 'POST', body: JSON.stringify(data) }),
}

// AI
export const ai = {
  analyzeScript: (content: string, language: string = 'tamil') => 
    fetchAPI('/api/ai/analyze-script', { method: 'POST', body: JSON.stringify({ content }) }),
  deepAnalysis: (content: string, language: string = 'tamil') =>
    fetchAPI('/api/ai/deep-analysis', { method: 'POST', body: JSON.stringify({ content, language }) }),
  generateShotList: (sceneDescription: string) =>
    fetchAPI('/api/ai/generate-shot-list', { method: 'POST', body: JSON.stringify({ scene_description: sceneDescription }) }),
  estimateBudget: (scenes: any[], locations: any[], days: number) =>
    fetchAPI('/api/ai/estimate-budget', { method: 'POST', body: JSON.stringify({ scenes, locations, days }) }),
}

// Notifications
export const notifications = {
  sendWhatsApp: (data: { recipient: string; message: string }) =>
    fetchAPI('/api/notifications/whatsapp', { method: 'POST', body: JSON.stringify(data) }),
  sendEmail: (data: { recipient: string; subject: string; body: string }) =>
    fetchAPI('/api/notifications/email', { method: 'POST', body: JSON.stringify(data) }),
}

// Upload
export const upload = {
  script: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_URL}/api/upload/script`, { method: 'POST', body: formData })
    return res.json()
  },
}

// Health
export const health = (): Promise<{ status: string; version: string }> => fetchAPI('/api/health')

// Script Parser
export const scriptParser = {
  parse: (content: string) => fetchAPI('/api/scripts/parse', { method: 'POST', body: JSON.stringify({ content }) }),
}

// Script Upload
export const scriptUpload = {
  advanced: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_URL}/api/upload/script-advanced`, { method: 'POST', body: formData })
    return res.json()
  },
}

// Schedule Optimization
export const scheduleOptimization = {
  optimize: (scenes: any[], locations: any[]) =>
    fetchAPI('/api/schedule/optimize', { method: 'POST', body: JSON.stringify({ scenes, locations }) }),
}

// AI Advanced
export const aiAdvanced = {
  fullAnalysis: (content: string, language: string = 'tamil') =>
    fetchAPI('/api/ai/full-analysis', { method: 'POST', body: JSON.stringify({ content, language }) }),
  analyzeDialogue: (content: string) =>
    fetchAPI('/api/ai/analyze-dialogue', { method: 'POST', body: JSON.stringify({ content }) }),
  analyzeEmotions: (content: string) =>
    fetchAPI('/api/ai/analyze-emotions', { method: 'POST', body: JSON.stringify({ content }) }),
  suggestShots: (heading: string, characters: string[]) =>
    fetchAPI('/api/ai/suggest-shots', { method: 'POST', body: JSON.stringify({ heading, characters }) }),
}

// WhatsApp Templates
export const whatsappTemplates = {
  list: () => fetchAPI('/api/notifications/whatsapp/templates'),
  send: (id: string, recipient: string, vars: Record<string, string>) =>
    fetchAPI('/api/notifications/whatsapp/template', { method: 'POST', body: JSON.stringify({ id, recipient, vars }) }),
}

// PDF Export
export const pdfExport = {
  generate: (projectId: number, type: string) =>
    fetchAPI('/api/export/pdf', { method: 'POST', body: JSON.stringify({ projectId, type }) }),
}

// AI Enhanced 2
export const aiEnhanced2 = {
  analyze: (content: string, language: string = 'tamil', analysisType: string = 'full') =>
    fetchAPI('/api/ai/enhanced-analysis', { method: 'POST', body: JSON.stringify({ content, language, analysisType }) }),
  getInsights: (content: string) =>
    fetchAPI('/api/ai/script-insights', { method: 'POST', body: JSON.stringify({ content }) }),
  getCapabilities: () => fetchAPI('/api/ai/capabilities'),
}

// Schedule Optimizer
export const scheduleOptimizer = {
  optimize: (scenes: any[], locations: any[], days: number) =>
    fetchAPI('/api/ai/schedule-optimize', { method: 'POST', body: JSON.stringify({ scenes, locations, days }) }),
}

// AI Real
export const aiReal = {
  analyze: (content: string, language: string = 'tamil', provider?: string) =>
    fetchAPI('/api/ai/analyze-real', { method: 'POST', body: JSON.stringify({ content, language, provider }) }),
}

// AI Improved
export const aiImproved = {
  analyze: (content: string, language: string = 'tamil', analysisType: string = 'full') =>
    fetchAPI('/api/ai/improved-analysis', { method: 'POST', body: JSON.stringify({ content, language, analysisType }) }),
}

// Production Timeline
export const productionTimeline = {
  get: (projectId: number) => fetchAPI(`/api/projects/${projectId}/timeline`),
}

// Progress Tracking
export const progressTracking = {
  get: (projectId: number) => fetchAPI(`/api/projects/${projectId}/progress`),
}

// Script Comparison
export const scriptComparison = {
  compare: (v1: string, v2: string) =>
    fetchAPI('/api/scripts/compare', { method: 'POST', body: JSON.stringify({ v1, v2 }) }),
}

// Equipment
export const equipment = {
  list: (projectId: number) => fetchAPI(`/api/projects/${projectId}/equipment`),
}

// Cast Availability
export const castAvailability = {
  get: (projectId: number) => fetchAPI(`/api/projects/${projectId}/cast-availability`),
}

// Crew Management
export const crewManagement = {
  addMember: (projectId: number, member: any) =>
    fetchAPI(`/api/projects/${projectId}/crew`, { method: 'POST', body: JSON.stringify(member) }),
}

// Export Project

export const interactiveWhatsApp = {
  send: (recipient: string, title: string, message: string, buttons: any[]) =>
    fetchAPI('/api/notifications/whatsapp/interactive', { method: 'POST', body: JSON.stringify({ recipient, title, message, buttons }) }),
}

export interface WhatsAppTemplate {
  id: string
  name: string
  template: string
}

// Collaboration types
export interface Activity {
  id: number
  type: string
  description: string
  user: string
  timestamp: string
}

export interface ProjectTask {
  id: number
  title: string
  description: string
  status: string
  priority: string
  assigned_to: string
  due_date: string
}

export interface ProjectExpenses {
  total: number
  totals: { total_spent: number; budget: number; total_budget: number; remaining: number; percent_used: number }
  categories: any[]
  items: any[]
  expenses: any[]
}

export const collaboration = {
  getActivity: (projectId: number) => fetchAPI(`/api/projects/${projectId}/activity`),
  getTasks: (projectId: number) => fetchAPI(`/api/projects/${projectId}/tasks`),
  getExpenses: (projectId: number) => fetchAPI(`/api/projects/${projectId}/expenses`),
  createTask: (projectId: number, task: any) => 
    fetchAPI(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(task) }),
}

export const aiAnalysis = {
  analyzePacing: (content: string) => fetchAPI('/api/ai/analyze-pacing', { method: 'POST', body: JSON.stringify({ content }) }),
  analyzeCharacters: (content: string) => fetchAPI('/api/ai/analyze-characters', { method: 'POST', body: JSON.stringify({ content }) }),
  analyzeEmotionalArc: (content: string) => fetchAPI('/api/ai/analyze-emotional-arc', { method: 'POST', body: JSON.stringify({ content }) }),
  generateTags: (content: string) => fetchAPI('/api/ai/generate-tags', { method: 'POST', body: JSON.stringify({ content }) }),
}

export interface ScheduleReminderRequest {
  recipient: string
  project_name?: string
  shoot_date: string
  call_time: string
  location: string
}

export interface LocationUpdateRequest {
  recipient: string
  project_name?: string
  old_location: string
  new_location: string
  effective_date: string
}

export interface CastCallRequest {
  recipient: string
  actor_name?: string
  project_name?: string
  date: string
  call_time: string
  scene_numbers: (string | number)[]
}

export const whatsappEnhanced = {
  scheduleReminder: (data: ScheduleReminderRequest) =>
    fetchAPI('/api/whatsapp/schedule-reminder', { method: 'POST', body: JSON.stringify(data) }),
  sendScheduleReminder: (data: ScheduleReminderRequest) =>
    fetchAPI('/api/whatsapp/schedule-reminder', { method: 'POST', body: JSON.stringify(data) }),
  locationUpdate: (data: LocationUpdateRequest) =>
    fetchAPI('/api/whatsapp/location-update', { method: 'POST', body: JSON.stringify(data) }),
  sendLocationUpdate: (data: LocationUpdateRequest) =>
    fetchAPI('/api/whatsapp/location-update', { method: 'POST', body: JSON.stringify(data) }),
  castCall: (data: CastCallRequest) =>
    fetchAPI('/api/whatsapp/cast-call', { method: 'POST', body: JSON.stringify(data) }),
  sendCastCall: (data: CastCallRequest) =>
    fetchAPI('/api/whatsapp/cast-call', { method: 'POST', body: JSON.stringify(data) }),
}

export interface ProjectProgress {
  overall: number
  phases: any
}

export interface Milestone {
  id: number
  name: string
  date: string
  status: string
}

export interface CastMember {
  name: string
  available: boolean
}

export interface EquipmentItem {
  name: string
  category: string
}

export const dood = {
  getReport: (projectId: number) => fetchAPI('/api/dood/' + projectId),
}

export const exportProject = {
  export: (projectId: number | string, format: string) => 
    fetchAPI('/api/export/json', { method: 'POST', body: JSON.stringify({ projectId, format }) }),
}

// Enhanced AI Analysis V2
export const aiEnhancedV2 = {
  analyzeScreenplayFormat: (content: string) =>
    fetchAPI('/api/ai/analyze-screenplay-format', { method: 'POST', body: JSON.stringify({ content }) }),
  analyzeSceneComplexity: (content: string) =>
    fetchAPI('/api/ai/analyze-scene-complexity', { method: 'POST', body: JSON.stringify({ content }) }),
  parseFountain: (content: string) =>
    fetchAPI('/api/ai/parse-fountain', { method: 'POST', body: JSON.stringify({ content }) }),
  compareScripts: (version1: string, version2: string) =>
    fetchAPI('/api/ai/compare-scripts', { method: 'POST', body: JSON.stringify({ version1, version2 }) }),
}

// WhatsApp Real Integration
export const whatsappReal = {
  send: (recipient: string, message: string, useWacli: boolean = true) =>
    fetchAPI('/api/whatsapp/send', { method: 'POST', body: JSON.stringify({ recipient, message, use_wacli: useWacli }) }),
  batchSend: (messages: { recipient: string; message: string }[]) =>
    fetchAPI('/api/whatsapp/batch-send', { method: 'POST', body: JSON.stringify({ messages }) }),
}

// Schedule Recommendations
export const scheduleRecommendations = {
  get: (scenes: any[], locations: any[], budget: number) =>
    fetchAPI('/api/schedule/recommendations', { method: 'POST', body: JSON.stringify({ scenes, locations, budget }) }),
}

// Cast Management
export const castManagement = {
  getCast: (projectId: number) => fetchAPI(`/api/projects/${projectId}/cast`),
  addCast: (projectId: number, data: any) =>
    fetchAPI(`/api/projects/${projectId}/cast`, { method: 'POST', body: JSON.stringify(data) }),
}

// Equipment Management
export const equipmentManagement = {
  getEquipment: (projectId: number) => fetchAPI(`/api/projects/${projectId}/equipment`),
  addEquipment: (projectId: number, data: any) =>
    fetchAPI(`/api/projects/${projectId}/equipment`, { method: 'POST', body: JSON.stringify(data) }),
}
