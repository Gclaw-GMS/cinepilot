// CinePilot TypeScript Types

// Base Types
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Project Types
export interface Project {
  id: number
  name: string
  description: string | null
  language: string
  status: 'planning' | 'pre-production' | 'shooting' | 'post-production' | 'completed'
  budget: number | null
  created_at: string
}

export interface ProjectCreate {
  name: string
  description?: string
  language?: string
  budget?: number
}

// Scene Types
export interface Scene {
  id: number
  project_id?: number
  scene_number: number
  heading: string | null
  location: string | null
  location_tamil: string | null
  time_of_day: string | null
  interior_exterior: 'INT' | 'EXT' | null
  description: string | null
}

export interface SceneCreate {
  scene_number: number
  heading?: string
  location?: string
  location_tamil?: string
  time_of_day?: string
  interior_exterior?: string
  description?: string
}

// Character Types
export interface Character {
  id: number
  name: string
  tamil: string | null
  actor: string | null
  role: string
  description?: string
}

export interface CharacterCreate {
  name: string
  tamil?: string
  actor?: string
  role: string
  description?: string
}

// Location Types
export interface Location {
  id: number
  name: string
  tamil: string | null
  type: 'indoor' | 'outdoor' | 'religious' | 'commercial' | 'residential'
  address: string
  notes?: string
}

export interface LocationCreate {
  name: string
  tamil?: string
  type: string
  address: string
  notes?: string
}

// Crew Types
export interface CrewMember {
  id: number
  name: string
  role: string
  department: string
  email?: string
  phone?: string
  daily_rate?: number
}

export interface CrewMemberCreate {
  name: string
  role: string
  department: string
  email?: string
  phone?: number
  daily_rate?: number
}

// Schedule Types
export interface ScheduleDay {
  day: number
  scenes: Scene[]
  location: Location | null
  estimated_hours: number
  notes?: string
}

export interface Schedule {
  schedule: ScheduleDay[]
}

// Call Sheet Types
export interface CallSheet {
  project: string
  date: string
  call_time: string
  location: string
  scenes: string[]
  weather?: string
  crew: CallSheetCrew[]
}

export interface CallSheetCrew {
  name: string
  call_time: string
  role?: string
}

// DOOD Types
export interface DOODReport {
  character: string
  total_days: number
  days: number[]
}

// Budget Types
export interface BudgetCategory {
  name: string
  estimated: number
  actual: number
}

export interface BudgetItem {
  item: string
  estimated: number
  actual: number
}

export interface Budget {
  total: number
  categories: BudgetCategory[]
  top_items: BudgetItem[]
}

// AI Analysis Types
export interface ScriptAnalysis {
  total_scenes: number
  total_locations: number
  total_characters: number
  estimated_shooting_days: number
  estimated_budget: number
  tags: string[]
  safety_warnings: string[]
  cultural_notes: string[]
}

export interface TamilScriptAnalysis {
  summary: {
    total_scenes: number
    total_pages: number
    estimated_runtime: string
  }
  locations: Array<{
    name: string
    tamil: string
    count: number
    suggested_days: number
  }>
  characters: Array<{
    name: string
    tamil: string
    scenes: number
    dialogue_lines: number
  }>
  tags: {
    genres: string[]
    moods: string[]
    themes: string[]
  }
  technical: {
    day_scenes: number
    night_scenes: number
    int_scenes: number
    ext_scenes: number
    vfx_shots: number
    stunt_scenes: number
  }
  cultural_notes: string[]
  safety_warnings: Array<{
    scene: number
    type: string
    description: string
  }>
}

export interface ShotListItem {
  shot_type: string
  description: string
  camera: string
  lens: string
}

export interface ShotList {
  shots: ShotListItem[]
}

export interface BudgetEstimate {
  estimated_total: number
  breakdown: {
    pre_production: number
    production: number
    post_production: number
    contingency: number
  }
}

// File Upload Types
export interface UploadedFile {
  filename: string
  path: string
  size: number
  text_preview: string
}

// Scene Elements
export interface SceneElement {
  id: number
  type: 'cast' | 'crew' | 'prop' | 'costume' | 'location' | 'vehicle'
  name: string
  speaking?: boolean
  notes?: string
}
