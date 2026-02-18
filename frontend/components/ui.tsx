'use client'

import { ReactNode } from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }
  return (
    <div className={`${sizes[size]} border-2 border-gray-700 border-t-cinepilot-accent rounded-full animate-spin`} />
  )
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`bg-cinepilot-card border border-cinepilot-border rounded-lg ${hover ? 'hover:border-indigo-500/50 hover:shadow-lg transition-all' : ''} ${className}`}>
      {children}
    </div>
  )
}

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
  className?: string
}

export function Button({ children, variant = 'primary', onClick, className = '' }: ButtonProps) {
  const variants = {
    primary: 'bg-cinepilot-accent text-black hover:bg-cyan-400',
    secondary: 'bg-gray-700 hover:bg-gray-600',
    danger: 'bg-red-600 hover:bg-red-700'
  }
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium text-sm transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

interface InputProps {
  placeholder?: string
  value?: string
  onChange?: (e: any) => void
  type?: string
  className?: string
}

export function Input({ placeholder, value, onChange, type = 'text', className = '' }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none ${className}`}
    />
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: string
  className?: string
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variantMap: Record<string, string> = {
    success: 'bg-green-900 text-green-400',
    warning: 'bg-yellow-900 text-yellow-400',
    danger: 'bg-red-900 text-red-400',
    info: 'bg-blue-900 text-blue-400',
    emerald: 'bg-emerald-900 text-emerald-400',
    indigo: 'bg-indigo-900 text-indigo-400',
    violet: 'bg-violet-900 text-violet-400',
    amber: 'bg-amber-900 text-amber-400',
    rose: 'bg-rose-900 text-rose-400',
    cyan: 'bg-cyan-900 text-cyan-400',
    slate: 'bg-slate-700 text-slate-300',
    active: 'bg-emerald-900 text-emerald-400',
    busy: 'bg-amber-900 text-amber-400',
    offline: 'bg-slate-700 text-slate-300',
    available: 'bg-emerald-900 text-emerald-400',
    'in-use': 'bg-amber-900 text-amber-400',
    maintenance: 'bg-rose-900 text-rose-400'
  }
  
  const variantClass = variantMap[variant] || variantMap[variant.toLowerCase()] || 'bg-slate-700 text-slate-300'
  
  return (
    <span className={`px-2 py-1 text-xs rounded ${variantClass} ${className}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max = 100, showLabel = false }: { value: number; max?: number; showLabel?: boolean }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="h-2 bg-gray-700 rounded overflow-hidden">
        <div 
          className="h-full bg-cinepilot-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-6 w-full max-w-lg animate-fade-in" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface TabsProps {
  tabs: { id: string; label: string; icon?: string }[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-cinepilot-border mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-cinepilot-accent border-b-2 border-cinepilot-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.icon && <span className="mr-1">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  className = '' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export function TextArea({ 
  value, 
  onChange, 
  placeholder,
  rows = 4,
  className = '' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cinepilot-accent focus:outline-none resize-none ${className}`}
    />
  )
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
      {action && (
        <button 
          onClick={action.onClick}
          className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium text-sm hover:bg-cyan-400"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// StatCard component
interface StatCardProps {
  title: string
  value: string | number
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan'
  icon?: ReactNode
  trend?: { value: number; positive: boolean }
}

const colorClasses = {
  indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
  violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
  cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
}

const iconColorClasses = {
  indigo: 'text-indigo-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
}

export function StatCard({ title, value, color = 'indigo', icon, trend }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        {icon && <span className={iconColorClasses[color]}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}

// PageHeader component
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
