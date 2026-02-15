// Phase 30 API Client - Production Timeline & Analytics
// CinePilot API Extensions

export interface TimelineEvent {
  id: string;
  type: 'scene' | 'location' | 'crew' | 'equipment' | 'milestone';
  title: string;
  date: string;
  endDate?: string;
  projectId: string;
  metadata?: Record<string, any>;
}

export interface ProjectStats {
  totalScenes: number;
  completedScenes: number;
  totalBudget: number;
  spentBudget: number;
  totalLocations: number;
  totalCrew: number;
  shootingDays: number;
  progress: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
}

export interface DayPlan {
  id: string;
  date: string;
  scenes: string[];
  locations: string[];
  callTime: string;
  wrapTime: string;
  notes: string;
}

// Timeline API
export async function getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/timeline`);
    return res.json();
  } catch {
    return [];
  }
}

export async function createTimelineEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
  const res = await fetch('/api/timeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return res.json();
}

// Project Stats API
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  try {
    const res = await fetch(`/api/projects/${projectId}/stats`);
    return res.json();
  } catch {
    return {
      totalScenes: 0,
      completedScenes: 0,
      totalBudget: 0,
      spentBudget: 0,
      totalLocations: 0,
      totalCrew: 0,
      shootingDays: 0,
      progress: 0,
    };
  }
}

// Day Plans API
export async function getDayPlans(projectId: string): Promise<DayPlan[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/day-plans`);
    return res.json();
  } catch {
    return [];
  }
}

export async function createDayPlan(plan: Omit<DayPlan, 'id'>): Promise<DayPlan> {
  const res = await fetch('/api/day-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  return res.json();
}

// Quick Actions
export const quickActions: QuickAction[] = [
  { id: '1', label: 'New Scene', icon: '🎬', route: '/scenes', color: 'bg-blue-500' },
  { id: '2', label: 'Add Crew', icon: '👥', route: '/crew', color: 'bg-green-500' },
  { id: '3', label: 'Schedule', icon: '📅', route: '/schedule', color: 'bg-purple-500' },
  { id: '4', label: 'Budget', icon: '💰', route: '/budget', color: 'bg-yellow-500' },
  { id: '5', label: 'Export', icon: '📤', route: '/exports', color: 'bg-orange-500' },
  { id: '6', label: 'Reports', icon: '📊', route: '/reports', color: 'bg-pink-500' },
];

// Phase 30: Timeline visualization types
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'pre-production' | 'production' | 'post-production';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface LocationCluster {
  id: string;
  name: string;
  sceneIds: string[];
  totalDays: number;
  estimatedCost: number;
}

// Analytics enhancements
export interface BurnRate {
  date: string;
  amount: number;
  cumulative: number;
}

export interface ResourceUtilization {
  resource: string;
  utilization: number;
  daysUsed: number;
}

export async function getBurnRate(projectId: string): Promise<BurnRate[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/burn-rate`);
    return res.json();
  } catch {
    return [];
  }
}

export async function getResourceUtilization(projectId: string): Promise<ResourceUtilization[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/resource-utilization`);
    return res.json();
  } catch {
    return [];
  }
}
