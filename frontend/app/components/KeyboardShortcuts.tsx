'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight } from 'lucide-react'

const PAGE_SHORTCUTS = [
  { key: '1', label: 'Dashboard', href: '/' },
  { key: '2', label: 'Analytics', href: '/analytics' },
  { key: '3', label: 'Scripts', href: '/scripts' },
  { key: '4', label: 'Shot Hub', href: '/shot-list' },
  { key: '5', label: 'Storyboard', href: '/storyboard' },
  { key: '6', label: 'Timeline', href: '/timeline' },
  { key: '7', label: 'Schedule', href: '/schedule' },
  { key: '8', label: 'Progress', href: '/progress' },
  { key: '9', label: 'Locations', href: '/locations' },
  { key: '0', label: 'Equipment', href: '/equipment' },
  { key: 'B', label: 'Budget', href: '/budget' },
  { key: 'T', label: 'Tasks', href: '/tasks' },
  { key: 'C', label: 'Crew', href: '/crew' },
  { key: 'O', label: 'Continuity', href: '/continuity' },
  { key: 'V', label: 'VFX', href: '/vfx' },
  { key: 'W', label: 'Weather', href: '/weather' },
  { key: 'M', label: 'Mission Control', href: '/mission-control' },
  { key: 'R', label: 'Reports', href: '/reports' },
  { key: 'A', label: 'Call Sheets', href: '/call-sheets' },
  { key: 'S', label: 'Settings', href: '/settings' },
]

export default function KeyboardShortcuts() {
  const [showGoTo, setShowGoTo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filteredPages = PAGE_SHORTCUTS.filter(page => 
    page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea/select
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    // Number keys 0-9 for quick navigation
    const numKey = parseInt(e.key)
    if (!isNaN(numKey) && numKey >= 0 && numKey <= 9) {
      const page = PAGE_SHORTCUTS.find(p => p.key === e.key)
      if (page) {
        e.preventDefault()
        router.push(page.href)
        return
      }
    }

    // G - Go to page
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      setShowGoTo(true)
      setSearchQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }

    // Letter shortcuts (when not combined with other keys)
    const letterShortcuts = PAGE_SHORTCUTS.filter(p => p.key.length === 1 && isNaN(parseInt(p.key)))
    const letterPage = letterShortcuts.find(p => p.key.toLowerCase() === e.key.toLowerCase() && !e.ctrlKey && !e.metaKey)
    if (letterPage && e.key.length === 1) {
      e.preventDefault()
      router.push(letterPage.href)
      return
    }

    // Escape - close Go To
    if (e.key === 'Escape' && showGoTo) {
      setShowGoTo(false)
      setSearchQuery('')
    }
  }, [showGoTo, router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const navigateTo = (href: string) => {
    router.push(href)
    setShowGoTo(false)
    setSearchQuery('')
  }

  if (!showGoTo) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setShowGoTo(false)}>
      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Go to page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
            autoFocus
          />
          <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredPages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No pages found
            </div>
          ) : (
            <div className="p-2">
              {filteredPages.map((page) => (
                <button
                  key={page.href}
                  onClick={() => navigateTo(page.href)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-800 text-left transition-colors group"
                >
                  <span className="text-slate-300 group-hover:text-white">{page.label}</span>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-indigo-400 font-mono">{page.key}</kbd>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30">
          <div className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-400 font-mono">G</kbd> anywhere to open • Type to search • <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-400 font-mono">Enter</kbd> to navigate
          </div>
        </div>
      </div>
    </div>
  )
}
