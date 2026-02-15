/**
 * CinePilot Enhanced Components - Phase 29
 * Advanced UI components for real-time collaboration and project management
 */

import React, { useState, useEffect } from 'react';

// ============ Collaboration Components ============

interface CollaboratorAvatarProps {
  name: string;
  role: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export function CollaboratorAvatar({ name, role, avatarUrl, isOnline }: CollaboratorAvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div className="relative inline-block">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      )}
    </div>
  );
}

interface CollaboratorListProps {
  collaborators: Array<{
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    isOnline?: boolean;
  }>;
}

export function CollaboratorList({ collaborators }: CollaboratorListProps) {
  return (
    <div className="flex -space-x-2">
      {collaborators.map((collaborator) => (
        <div key={collaborator.id} className="relative" title={`${collaborator.name} - ${collaborator.role}`}>
          <CollaboratorAvatar {...collaborator} />
        </div>
      ))}
      {collaborators.length > 5 && (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold">
          +{collaborators.length - 5}
        </div>
      )}
    </div>
  );
}

// ============ Activity Feed Component ============

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'comment';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ActivityFeed({ activities, onLoadMore, hasMore }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create': return '✨';
      case 'update': return '📝';
      case 'delete': return '🗑️';
      case 'comment': return '💬';
      default: return '📌';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-xl">{getActivityIcon(activity.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{activity.user}</span>{' '}
              <span className="text-gray-600">{activity.action}</span>{' '}
              <span className="font-medium text-gray-800">{activity.target}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
          </div>
        </div>
      ))}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Load more
        </button>
      )}
    </div>
  );
}

// ============ Real-time Status Badge ============

interface RealtimeStatusProps {
  isConnected: boolean;
  lastSync?: string;
}

export function RealtimeStatus({ isConnected, lastSync }: RealtimeStatusProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
      <span className="text-gray-600">
        {isConnected ? 'Live' : 'Offline'}
        {lastSync && !isConnected && ` · Synced ${lastSync}`}
      </span>
    </div>
  );
}

// ============ Project Timeline Component ============

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
  description?: string;
}

interface ProjectTimelineProps {
  events: TimelineEvent[];
}

