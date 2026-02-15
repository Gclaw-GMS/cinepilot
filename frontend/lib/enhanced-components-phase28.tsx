// Enhanced UI Components for CinePilot - Phase 28
import React from 'react';

// Project Card Component
interface ProjectCardProps {
  id: number;
  title: string;
  genre: string;
  budget: number;
  status: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed';
  onClick?: () => void;
}

export function ProjectCard({ title, genre, budget, status, onClick }: ProjectCardProps) {
  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    'pre-production': 'bg-yellow-100 text-yellow-800',
    production: 'bg-orange-100 text-orange-800',
    'post-production': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
          {status.replace('-', ' ')}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>{genre}</span>
        <span className="font-medium">${budget.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Scene Card Component
interface SceneCardProps {
  sceneNumber: string;
  title: string;
  location: string;
  characters: string[];
  duration: number;
  completed?: boolean;
  onClick?: () => void;
}

export function SceneCard({ sceneNumber, title, location, characters, duration, completed, onClick }: SceneCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${completed ? 'border-green-500' : 'border-yellow-500'} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-sm font-medium text-gray-500">{sceneNumber}</span>
          <h4 className="text-md font-semibold text-gray-900">{title}</h4>
        </div>
        <span className="text-sm text-gray-500">{duration} min</span>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-600">📍 {location}</p>
        <p className="text-sm text-gray-500 mt-1">
          {characters.length > 0 ? `👤 ${characters.join(', ')}` : 'No characters'}
        </p>
      </div>
    </div>
  );
}

// Crew Card Component
interface CrewCardProps {
  name: string;
  role: string;
  department: string;
  dailyRate: number;
  available: boolean;
  onClick?: () => void;
}

export function CrewCard({ name, role, department, dailyRate, available, onClick }: CrewCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-md font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {available ? 'Available' : 'Busy'}
        </span>
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-gray-500">{department}</span>
        <span className="font-medium">${dailyRate}/day</span>
      </div>
    </div>
  );
}

// Budget Progress Bar
interface BudgetProgressProps {
  spent: number;
  total: number;
  label?: string;
}

export function BudgetProgress({ spent, total, label }: BudgetProgressProps) {
  const percentage = Math.min((spent / total) * 100, 100);
  const color = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">${spent.toLocaleString()} / ${total.toLocaleString()}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Loading Spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`} />
  );
}

// Empty State
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Tabs Component
interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default {
  ProjectCard,
  SceneCard,
  CrewCard,
  BudgetProgress,
  LoadingSpinner,
  EmptyState,
  Badge,
  Modal,
  Tabs,
};
