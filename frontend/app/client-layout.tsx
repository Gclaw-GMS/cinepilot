'use client'

import { useEffect, useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Command, Keyboard, X } from 'lucide-react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

const SHORTCUTS: KeyboardShortcut[] = [
  { key: '0', ctrl: true, action: () => navigate('/health'), description: 'Go to System Health' },
  { key: '1', ctrl: true, action: () => navigate('/'), description: 'Go to Dashboard' },
  { key: '2', ctrl: true, action: () => navigate('/projects'), description: 'Go to Projects' },
  { key: '3', ctrl: true, action: () => navigate('/scripts'), description: 'Go to Scripts' },
  { key: '4', ctrl: true, action: () => navigate('/shot-list'), description: 'Go to Shot Hub' },
  { key: '5', ctrl: true, action: () => navigate('/storyboard'), description: 'Go to Storyboard' },
  { key: '6', ctrl: true, action: () => navigate('/schedule'), description: 'Go to Schedule' },
  { key: '7', ctrl: true, action: () => navigate('/crew'), description: 'Go to Crew' },
  { key: '8', ctrl: true, action: () => navigate('/budget'), description: 'Go to Budget' },
  { key: '9', ctrl: true, action: () => navigate('/settings'), description: 'Go to Settings' },
  { key: 'm', ctrl: true, action: () => navigate('/mission-control'), description: 'Go to Mission Control' },
  { key: '?', shift: true, action: toggleHelp, description: 'Show keyboard shortcuts' },
  { key: 'Escape', action: closeModals, description: 'Close modals' },
]

function navigate(path: string) {
  window.location.href = path
}

function toggleHelp() {
  const event = new CustomEvent('toggleKeyboardHelp')
  window.dispatchEvent(event)
}

function closeModals() {
  const event = new CustomEvent('closeModals')
  window.dispatchEvent(event)
}

export function useKeyboardShortcuts(enabled = true) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable) {
      return
    }

    // Check for matching shortcuts
    for (const shortcut of SHORTCUTS) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.alt ? e.altKey : !e.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [])

  // Listen for toggle help event
  useEffect(() => {
    const handleToggleHelp = () => setShowHelp(prev => !prev)
    window.addEventListener('toggleKeyboardHelp', handleToggleHelp)
    return () => window.removeEventListener('toggleKeyboardHelp', handleToggleHelp)
  }, [])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return { showHelp, setShowHelp }
}

export function KeyboardHelpModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  // Get context-aware shortcuts based on current page
  const getContextShortcuts = () => {
    const base = [
      { keys: ['Ctrl', '?'], action: 'Toggle help' },
      { keys: ['Esc'], action: 'Close modal' },
    ]

    // Add page-specific shortcuts
    if (pathname === '/scripts') {
      return [
        { keys: ['Ctrl', 'N'], action: 'New script' },
        { keys: ['Ctrl', 'F'], action: 'Focus search' },
        { keys: ['Ctrl', 'S'], action: 'Save changes' },
        ...base,
      ]
    }

    if (pathname === '/shot-list') {
      return [
        { keys: ['Ctrl', 'G'], action: 'Generate shots' },
        { keys: ['Ctrl', 'E'], action: 'Export shots' },
        { keys: ['Ctrl', 'F'], action: 'Filter shots' },
        ...base,
      ]
    }

    return base
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header with gradient accent */}
        <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Keyboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Work faster with keyboard shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent" />
        </div>
        
        <div className="p-6 space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Navigation</h3>
            <div className="space-y-2">
              <ShortcutRow keys={['Ctrl', '1']} action="Dashboard" />
              <ShortcutRow keys={['Ctrl', '2']} action="Projects" />
              <ShortcutRow keys={['Ctrl', '3']} action="Scripts" />
              <ShortcutRow keys={['Ctrl', '4']} action="Shot Hub" />
              <ShortcutRow keys={['Ctrl', '5']} action="Storyboard" />
              <ShortcutRow keys={['Ctrl', '6']} action="Schedule" />
              <ShortcutRow keys={['Ctrl', '7']} action="Crew" />
              <ShortcutRow keys={['Ctrl', '8']} action="Budget" />
              <ShortcutRow keys={['Ctrl', '9']} action="Settings" />
              <ShortcutRow keys={['Ctrl', 'M']} action="Mission Control" />
            </div>
          </div>

          {/* Context Shortcuts */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Current Page</h3>
            <div className="space-y-2">
              {getContextShortcuts().map((shortcut, i) => (
                <ShortcutRow key={i} keys={shortcut.keys} action={shortcut.action} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800/50 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 font-mono text-xs">?</kbd>
            <span>anywhere to show this help</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors -mx-3">
      <span className="text-sm text-slate-300">{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd className="px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 font-mono shadow-sm">
              {key === 'Ctrl' ? <Command className="w-3 h-3" /> : key}
            </kbd>
            {i < keys.length - 1 && <span className="text-slate-500 mx-0.5 text-xs">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false)
  const { showHelp, setShowHelp } = useKeyboardShortcuts(true)

  useEffect(() => {
    if (showHelp) {
      setKeyboardHelpOpen(true)
    }
  }, [showHelp])

  // Listen for close modals event
  useEffect(() => {
    const handleCloseModals = () => {
      setKeyboardHelpOpen(false)
    }
    window.addEventListener('closeModals', handleCloseModals)
    return () => window.removeEventListener('closeModals', handleCloseModals)
  }, [])

  return (
    <>
      {children}
      {keyboardHelpOpen && (
        <KeyboardHelpModal onClose={() => setKeyboardHelpOpen(false)} />
      )}
    </>
  )
}
