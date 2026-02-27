'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, Clock, Film, MapPin, Loader2 } from 'lucide-react';

interface ShootingDay {
  id: string;
  dayNumber: number;
  scheduledDate: string | null;
  callTime: string | null;
  estimatedHours: string | null;
  notes: string | null;
  status: string;
  dayScenes: DayScene[];
  location?: { name: string } | null;
}

interface DayScene {
  id: string;
  orderNumber: number | null;
  estimatedMinutes: number | null;
  scene: {
    id: string;
    sceneNumber: string;
    headingRaw: string | null;
    intExt: string | null;
    timeOfDay: string | null;
    location: string | null;
  };
}

interface Script {
  id: string;
  title: string;
  scenes: { id: string; sceneNumber: string }[];
}

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'pre-production' | 'production' | 'post-production';
  status: 'pending' | 'in-progress' | 'completed';
  details?: string;
  scenes?: number;
}

const typeColors: Record<string, string> = {
  'pre-production': 'bg-blue-500',
  'production': 'bg-purple-500',
  'post-production': 'bg-orange-500',
};

const typeColorVars: Record<string, string> = {
  'pre-production': 'bg-blue-500/20 border-blue-500',
  'production': 'bg-purple-500/20 border-purple-500',
  'post-production': 'bg-orange-500/20 border-orange-500',
};

const statusColors: Record<string, string> = {
  'pending': 'bg-gray-400',
  'in-progress': 'bg-yellow-500',
  'completed': 'bg-green-500',
};

interface ProductionTimelineProps {
  projectId?: string;
}

