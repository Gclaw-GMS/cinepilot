// =============================================================================
// CinePilot API Client — Enhanced Stub Layer
// Provides typed API functions that wrap the Next.js API routes.
// Even without a database, these can work with demo data from the APIs.
// =============================================================================

// Base API URL - can be configured for different environments
const API_BASE = '';

// Generic fetch wrapper with error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  
  return res.json();
}

// Common type definitions
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  isDemoMode?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Utility functions
export const utils = {
  formatCurrency: (n: number): string => `₹${n.toLocaleString('en-IN')}`,
  formatNumber: (n: number): string => n.toLocaleString('en-IN'),
  formatDate: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  formatTime: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },
  formatDuration: (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  },
  formatPercentage: (value: number, decimals: number = 0): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
};

// Projects API
export const projects = {
  getAll: async (): Promise<any[]> => {
    return apiFetch('/api/projects');
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/projects/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
  },
};

// Scripts API
export const scripts = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/scripts${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/scripts/${id}`);
  },
  upload: async (file: File, projectId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);
    
    const res = await fetch('/api/scripts', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  analyze: async (scriptId: string): Promise<any> => {
    return apiFetch('/api/scripts', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze', scriptId }),
    });
  },
};

// Scenes API
export const scenes = {
  getAll: async (scriptId: string): Promise<any[]> => {
    return apiFetch(`/api/scenes?scriptId=${scriptId}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/scenes/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/scenes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/scenes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Characters API
export const characters = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/characters${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/characters/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/characters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Locations API
export const locations = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/locations${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/locations/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  search: async (query: string, projectId?: string): Promise<any[]> => {
    const params = new URLSearchParams({ q: query });
    if (projectId) params.append('projectId', projectId);
    return apiFetch(`/api/locations/search?${params}`);
  },
};

// Schedule API
export const schedule = {
  getDays: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/schedule${params}`);
  },
  generate: async (projectId?: string): Promise<any> => {
    return apiFetch('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate', projectId }),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/schedule/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Budget API
export const budgetApi = {
  getItems: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/budget${params}`);
  },
  getForecast: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}&action=forecast` : '?action=forecast';
    return apiFetch(`/api/budget${params}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/budget/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Crew API
export const crew = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/crew${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/crew/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/crew', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/crew/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/crew/${id}`, { method: 'DELETE' });
  },
};

// Shots API
export const shots = {
  getAll: async (scriptId: string): Promise<any[]> => {
    return apiFetch(`/api/shots?scriptId=${scriptId}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/shots/${id}`);
  },
  generate: async (scriptId: string, style?: string): Promise<any> => {
    return apiFetch('/api/shots', {
      method: 'POST',
      body: JSON.stringify({ action: 'generateScript', scriptId, directorStyle: style }),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/shots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// DOOD (Day Out of Days) API
export const dood = {
  getReport: async (projectId: string = 'default-project'): Promise<any> => {
    return apiFetch(`/api/dood?projectId=${projectId}`);
  },
  generate: async (projectId: string = 'default-project'): Promise<any> => {
    return apiFetch('/api/dood', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate', projectId }),
    });
  },
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/dood${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/dood/${id}`);
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/dood/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/dood/${id}`, { method: 'DELETE' });
  },
};

// Storyboard API
export const storyboard = {
  getAll: async (scriptId: string): Promise<any[]> => {
    return apiFetch(`/api/storyboard?scriptId=${scriptId}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/storyboard/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/storyboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/storyboard/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Call Sheets API
export const callSheets = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/call-sheets${params}`);
  },
  getById: async (id: string): Promise<any> => {
    return apiFetch(`/api/call-sheets/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/call-sheets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/call-sheets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/call-sheets/${id}`, { method: 'DELETE' });
  },
};

// Equipment API
export const equipment = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/equipment${params}`);
  },
  getCategories: async (): Promise<any[]> => {
    return apiFetch('/api/equipment/categories');
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/equipment/${id}`, { method: 'DELETE' });
  },
};

// Notifications API
export const notifications = {
  getAll: async (projectId?: string, channel?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (channel) params.append('channel', channel);
    const query = params.toString();
    return apiFetch(`/api/notifications${query ? '?' + query : ''}`);
  },
  send: async (data: any): Promise<any> => {
    return apiFetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  markAsRead: async (id: string): Promise<any> => {
    return apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, status: 'read' }),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
  },
};

