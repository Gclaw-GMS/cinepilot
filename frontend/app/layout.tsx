import './globals.css'
import type { Metadata } from 'next'
import ClientLayout from './client-layout'

export const metadata: Metadata = {
  title: 'CinePilot - AI-Powered Pre-Production',
  description: 'AI-powered pre-production platform for Tamil & Indian Cinema',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
