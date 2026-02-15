// CinePilot API Status Hook
// Provides real-time backend connection status

import { useState, useEffect, useCallback } from 'react'

export interface APIStatus {
  connected: boolean
  version: string | null
  latency: number | null
  lastChecked: Date | null
  error: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function useAPIStatus() {
  const [status, setStatus] = useState<APIStatus>({
    connected: false,
    version: null,
    latency: null,
    lastChecked: null,
    error: null,
  })

  const checkStatus = useCallback(async () => {
    const start = Date.now()
    try {
      const res = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      
      const latency = Date.now() - start
      
      if (res.ok) {
        const data = await res.json()
        setStatus({
          connected: true,
          version: data.version || '1.0.0',
          latency,
          lastChecked: new Date(),
          error: null,
        })
      } else {
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: `HTTP ${res.status}`,
          lastChecked: new Date(),
        }))
      }
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        lastChecked: new Date(),
      }))
    }
  }, [])

  useEffect(() => {
    checkStatus()
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [checkStatus])

  return { ...status, checkStatus }
}

// Status Indicator Component
export function APIStatusIndicator({ 
  showDetails = false,
  className = ''
}: { 
  showDetails?: boolean
  className?: string
}) {
  const status = useAPIStatus()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status.connected 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-400">
          {status.connected ? 'API Connected' : 'API Offline'}
        </span>
      </div>
      
      {showDetails && status.connected && (
        <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
          <span>v{status.version}</span>
          {status.latency && (
            <span className="flex items-center gap-1">
              ⚡ {status.latency}ms
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// API Status Banner
export function APIStatusBanner() {
  const status = useAPIStatus()

  if (status.connected) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-yellow-900/90 border border-yellow-700 rounded-lg p-4 shadow-xl z-50">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-semibold text-yellow-200">Backend Offline</h4>
          <p className="text-sm text-yellow-300/80 mt-1">
            Running in demo mode. Start backend with:
          </p>
          <code className="block mt-2 text-xs bg-black/30 p-2 rounded font-mono">
            cd ~/.openclaw/workspace-agents/cinepilot/backend && python main.py
          </code>
          <button 
            onClick={status.checkStatus}
            className="mt-3 text-xs text-yellow-200 underline"
          >
            Retry connection
          </button>
        </div>
      </div>
    </div>
  )
}

export default { useAPIStatus, APIStatusIndicator, APIStatusBanner }
