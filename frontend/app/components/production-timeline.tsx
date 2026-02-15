'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Types
interface TimelineEvent {
  id: string;
  type: 'scene' | 'location' | 'crew' | 'equipment' | 'milestone';
  title: string;
  date: string;
  endDate?: string;
  projectId: string;
  status?: string;
}

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'pre-production' | 'production' | 'post-production';
  status: 'pending' | 'in-progress' | 'completed';
}

// Demo data
const demoTasks: GanttTask[] = [
  {
    id: '1',
    name: 'Script Finalization',
    start: new Date('2026-02-01'),
    end: new Date('2026-02-10'),
    progress: 100,
    type: 'pre-production',
    status: 'completed',
  },
  {
    id: '2',
    name: 'Location Scouting',
    start: new Date('2026-02-05'),
    end: new Date('2026-02-15'),
    progress: 80,
    type: 'pre-production',
    status: 'in-progress',
  },
  {
    id: '3',
    name: 'Casting',
    start: new Date('2026-02-08'),
    end: new Date('2026-02-18'),
    progress: 60,
    type: 'pre-production',
    status: 'in-progress',
  },
  {
    id: '4',
    name: 'Pre-Production',
    start: new Date('2026-02-10'),
    end: new Date('2026-02-20'),
    progress: 40,
    type: 'pre-production',
    status: 'in-progress',
  },
  {
    id: '5',
    name: 'Principal Photography',
    start: new Date('2026-02-21'),
    end: new Date('2026-03-15'),
    progress: 0,
    type: 'production',
    status: 'pending',
  },
  {
    id: '6',
    name: 'Shot 1-15: Studio',
    start: new Date('2026-02-21'),
    end: new Date('2026-02-28'),
    progress: 0,
    type: 'production',
    status: 'pending',
  },
  {
    id: '7',
    name: 'Shot 16-40: Outdoor',
    start: new Date('2026-03-01'),
    end: new Date('2026-03-10'),
    progress: 0,
    type: 'production',
    status: 'pending',
  },
  {
    id: '8',
    name: 'Post-Production',
    start: new Date('2026-03-16'),
    end: new Date('2026-04-15'),
    progress: 0,
    type: 'post-production',
    status: 'pending',
  },
  {
    id: '9',
    name: 'Editing',
    start: new Date('2026-03-16'),
    end: new Date('2026-04-05'),
    progress: 0,
    type: 'post-production',
    status: 'pending',
  },
  {
    id: '10',
    name: 'VFX & DI',
    start: new Date('2026-04-01'),
    end: new Date('2026-04-15'),
    progress: 0,
    type: 'post-production',
    status: 'pending',
  },
];

const typeColors = {
  'pre-production': 'bg-blue-500',
  'production': 'bg-purple-500',
  'post-production': 'bg-orange-500',
};

const statusColors = {
  'pending': 'bg-gray-400',
  'in-progress': 'bg-yellow-500',
  'completed': 'bg-green-500',
};

interface ProductionTimelineProps {
  projectId?: string;
}

export default function ProductionTimeline({ projectId }: ProductionTimelineProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);

  const { startDate, endDate, days } = useMemo(() => {
    const start = new Date('2026-02-01');
    const end = new Date('2026-04-30');
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { startDate: start, endDate: end, days: totalDays };
  }, []);

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.max(0, (task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      left: `${(startOffset / days) * 100}%`,
      width: `${(duration / days) * 100}%`,
    };
  };

  const getDaysInMonth = () => {
    const months = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const months = getDaysInMonth();

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📅</span> Production Timeline
        </h3>
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
        <div className="relative min-h-[400px]">
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
            {demoTasks.map((task, idx) => {
              const pos = getTaskPosition(task);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative h-10 flex items-center cursor-pointer group"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Task Label */}
                  <div className="absolute left-0 w-40 text-sm text-gray-300 truncate pr-2 z-10">
                    {task.name}
                  </div>

                  {/* Task Bar */}
                  <div
                    className={`absolute h-8 rounded-lg ${typeColors[task.type]} cursor-pointer hover:opacity-80 transition-opacity`}
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
          className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">{selectedTask.name}</h4>
              <p className="text-gray-400 text-sm">
                {selectedTask.start.toLocaleDateString()} - {selectedTask.end.toLocaleDateString()}
              </p>
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
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-2xl font-bold text-white">10</div>
          <div className="text-xs text-gray-400">Total Phases</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-400">2</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-2xl font-bold text-yellow-400">5</div>
          <div className="text-xs text-gray-400">In Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-bold text-gray-400">3</div>
          <div className="text-xs text-gray-400">Pending</div>
        </div>
      </div>
    </div>
  );
}
