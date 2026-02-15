// CinePilot Enhanced Components
// Advanced UI components for CinePilot

import React, { useState, useEffect, useRef, ReactNode } from 'react'

// ==================== MODAL DIALOG ====================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    if (isOpen) setVisible(true)
    else setTimeout(() => setVisible(false), 200)
  }, [isOpen])

  if (!visible) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl ${sizes[size]} w-full mx-4 transform transition-all ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}

// ==================== TOOLTIP ====================

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false)
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg whitespace-nowrap ${positions[position]}`}>
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}
    </div>
  )
}

// ==================== ACCORDION ====================

interface AccordionItem {
  title: string
  content: ReactNode
  icon?: string
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggle = (index: number) => {
    if (allowMultiple) {
      setOpenItems(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index])
    } else {
      setOpenItems(prev => prev.includes(index) ? [] : [index])
    }
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              {item.icon && <span>{item.icon}</span>}
              <span className="font-medium">{item.title}</span>
            </span>
            <span className={`transform transition-transform ${openItems.includes(index) ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {openItems.includes(index) && (
            <div className="px-4 py-3 bg-white border-t">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ==================== DROPDOWN ====================

interface DropdownOption {
  label: string
  value: string
  icon?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function Dropdown({ options, value, onChange, label, placeholder = 'Select...' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white hover:border-blue-400 transition-colors"
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${option.value === value ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              {option.icon && <span>{option.icon}</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== BADGE ====================

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

// ==================== ALERT ====================

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

export function Alert({ type = 'info', title, children, dismissible, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const types = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border rounded-lg ${types[type]}`}>
      <span className="text-xl">{icons[type]}</span>
      <div className="flex-1">
        {title && <div className="font-medium mb-1">{title}</div>}
        <div>{children}</div>
      </div>
      {dismissible && (
        <button onClick={() => { setVisible(false); onDismiss?.() }} className="opacity-60 hover:opacity-100">×</button>
      )}
    </div>
  )
}

// ==================== SKELETON LOADER ====================

interface SkeletonProps {
  width?: string
  height?: string
  rounded?: boolean
}

export function Skeleton({ width = '100%', height = '20px', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-300 ${rounded ? 'rounded' : ''}`}
      style={{ width, height }}
    />
  )
}

// ==================== AVATAR ====================

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  )
}

// ==================== TOAST NOTIFICATION ====================

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

let toastCallback: ((toast: ToastMessage) => void) | null = null

export function showToast(message: string, type: ToastMessage['type'] = 'info', duration = 3000) {
  const toast: ToastMessage = { id: Date.now().toString(), type, message, duration }
  toastCallback?.(toast)
}

export function ToastContainer({ onRegister }: { onRegister: (cb: (t: ToastMessage) => void) => void }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastCallback = (toast) => setToasts(prev => [...prev, toast])
    onRegister(toastCallback)
    return () => { toastCallback = null }
  }, [onRegister])

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration) {
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), toast.duration)
      }
    })
  }, [toasts])

  const types = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`${types[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px] animate-slide-in`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}

// ==================== DATA TABLE ====================

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  onRowClick?: (item: T) => void
}

export function DataTable<T>({ data, columns, keyField, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map(col => (
              <th key={String(col.key)} className="px-4 py-3 text-left text-sm font-medium text-gray-600">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={String(item[keyField])} onClick={() => onRowClick?.(item)} className={`border-b hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}>
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3 text-sm">
                  {col.render ? col.render(item) : String(item[col.key as keyof T] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== TIMELINE ====================

interface TimelineItem {
  date: string
  title: string
  description?: string
  icon?: string
  status?: 'completed' | 'current' | 'pending'
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const statusColors = {
    completed: 'bg-green-500',
    current: 'bg-blue-500',
    pending: 'bg-gray-300'
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${statusColors[item.status || 'pending']}`} />
            {i < items.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
          </div>
          <div className="pb-4">
            <div className="text-xs text-gray-500">{item.date}</div>
            <div className="font-medium">{item.title}</div>
            {item.description && <div className="text-sm text-gray-600 mt-1">{item.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
