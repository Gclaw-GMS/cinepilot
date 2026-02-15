// CinePilot API - Phase 23 Extensions
// Extended API client for new Phase 23 features

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
  return res.json()
}

// ============== Location Management ==============

export interface LocationScout {
  id: number
  name: string
  address: string
  type: 'indoor' | 'outdoor' | 'studio'
  accessibility: number // 1-10
  permit_required: boolean
  permit_cost: number
  nearby_locations: string[]
  photos: string[]
  notes: string
  score: number // Overall suitability score
}

export const locationScout = {
  search: (query: string) => 
    fetchAPI('/api/locations/scout', { method: 'POST', body: JSON.stringify({ query }) }),
  getRecommendations: (sceneRequirements: any) =>
    fetchAPI('/api/locations/recommendations', { method: 'POST', body: JSON.stringify(sceneRequirements) }),
  checkCompatibility: (locationId: number, sceneRequirements: any) =>
    fetchAPI(`/api/locations/${locationId}/compatibility`, { method: 'POST', body: JSON.stringify(sceneRequirements) }),
}

// ============== Storyboard Management ==============

export interface StoryboardFrame {
  id: number
  scene_id: number
  shot_number: number
  description: string
  camera_angle: string
  camera_movement: string
  duration: number // seconds
  image_url?: string
  notes: string
}

