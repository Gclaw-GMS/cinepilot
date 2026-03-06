'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  Video,
  ImageIcon,
  Calendar,
  MapPin,
  DollarSign,
  Shield,
  Languages,
  Users,
  Clapperboard,
  Settings,
  BarChart3,
  Cloud,
  Bell,
  ChevronRight,
  Eye,
  Sparkles,
  Plane,
  MessageCircle,
  Utensils,
  Shirt,
  StickyNote,
  Download,
  UsersRound,
  Folder,
  CheckSquare,
  Activity,
} from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string | number
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Core',
    items: [
      { href: '/projects', icon: Folder, label: 'Projects' },
      { href: '/', icon: Home, label: 'Dashboard' },
      { href: '/mission-control', icon: BarChart3, label: 'Mission Control', badge: 'NEW' },
      { href: '/scripts', icon: FileText, label: 'Script Breakdown' },
      { href: '/shot-list', icon: Video, label: 'Shot Hub' },
      { href: '/storyboard', icon: ImageIcon, label: 'Storyboard' },
    ],
  },
  {
    title: 'Production',
    items: [
      { href: '/schedule', icon: Calendar, label: 'Schedule' },
      { href: '/timeline', icon: BarChart3, label: 'Timeline' },
      { href: '/locations', icon: MapPin, label: 'Location Scout' },
      { href: '/equipment', icon: Clapperboard, label: 'Equipment' },
      { href: '/travel', icon: Plane, label: 'Travel Expenses' },
      { href: '/character-costume', icon: Shirt, label: 'Character Costume', badge: 'NEW' },
      { href: '/audience-sentiment', icon: MessageCircle, label: 'Audience Sentiment' },
      { href: '/dailies', icon: Clapperboard, label: 'Daily Reports', badge: 'NEW' },
      { href: '/catering', icon: Utensils, label: 'Catering', badge: 'NEW' },
      { href: '/budget', icon: DollarSign, label: 'Budget Engine' },
      { href: '/reports', icon: FileText, label: 'Reports' },
      { href: '/censor', icon: Shield, label: 'Censor Board' },
      { href: '/continuity', icon: Eye, label: 'Continuity' },
      { href: '/vfx', icon: Sparkles, label: 'VFX Breakdown' },
      { href: '/dubbing', icon: Languages, label: 'Dubbing' },
    ],
  },
  {
    title: 'Team',
    items: [
      { href: '/crew', icon: Users, label: 'Crew' },
      { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { href: '/collaboration', icon: UsersRound, label: 'Collaboration' },
      { href: '/call-sheets', icon: FileText, label: 'Call Sheets' },
      { href: '/dood', icon: Calendar, label: 'DOOD' },
      { href: '/notes', icon: StickyNote, label: 'Notes' },
      { href: '/whatsapp', icon: MessageCircle, label: 'WhatsApp Broadcast', badge: 'NEW' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { href: '/ai-tools', icon: Sparkles, label: 'AI Tools', badge: 'NEW' },
      { href: '/progress', icon: BarChart3, label: 'Progress' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/health', icon: Activity, label: 'System Health', badge: 'NEW' },
      { href: '/exports', icon: Download, label: 'Export Center' },
      { href: '/weather', icon: Cloud, label: 'Weather' },
      { href: '/notifications', icon: Bell, label: 'Notifications' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 dark:border-slate-800 fixed h-screen overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800 dark:border-slate-800">
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
      <div className="px-4 py-4 border-b border-slate-800 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => (window.location.href = '/scripts')}
            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-indigo-300 transition-colors text-left"
          >
            <FileText className="w-4 h-4" />
            Upload Script
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="text-xs font-medium text-slate-500 mb-1.5 px-3 uppercase tracking-wider">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/' || pathname === ''
                    : pathname.startsWith(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-md transition-all group ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 ${
                            isActive
                              ? 'text-indigo-400'
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.badge === 'NEW'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-indigo-500/15 text-indigo-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-indigo-400/50" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            const event = new CustomEvent('toggleKeyboardHelp')
            window.dispatchEvent(event)
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd>
          <span className="ml-1">Shortcuts</span>
        </button>
        <div className="text-xs text-slate-600 text-center mt-2">CinePilot v1.0</div>
      </div>
    </aside>
  )
}
