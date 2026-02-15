'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  time: string
  read: boolean
  action?: {
    label: string
    href: string
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'info', title: 'Script Analysis Complete', message: 'Veera\'s Journey script has been analyzed', time: '5 min ago', read: false },
    { id: 2, type: 'success', title: 'Budget Approved', message: 'Madurai Express budget approved by producer', time: '1 hour ago', read: false },
    { id: 3, type: 'warning', title: 'Location Issue', message: 'Temple permit expires in 3 days', time: '2 hours ago', read: false },
    { id: 4, type: 'info', title: 'New Crew Member', message: 'Stunt Coordinator added to cast', time: '3 hours ago', read: true },
    { id: 5, type: 'error', title: 'Schedule Conflict', message: 'Actor unavailable on Day 12', time: '1 day ago', read: true },
  ])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.read)
  )

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-500/10'
      case 'warning': return 'border-yellow-500 bg-yellow-500/10'
      case 'error': return 'border-red-500 bg-red-500/10'
      default: return 'border-blue-500 bg-blue-500/10'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✕'
      default: return 'ℹ'
    }
  }

  return (
    <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cinepilot-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-cinepilot-accent text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'unread' ? 'bg-cinepilot-accent text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'all' ? 'bg-cinepilot-accent text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-3xl mb-2">🔔</div>
            <p>No notifications</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                !notification.read ? 'bg-gray-800/30' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                      {notification.title}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</div>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{notification.message}</div>
                  {notification.action && (
                    <a 
                      href={notification.action.href}
                      className="text-xs text-cinepilot-accent hover:underline mt-2 inline-block"
                    >
                      {notification.action.label} →
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="text-gray-500 hover:text-cinepilot-accent text-xs"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {unreadCount > 0 && (
        <div className="p-3 border-t border-cinepilot-border bg-gray-800/50">
          <button 
            onClick={markAllAsRead}
            className="w-full text-center text-sm text-cinepilot-accent hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}
