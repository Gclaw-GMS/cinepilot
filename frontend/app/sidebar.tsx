'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: '🏠', label: 'Dashboard' },
    { href: '/scripts', icon: '📄', label: 'Scripts', badge: 2 },
    { href: '/shot-list', icon: '🎥', label: 'Shot List' },
    { href: '/schedule', icon: '📅', label: 'Schedule' },
    { href: '/locations', icon: '📍', label: 'Locations' },
    { href: '/equipment', icon: '🎬', label: 'Equipment' },
    { href: '/progress', icon: '📊', label: 'Progress' },
    { href: '/dood', icon: '📈', label: 'DOOD Report' },
    { href: '/budget', icon: '💰', label: 'Budget' },
    { href: '/crew', icon: '👥', label: 'Crew' },
    { href: '/call-sheets', icon: '📋', label: 'Call Sheets' },
    { href: '/reports', icon: '📋', label: 'Reports', badge: 'NEW' },
    { href: '/exports', icon: '📤', label: 'Exports', badge: 'NEW' },
    { href: '/ai-tools', icon: '🤖', label: 'AI Tools', badge: 'NEW' },
    { href: '/notifications', icon: '📱', label: 'Notifications', badge: 5 },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  // Quick actions
  const quickActions = [
    { icon: '➕', label: 'New Project', action: () => console.log('New project') },
    { icon: '📤', label: 'Upload Script', action: () => window.location.href = '/scripts' },
    { icon: '🎬', label: 'Generate Shot List', action: () => window.location.href = '/shot-list' },
  ]

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 fixed h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center text-xl">
            🎬
          </div>
          <div>
            <h1 className="font-bold text-lg">CinePilot</h1>
            <p className="text-xs text-gray-500">AI Pre-Production</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Quick Actions</div>
        <div className="flex gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg p-2 text-center transition-colors"
              title={action.label}
            >
              <div className="text-lg">{action.icon}</div>
              <div className="text-[10px] text-gray-400 truncate">{action.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/' 
              ? pathname === '/' || pathname === ''
              : pathname.startsWith(item.href)
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-cinepilot-accent/10 text-cinepilot-accent' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.badge === 'NEW' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-cinepilot-accent/20 text-cinepilot-accent'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Project Status */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Active Projects</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 truncate">இதயத்தின் ஒலி</span>
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Planning</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 truncate">Veera's Journey</span>
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Shooting</span>
          </div>
        </div>
      </div>

      {/* Tamil Support Badge */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Built for</div>
          <div className="text-sm font-semibold text-purple-400">தமிழ் Cinema</div>
        </div>
      </div>
    </aside>
  )
}