// Weather API
export const weather = {
  getForecast: async (lat: number, lng: number, days: number = 7): Promise<any> => {
    return apiFetch(`/api/weather?lat=${lat}&lng=${lng}&days=${days}`);
  },
  getByLocation: async (location: string): Promise<any> => {
    return apiFetch(`/api/weather?location=${encodeURIComponent(location)}`);
  },
};

// Censor API
export const censor = {
  getAnalysis: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/censor${params}`);
  },
  analyze: async (projectId?: string): Promise<any> => {
    return apiFetch('/api/censor', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze', projectId }),
    });
  },
};

// Export API
export const exportProject = {
  toJSON: async (type: string, projectId?: string): Promise<any> => {
    return apiFetch(`/api/exports?type=${type}&projectId=${projectId || 'default-project'}`);
  },
  toCSV: async (type: string, projectId?: string): Promise<string> => {
    const data = await exportProject.toJSON(type, projectId);
    // Convert JSON to CSV
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map((row: any) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))
      ].join('\n');
      return csv;
    }
    return '';
  },
  toPDF: async (type: string, projectId?: string): Promise<any> => {
    // PDF generation would require a server-side implementation
    // For now, return the data that could be sent to a PDF service
    return exportProject.toJSON(type, projectId);
  },
};

// AI Analysis API
export const ai = {
  analyzeScript: async (scriptId: string): Promise<any> => {
    return apiFetch('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ scriptId }),
    });
  },
  suggestShots: async (sceneId: string): Promise<any> => {
    return apiFetch('/api/ai/shots', {
      method: 'POST',
      body: JSON.stringify({ sceneId }),
    });
  },
  forecastBudget: async (projectId?: string): Promise<any> => {
    return apiFetch('/api/ai/budget-forecast', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },
  optimizeSchedule: async (projectId?: string): Promise<any> => {
    return apiFetch('/api/ai/schedule-optimize', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },
  detectRisks: async (projectId?: string): Promise<any> => {
    return apiFetch('/api/ai/risks', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },
};

// Collaboration API
export const collaboration = {
  getActivities: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/collaboration/activities${params}`);
  },
  getTeam: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/collaboration/team${params}`);
  },
  addComment: async (data: any): Promise<any> => {
    return apiFetch('/api/collaboration/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// WhatsApp Notifications API
export const whatsappReal = {
  send: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const whatsappEnhanced = {
  send: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getTemplates: async (): Promise<any[]> => {
    return apiFetch('/api/whatsapp/templates');
  },
  scheduleReminder: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  sendLocationUpdate: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  sendCastCall: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/cast-call', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const whatsappTemplates = {
  getAll: async (): Promise<any[]> => {
    return apiFetch('/api/whatsapp/templates');
  },
  create: async (data: any): Promise<any> => {
    return apiFetch('/api/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/whatsapp/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/whatsapp/templates/${id}`, { method: 'DELETE' });
  },
};

