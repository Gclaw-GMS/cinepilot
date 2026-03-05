import './globals.css'
import type { Metadata } from 'next'
import ClientLayout from './client-layout'
import Sidebar from './sidebar'
import { Menu, X } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CinePilot - AI-Powered Pre-Production',
  description: 'AI-powered pre-production platform for Tamil & Indian Cinema',
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 ml-64">
        <ClientLayout>{children}</ClientLayout>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
