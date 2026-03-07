'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Loader2, Sparkles } from 'lucide-react'

interface ConnectionStatus {
  api: 'connected' | 'disconnected' | 'checking'
  backend: string
}

interface HealthData {
  status: string
  version: string
  database?: {
    status: string
    provider?: string
  }
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    api: 'checking',
    backend: 'Unknown'
  })
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [dbStatus, setDbStatus] = useState<string>('Unknown')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Use the actual health API endpoint (full check, not simple)
      const res = await fetch('/api/health')
      if (res.ok) {
        const healthData: HealthData = await res.json()
        setStatus({
          api: 'connected',
          backend: healthData.version || '1.0.0'
        })
        
        // Set database status
        if (healthData.database?.status === 'connected') {
          setDbStatus(healthData.database.provider || 'PostgreSQL')
        } else {
          setDbStatus('Demo Mode')
        }
        
        // Try to get AI capabilities from the AI API
        try {
          const aiRes = await fetch('/api/ai')
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            setCapabilities(aiData.features?.map((f: any) => f.name) || [])
          }
        } catch {
          // AI capabilities not available - use defaults
          setCapabilities(['Script Analysis', 'Shot Generation', 'Budget AI'])
        }
      } else {
        throw new Error('Health check failed')
      }
    } catch (e) {
      setStatus({
        api: 'disconnected',
        backend: 'Unavailable'
      })
      setDbStatus('Offline')
    }
  }

  const statusConfig = {
    connected: { 
      color: 'bg-green-500', 
      text: 'Connected',
      icon: Wifi
    },
    disconnected: { 
      color: 'bg-red-500', 
      text: 'Offline',
      icon: WifiOff
    },
    checking: { 
      color: 'bg-yellow-500', 
      text: 'Checking...',
      icon: Loader2
    }
  }

  const config = statusConfig[status.api]
  const StatusIcon = config.icon

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.color} ${status.api === 'checking' ? 'animate-pulse' : ''}`} />
          <StatusIcon className={`w-4 h-4 ${status.api === 'connected' ? 'text-green-400' : status.api === 'disconnected' ? 'text-red-400' : 'text-yellow-400'}`} />
          <span className="text-sm font-medium text-slate-200">{config.text}</span>
          <span className="text-xs text-slate-500">v{status.backend}</span>
          {dbStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${dbStatus === 'Demo Mode' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {dbStatus}
            </span>
          )}
        </div>
        
        {status.api === 'connected' && capabilities.length > 0 && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <div className="flex gap-1">
              {capabilities.slice(0, 3).map((cap) => (
                <span 
                  key={cap}
                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
                >
                  {cap}
                </span>
              ))}
              {capabilities.length > 3 && (
                <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                  +{capabilities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
        
        {status.api === 'disconnected' && (
          <span className="text-xs text-amber-500">
            Using demo data
          </span>
        )}
      </div>
    </div>
  )
}
