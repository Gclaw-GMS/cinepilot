// CinePilot Enhanced Charts & Data Visualization
// Advanced visualization components for film production data

import React from 'react'

// ==================== BAR CHART ====================

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  horizontal?: boolean
}

export function BarChart({ data, height = 200, horizontal = false }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="space-y-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          {horizontal ? (
            <>
              <span className="w-24 text-sm text-gray-600 truncate text-right">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.color || 'bg-blue-500'}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-12 text-sm text-gray-500">{item.value}</span>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">{item.value}</span>
              <div 
                className={`w-full rounded-t ${item.color || 'bg-blue-500'}`}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ==================== PIE CHART ====================

interface PieChartProps {
  data: { label: string; value: number; color?: string }[]
  size?: number
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let currentAngle = 0
  
  const slices = data.map((item, i) => {
    const percentage = item.value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    currentAngle += angle
    return { ...item, percentage, startAngle, angle, color: item.color || PIE_COLORS[i % PIE_COLORS.length] }
  })
  
  const radius = size / 2 - 10
  const center = size / 2
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {slices.map((slice, i) => {
          const startRad = (slice.startAngle * Math.PI) / 180
          const endRad = ((slice.startAngle + slice.angle) * Math.PI) / 180
          const x1 = center + radius * Math.cos(startRad)
          const y1 = center + radius * Math.sin(startRad)
          const x2 = center + radius * Math.cos(endRad)
          const y2 = center + radius * Math.sin(endRad)
          const largeArc = slice.angle > 180 ? 1 : 0
          
          return (
            <path
              key={i}
              d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={slice.color}
              opacity={0.85}
            />
          )
        })}
        <circle cx={center} cy={center} r={radius * 0.5} fill="white" />
      </svg>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-sm text-gray-600">{slice.label}</span>
            <span className="text-sm font-medium">({slice.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== PROGRESS RING ====================

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  showPercentage?: boolean
}

export function ProgressRing({ 
  progress, size = 120, strokeWidth = 10, 
  color = '#3B82F6', label, showPercentage = true 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <span className="text-xl font-bold text-gray-800 -mt-8">{Math.round(progress)}%</span>
      )}
      {label && <span className="text-sm text-gray-500 mt-1">{label}</span>}
    </div>
  )
}

// ==================== TIMELINE COMPONENT ====================

interface TimelineItem {
  id: string
  date: string
  title: string
  description?: string
  status?: 'completed' | 'current' | 'pending'
  icon?: string
}

interface TimelineProps {
  items: TimelineItem[]
  orientation?: 'vertical' | 'horizontal'
}

