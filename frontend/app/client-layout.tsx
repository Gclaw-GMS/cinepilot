'use client'

import { useEffect, useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

const SHORTCUTS: KeyboardShortcut[] = [
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
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

        <div className="px-6 py-4 bg-slate-800/50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  )
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-slate-500 mx-1">+</span>}
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
