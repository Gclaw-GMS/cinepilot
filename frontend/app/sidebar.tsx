'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Clapperboard, Calendar, Cloud, Radar, MapPin, Users, DollarSign, Settings, BarChart3, Video, Bell, FolderOpen, Download, Sparkles, ChevronRight } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/scripts', icon: FileText, label: 'Scripts' },
    { href: '/shot-list', icon: Video, label: 'Shot List' },
    { href: '/schedule', icon: Calendar, Cloud, Radar, label: 'Schedule' },
    { href: '/timeline', icon: Calendar, Cloud, Radar, label: 'Timeline', badge: 'NEW' },
    { href: '/locations', icon: MapPin, label: 'Locations' },
    { href: '/equipment', icon: Clapperboard, label: 'Equipment' },
    { href: '/collaboration', icon: Users, label: 'Collaboration', badge: 'NEW' },
    { href: '/progress', icon: BarChart3, label: 'Progress' },
    { href: '/dood', icon: BarChart3, label: 'DOOD Report' },
    { href: '/budget', icon: DollarSign, label: 'Budget' },
    { href: '/crew', icon: Users, label: 'Crew' },
    { href: '/call-sheets', icon: FileText, label: 'Call Sheets' },
    { href: '/reports', icon: FolderOpen, label: 'Reports', badge: 'NEW' },
    { href: '/exports', icon: Download, label: 'Exports', badge: 'NEW' },
    { href: '/ai-tools', icon: Sparkles, label: 'AI Tools', badge: 'NEW' },
    { href: '/notifications', icon: Bell, label: 'Notifications', badge: 5 },
    { href: '/weather', icon: Cloud, Radar, label: 'Weather' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  const quickActions = [
    { label: 'New Project', icon: Plus, action: () => console.log('New project') },
    { label: 'Upload Script', icon: FileText, action: () => window.location.href = '/scripts' },
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 fixed h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white tracking-tight">CinePilot</h1>
            <p className="text-xs text-slate-500">AI Pre-Production</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Quick Actions</div>
        <div className="flex flex-col gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors text-left"
            >
              <action.icon className="w-4 h-4 text-indigo-400" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <div className="text-xs font-medium text-slate-500 mb-2 px-3 uppercase tracking-wider">Menu</div>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === '/' 
              ? pathname === '/' || pathname === ''
              : pathname.startsWith(item.href)
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all group ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.badge === 'NEW' 
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-indigo-500/15 text-indigo-400'
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

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="text-xs text-slate-600 text-center">
          CinePilot v1.0
        </div>
      </div>
    </aside>
  )
}

function Plus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  )
}