export function Timeline({ items, orientation = 'vertical' }: TimelineProps) {
  const statusColors = {
    completed: 'bg-green-500',
    current: 'bg-blue-500',
    pending: 'bg-gray-300'
  }
  
  if (orientation === 'horizontal') {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-0 min-w-max">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${statusColors[item.status || 'pending']}`}>
                  {item.status === 'completed' ? '✓' : i + 1}
                </div>
                <div className="mt-2 text-center w-28">
                  <p className="text-xs text-gray-500">{item.date}</p>
                  <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                </div>
              </div>
              {i < items.length - 1 && (
                <div className={`w-16 h-1 ${statusColors[item.status || 'pending']} mx-2`} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${statusColors[item.status || 'pending']} z-10`}>
              {item.status === 'completed' ? '✓' : i + 1}
            </div>
            {i < items.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
          </div>
          <div className="flex-1 pb-6">
            <p className="text-sm text-gray-500">{item.date}</p>
            <p className="font-semibold text-gray-800">{item.title}</p>
            {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== DATA TABLE ====================

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id?: number | string }>({ 
  data, columns, onRowClick, emptyMessage = 'No data available' 
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col, i) => (
              <th key={i} className={`text-left py-3 px-4 font-semibold text-gray-600 ${col.width || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`border-b border-gray-100 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="py-3 px-4 text-gray-700">
                  {col.render 
                    ? col.render(item) 
                    : String(item[col.key as keyof T] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== KANBAN BOARD ====================

interface KanbanColumn {
  id: string
  title: string
  color?: string
  items: { id: string; title: string; description?: string }[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onDragStart?: (itemId: string, columnId: string) => void
  onDrop?: (itemId: string, columnId: string) => void
}

export function KanbanBoard({ columns, onDragStart, onDrop }: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null)
  
  const handleDragStart = (itemId: string, columnId: string) => {
    setDraggedItem(itemId)
    onDragStart?.(itemId, columnId)
  }
  
  const handleDrop = (columnId: string) => {
    if (draggedItem) {
      onDrop?.(draggedItem, columnId)
      setDraggedItem(null)
    }
  }
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div 
          key={column.id} 
          className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(column.id)}
        >
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${column.color || 'bg-gray-400'}`} />
            {column.title}
            <span className="ml-auto bg-gray-200 px-2 py-0.5 rounded-full text-xs">
              {column.items.length}
            </span>
          </h3>
          <div className="space-y-2">
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id, column.id)}
                className="bg-white p-3 rounded shadow-sm cursor-move hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== GAUGE CHART ====================

interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  label?: string
  zones?: { min: number; max: number; color: string; label: string }[]
}

export function GaugeChart({ value, min = 0, max = 100, label, zones = [] }: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const angle = (percentage / 100) * 180 - 90
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        <div className="absolute w-40 h-40 rounded-full border-8 border-gray-200" />
        <div 
          className="absolute w-40 h-40 rounded-full border-8 border-blue-500"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center center'
          }} 
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-20 bg-gray-800 rounded-full" />
      </div>
      <div className="text-center -mt-2">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {label && <p className="text-sm text-gray-500">{label}</p>}
      </div>
      {zones.length > 0 && (
        <div className="flex gap-2 mt-2">
          {zones.map((zone, i) => (
            <div key={i} className="text-xs flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
              <span>{zone.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== BUDGET BREAKDOWN CHART ====================

interface BudgetBreakdownProps {
  items: { category: string; estimated: number; actual?: number; color?: string }[]
  total?: number
}

export function BudgetBreakdown({ items, total }: BudgetBreakdownProps) {
  const maxValue = Math.max(...items.map(i => i.estimated))
  
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const percentage = (item.estimated / maxValue) * 100
        const actualPercentage = item.actual ? (item.actual / item.estimated) * 100 : 0
        
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.category}</span>
              <span className="text-gray-500">
                ₹{(item.estimated / 100000).toFixed(1)}L
                {item.actual && (
                  <span className="ml-2 text-green-600">
                    / ₹{(item.actual / 100000).toFixed(1)}L
                  </span>
                )}
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.color || 'bg-blue-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {item.actual && (
              <div className="h-1 bg-green-400 rounded-full mt-0.5" style={{ width: `${actualPercentage}%` }} />
            )}
          </div>
        )
      })}
      {total && (
        <div className="pt-3 border-t border-gray-200 flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-semibold text-blue-600">₹{(total / 100000).toFixed(1)}L</span>
        </div>
      )}
    </div>
  )
}

// ==================== TIMELINE CHART ====================

interface TimelineEvent {
  id: string
  title: string
  start: number // day number
  end?: number // for ranges
  color?: string
  type?: 'scene' | 'location' | 'cast' | 'milestone'
}

// ==================== HEATMAP ====================

interface HeatmapData {
  day: number
  value: number
  label?: string
}

interface HeatmapProps {
  data: HeatmapData[]
  rows?: number
}

export function Heatmap({ data, rows = 5 }: HeatmapProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  const getColor = (value: number) => {
    const intensity = value / maxValue
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.25) return 'bg-blue-200'
    if (intensity < 0.5) return 'bg-blue-400'
    if (intensity < 0.75) return 'bg-blue-600'
    return 'bg-blue-800'
  }
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
        <div key={i} className="text-center text-xs text-gray-500 font-medium">{day}</div>
      ))}
      {Array.from({ length: rows * 7 }).map((_, i) => {
        const dayData = data.find(d => d.day === i + 1)
        return (
          <div
            key={i}
            className={`h-8 rounded flex items-center justify-center text-xs ${dayData ? getColor(dayData.value) : ''}`}
            title={dayData?.label}
          >
            {dayData?.value || ''}
          </div>
        )
      })}
    </div>
  )
}
