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
  getAll: noopArray,
  getById: noop,
  create: noop,
  update: noop,
  delete: noop,
};

export const scripts = {
  getAll: noopArray,
  getById: noop,
  upload: noop,
  analyze: noop,
};

export const scenes = {
  getAll: noopArray,
  getById: noop,
  create: noop,
  update: noop,
};

export const characters = {
  getAll: noopArray,
  getById: noop,
  create: noop,
};

export const locations = {
  getAll: noopArray,
  getById: noop,
  create: noop,
  search: noopArray,
};

export const schedule = {
  getDays: noopArray,
  generate: noop,
  update: noop,
};

export const budgetApi = {
  getItems: noopArray,
  create: noop,
  update: noop,
};

export const crew = {
  getAll: noopArray,
  create: noop,
  update: noop,
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
  analyzeScript: noop,
  getResults: noop,
};

export const scriptUpload = {
  upload: noop,
  getVersions: noopArray,
};

export const scriptVersions = {
  getAll: noopArray,
  compare: noop,
};

export const notifications = {
  getAll: noopArray,
  send: noop,
};

export const scheduleRecommendations = {
  get: noop,
  apply: noop,
};

export const analytics = {
  getDashboard: noop,
  getMetrics: noop,
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
export type ScriptUploadResult = any;
export type MultiScriptResult = any;
export type WhatsAppTemplate = any;
