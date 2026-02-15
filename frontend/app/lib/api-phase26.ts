/**
 * CinePilot API Client - Phase 26 Enhancements
 * Additional real-time API methods and improved connectivity
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============ ENHANCED API CLIENT ============

// Real-time project sync
export async function syncProjectData(projectId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}`)
  if (!response.ok) throw new Error('Failed to sync project')
  return response.json()
}

// Batch operations for scenes
export async function batchUpdateScenes(projectId: number, scenes: any[]): Promise<any> {
  const response = await fetch(`${API_BASE}/api/scenes/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, scenes })
  })
  return response.json()
}

// AI-powered scene suggestions
export async function getSceneSuggestions(projectId: number, context: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/ai/scene-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, context })
  })
  return response.json()
}

// Production calendar integration
export async function getProductionCalendar(projectId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/calendar/${projectId}`)
  return response.json()
}

// Export to multiple formats
export async function exportProject(projectId: number, format: 'pdf' | 'xlsx' | 'json' | 'csv'): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export/${projectId}?format=${format}`)
  if (!response.ok) throw new Error('Export failed')
  return response.blob()
}

// Crew availability check
export async function checkCrewAvailability(crewIds: number[], dates: string[]): Promise<any> {
  const response = await fetch(`${API_BASE}/api/crew/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crew_ids: crewIds, dates })
  })
  return response.json()
}

// Location scouting with AI recommendations
export async function getLocationRecommendations(scriptContent: string, requirements: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/ai/location-recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script_content: scriptContent, requirements })
  })
  return response.json()
}

// Cost estimation with AI
export async function getAICostEstimate(projectId: number, scenes: any[]): Promise<any> {
  const response = await fetch(`${API_BASE}/api/ai/cost-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, scenes })
  })
  return response.json()
}

// Real-time collaboration status
export async function getCollaborators(projectId: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/collaboration/${projectId}/users`)
  return response.json()
}

// Version history for scripts
export async function getScriptVersions(projectId: number): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/scripts/${projectId}/versions`)
  return response.json()
}

// Notification preferences
export async function updateNotificationPreferences(userId: number, prefs: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...prefs })
  })
  return response.json()
}

// ============ ENHANCED STORAGE ============

const STORAGE_KEY = 'cinepilot_cache'

interface CacheItem {
  data: any
  timestamp: number
  ttl: number // milliseconds
}

export function setCache(key: string, data: any, ttlMinutes: number = 5): void {
  if (typeof window === 'undefined') return
  try {
    const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Cache error:', e)
  }
}

export function getCache(key: string): any | null {
  if (typeof window === 'undefined') return null
  try {
    const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const item = cache[key]
    if (!item) return null
    if (Date.now() - item.timestamp > item.ttl) {
      delete cache[key]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
      return null
    }
    return item.data
  } catch (e) {
    return null
  }
}

export function clearCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ============ WEBSOCKET SIMULATION (for real-time updates) ============

type Listener = (data: any) => void

class EventBus {
  private listeners: Map<string, Listener[]> = new Map()
  
  subscribe(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
    
    return () => {
      const listeners = this.listeners.get(event) || []
      this.listeners.set(event, listeners.filter(l => l !== callback))
    }
  }
  
  publish(event: string, data: any): void {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(l => l(data))
  }
}

export const eventBus = new EventBus()

// Event types
export const Events = {
  PROJECT_UPDATED: 'project:updated',
  SCENE_ADDED: 'scene:added',
  CREW_UPDATED: 'crew:updated',
  BUDGET_CHANGED: 'budget:changed',
  SCHEDULE_CHANGED: 'schedule:changed',
  NOTIFICATION_RECEIVED: 'notification:received'
}
