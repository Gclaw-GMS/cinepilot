'use client'

import { useEffect, useState } from 'react'
import Sidebar from './sidebar'
import ChatWidget from './components/ChatWidget'

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved theme preference
    const savedTheme = localStorage.getItem('cinepilot-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  // Prevent flash by rendering nothing until mounted on theme change
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return <>{children}</>
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-cinepilot-dark text-white font-mono">
        <ThemeInitializer>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-h-screen overflow-auto ml-64">
              {children}
            </main>
          </div>
          <ChatWidget />
        </ThemeInitializer>
      </body>
    </html>
  )
}