export function ProjectTimeline({ events }: ProjectTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex items-start gap-4">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
              event.status === 'completed' ? 'bg-green-500 text-white' :
              event.status === 'in-progress' ? 'bg-indigo-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {event.status === 'completed' ? '✓' : event.status === 'in-progress' ? '●' : '○'}
            </div>
            <div className="flex-1 pb-6">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              <p className="text-sm text-gray-500">{event.date}</p>
              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Budget Tracker Component ============

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

interface BudgetTrackerProps {
  categories: BudgetCategory[];
  totalBudget: number;
}

export function BudgetTracker({ categories, totalBudget }: BudgetTrackerProps) {
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const percentage = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Total Budget</span>
        <span className="text-sm text-gray-600">
          ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
        </span>
      </div>
      
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const catPercentage = (category.spent / category.allocated) * 100;
          return (
            <div key={category.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{category.name}</span>
                <span className="text-gray-500">
                  ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(catPercentage, 100)}%`, backgroundColor: category.color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Scene Board Component ============

interface SceneBoardProps {
  scenes: Array<{
    id: string;
    title: string;
    status: string;
    location?: string;
    dayNight?: string;
  }>;
  onDragStart?: (sceneId: string) => void;
  onDrop?: (sceneId: string, newStatus: string) => void;
}

export function SceneBoard({ scenes, onDragStart, onDrop }: SceneBoardProps) {
  const columns = [
    { id: 'scripted', title: 'Scripted', color: 'bg-blue-100 border-blue-300' },
    { id: 'ready', title: 'Ready to Shoot', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'filming', title: 'Filming', color: 'bg-green-100 border-green-300' },
    { id: 'completed', title: 'Completed', color: 'bg-gray-100 border-gray-300' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.id} className={`rounded-lg border-2 p-3 ${column.color}`}>
          <h3 className="font-semibold text-gray-800 mb-3">{column.title}</h3>
          <div className="space-y-2 min-h-[200px]">
            {scenes
              .filter((scene) => scene.status === column.id)
              .map((scene) => (
                <div
                  key={scene.id}
                  draggable
                  onDragStart={() => onDragStart?.(scene.id)}
                  onDragEnd={(e) => {
                    if (onDrop) {
                      e.preventDefault();
                      onDrop(scene.id, column.id);
                    }
                  }}
                  className="bg-white p-3 rounded shadow-sm cursor-move hover:shadow-md transition-shadow"
                >
                  <h4 className="font-medium text-sm text-gray-800">{scene.title}</h4>
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    {scene.location && <span>📍 {scene.location}</span>}
                    {scene.dayNight && <span>🌙 {scene.dayNight}</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Export Modal Component ============

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
  projectName: string;
}

export function ExportModal({ isOpen, onClose, onExport, projectName }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('json');
  
  const formats = [
    { id: 'json', name: 'JSON', description: 'Full project data with all metadata', icon: '📦' },
    { id: 'csv', name: 'CSV', description: 'Spreadsheet-compatible scene list', icon: '📊' },
    { id: 'pdf', name: 'PDF', description: 'Print-ready production document', icon: '📄' },
    { id: 'xlsx', name: 'Excel', description: 'Multi-sheet workbook with budgets', icon: '📈' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Export Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">Export "{projectName}" as:</p>
        
        <div className="space-y-2">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedFormat === format.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{format.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{format.name}</h3>
                  <p className="text-sm text-gray-500">{format.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(selectedFormat)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Quick Actions Component ============

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
          {action.shortcut && (
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
              {action.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============ Search & Filter Component ============

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: Array<{
    label: string;
    value: string;
    count?: number;
  }>;
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
}

export function SearchFilter({ search, onSearchChange, filters, selectedFilter, onFilterChange }: SearchFilterProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      {filters && onFilterChange && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span className="ml-1 opacity-75">({filter.count})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Toast Notification Component ============

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles[type]} animate-slide-up`}>
      <span>{icons[type]}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ============ Phase 29 Dashboard Component ============

interface Phase29DashboardProps {
  stats: {
    projects: number;
    scenes: number;
    crew: number;
    budget: number;
  };
  recentActivities: ActivityItem[];
  collaborators: Array<{ id: string; name: string; role: string; isOnline: boolean }>;
}

export function Phase29Dashboard({ stats, recentActivities, collaborators }: Phase29DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-indigo-600">{stats.projects}</div>
          <div className="text-sm text-gray-500">Active Projects</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.scenes}</div>
          <div className="text-sm text-gray-500">Total Scenes</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.crew}</div>
          <div className="text-sm text-gray-500">Crew Members</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">${(stats.budget / 100000).toFixed(1)}L</div>
          <div className="text-sm text-gray-500">Total Budget</div>
        </div>
      </div>

      {/* Activity & Collaborators */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <ActivityFeed activities={recentActivities.slice(0, 5)} />
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Team</h3>
          <div className="space-y-3">
            {collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center gap-3">
                <CollaboratorAvatar name={collab.name} role={collab.role} isOnline={collab.isOnline} />
                <div>
                  <div className="font-medium text-gray-900">{collab.name}</div>
                  <div className="text-xs text-gray-500">{collab.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Team Workload Component ============

interface TeamMember {
  name: string;
  role: string;
  tasks: number;
  capacity: number;
}

interface TeamWorkloadProps {
  members: TeamMember[];
}

export function TeamWorkload({ members }: TeamWorkloadProps) {
  return (
    <div className="space-y-4">
      {members.map((member, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-white">{member.name}</div>
              <div className="text-xs text-gray-400">{member.role}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">{member.tasks} tasks</div>
              <div className={`text-xs ${member.capacity > 80 ? 'text-red-400' : 'text-green-400'}`}>
                {member.capacity}% capacity
              </div>
            </div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${member.capacity > 80 ? 'bg-red-500' : member.capacity > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(member.capacity, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Collaboration Stats Component ============

interface CollaborationStatsProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  trend: 'up' | 'down';
}

export function CollaborationStats({ title, value, change, icon, trend }: CollaborationStatsProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className={`text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
}

export default {
  CollaboratorAvatar,
  CollaboratorList,
  ActivityFeed,
  RealtimeStatus,
  ProjectTimeline,
  TeamWorkload,
  CollaborationStats,
  BudgetTracker,
  SceneBoard,
  ExportModal,
  QuickActions,
  SearchFilter,
  Toast,
  Phase29Dashboard,
};
