"use client"

import { useState } from 'react'
import Sidebar from '../sidebar'
import ProductionReport from '../components/production-report'
import CharacterArcViewer from '../components/character-arc-viewer'
import ShotListGenerator from '../components/shot-list-generator'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'arc' | 'shots'>('reports')

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">📊 Reports & Analysis</h1>
            <p className="text-gray-400 mt-2">Production insights and AI-powered analysis</p>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📋 Production Reports
            </button>
            <button
              onClick={() => setActiveTab('arc')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'arc'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🎭 Character Arcs
            </button>
            <button
              onClick={() => setActiveTab('shots')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'shots'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🎬 Shot List Generator
            </button>
          </div>

          {/* Content */}
          {activeTab === 'reports' && <ProductionReport />}
          {activeTab === 'arc' && <CharacterArcViewer />}
          {activeTab === 'shots' && <ShotListGenerator />}
        </div>
      </main>
    </div>
  )
}
