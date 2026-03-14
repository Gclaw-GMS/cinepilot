'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LocationScoutCardProps {
  location: {
    id: number
    name: string
    address: string
    type: 'indoor' | 'outdoor' | 'studio'
    accessibility: number
    permit_required: boolean
    permit_cost: number
    score: number
    photos: string[]
  }
  onSelect?: (id: number) => void
}

export const LocationScoutCard: React.FC<LocationScoutCardProps> = ({ location, onSelect }) => {
  const [expanded, setExpanded] = useState(false)

  const typeColors = {
    indoor: 'bg-blue-500',
    outdoor: 'bg-green-500',
    studio: 'bg-purple-500'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
    >
      <div className="relative h-40 bg-gray-700">
        {location.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={location.photos[0]} alt={location.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[location.type]} text-white`}>
            {location.type}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
          <span className="text-yellow-400 font-bold">Score: {location.score}/10</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{location.name}</h3>
        <p className="text-gray-400 text-sm mb-3">{location.address}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Accessibility:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= location.accessibility ? 'bg-green-400' : 'bg-gray-600'}`} />
              ))}
            </div>
          </div>
          {location.permit_required && (
            <span className="text-orange-400 text-xs">Permit: ₹{location.permit_cost}</span>
          )}
        </div>
        
        <button
          onClick={() => onSelect?.(location.id)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Select Location
        </button>
      </div>
    </motion.div>
  )
}

interface LocationScoutGridProps {
  locations: any[]
  onSelect?: (id: number) => void
  loading?: boolean
}

export const LocationScoutGrid: React.FC<LocationScoutGridProps> = ({ locations, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-gray-800 rounded-xl h-72 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {locations.map((loc, idx) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <LocationScoutCard location={loc} onSelect={onSelect} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Location Search & Recommendation Component
export const LocationScoutSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    // Simulated - in real app would call API
    setTimeout(() => {
      setResults([
        { id: 1, name: 'Studio 24', address: 'Chennai, TN', type: 'studio' as const, accessibility: 8, permit_required: false, permit_cost: 0, score: 9.2, photos: [] },
        { id: 2, name: 'Beach Location', address: 'Mahabalipuram, TN', type: 'outdoor' as const, accessibility: 6, permit_required: true, permit_cost: 5000, score: 8.5, photos: [] },
        { id: 3, name: 'Heritage House', address: 'Pondicherry, TN', type: 'indoor' as const, accessibility: 7, permit_required: true, permit_cost: 3000, score: 8.1, photos: [] },
      ])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search locations (e.g., beach, studio, temple)..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          Search
        </button>
      </div>
      <LocationScoutGrid locations={results} loading={loading} />
    </div>
  )
}

export default LocationScoutCard