export const storyboard = {
  getFrames: (sceneId: number) => fetchAPI(`/api/storyboard/${sceneId}`),
  createFrame: (sceneId: number, frame: Partial<StoryboardFrame>) =>
    fetchAPI('/api/storyboard/frame', { method: 'POST', body: JSON.stringify({ scene_id: sceneId, ...frame }) }),
  updateFrame: (frameId: number, data: Partial<StoryboardFrame>) =>
    fetchAPI(`/api/storyboard/frame/${frameId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFrame: (frameId: number) =>
    fetchAPI(`/api/storyboard/frame/${frameId}`, { method: 'DELETE' }),
  exportPDF: (sceneId: number) =>
    fetchAPI('/api/storyboard/export', { method: 'POST', body: JSON.stringify({ scene_id: sceneId }) }),
}

// ============== Casting Recommendations ==============

export interface CastingRecommendation {
  character_name: string
  suggested_actors: {
    name: string
    compatibility: number
    availability: string
    contact?: string
    notes: string
  }[]
}

export const casting = {
  getRecommendations: (projectId: number, characterRequirements: any) =>
    fetchAPI(`/api/casting/recommendations/${projectId}`, { method: 'POST', body: JSON.stringify(characterRequirements) }),
  searchActors: (query: string, role?: string) =>
    fetchAPI('/api/casting/search', { method: 'POST', body: JSON.stringify({ query, role }) }),
  checkAvailability: (actorId: number, dates: string[]) =>
    fetchAPI(`/api/casting/availability/${actorId}`, { method: 'POST', body: JSON.stringify({ dates }) }),
}

// ============== Scene Sentiment Analysis ==============

export interface SceneSentiment {
  scene_id: number
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  sentiment_score: number // -1 to 1
  emotions: { emotion: string; intensity: number }[]
  key_moments: string[]
  dialogue_tone: string
}

export const sentimentAnalysis = {
  analyzeScene: (sceneId: number) => fetchAPI(`/api/sentiment/scene/${sceneId}`),
  analyzeScenes: (sceneIds: number[]) =>
    fetchAPI('/api/sentiment/scenes', { method: 'POST', body: JSON.stringify({ scene_ids: sceneIds }) }),
  getEmotionalJourney: (projectId: number) =>
    fetchAPI(`/api/sentiment/journey/${projectId}`),
}

// ============== Notification History ==============

export interface NotificationRecord {
  id: number
  type: 'whatsapp' | 'email' | 'sms'
  recipient: string
  message: string
  status: 'sent' | 'delivered' | 'failed'
  sent_at: string
  delivered_at?: string
}

export const notificationHistory = {
  getHistory: (projectId: number, type?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (limit) params.append('limit', limit.toString())
    return fetchAPI(`/api/notifications/history/${projectId}?${params}`)
  },
  retryFailed: (notificationId: number) =>
    fetchAPI(`/api/notifications/retry/${notificationId}`, { method: 'POST' }),
}

// ============== Equipment Checklist ==============

export interface EquipmentChecklistItem {
  id: number
  category: string
  name: string
  required: boolean
  quantity: number
  checked: boolean
  notes: string
}

export const equipmentChecklist = {
  generate: (projectId: number, shootDays: number) =>
    fetchAPI('/api/equipment/checklist', { method: 'POST', body: JSON.stringify({ project_id: projectId, shoot_days: shootDays }) }),
  updateItem: (itemId: number, data: Partial<EquipmentChecklistItem>) =>
    fetchAPI(`/api/equipment/checklist/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  exportList: (projectId: number, format: 'pdf' | 'excel') =>
    fetchAPI('/api/equipment/export', { method: 'POST', body: JSON.stringify({ project_id: projectId, format }) }),
}

// ============== Script Version Control ==============

export interface ScriptVersion {
  id: number
  version_number: string
  created_at: string
  created_by: string
  changes_summary: string
  content_hash: string
}

export const scriptVersioning = {
  getVersions: (projectId: number) => fetchAPI(`/api/scripts/versions/${projectId}`),
  createVersion: (projectId: number, content: string, versionNumber: string, changesSummary: string) =>
    fetchAPI('/api/scripts/version', { method: 'POST', body: JSON.stringify({ project_id: projectId, content, version_number: versionNumber, changes_summary: changesSummary }) }),
  getVersion: (versionId: number) => fetchAPI(`/api/scripts/version/${versionId}`),
  diffVersions: (v1Id: number, v2Id: number) =>
    fetchAPI('/api/scripts/diff', { method: 'POST', body: JSON.stringify({ v1_id: v1Id, v2_id: v2Id }) }),
}

// ============== Cost Estimation V2 ==============

export interface CostEstimate {
  category: string
  estimated: number
  actual?: number
  variance?: number
  breakdown: { item: string; cost: number }[]
}

export const costEstimation = {
  getDetailedEstimate: (projectId: number) => fetchAPI(`/api/cost-estimate/${projectId}`),
  updateEstimate: (projectId: number, estimates: CostEstimate[]) =>
    fetchAPI(`/api/cost-estimate/${projectId}`, { method: 'PUT', body: JSON.stringify({ estimates }) }),
  compareWithActual: (projectId: number) =>
    fetchAPI(`/api/cost-estimate/${projectId}/compare`, { method: 'POST' }),
}

// ============== Production Dashboard ==============

export interface ProductionMetrics {
  total_scenes: number
  completed_scenes: number
  total_shoot_days: number
  used_shoot_days: number
  budget_spent: number
  budget_remaining: number
  crew_utilization: number
  equipment_usage: number
}

export const productionDashboard = {
  getMetrics: (projectId: number) => fetchAPI(`/api/dashboard/${projectId}`),
  getTimeline: (projectId: number) => fetchAPI(`/api/dashboard/${projectId}/timeline`),
  getAlerts: (projectId: number) => fetchAPI(`/api/dashboard/${projectId}/alerts`),
}

// ============== Bulk Operations ==============

export const bulkOperations = {
  importScenes: (projectId: number, scenes: any[]) =>
    fetchAPI('/api/bulk/import-scenes', { method: 'POST', body: JSON.stringify({ project_id: projectId, scenes }) }),
  exportScenes: (projectId: number, format: 'json' | 'csv') =>
    fetchAPI('/api/bulk/export-scenes', { method: 'POST', body: JSON.stringify({ project_id: projectId, format }) }),
  batchUpdateStatus: (sceneIds: number[], status: string) =>
    fetchAPI('/api/bulk/update-status', { method: 'POST', body: JSON.stringify({ scene_ids: sceneIds, status }) }),
}

// ============== Real-time Connection Status ==============

export interface ConnectionStatus {
  backend_connected: boolean
  api_latency_ms: number
  last_sync: string
  websocket_status?: 'connected' | 'disconnected' | 'connecting'
}

export const connectionStatus = {
  check: () => fetchAPI('/api/status/connection'),
  getLatency: () => fetchAPI('/api/status/latency'),
}
