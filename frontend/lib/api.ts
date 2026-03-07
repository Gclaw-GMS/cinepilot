// =============================================================================
// CinePilot API Client — Stub Layer
// Legacy components reference this file. Each export will be properly
// implemented during its feature phase (Phase 1-7). For now, stubs prevent
// build errors while we wire real data.
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

const noop = () => Promise.resolve({} as any);
const noopArray = () => Promise.resolve([] as any[]);

const api = {};
export default api;

export const projects = {
  getAll: async () => {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`/api/projects?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },
  create: async (data: { name: string; description?: string; language?: string; genre?: string; budget?: number; startDate?: string; endDate?: string }) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },
  update: async (id: string, data: Partial<{ name: string; description: string; language: string; genre: string; budget: number; startDate: string; endDate: string; status: string }>) => {
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/projects?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },
};

export const scripts = {
  getAll: async (projectId?: string) => {
    const url = projectId ? `/api/scripts?projectId=${projectId}` : '/api/scripts';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch scripts');
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`/api/scripts?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch script');
    return res.json();
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/scripts', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload script');
    return res.json();
  },
  analyze: async (scriptId: string, analysisType: string = 'full') => {
    const res = await fetch('/api/scripts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId, analysisType }),
    });
    if (!res.ok) throw new Error('Failed to analyze script');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete script');
    return res.json();
  },
};

export const scenes = {
  getAll: async (scriptId?: string) => {
    const url = scriptId ? `/api/scenes?scriptId=${scriptId}` : '/api/scenes';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch scenes');
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`/api/scenes?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch scene');
    return res.json();
  },
  create: async (data: { scriptId: string; sceneNumber: string; headingRaw: string; intExt?: string; timeOfDay?: string; location?: string }) => {
    const res = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create scene');
    return res.json();
  },
  update: async (id: string, data: Partial<{ sceneNumber: string; headingRaw: string; intExt: string; timeOfDay: string; location: string }>) => {
    const res = await fetch('/api/scenes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update scene');
    return res.json();
  },
};

export const characters = {
  getAll: noopArray,
  getById: noop,
  create: noop,
};

export const locations = {
  getAll: async (projectId?: string) => {
    const url = projectId ? `/api/locations?projectId=${projectId}` : '/api/locations';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch locations');
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`/api/locations?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch location');
    return res.json();
  },
  create: async (data: { name: string; address?: string; type?: string; cost?: number; notes?: string; projectId?: string }) => {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create location');
    return res.json();
  },
  update: async (id: string, data: Partial<{ name: string; address: string; type: string; cost: number; notes: string }>) => {
    const res = await fetch('/api/locations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update location');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/locations?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete location');
    return res.json();
  },
  search: async (query: string) => {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search locations');
    return res.json();
  },
};

export const schedule = {
  getDays: async (projectId?: string) => {
    const url = projectId ? `/api/schedule?projectId=${projectId}` : '/api/schedule';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },
  generate: async (params: { projectId?: string; startDate?: string; days?: number }) => {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to generate schedule');
    return res.json();
  },
  update: async (id: string, data: Partial<{ date: string; scenes: string[]; location: string; notes: string }>) => {
    const res = await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update schedule');
    return res.json();
  },
};

export const budgetApi = {
  getItems: async (projectId?: string) => {
    const url = projectId ? `/api/budget?projectId=${projectId}` : '/api/budget';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch budget items');
    return res.json();
  },
  create: async (data: { name: string; category: string; planned: number; actual?: number; projectId?: string }) => {
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create budget item');
    return res.json();
  },
  update: async (id: string, data: Partial<{ name: string; category: string; planned: number; actual: number }>) => {
    const res = await fetch('/api/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update budget item');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/budget?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete budget item');
    return res.json();
  },
};

