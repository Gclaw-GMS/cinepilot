'use client';

import { useState } from 'react';
import ProductionTimeline from '../components/production-timeline';

export default function TimelinePage() {
  const [selectedProject, setSelectedProject] = useState('all');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">🎬</span> Production Timeline
            </h1>
            <p className="text-gray-400 mt-1">Visual project timeline with Gantt chart</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Projects</option>
              <option value="1">Kaadhal Enbadhu</option>
              <option value="2">Vikram Vedha 2</option>
            </select>
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors">
              + Add Phase
            </button>
          </div>
        </div>

        {/* Timeline */}
        <ProductionTimeline projectId={selectedProject} />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors text-left">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-white">Edit Schedule</div>
            <div className="text-sm text-gray-400">Modify timeline phases</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors text-left">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-medium text-white">Auto-Schedule</div>
            <div className="text-sm text-gray-400">AI optimize dates</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors text-left">
            <div className="text-2xl mb-2">📤</div>
            <div className="font-medium text-white">Export Timeline</div>
            <div className="text-sm text-gray-400">PDF/Image export</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors text-left">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-white">Assign Tasks</div>
            <div className="text-sm text-gray-400">Team assignments</div>
          </button>
        </div>
      </div>
    </div>
  );
}
