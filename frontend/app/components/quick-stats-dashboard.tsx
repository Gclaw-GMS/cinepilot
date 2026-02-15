'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ProjectStats {
  totalScenes: number;
  completedScenes: number;
  totalBudget: number;
  spentBudget: number;
  totalLocations: number;
  totalCrew: number;
  shootingDays: number;
  progress: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

const defaultStats: ProjectStats = {
  totalScenes: 45,
  completedScenes: 12,
  totalBudget: 2500000,
  spentBudget: 875000,
  totalLocations: 8,
  totalCrew: 24,
  shootingDays: 18,
  progress: 27,
};

const sceneData = [
  { name: 'Completed', value: 12, color: '#22c55e' },
  { name: 'In Progress', value: 18, color: '#eab308' },
  { name: 'Pending', value: 15, color: '#6b7280' },
];

const budgetData = [
  { name: 'Pre-Prod', value: 350000 },
  { name: 'Production', value: 1500000 },
  { name: 'Post-Prod', value: 500000 },
  { name: 'Contingency', value: 150000 },
];

const crewData = [
  { department: 'Direction', count: 3 },
  { department: 'Camera', count: 8 },
  { department: 'Lighting', count: 5 },
  { department: 'Sound', count: 3 },
  { department: 'Art', count: 5 },
];

export default function QuickStatsDashboard() {
  const [stats, setStats] = useState<ProjectStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const quickStats: QuickStat[] = [
    { label: 'Total Scenes', value: stats.totalScenes, change: 5, icon: '🎬', color: 'bg-purple-500' },
    { label: 'Completed', value: stats.completedScenes, change: 12, icon: '✅', color: 'bg-green-500' },
    { label: 'Locations', value: stats.totalLocations, icon: '📍', color: 'bg-blue-500' },
    { label: 'Crew', value: stats.totalCrew, icon: '👥', color: 'bg-pink-500' },
    { label: 'Budget', value: formatCurrency(stats.totalBudget), icon: '💰', color: 'bg-yellow-500' },
    { label: 'Spent', value: formatCurrency(stats.spentBudget), icon: '💳', color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-16 mb-1"></div>
            <div className="h-4 bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-6 gap-4">
        {quickStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              {stat.change && (
                <span className={`text-xs font-medium ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress Ring */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#374151"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#8b5cf6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(stats.progress / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{stats.progress}%</span>
                <span className="text-xs text-gray-400">Complete</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-green-400 font-medium">{stats.completedScenes}</div>
              <div className="text-gray-500">Done</div>
            </div>
            <div>
              <div className="text-yellow-400 font-medium">{stats.totalScenes - stats.completedScenes}</div>
              <div className="text-gray-500">Left</div>
            </div>
            <div>
              <div className="text-blue-400 font-medium">{stats.shootingDays}</div>
              <div className="text-gray-500">Days</div>
            </div>
          </div>
        </motion.div>

        {/* Scene Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Scene Distribution</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sceneData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sceneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {sceneData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Budget Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Budget Breakdown</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <span className="text-gray-400 text-sm">Total: </span>
            <span className="text-white font-bold">{formatCurrency(stats.totalBudget)}</span>
          </div>
        </motion.div>
      </div>

      {/* Crew Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Crew by Department</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={crewData}>
              <XAxis dataKey="department" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
