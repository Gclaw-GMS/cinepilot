'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilmComparison from './FilmComparison';
import BudgetPredictor from './BudgetPredictor';
import CharacterNetwork from './CharacterNetwork';
import WeatherSchedule from './WeatherSchedule';
import VFXAnalyzer from './VFXAnalyzer';

type TabType = 'film' | 'budget' | 'network' | 'weather' | 'vfx';

interface Phase25DashboardProps {
  projectId?: string;
  scenes?: any[];
  characters?: any[];
}

export default function Phase25Dashboard({ projectId, scenes = [], characters = [] }: Phase25DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('budget');

  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: 'film', label: 'Film Comparison', emoji: '🎬' },
    { id: 'budget', label: 'Budget AI', emoji: '💰' },
    { id: 'network', label: 'Character Network', emoji: '🔗' },
    { id: 'weather', label: 'Weather Schedule', emoji: '🌤️' },
    { id: 'vfx', label: 'VFX Analysis', emoji: '✨' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🚀 Phase 25: Advanced AI Suite</h2>
        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full">
          New
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span>{tab.emoji}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === 'film' && <FilmComparison projectId={projectId} />}
          {activeTab === 'budget' && <BudgetPredictor scenes={scenes} genre="drama" />}
          {activeTab === 'network' && <CharacterNetwork scenes={scenes} characters={characters} />}
          {activeTab === 'weather' && <WeatherSchedule schedule={[]} />}
          {activeTab === 'vfx' && <VFXAnalyzer scenes={scenes} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
