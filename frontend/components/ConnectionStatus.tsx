// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'
const { aiEnhanced2 } = api

interface ConnectionStatus {
  api: 'connected' | 'disconnected' | 'checking'
  backend: string
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    api: 'checking',
    backend: 'Unknown'
  })
  const [capabilities, setCapabilities] = useState<string[]>([])

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const health = await api.health()
      setStatus({
        api: 'connected',
        backend: health.version || '1.0.0'
      })
      
      // Get AI capabilities
      const caps: any = await aiEnhanced2.getCapabilities()
      setCapabilities(caps.features || [])
    } catch (e) {
      setStatus({
        api: 'disconnected',
        backend: 'Unavailable'
      })
    }
  }

  const statusColor = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    checking: 'bg-yellow-500'
  }

  const statusText = {
    connected: 'API Connected',
    disconnected: 'API Offline',
    checking: 'Checking...'
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColor[status.api]}`} />
          <span className="text-sm font-medium">{statusText[status.api]}</span>
          <span className="text-xs text-gray-500">v{status.backend}</span>
        </div>
        
        {status.api === 'connected' && capabilities.length > 0 && (
          <div className="flex gap-1">
            {capabilities.slice(0, 3).map((cap) => (
              <span 
                key={cap}
                className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
              >
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
            {capabilities.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                +{capabilities.length - 3}
              </span>
            )}
          </div>
        )}
        
        {status.api === 'disconnected' && (
          <span className="text-xs text-yellow-500">
            Using demo data
          </span>
        )}
      </div>
    </div>
  )
}
