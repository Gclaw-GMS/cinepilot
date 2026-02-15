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
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-cinepilot-card border border-cinepilot-border rounded-lg ${className}`}>
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
  variant?: 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, variant = 'info' }: BadgeProps) {
  const variants = {
    success: 'bg-green-900 text-green-400',
    warning: 'bg-yellow-900 text-yellow-400',
    danger: 'bg-red-900 text-red-400',
    info: 'bg-blue-900 text-blue-400'
  }
  
  return (
    <span className={`px-2 py-1 text-xs rounded ${variants[variant]}`}>
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
