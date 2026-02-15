// CinePilot API - Phase 24 Extensions
// Extended API client for Phase 24 features

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
  return res.json()
}

async function fetchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
  return res.json()
}

// ============== Script Upload ==============

export interface ScriptUploadResult {
  filename: string
  size: number
  format_detected: string
  parsing_result: {
    scenes: any[]
    format: string
    scene_count: number
  }
  metadata: {
    scene_count: number
    total_lines: number
    estimated_pages: number
    locations: string[]
  }
}

export interface MultiScriptResult {
  files: {
    filename: string
    size: number
    status: string
    scene_count: number
    format?: string
  }[]
  total_files: number
  total_scenes: number
}

export const scriptUpload = {
  // Upload single script with advanced parsing
  uploadAdvanced: async (file: File): Promise<ScriptUploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchFormData('/api/upload/script-advanced', formData)
  },
  
  // Upload multiple scripts
  uploadMultiple: async (files: File[]): Promise<MultiScriptResult> => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    return fetchFormData('/api/upload/multi', formData)
  },
  
  // Upload single script (basic)
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchFormData('/api/upload/script', formData)
  }
}

// ============== WhatsApp Templates ==============

export interface WhatsAppTemplate {
  name: string
  template: string
  variables: string[]
}

export interface WhatsAppSendRequest {
  template_name: string
  recipient: string
  variables: Record<string, string>
}

export interface WhatsAppBatchRequest {
  template_name: string
  recipients: { phone: string; variables: Record<string, string> }[]
}

export const whatsappTemplates = {
  // Get all templates
  list: (): Promise<{ templates: Record<string, WhatsAppTemplate> }> =>
    fetchAPI('/api/whatsapp/templates'),
  
  // Get specific template
  get: (name: string): Promise<WhatsAppTemplate> =>
    fetchAPI(`/api/whatsapp/templates/${name}`),
  
  // Send single template message
  send: (request: WhatsAppSendRequest) =>
    fetchAPI('/api/whatsapp/send-template', { method: 'POST', body: JSON.stringify(request) }),
  
  // Send batch template messages
  sendBatch: (request: WhatsAppBatchRequest) =>
    fetchAPI('/api/whatsapp/batch-template', { method: 'POST', body: JSON.stringify(request) }),
  
  // Quick send with pre-defined variables
  sendScheduleReminder: (recipient: string, data: Record<string, string>) =>
    fetchAPI('/api/whatsapp/send-template', {
      method: 'POST',
      body: JSON.stringify({
        template_name: 'schedule_reminder',
        recipient,
        variables: data
      })
    }),
  
  sendLocationUpdate: (recipient: string, data: Record<string, string>) =>
    fetchAPI('/api/whatsapp/send-template', {
      method: 'POST',
      body: JSON.stringify({
        template_name: 'location_update',
        recipient,
        variables: data
      })
    }),
  
  sendCastCall: (recipient: string, data: Record<string, string>) =>
    fetchAPI('/api/whatsapp/send-template', {
      method: 'POST',
      body: JSON.stringify({
        template_name: 'cast_call',
        recipient,
        variables: data
      })
    }),
  
  sendBudgetAlert: (recipient: string, data: Record<string, string>) =>
    fetchAPI('/api/whatsapp/send-template', {
      method: 'POST',
      body: JSON.stringify({
        template_name: 'budget_alert',
        recipient,
        variables: data
      })
    })
}

// ============== Enhanced AI Analysis ==============

export const aiAnalysis = {
  // Analyze dialogue density
  analyzeDialogueDensity: (content: string) =>
    fetchAPI('/api/ai/analyze-dialogue-density', {
      method: 'POST',
      body: JSON.stringify({ content })
    }),
  
  // Analyze visual flow
  analyzeVisualFlow: (scenes: any[]) =>
    fetchAPI('/api/ai/analyze-visual-flow', {
      method: 'POST',
      body: JSON.stringify({ scenes })
    }),
  
  // Suggest continuity improvements
  suggestContinuity: (scenes: any[]) =>
    fetchAPI('/api/ai/suggest-continuity', {
      method: 'POST',
      body: JSON.stringify({ scenes })
    }),
  
  // Generate scene summary
  generateSceneSummary: (scene: any) =>
    fetchAPI('/api/ai/generate-scene-summary', {
      method: 'POST',
      body: JSON.stringify({ scene })
    })
}

// ============== Project Import/Export ==============

export const projectIO = {
  // Export project
  export: (projectId: number, format: 'json' | 'csv' = 'json') =>
    fetchAPI(`/api/projects/${projectId}/export?format=${format}`),
  
  // Import project
  import: (data: any) =>
    fetchAPI('/api/projects/import', { method: 'POST', body: JSON.stringify(data) }),
  
  // Export as JSON
  exportJSON: (projectId: number) =>
    fetchAPI(`/api/projects/${projectId}/export?format=json`),
  
  // Export as CSV
  exportCSV: (projectId: number) =>
    fetchAPI(`/api/projects/${projectId}/export?format=csv`)
}

// ============== Analytics ==============

export interface ProjectAnalytics {
  project_id: number
  scenes: {
    total: number
    completed: number
    pending: number
    completion_rate: number
  }
  pages: {
    total: number
    shot: number
    remaining: number
  }
  budget: {
    crew_daily_rate: number
    total_spent: number
    estimated_remaining_days: number
    daily_burn_rate: number
  }
  crew: {
    total: number
    by_department: Record<string, number>
  }
}

export const analytics = {
  // Get comprehensive project analytics
  getProjectAnalytics: (projectId: number): Promise<ProjectAnalytics> =>
    fetchAPI(`/api/analytics/project/${projectId}`)
}

// ============== Crew Management ==============

export interface AvailableCrew {
  id: number
  name: string
  role: string
  department: string
  daily_rate: number
  available: boolean
  next_assignment: string | null
}

export const crewManagement = {
  // Get available crew between dates
  getAvailable: (startDate: string, endDate: string): Promise<{ crew: AvailableCrew[]; count: number }> =>
    fetchAPI(`/api/crew/available?start_date=${startDate}&end_date=${endDate}`),
  
  // Assign crew to project
  assign: (crewId: number, projectId: number, dates: string[]) =>
    fetchAPI('/api/crew/assign', {
      method: 'POST',
      body: JSON.stringify({ crew_id: crewId, project_id: projectId, dates })
    })
}

// ============== Connection Status ==============

export interface ConnectionStatus {
  backend_connected: boolean
  api_latency_ms: number
  last_sync: string
  websocket_status: string
}

export const connection = {
  check: (): Promise<ConnectionStatus> =>
    fetchAPI('/api/status/connection')
}
