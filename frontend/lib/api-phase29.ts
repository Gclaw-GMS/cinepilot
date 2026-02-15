/**
 * CinePilot API Client - Phase 29
 * Enhanced with real-time collaboration, WebSocket simulation, and advanced project management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache for offline support
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Event bus for real-time updates
type EventCallback = (data: any) => void;
const eventBus = new Map<string, EventCallback[]>();

interface Project {
  id: string;
  name: string;
  description?: string;
  language: string;
  budget?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Scene {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  location?: string;
  characters: string[];
  duration?: number;
  status: string;
}

interface Crew {
  id: string;
  name: string;
  role: string;
  department: string;
  availability: string;
  contact?: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  scenesCount: number;
  crewCount: number;
  completedScenes: number;
}

// Cache helper
function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < item.ttl) {
    return item.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// Event bus helpers
export function subscribe(event: string, callback: EventCallback): () => void {
  if (!eventBus.has(event)) {
    eventBus.set(event, []);
  }
  eventBus.get(event)!.push(callback);
  return () => {
    const callbacks = eventBus.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  };
}

function emit(event: string, data: any): void {
  const callbacks = eventBus.get(event);
  if (callbacks) {
    callbacks.forEach(cb => cb(data));
  }
}

// Generic request with retry
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const cacheKey = `${options.method || 'GET'}:${endpoint}`;
  
  // GET requests can use cache
  if (!options.method || options.method === 'GET') {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache GET responses
      if (!options.method || options.method === 'GET') {
        setCache(cacheKey, data);
      }
      
      // Emit real-time event
      if (endpoint.startsWith('/api/')) {
        emit('api:update', { endpoint, data });
      }
      
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

// ============ Projects API ============

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export async function getProject(id: string): Promise<Project> {
  return request<Project>(`/api/projects/${id}`);
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/api/projects/${id}`, { method: 'DELETE' });
  cache.clear(); // Invalidate cache
}

export async function getProjectStats(): Promise<ProjectStats> {
  return request<ProjectStats>('/api/projects/stats');
}

// ============ Scenes API ============

export async function getScenes(projectId: string): Promise<Scene[]> {
  return request<Scene[]>(`/api/scenes?project_id=${projectId}`);
}

export async function createScene(data: Partial<Scene>): Promise<Scene> {
  return request<Scene>('/api/scenes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScene(id: string, data: Partial<Scene>): Promise<Scene> {
  return request<Scene>(`/api/scenes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScene(id: string): Promise<void> {
  await request(`/api/scenes/${id}`, { method: 'DELETE' });
}

export async function batchCreateScenes(scenes: Partial<Scene>[]): Promise<Scene[]> {
  return request<Scene[]>('/api/scenes/batch', {
    method: 'POST',
    body: JSON.stringify({ scenes }),
  });
}

// ============ Crew API ============

export async function getCrew(): Promise<Crew[]> {
  return request<Crew[]>('/api/crew');
}

export async function getCrewByDepartment(department: string): Promise<Crew[]> {
  return request<Crew[]>(`/api/crew?department=${department}`);
}

export async function createCrew(data: Partial<Crew>): Promise<Crew> {
  return request<Crew>('/api/crew', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCrew(id: string, data: Partial<Crew>): Promise<Crew> {
  return request<Crew>(`/api/crew/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCrew(id: string): Promise<void> {
  await request(`/api/crew/${id}`, { method: 'DELETE' });
}

export async function getAvailableCrew(startDate: string, endDate: string): Promise<Crew[]> {
  return request<Crew[]>(`/api/crew/available?start=${startDate}&end=${endDate}`);
}

// ============ Budget API ============

export async function getBudget(projectId: string) {
  return request(`/api/budget/${projectId}`);
}

export async function updateBudget(projectId: string, data: any) {
  return request(`/api/budget/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getBudgetBreakdown(projectId: string) {
  return request(`/api/budget/${projectId}/breakdown`);
}

// ============ Schedule API ============

export async function getSchedule(projectId: string) {
  return request(`/api/schedule/${projectId}`);
}

export async function updateSchedule(projectId: string, data: any) {
  return request(`/api/schedule/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getWeatherSchedule(projectId: string, days: number = 14) {
  return request(`/api/schedule/${projectId}/weather?days=${days}`);
}

// ============ Analytics API ============

export async function getProjectAnalytics(projectId: string) {
  return request(`/api/analytics/${projectId}`);
}

export async function getPacingAnalysis(projectId: string) {
  return request(`/api/analytics/${projectId}/pacing`);
}

export async function getCharacterNetwork(projectId: string) {
  return request(`/api/analytics/${projectId}/characters/network`);
}

// ============ AI Analysis API ============

export async function analyzeScript(projectId: string, analysisType: string) {
  return request(`/api/ai/analyze/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ type: analysisType }),
  });
}

export async function getSceneSuggestions(projectId: string, context: string) {
  return request(`/api/ai/scenes/suggestions`, {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, context }),
  });
}

export async function getBudgetPrediction(projectId: string, genre: string) {
  return request(`/api/ai/budget/predict`, {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, genre }),
  });
}

export async function compareWithSimilarFilms(projectId: string) {
  return request(`/api/ai/compare/${projectId}`);
}

// ============ Collaboration API ============

export async function getCollaborators(projectId: string) {
  return request(`/api/collaboration/${projectId}`);
}

export async function inviteCollaborator(projectId: string, email: string, role: string) {
  return request(`/api/collaboration/${projectId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export async function removeCollaborator(projectId: string, userId: string) {
  return request(`/api/collaboration/${projectId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function getProjectActivity(projectId: string) {
  return request(`/api/activity/${projectId}`);
}

// ============ Export/Import API ============

export async function exportProject(projectId: string, format: string = 'json') {
  return request(`/api/export/${projectId}?format=${format}`);
}

export async function importProject(data: any) {
  return request('/api/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function exportScenesCSV(projectId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export/${projectId}/scenes/csv`);
  return response.blob();
}

// ============ Notification Preferences API ============

export async function getNotificationPreferences() {
  return request('/api/notifications/preferences');
}

export async function updateNotificationPreferences(data: any) {
  return request('/api/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ Utility Functions ============

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Re-export for convenience
export * from './api-phase28';
