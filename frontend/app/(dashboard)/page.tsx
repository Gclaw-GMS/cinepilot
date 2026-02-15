'use client'

import { useState, useEffect } from 'react'
import * as api from '@/lib/api'
import { APIStatusIndicator } from '@/lib/api-status'
import Link from 'next/link'

interface Project {
  id: number
  name: string
  status: string
  budget?: number | null
  language?: string
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 12,
    shooting: 3,
    planning: 9,
    budget: 25000000,
    analyses: 48,
    completion: 67
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Set current time
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))

    async function fetchData() {
      try {
        const data = await api.projects.list()
        if (data && data.length > 0) {
          setConnected(true)
          setProjects(data)
          setStats(prev => ({ ...prev, projects: data.length }))
        }
      } catch (e) {
        // Use mock data
        setProjects([
          { id: 1, name: 'இதயத்தின் ஒலி', status: 'planning', budget: 2500000, language: 'tamil' },
          { id: 2, name: "Veera's Journey", status: 'shooting', budget: 5000000, language: 'tamil' },
        ])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome back! Here's your production overview.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Current Time</div>
            <div className="text-lg font-mono text-cinepilot-accent">{currentTime}</div>
          </div>
          <APIStatusIndicator showDetails />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Projects" value={stats.projects} color="cyan" icon="📁" />
        <StatCard label="In Production" value={stats.shooting} color="green" icon="🎬" />
        <StatCard label="In Planning" value={stats.planning} color="yellow" icon="📝" />
        <StatCard label="Total Budget" value={`₹${(stats.budget/10000000).toFixed(1)}Cr`} color="purple" icon="💰" />
        <StatCard label="AI Analyses" value={stats.analyses} color="cyan" icon="🤖" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Project Progress */}
        <div className="col-span-2 bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Project Progress</h2>
            <Link href="/progress" className="text-xs text-cinepilot-accent hover:underline">View All →</Link>
          </div>
          <div className="space-y-4">
            <ProgressBar project="இதயத்தின் ஒலி" progress={75} status="planning" />
            <ProgressBar project="Veera's Journey" progress={45} status="shooting" />
            <ProgressBar project="Madurai Express" progress={20} status="pre-production" />
            <ProgressBar project="Chennai Nights" progress={90} status="post-production" />
          </div>
        </div>

        {/* Completion Ring */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Overall Completion</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64" cy="64" r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-800"
                />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${stats.completion * 3.52} 352`}
                  strokeLinecap="round"
                  className="text-cinepilot-accent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-cinepilot-accent">{stats.completion}%</span>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Pre-production phase<br/>nearing completion
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & AI Insights */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent Projects</h2>
            <Link href="/scripts" className="text-xs text-cinepilot-accent hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            <ActivityItem project="இதயத்தின் ஒலி" action="Script uploaded" time="2 hours ago" />
            <ActivityItem project="Veera's Journey" action="Schedule generated" time="5 hours ago" />
            <ActivityItem project="Madurai Express" action="Budget approved" time="1 day ago" />
          </div>
        </div>

        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">AI Insights</h2>
            <Link href="/ai-tools" className="text-xs text-cinepilot-accent-hover:underline">View All →</Link>
          </div>
          <InsightItem type="success" text="Scene 15 has location match with Scene 23 - save 1 day" />
          <InsightItem type="warning" text="Actor availability conflict on Day 12" />
          <InsightItem type="info" text="Budget optimized by ₹2.5L using location grouping" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <QuickActionButton icon="📤" label="Upload Script" href="/scripts" />
        <QuickActionButton icon="🎥" label="Generate Shot List" href="/shot-list" />
        <QuickActionButton icon="📅" label="View Schedule" href="/schedule" />
        <QuickActionButton icon="💰" label="Manage Budget" href="/budget" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'cyan', icon }: { label: string; value: string | number; color?: string; icon?: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cinepilot-accent',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 hover:border-cinepilot-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span>{icon}</span>}
        <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function ProgressBar({ project, progress, status }: { project: string; progress: number; status: string }) {
  const statusColors: Record<string, string> = {
    'planning': 'bg-yellow-500',
    'pre-production': 'bg-blue-500',
    'shooting': 'bg-green-500',
    'post-production': 'bg-purple-500',
    'completed': 'bg-gray-500',
  }
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{project}</span>
        <span className="text-gray-400">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${statusColors[status] || 'bg-cinepilot-accent'} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function ActivityItem({ project, action, time }: { project: string; action: string; time: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 -mx-2 px-2 rounded transition-colors">
      <div>
        <div className="font-medium">{project}</div>
        <div className="text-sm text-gray-400">{action}</div>
      </div>
      <div className="text-xs text-gray-500">{time}</div>
    </div>
  )
}

function InsightItem({ type, text }: { type: string; text: string }) {
  const colors: Record<string, string> = {
    success: 'border-green-500 text-green-400',
    warning: 'border-yellow-500 text-yellow-400',
    info: 'border-blue-500 text-blue-400',
  }
  const icons: Record<string, string> = {
    success: '✓',
    warning: '⚠',
    info: 'ℹ',
  }
  return (
    <div className={`p-3 border-l-2 ${colors[type]} bg-gray-800/50 rounded-r mb-2 text-sm flex items-start gap-2`}>
      <span className="opacity-70">{icons[type]}</span>
      {text}
    </div>
  )
}

function QuickActionButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link 
      href={href}
      className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4 text-center hover:border-cinepilot-accent/50 hover:bg-cinepilot-accent/5 transition-all group"
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  )
}
