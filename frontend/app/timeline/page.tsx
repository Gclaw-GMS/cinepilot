'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProductionTimeline from '../components/production-timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Download, Plus, Layers, Grid3X3, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Target, CheckCircle, Zap, Clock, Film, MapPin,
  Filter, RefreshCw, TrendingUp, TrendingDown, Keyboard
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);
  
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
      if (timelineData.isDemoMode) {
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

  // Export timeline to CSV
  const handleExportTimeline = () => {
    const timelineData = [
      { Phase: 'Pre-Production', Status: 'Completed', Progress: '100%', Start: '2026-01-01', End: '2026-01-20', Scenes: 47 },
      { Phase: 'Principal Photography', Status: 'In Progress', Progress: '40%', Start: '2026-01-21', End: '2026-02-10', Scenes: 47 },
      { Phase: 'Post-Production', Status: 'Pending', Progress: '0%', Start: '2026-02-11', End: '2026-03-15', Scenes: 0 },
    ];
    
    const milestonesData = [
      { Milestone: 'Script Lock', Date: '2026-01-05', Status: 'Completed', Phase: 'Pre-Production' },
      { Milestone: 'Casting Complete', Date: '2026-01-10', Status: 'Completed', Phase: 'Pre-Production' },
      { Milestone: 'Location Scout Done', Date: '2026-01-15', Status: 'Completed', Phase: 'Pre-Production' },
      { Milestone: '50% Shoot Days', Date: '2026-01-31', Status: 'In Progress', Phase: 'Production' },
      { Milestone: 'Pack-Up', Date: '2026-02-10', Status: 'Pending', Phase: 'Production' },
      { Milestone: 'Rough Cut', Date: '2026-02-25', Status: 'Pending', Phase: 'Post-Production' },
      { Milestone: 'Final Delivery', Date: '2026-03-15', Status: 'Pending', Phase: 'Post-Production' },
    ];

    // Export phases
    const phaseHeaders = Object.keys(timelineData[0]);
    const phaseRows = timelineData.map(row => Object.values(row).join(','));
    const phaseCsv = [phaseHeaders.join(','), ...phaseRows].join('\n');
    
    // Export milestones
    const milestoneHeaders = Object.keys(milestonesData[0]);
    const milestoneRows = milestonesData.map(row => Object.values(row).join(','));
    const milestoneCsv = [milestoneHeaders.join(','), ...milestoneRows].join('\n');

    // Create combined CSV
    const combinedCsv = `PRODUCTION TIMELINE EXPORT\nGenerated: ${new Date().toISOString()}\n\nPHASES\n${phaseCsv}\n\nMILESTONES\n${milestoneCsv}`;
    
    const blob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const projectOptions = DEMO_PROJECTS;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // R: Refresh data
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleRefresh();
      }
      
      // V: Cycle through view modes
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const modes: Array<'timeline' | 'gantt' | 'calendar'> = ['timeline', 'gantt', 'calendar'];
        const currentIndex = modes.indexOf(viewMode);
        setViewMode(modes[(currentIndex + 1) % modes.length]);
      }
      
      // +/-: Zoom in/out
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomLevel(prev => Math.min(prev + 0.25, 2));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
      }
      
      // F: Focus filter
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowFilters(true);
        setTimeout(() => filterInputRef.current?.focus(), 50);
      }
      
      // E: Export
      if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleExportTimeline();
      }
      
      // ?: Show keyboard help (Shift+?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      
      // Escape: Close keyboard help
      if (e.key === 'Escape') {
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else if (showFilters) {
          setShowFilters(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, showFilters, showKeyboardHelp, handleExportTimeline]);

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
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
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

        {/* Progress Visualization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Phase Progress Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Phase Completion
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.completed, color: '#10b981' },
                      { name: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
                      { name: 'Pending', value: stats.pending, color: '#64748b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#10b981', '#f59e0b', '#64748b'
                      ][index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px' 
                    }}
                    formatter={(value: number) => [`${value} phases`, '']}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Trend Area Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Weekly Progress Trend
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { week: 'Week 1', planned: 4, completed: 4 },
                    { week: 'Week 2', planned: 3, completed: 3 },
                    { week: 'Week 3', planned: 5, completed: 4 },
                    { week: 'Week 4', planned: 2, completed: 2 },
                    { week: 'Week 5', planned: 4, completed: 1 },
                    { week: 'Week 6', planned: 3, completed: 0 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px' 
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="planned"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPlanned)"
                    name="Planned Scenes"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="Completed Scenes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
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
            <button 
              onClick={handleExportTimeline}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
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
            onClick={handleExportTimeline}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Download className="w-4 h-4 text-green-400" />
              </div>
              <div className="font-medium text-white">Export Timeline</div>
            </div>
            <div className="text-sm text-slate-400">CSV export</div>
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

        {/* Enhanced Milestone Tracker */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Milestone Tracker
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Overall Progress:</span>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-green-400 font-medium">{Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%</span>
            </div>
          </div>
          
          {/* Milestone Timeline Visualization */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>
              
              {/* Milestones */}
              <div className="space-y-6">
                {[
                  { name: 'Script Lock', date: '2026-01-05', phase: 'Pre-Production', status: 'completed', progress: 100 },
                  { name: 'Casting Complete', date: '2026-01-10', phase: 'Pre-Production', status: 'completed', progress: 100 },
                  { name: 'Location Scout Done', date: '2026-01-15', phase: 'Pre-Production', status: 'completed', progress: 100 },
                  { name: '50% Shoot Days', date: '2026-01-31', phase: 'Production', status: 'in_progress', progress: 40 },
                  { name: 'Pack-Up', date: '2026-02-10', phase: 'Production', status: 'pending', progress: 0 },
                  { name: 'Rough Cut', date: '2026-02-25', phase: 'Post-Production', status: 'pending', progress: 0 },
                  { name: 'Final Delivery', date: '2026-03-15', phase: 'Post-Production', status: 'pending', progress: 0 },
                ].map((milestone, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-2">
                    {/* Status Indicator */}
                    <div className={`
                      relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2
                      ${milestone.status === 'completed' ? 'bg-green-500/20 border-green-500' : 
                        milestone.status === 'in_progress' ? 'bg-yellow-500/20 border-yellow-500' : 
                        'bg-slate-800 border-slate-600'}
                    `}>
                      {milestone.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : milestone.status === 'in_progress' ? (
                        <Zap className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white">{milestone.name}</h4>
                          <p className="text-sm text-slate-400">{milestone.phase}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-300">{milestone.date}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  milestone.status === 'completed' ? 'bg-green-500' :
                                  milestone.status === 'in_progress' ? 'bg-yellow-500' : 'bg-slate-600'
                                }`}
                                style={{ width: `${milestone.progress}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              milestone.status === 'completed' ? 'text-green-400' :
                              milestone.status === 'in_progress' ? 'text-yellow-400' : 'text-slate-500'
                            }`}>{milestone.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Production Metrics Summary */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Pre-Production</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-semibold text-blue-400">100%</div>
            <div className="text-xs text-slate-500 mt-1">3/3 milestones</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Production</span>
              <Film className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-purple-400">40%</div>
            <div className="text-xs text-slate-500 mt-1">1/3 milestones</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Post-Production</span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-semibold text-orange-400">0%</div>
            <div className="text-xs text-slate-500 mt-1">0/2 milestones</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Days Remaining</span>
              <Calendar className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-semibold text-green-400">42</div>
            <div className="text-xs text-slate-500 mt-1">Until delivery</div>
          </div>
        </div>
      </main>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-purple-400" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh timeline data' },
                { key: 'V', description: 'Cycle view mode (Timeline → Gantt → Calendar)' },
                { key: '+/-', description: 'Zoom in/out' },
                { key: 'F', description: 'Focus filter input' },
                { key: 'E', description: 'Export to CSV' },
                { key: '?', description: 'Show this help' },
                { key: 'Esc', description: 'Close modal' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm font-mono text-purple-400">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">Press <kbd className="px-1 bg-slate-800 rounded">?</kbd> anytime to show this help</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
