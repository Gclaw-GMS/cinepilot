'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  const paddingClass = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[padding]
  
  return (
    <div className={`
      bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl
      ${hover ? 'hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5' : ''}
      ${paddingClass}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: ReactNode
  color?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan'
}

export function StatCard({ title, value, subtitle, trend, trendValue, icon, color = 'indigo' }: StatCardProps) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30',
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  }
  
  const iconColors = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    violet: 'bg-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  }
  
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-slate-400'
  }

  return (
    <div className={`
      bg-gradient-to-br ${colors[color]} border rounded-xl p-5 
      hover:shadow-lg transition-all duration-300 hover:-translate-y-1
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold mt-2 text-white">{value}</p>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${trendColors[trend]}`}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    ghost: 'hover:bg-slate-800 text-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button 
      className={`rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate'
}

export function Badge({ children, variant = 'indigo' }: BadgeProps) {
  const variants = {
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
