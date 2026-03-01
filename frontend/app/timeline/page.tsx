'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProductionTimeline from '../components/production-timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Download, Plus, Layers, Grid3X3, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Target, CheckCircle, Zap, Clock, Film, MapPin,
  Filter, RefreshCw
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  shootDays: number;
  scenes: number;
}

const DEMO_PROJECTS: Project[] = [
  { id: 'all', name: 'All Projects' },
  { id: '1', name: 'Kaadhal Enbadhu' },
  { id: '2', name: 'Vikram Vedha 2' },
];

export default function TimelinePage() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt' | 'calendar'>('timeline');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Real stats from API
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    shootDays: 0,
    scenes: 0,
  });

  // Demo stats for when there's no data
  const DEMO_STATS: Stats = {
    total: 8,
    completed: 2,
    inProgress: 3,
    pending: 3,
    shootDays: 20,
    scenes: 145,
  };

  // Fetch real stats from API
  const fetchStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const projectId = selectedProject === 'all' ? 'default-project' : selectedProject;
      
      // Fetch timeline data from dedicated API
      const timelineRes = await fetch(`/api/timeline?projectId=${projectId}`);
      const timelineData = await timelineRes.json();
      
      // Check if we're in demo mode
      if (timelineData.isDemo) {
        setStats(DEMO_STATS);
        setIsDemoMode(true);
      } else {
        // Use real data from API
        const statsFromApi = timelineData.stats;
        if (statsFromApi && statsFromApi.totalPhases > 0) {
          setIsDemoMode(false);
          setStats({
            total: statsFromApi.totalPhases,
            completed: statsFromApi.completedPhases,
            inProgress: statsFromApi.totalPhases - statsFromApi.completedPhases,
            pending: 0,
            shootDays: statsFromApi.totalScenes,
            scenes: statsFromApi.totalScenes,
          });
        } else {
          setStats(DEMO_STATS);
          setIsDemoMode(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch timeline stats:', err);
      // Use demo stats on error for better UX
      setStats(DEMO_STATS);
      setIsDemoMode(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [selectedProject]);

  // Fetch stats on mount and when project changes
  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const projectOptions = DEMO_PROJECTS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Production Timeline
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-sm mt-1">Visual project timeline with Gantt chart</p>
                {isDemoMode && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-medium">
                    DEMO
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Phase
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Total Phases</span>
            </div>
            <p className="text-2xl font-semibold text-white">{stats.total}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-slate-400">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-green-400">{stats.completed}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm text-slate-400">In Progress</span>
            </div>
            <p className="text-2xl font-semibold text-yellow-400">{stats.inProgress}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-slate-700/50">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm text-slate-400">Pending</span>
            </div>
            <p className="text-2xl font-semibold text-slate-400">{stats.pending}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Film className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Shoot Days</span>
            </div>
            <p className="text-2xl font-semibold text-purple-400">{stats.shootDays}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <MapPin className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm text-slate-400">Total Scenes</span>
            </div>
            <p className="text-2xl font-semibold text-indigo-400">{stats.scenes}</p>
          </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'timeline' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 inline mr-1" />
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'gantt' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 inline mr-1" />
                  Gantt
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'calendar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Calendar
                </button>
              </div>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  showFilters ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Zoom:</span>
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                  className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-6 pt-4 mt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Type:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="pre-production">Pre-Production</option>
                      <option value="production">Production</option>
                      <option value="post-production">Post-Production</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setFilterType('all')}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-slate-400">Pre-Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-slate-400">Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-slate-400">Post-Production</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-green-400"></div>
            <span className="text-slate-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-yellow-400"></div>
            <span className="text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-transparent"></div>
            <span className="text-slate-400">Pending</span>
          </div>
        </div>

        {/* Timeline Component */}
        <ProductionTimeline projectId={selectedProject} />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="font-medium text-white">Edit Schedule</div>
            </div>
            <div className="text-sm text-slate-400">Modify timeline phases</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-medium text-white">Auto-Schedule</div>
            </div>
            <div className="text-sm text-slate-400">AI optimize dates</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Download className="w-4 h-4 text-green-400" />
              </div>
              <div className="font-medium text-white">Export Timeline</div>
            </div>
            <div className="text-sm text-slate-400">PDF/Image export</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-medium text-white">Assign Tasks</div>
            </div>
            <div className="text-sm text-slate-400">Team assignments</div>
          </motion.button>
        </div>
      </main>
    </div>
  );
}
