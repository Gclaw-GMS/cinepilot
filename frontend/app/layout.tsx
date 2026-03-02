import './globals.css'
import type { Metadata } from 'next'
import Sidebar from './sidebar'
import ChatWidget from './components/ChatWidget'

// Force dynamic rendering for all pages to ensure fresh data
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CinePilot - AI-Powered Pre-Production',
  description: 'AI-powered pre-production platform for Tamil & Indian Cinema',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-cinepilot-dark text-white font-mono">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-auto ml-64">
            {children}
          </main>
        </div>
        <ChatWidget />
      </body>
    </html>
  )
}