export default function ProductionTimeline({ projectId = 'default-project' }: ProductionTimelineProps) {
  const [shootingDays, setShootingDays] = useState<ShootingDay[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch schedule data
      const scheduleRes = await fetch(`/api/schedule?projectId=${projectId}`);
      const scheduleData = await scheduleRes.json();
      
      // Fetch scripts for scene count
      const scriptsRes = await fetch(`/api/scripts?projectId=${projectId}`);
      const scriptsData = await scriptsRes.json();
      
      setShootingDays(scheduleData.shootingDays || []);
      setScripts(scriptsData.scripts || []);
    } catch (err) {
      console.error('Failed to fetch timeline data:', err);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform API data into Gantt tasks
  const tasks: GanttTask[] = useMemo(() => {
    const result: GanttTask[] = [];
    
    // Pre-production phase (if no shooting days yet)
    if (shootingDays.length === 0) {
      const today = new Date();
      result.push({
        id: 'pre-prod',
        name: 'Pre-Production',
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        progress: 60,
        type: 'pre-production',
        status: 'in-progress',
        details: 'Script breakdown, location scouting, casting',
        scenes: scripts.length > 0 ? scripts[0]?.scenes?.length || 0 : 0,
      });
    }
    
    // Add shooting days as production tasks
    shootingDays.forEach((day) => {
      const date = day.scheduledDate ? new Date(day.scheduledDate) : new Date();
      const hours = parseFloat(day.estimatedHours || '0');
      const endDate = new Date(date);
      endDate.setHours(endDate.getHours() + hours);
      
      // Group consecutive days by location
      const locationName = day.location?.name || day.dayScenes[0]?.scene.location || 'TBD';
      
      result.push({
        id: day.id,
        name: `Day ${day.dayNumber}: ${locationName}`,
        start: date,
        end: endDate,
        progress: day.status === 'completed' ? 100 : day.status === 'in-progress' ? 50 : 0,
        type: 'production',
        status: day.status === 'completed' ? 'completed' : day.status === 'in-progress' ? 'in-progress' : 'pending',
        details: day.dayScenes.map(ds => ds.scene.sceneNumber).join(', ') || 'No scenes',
        scenes: day.dayScenes.length,
      });
    });

    // Add post-production if shooting is complete
    if (shootingDays.length > 0) {
      const lastDay = shootingDays[shootingDays.length - 1];
      if (lastDay?.scheduledDate) {
        const lastDate = new Date(lastDay.scheduledDate);
        const postStart = new Date(lastDate);
        postStart.setDate(postStart.getDate() + 1);
        const postEnd = new Date(postStart);
        postEnd.setMonth(postEnd.getMonth() + 2);
        
        result.push({
          id: 'post-prod',
          name: 'Post-Production',
          start: postStart,
          end: postEnd,
          progress: 0,
          type: 'post-production',
          status: 'pending',
          details: 'Editing, VFX, Sound, DI',
        });
      }
    }

    return result;
  }, [shootingDays, scripts]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const totalScenes = tasks.reduce((sum, t) => sum + (t.scenes || 0), 0);
    
    return { total, completed, inProgress, pending, totalScenes };
  }, [tasks]);

  const { startDate, endDate, days } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0),
        days: 90,
      };
    }
    
    let minDate = new Date();
    let maxDate = new Date();
    
    tasks.forEach(task => {
      if (task.start < minDate) minDate = task.start;
      if (task.end > maxDate) maxDate = task.end;
    });
    
    // Add padding
    minDate = new Date(minDate);
    minDate.setDate(minDate.getDate() - 7);
    maxDate = new Date(maxDate);
    maxDate.setDate(maxDate.getDate() + 14);
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return { startDate: minDate, endDate: maxDate, days: totalDays };
  }, [tasks]);

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.max(0, (task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      left: `${(startOffset / days) * 100}%`,
      width: `${(duration / days) * 100}%`,
    };
  };

  const getMonthsInRange = () => {
    const months = [];
    const current = new Date(startDate);
    current.setDate(1);
    while (current <= endDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const months = getMonthsInRange();

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="text-gray-400">Loading timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <div className="text-red-400">{error}</div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const hasNoData = tasks.length === 0;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📅</span> Production Timeline
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-sm ${
                viewMode === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-sm ${
                viewMode === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-400">Pre-Production</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-gray-400">Production</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-400">Post-Production</span>
        </div>
      </div>

      {/* Empty State */}
      {hasNoData ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <Calendar className="w-16 h-16 text-gray-600 mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">No Schedule Yet</h4>
          <p className="text-gray-400 max-w-md">
            Optimize your schedule in the Schedule tab to see your production timeline here.
          </p>
        </div>
      ) : (
        <>
          {/* Timeline Grid */}
          <div className="relative overflow-x-auto">
            {/* Month Headers */}
            <div className="flex border-b border-gray-700 mb-2">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="text-center text-gray-400 text-sm py-2 border-r border-gray-700 last:border-r-0"
                  style={{ width: `${100 / months.length}%` }}
                >
                  {month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              ))}
            </div>

            {/* Gantt Bars */}
            <div className="relative min-h-[300px]">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex">
                {months.map((_, idx) => (
                  <div
                    key={idx}
                    className="border-r border-gray-800 h-full"
                    style={{ width: `${100 / months.length}%` }}
                  />
                ))}
              </div>

              {/* Task Rows */}
              <div className="relative space-y-3 pt-8">
                {tasks.map((task, idx) => {
                  const pos = getTaskPosition(task);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative h-12 flex items-center cursor-pointer group"
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Task Label */}
                      <div className="absolute left-0 w-40 text-sm text-gray-300 truncate pr-2 z-10 flex flex-col">
                        <span className="truncate font-medium">{task.name}</span>
                        {task.scenes !== undefined && task.scenes > 0 && (
                          <span className="text-xs text-gray-500">{task.scenes} scenes</span>
                        )}
                      </div>

                      {/* Task Bar */}
                      <div
                        className={`absolute h-10 rounded-lg ${typeColors[task.type]} cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                          task.status === 'completed' ? 'border-green-400' : 
                          task.status === 'in-progress' ? 'border-yellow-400' : 'border-transparent'
                        }`}
                        style={{ left: `calc(11rem + ${pos.left})`, width: pos.width }}
                      >
                        {/* Progress Fill */}
                        <div
                          className="h-full bg-white/20 rounded-lg"
                          style={{ width: `${task.progress}%` }}
                        />
                        {/* Progress Text */}
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {task.progress > 0 ? `${task.progress}%` : task.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Task Details */}
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg border-2 ${typeColorVars[selectedTask.type]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">{selectedTask.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedTask.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {selectedTask.start.getTime() !== selectedTask.end.getTime() && (
                        <> - {selectedTask.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </span>
                    {selectedTask.scenes !== undefined && selectedTask.scenes > 0 && (
                      <span className="flex items-center gap-1">
                        <Film className="w-4 h-4" />
                        {selectedTask.scenes} scenes
                      </span>
                    )}
                  </div>
                  {selectedTask.details && (
                    <p className="text-sm text-gray-500 mt-2">{selectedTask.details}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{selectedTask.progress}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedTask.status]} text-white`}>
                    {selectedTask.status}
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-5 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total Phases</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
          <div className="text-xs text-gray-400">In Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">🎬</div>
          <div className="text-2xl font-bold text-purple-400">{stats.totalScenes}</div>
          <div className="text-xs text-gray-400">Total Scenes</div>
        </div>
      </div>
    </div>
  );
}