// Analytics API
export const analytics = {
  getDashboard: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/analytics/dashboard${params}`);
  },
  getMetrics: async (projectId?: string, metric?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (metric) params.append('metric', metric);
    return apiFetch(`/api/analytics/metrics?${params}`);
  },
};

// Production Timeline API
export const productionTimeline = {
  getMilestones: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/timeline/milestones${params}`);
  },
  createMilestone: async (data: any): Promise<any> => {
    return apiFetch('/api/timeline/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateMilestone: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/timeline/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Cast Availability API
export const castAvailability = {
  getAll: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/cast/availability${params}`);
  },
  update: async (id: string, data: any): Promise<any> => {
    return apiFetch(`/api/cast/availability/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Enhanced AI API
export const aiEnhancedV2 = {
  analyze: async (data: any): Promise<any> => {
    return apiFetch('/api/ai/v2/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getInsights: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/ai/v2/insights${params}`);
  },
};

// AI Analysis API
export const aiAnalysis = {
  analyzeScript: async (scriptId: string): Promise<any> => {
    return apiFetch('/api/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({ scriptId }),
    });
  },
  getResults: async (scriptId: string): Promise<any> => {
    return apiFetch(`/api/ai-analysis?scriptId=${scriptId}`);
  },
};

// Script Upload API
export const scriptUpload = {
  upload: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/scripts/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  getVersions: async (scriptId: string): Promise<any[]> => {
    return apiFetch(`/api/scripts/${scriptId}/versions`);
  },
};

// Script Versions API
export const scriptVersions = {
  getAll: async (scriptId: string): Promise<any[]> => {
    return apiFetch(`/api/scripts/${scriptId}/versions`);
  },
  compare: async (scriptId: string, v1: number, v2: number): Promise<any> => {
    return apiFetch(`/api/scripts/${scriptId}/versions/compare`, {
      method: 'POST',
      body: JSON.stringify({ v1, v2 }),
    });
  },
};

// Schedule Recommendations API
export const scheduleRecommendations = {
  get: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/schedule/recommendations${params}`);
  },
  apply: async (recommendationId: string): Promise<any> => {
    return apiFetch('/api/schedule/recommendations/apply', {
      method: 'POST',
      body: JSON.stringify({ recommendationId }),
    });
  },
};

// Collaboration New API
export const collaborationNew = {
  getActivities: async (projectId?: string): Promise<any[]> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch(`/api/collaboration/activities${params}`);
  },
  addComment: async (data: any): Promise<any> => {
    return apiFetch('/api/collaboration/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Default export for backward compatibility
const api = {
  projects,
  scripts,
  scenes,
  characters,
  locations,
  schedule,
  budgetApi,
  crew,
  ai,
  collaboration,
  whatsappReal,
  whatsappEnhanced,
  whatsappTemplates,
  aiEnhancedV2,
  aiAnalysis,
  scriptUpload,
  scriptVersions,
  notifications,
  scheduleRecommendations,
  analytics,
  productionTimeline,
  castAvailability,
  equipment,
  collaborationNew,
  dood,
  exportProject,
  utils,
};

export default api;

// Type re-exports for components that import types from here
export type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  genre?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
};

export type Scene = {
  id: string;
  sceneNumber: string;
  headingRaw: string;
  intExt?: string;
  timeOfDay?: string;
  location?: string;
  scriptId: string;
};

export type Character = {
  id: string;
  name: string;
  nameTamil?: string;
  actorName?: string;
  isMain: boolean;
  description?: string;
  projectId: string;
};

export type Location = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeType?: string;
  score?: number;
  projectId: string;
};

export type CrewMember = {
  id: string;
  name: string;
  role: string;
  department?: string;
  phone?: string;
  email?: string;
  dailyRate?: number;
  notes?: string;
  projectId: string;
};

export type Schedule = {
  id: string;
  dayNumber: number;
  scheduledDate: string;
  callTime?: string;
  locationId?: string;
  status: string;
  projectId: string;
};

export type Activity = {
  id: string;
  type: string;
  description: string;
  userId?: string;
  projectId: string;
  createdAt: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  projectId: string;
  assignedTo?: string;
};

export type ProjectExpenses = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  status: string;
  projectId: string;
};

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  projectId: string;
};

export type CastMember = {
  id: string;
  name: string;
  actorName?: string;
  role: string;
  isMain: boolean;
  availability?: string[];
  projectId: string;
};

export type EquipmentCategory = {
  id: string;
  name: string;
  description?: string;
  items?: any[];
};

export type ScriptVersion = {
  id: string;
  versionNumber: number;
  changeNote?: string;
  createdAt: string;
  scriptId: string;
};

export type ScheduleReminderRequest = {
  projectId: string;
  shootingDayId: string;
  recipient: string;
  message: string;
  sendAt?: string;
};

export type LocationUpdateRequest = {
  projectId: string;
  shootingDayId: string;
  recipients: string[];
  location: string;
  address?: string;
  notes?: string;
};

export type CastCallRequest = {
  projectId: string;
  character: string;
  description: string;
  requirements: string;
  shootDates: string[];
  recipients: string[];
};

export type ScriptUploadResult = {
  id: string;
  title: string;
  sceneCount: number;
  characterCount: number;
  version: number;
};

export type MultiScriptResult = {
  scripts: ScriptUploadResult[];
  totalScenes: number;
  totalCharacters: number;
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
  variables?: string[];
};
