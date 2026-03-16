'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'cinepilot-settings'

interface StoredSettings {
  theme?: Theme
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const settings: StoredSettings = JSON.parse(stored)
      return settings.theme || 'dark'
    }
  } catch (e) {
    console.error('Failed to read theme from storage:', e)
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Remove both theme classes first
    root.classList.remove('light', 'dark')
    
    // Determine actual theme
    let actualTheme: Theme = theme
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    // Apply theme class
    root.classList.add(actualTheme)
    
    // Also set data attribute for CSS selectors
    root.setAttribute('data-theme', actualTheme)
  }, [theme, mounted])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      const actualTheme = mediaQuery.matches ? 'dark' : 'light'
      root.classList.add(actualTheme)
      root.setAttribute('data-theme', actualTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Listen for storage changes (settings page saves to localStorage)
  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const settings: StoredSettings = JSON.parse(e.newValue)
          if (settings.theme) {
            setTheme(settings.theme)
          }
        } catch (err) {
          console.error('Failed to parse settings:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [mounted])

  // Expose theme setter globally so settings page can trigger updates
  useEffect(() => {
    (window as Window & { __setTheme?: (theme: Theme) => void }).__setTheme = setTheme
    return () => {
      delete (window as Window & { __setTheme?: (theme: Theme) => void }).__setTheme
    }
  }, [])

  return <>{children}</>
}