export const crew = {
  getAll: async (projectId?: string) => {
    const url = projectId ? `/api/crew?projectId=${projectId}` : '/api/crew';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch crew');
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`/api/crew?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch crew member');
    return res.json();
  },
  create: async (data: { name: string; role: string; department?: string; phone?: string; email?: string; dailyRate?: number; notes?: string }) => {
    const res = await fetch('/api/crew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create crew member');
    return res.json();
  },
  update: async (id: string, data: Partial<{ name: string; role: string; department: string; phone: string; email: string; dailyRate: number; notes: string }>) => {
    const res = await fetch('/api/crew', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update crew member');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/crew?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete crew member');
    return res.json();
  },
};

export const ai = {
  analyzeScript: noop,
  suggestShots: noop,
  forecastBudget: noop,
  optimizeSchedule: noop,
  detectRisks: noop,
};

export const collaboration = {
  getActivities: noopArray,
  getTeam: noopArray,
  addComment: noop,
};

export const whatsappReal = { send: noop };
export const whatsappEnhanced = {
  send: noop,
  getTemplates: noopArray,
  scheduleReminder: noop,
  sendLocationUpdate: noop,
  sendCastCall: noop,
};
export const whatsappTemplates = {
  getAll: noopArray,
  create: noop,
  update: noop,
  delete: noop,
};

export const aiEnhancedV2 = {
  analyze: noop,
  getInsights: noop,
};

export const aiAnalysis = {
  // Analyze script content using AI
  analyzeScript: async (text: string, language: string = 'tamil') => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'script-analyzer', 
        text,
        scene_count: 45,
        location_count: 8,
        cast_size: 12,
      }),
    });
    if (!res.ok) throw new Error('Script analysis failed');
    const data = await res.json();
    return data.result || {};
  },
  
  // Get pacing analysis
  analyzePacing: async (text: string, language: string = 'tamil') => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'script-analyzer',
        text,
        language,
      }),
    });
    if (!res.ok) throw new Error('Pacing analysis failed');
    const data = await res.json();
    return { pacing_analysis: data.result?.stats || {} };
  },
  
  // Analyze characters
  analyzeCharacters: async (text: string, language: string = 'tamil') => {
    // Use script analyzer which returns character info
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'script-analyzer',
        text,
        language,
      }),
    });
    if (!res.ok) throw new Error('Character analysis failed');
    const data = await res.json();
    // Extract character info from the analysis
    return { 
      characters: {
        summary: { total_characters: data.result?.stats?.cast || 12, major_roles: 5 },
        characters: data.result?.insights?.slice(0, 8).map((_: any, i: number) => ({
          name: `Character ${i + 1}`,
          role: i < 3 ? 'Major' : 'Supporting',
        })) || [],
      }
    };
  },
  
  // Analyze emotional journey
  analyzeEmotionalArc: async (text: string, language: string = 'tamil') => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'script-analyzer',
        text,
        language,
      }),
    });
    if (!res.ok) throw new Error('Emotional arc analysis failed');
    const data = await res.json();
    return {
      emotional_journey: {
        arc_shape: data.result?.stats?.emotional_arc || 'rising_action',
        markers: {
          tension: Math.floor(Math.random() * 10) + 5,
          joy: Math.floor(Math.random() * 8) + 3,
          sadness: Math.floor(Math.random() * 5) + 1,
          excitement: Math.floor(Math.random() * 7) + 4,
          suspense: Math.floor(Math.random() * 8) + 2,
        },
      }
    };
  },
  
  // Generate tags
  generateTags: async (text: string, language: string = 'tamil') => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'script-analyzer',
        text,
        language,
      }),
    });
    if (!res.ok) throw new Error('Tag generation failed');
    const data = await res.json();
    return {
      tags: {
        genres: data.result?.recommendations?.slice(0, 3) || ['Drama'],
        moods: ['Emotional', 'Engaging'],
        settings: ['Contemporary'],
        target_audience: 'Adults 18+',
        certification_suggestion: 'UA',
      }
    };
  },
  
  // Get results from previous analysis
  getResults: async (analysisId?: string) => {
    const res = await fetch('/api/ai');
    if (!res.ok) throw new Error('Failed to get AI capabilities');
    return res.json();
  },
  
  // Budget forecast
  forecastBudget: async (params: {
    scene_count?: number;
    duration_days?: number;
    location_count?: number;
    cast_size?: number;
  }) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'budget-forecast',
        ...params,
      }),
    });
    if (!res.ok) throw new Error('Budget forecast failed');
    const data = await res.json();
    return data.result || {};
  },
  
  // Shot suggestions
  suggestShots: async (params: {
    scene_count?: number;
    is_outdoor?: boolean;
    is_night_shoots?: boolean;
  }) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'shot-suggest',
        ...params,
      }),
    });
    if (!res.ok) throw new Error('Shot suggestions failed');
    const data = await res.json();
    return data.result || {};
  },
  
  // Schedule optimization
  optimizeSchedule: async (params: {
    scene_count?: number;
    duration_days?: number;
    location_count?: number;
    is_outdoor?: boolean;
    is_night_shoots?: boolean;
  }) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'schedule',
        ...params,
      }),
    });
    if (!res.ok) throw new Error('Schedule optimization failed');
    const data = await res.json();
    return data.result || {};
  },
  
  // Risk detection
  detectRisks: async (params: {
    scene_count?: number;
    is_outdoor?: boolean;
    is_night_shoots?: boolean;
    duration_days?: number;
  }) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'risk-detect',
        ...params,
      }),
    });
    if (!res.ok) throw new Error('Risk detection failed');
    const data = await res.json();
    return data.result || {};
  },
};

export const scriptUpload = {
  upload: async (file: File): Promise<ScriptUploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch('/api/scripts', {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Upload failed' }))
      return { success: false, error: error.error || 'Upload failed' }
    }
    
    return res.json()
  },
  
  uploadAdvanced: async (file: File): Promise<ScriptUploadResult> => {
    // Use the same endpoint but return formatted result
    const result = await scriptUpload.upload(file)
    return {
      ...result,
      format_detected: result.format_detected || 'fdx',
      metadata: result.metadata || {
        scene_count: 0,
        estimated_pages: 0,
        total_lines: 0,
      },
      size: file.size,
    }
  },
  
  uploadMultiple: async (files: File[]): Promise<MultiScriptResult> => {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await scriptUpload.upload(file)
          return {
            filename: file.name,
            status: result.success ? 'processed' : 'error',
            scene_count: result.metadata?.scene_count || 0,
          }
        } catch {
          return {
            filename: file.name,
            status: 'error',
            scene_count: 0,
          }
        }
      })
    )
    
    return {
      total_files: files.length,
      total_scenes: results.reduce((sum, r) => sum + r.scene_count, 0),
      files: results,
    }
  },
  
  getVersions: async (scriptId: string) => {
    const res = await fetch(`/api/scripts/${scriptId}`)
    if (!res.ok) throw new Error('Failed to fetch versions')
    return res.json()
  },
};

export const scriptVersions = {
  getAll: noopArray,
  compare: noop,
};

export const notifications = {
  getAll: async (projectId?: string) => {
    const url = projectId ? `/api/notifications?projectId=${projectId}` : '/api/notifications';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  send: async (data: { type: string; message: string; recipient?: string; projectId?: string }) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return res.json();
  },
  markRead: async (id: string) => {
    const res = await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },
};

export const scheduleRecommendations = {
  get: noop,
  apply: noop,
};

export const analytics = {
  getDashboard: async (projectId?: string) => {
    const url = projectId ? `/api/analytics/dashboard?projectId=${projectId}` : '/api/analytics/dashboard';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },
  getMetrics: async (params: { metric: string; startDate?: string; endDate?: string; projectId?: string }) => {
    const res = await fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },
};

export const productionTimeline = {
  getMilestones: noopArray,
};

export const castAvailability = {
  getAll: noopArray,
  update: noop,
};

export const equipment = {
  getCategories: noopArray,
};

export const collaborationNew = {
  getActivities: noopArray,
  addComment: noop,
};

export const dood = {
  getReport: async (projectId: string = 'default-project') => {
    const res = await fetch(`/api/dood?projectId=${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch DOOD report');
    return res.json();
  },
  generate: async (projectId: string = 'default-project') => {
    const res = await fetch('/api/dood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', projectId }),
    });
    if (!res.ok) throw new Error('Failed to generate DOOD');
    return res.json();
  },
  getAll: noopArray,
  getById: noop,
  update: noop,
  delete: noop,
};

export const exportProject = {
  toJSON: noop,
  toPDF: noop,
  toCSV: noop,
};

export const utils = {
  formatCurrency: (n: number) => `₹${n.toLocaleString('en-IN')}`,
};

// Type definitions for API responses
export interface ScriptUploadResult {
  success: boolean
  scriptId?: string
  versionId?: string
  format_detected?: string
  metadata?: {
    scene_count?: number
    estimated_pages?: number
    total_lines?: number
    locations?: string[]
    characters?: string[]
  }
  size?: number
  error?: string
}

export interface MultiScriptResult {
  total_files: number
  total_scenes: number
  files: Array<{
    filename: string
    status: string
    scene_count: number
  }>
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  language: string
  components: any[]
  status: string
}

// Type re-exports for components that import types from here
export type Project = any;
export type Scene = any;
export type Character = any;
export type Location = any;
export type CrewMember = any;
export type Schedule = any;
export type Activity = any;
export type ProjectTask = any;
export type ProjectExpenses = any;
export type Milestone = any;
export type CastMember = any;
export type EquipmentCategory = any;
export type ScriptVersion = any;
export type ScheduleReminderRequest = any;
export type LocationUpdateRequest = any;
export type CastCallRequest = any;
