'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Bell, Check, X, Trash2, Clock, AlertCircle, 
  Info, CheckCircle, AlertTriangle, Search, Filter,
  RefreshCw, MailCheck, ChevronRight
} from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Script Analysis Complete',
    message: 'Your script "Kaadhal Vartham" has been fully analyzed with 47 scenes detected.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionUrl: '/scripts'
  },
  {
    id: '2',
    type: 'success',
    title: 'Budget Generated',
    message: 'Production budget of ₹8.5Cr has been generated successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    actionUrl: '/budget'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Weather Alert',
    message: 'Rain expected on shooting days 15-17. Consider rescheduling outdoor scenes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    actionUrl: '/schedule'
  },
  {
    id: '4',
    type: 'info',
    title: 'New Crew Member Added',
    message: 'Ravi Kumar (Director of Photography) has been added to the crew.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    actionUrl: '/crew'
  },
  {
    id: '5',
    type: 'error',
    title: 'Equipment Return Due',
    message: 'Camera rental due for return in 2 days. Please confirm return schedule.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
    actionUrl: '/equipment'
  },
]

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />
    case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
    default: return <Info className="w-4 h-4 text-blue-400" />
  }
}

function getNotificationBg(type: Notification['type']) {
  switch (type) {
    case 'success': return 'bg-emerald-500/10 border-emerald-500/20'
    case 'warning': return 'bg-amber-500/10 border-amber-500/20'
    case 'error': return 'bg-red-500/10 border-red-500/20'
    default: return 'bg-blue-500/10 border-blue-500/20'
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      
      // Map API response to UI format
      const apiNotifications = data.data || data.notifications || []
      if (Array.isArray(apiNotifications) && apiNotifications.length > 0) {
        setNotifications(apiNotifications.map((n: any) => ({
          id: n.id,
          type: (n.metadata?.priority === 'high' ? 'warning' : n.metadata?.priority === 'medium' ? 'info' : 'info') as 'info' | 'success' | 'warning' | 'error',
          title: n.title,
          message: n.body,
          timestamp: n.createdAt,
          read: n.status === 'read',
          actionUrl: undefined
        })))
        setIsDemoMode(data.isDemoMode === true)
      } else {
        setNotifications(DEMO_NOTIFICATIONS)
        setIsDemoMode(true)
      }
    } catch (e) {
      console.warn('Using demo notifications:', e)
      setNotifications(DEMO_NOTIFICATIONS)
      setIsDemoMode(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || !n.read
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Bell className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <MailCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={fetchNotifications}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            Showing demo notifications — Connect to receive real production alerts
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  relative flex items-start gap-4 p-4 rounded-xl border transition-all
                  ${getNotificationBg(notification.type)}
                  ${!notification.read ? 'shadow-md' : 'opacity-75 hover:opacity-100'}
                `}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute top-4 left-1 w-2 h-2 bg-indigo-500 rounded-full" />
                )}
                
                {/* Icon */}
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                  
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
                    >
                      View details
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
              <Bell className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              {searchQuery || filter !== 'all' ? 'No matching notifications' : 'No notifications'}
            </h3>
            <p className="text-slate-500 text-sm">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'You\'re all caught up!'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
