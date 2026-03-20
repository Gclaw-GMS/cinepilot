'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  TrendingUp,
  Lightbulb,
  ExternalLink,
  Plus,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingDown,
  Instagram,
  Youtube,
  Twitter,
  Video,
  AlertCircle,
  CheckCircle,
  Clock,
  HelpCircle,
  X,
  Search,
  Download,
  Printer,
  Filter,
} from 'lucide-react'
import {
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, color: '#1DA1F2' },
]

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
}

const DEMO_PROJECT_ID = 'demo-project'

// Regional cinema options for South Indian films
const REGIONAL_CINEMA = [
  { key: 'tamil', label: 'Tamil', color: '#ff6b6b', flag: '🇮🇳' },
  { key: 'telugu', label: 'Telugu', color: '#4ecdc4', flag: '🇮🇳' },
  { key: 'malayalam', label: 'Malayalam', color: '#45b7d1', flag: '🇮🇳' },
  { key: 'kannada', label: 'Kannada', color: '#96ceb4', flag: '🇮🇳' },
  { key: 'hindi', label: 'Hindi', color: '#feca57', flag: '🇮🇳' },
  { key: 'other', label: 'Other', color: '#a29bfe', flag: '🌍' },
]

// Language detection for comments
const COMMENT_LANGUAGES = [
  { key: 'tamil', label: 'Tamil', color: '#ff6b6b' },
  { key: 'english', label: 'English', color: '#3b82f6' },
  { key: 'telugu', label: 'Telugu', color: '#4ecdc4' },
  { key: 'hindi', label: 'Hindi', color: '#feca57' },
  { key: 'malayalam', label: 'Malayalam', color: '#45b7d1' },
  { key: 'kannada', label: 'Kannada', color: '#96ceb4' },
]

interface LanguageBreakdown {
  tamil: number
  english: number
  telugu: number
  hindi: number
  malayalam: number
  kannada: number
  other: number
}

interface SentimentAnalysis {
  id: string
  title: string
  platform: string
  videoUrl?: string | null
  totalComments: number
  analyzedCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  avgSentiment: number
  topPositive: Array<{ text: string; author: string; likes: number; language?: string }>
  topNegative: Array<{ text: string; author: string; likes: number; language?: string }>
  takeaways: string[]
  posterTips: string[]
  status: string
  errorMsg?: string | null
  createdAt: string
  // New South Indian cinema fields
  regionalCinema?: string
  languageBreakdown?: LanguageBreakdown
  audienceAgeGroups?: Record<string, number>
  sentimentTrend?: Array<{ date: string; sentiment: number; comments: number }>
}

export default function AudienceSentimentPage() {
  const [analyses, setAnalyses] = useState<SentimentAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'analyzing' | 'failed'>('all')
  const [regionalFilter, setRegionalFilter] = useState<string>('all')
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'sentiment' | 'comments' | 'positive' | 'negative' | 'neutral'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const printMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  
  // Calculate active filter count
  const activeFilterCount = (platformFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0) + (sortBy !== 'createdAt' || sortOrder !== 'desc' ? 1 : 0) + (regionalFilter !== 'all' ? 1 : 0)
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube',
    videoUrl: '',
    regionalCinema: 'tamil', // Default to Tamil cinema
  })

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchDataRef = useRef<() => void | Promise<void>>()
  const printSentimentReportRef = useRef<() => void>(() => {})
  const handleExportMarkdownRef = useRef(() => {})

  // Refs for context-aware keyboard shortcuts
  const showFiltersRef = useRef(showFilters)
  const platformFilterRef = useRef(platformFilter)
  const statusFilterRef = useRef(statusFilter)
  
  // Sync refs with state for context-aware shortcuts
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  useEffect(() => {
    platformFilterRef.current = platformFilter
  }, [platformFilter])
  
  useEffect(() => {
    statusFilterRef.current = statusFilter
  }, [statusFilter])

  // Filter and sort analyses by platform, status, search query, regional cinema, and sort options
  const filteredAnalyses = useMemo(() => {
    const filtered = analyses.filter(a => {
      const matchesPlatform = platformFilter === 'all' || a.platform === platformFilter
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter
      const matchesRegional = regionalFilter === 'all' || a.regionalCinema === regionalFilter
      const matchesSearch = !searchQuery || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.topPositive?.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (a.topNegative?.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (a.takeaways?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
      return matchesPlatform && matchesStatus && matchesRegional && matchesSearch
    })
    
    // Sort the filtered results
    return filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'sentiment':
          comparison = a.avgSentiment - b.avgSentiment
          break
        case 'comments':
          comparison = a.totalComments - b.totalComments
          break
        case 'positive':
          comparison = a.positiveCount - b.positiveCount
          break
        case 'negative':
          comparison = a.negativeCount - b.negativeCount
          break
        case 'neutral':
          comparison = a.neutralCount - b.neutralCount
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [analyses, platformFilter, statusFilter, regionalFilter, searchQuery, sortBy, sortOrder])

  const fetchAnalyses = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/audience-sentiment?projectId=${DEMO_PROJECT_ID}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalyses(data.sentiments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = async () => {
      setRefreshing(true)
      await fetchAnalyses()
    }
  }, [fetchAnalyses])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      // Context-aware number keys for platform filtering
      if (showFiltersRef.current) {
        // When filter panel is OPEN: Number keys 1-4 toggle platform filter (toggle behavior)
        const platformFilters: Record<string, string> = {
          '1': 'all',
          '2': 'youtube',
          '3': 'instagram',
          '4': 'twitter',
        }
        
        if (platformFilters[e.key]) {
          e.preventDefault()
          const platform = platformFilters[e.key]
          // Toggle behavior: if same platform is selected, clear to 'all'
          if (platformFilterRef.current === platform) {
            setPlatformFilter('all')
          } else {
            setPlatformFilter(platform)
          }
        }
        
        // 0: Clear platform filter
        if (e.key === '0') {
          e.preventDefault()
          setPlatformFilter('all')
        }
        
        // Shift+Number for status filter (when filter panel is OPEN)
        if (e.shiftKey) {
          const statusFilters: Record<string, typeof statusFilter> = {
            '1': 'all',
            '2': 'completed',
            '3': 'analyzing',
            '4': 'failed',
          }
          
          if (statusFilters[e.key]) {
            e.preventDefault()
            const status = statusFilters[e.key]
            // Toggle behavior: if same status is selected, clear to 'all'
            if (statusFilterRef.current === status) {
              setStatusFilter('all')
            } else {
              setStatusFilter(status)
            }
          }
          
          // Shift+0: Clear status filter
          if (e.key === '0') {
            e.preventDefault()
            setStatusFilter('all')
          }
        }
      } else {
        // When filter panel is CLOSED: Number keys open filter panel and apply platform filter
        const platformFilters: Record<string, string> = {
          '1': 'all',
          '2': 'youtube',
          '3': 'instagram',
          '4': 'twitter',
        }
        
        if (platformFilters[e.key]) {
          e.preventDefault()
          setShowFilters(true)
          const platform = platformFilters[e.key]
          setPlatformFilter(platform)
        }
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          setShowForm(true)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'm':
          e.preventDefault()
          handleExportMarkdownRef.current?.()
          break
        case 'p':
          e.preventDefault()
          printSentimentReportRef.current?.()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowFilters(false)
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.platform) return

    try {
      const res = await fetch('/api/audience-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: DEMO_PROJECT_ID,
          title: formData.title,
          platform: formData.platform,
          videoUrl: formData.videoUrl || null,
          regionalCinema: formData.regionalCinema,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Auto-start analysis
      setAnalyzing(data.sentiment.id)
      const analyzeRes = await fetch('/api/audience-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentimentId: data.sentiment.id, regionalCinema: formData.regionalCinema }),
      })
      await analyzeRes.json()
      setAnalyzing(null)

      setShowForm(false)
      setFormData({ title: '', platform: 'youtube', videoUrl: '', regionalCinema: 'tamil' })
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create analysis')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis?')) return
    try {
      await fetch(`/api/audience-sentiment?id=${id}`, { method: 'DELETE' })
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const runAnalysis = async (id: string) => {
    setAnalyzing(id)
    try {
      const res = await fetch('/api/audience-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentimentId: id }),
      })
      await res.json()
      fetchAnalyses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze')
    } finally {
      setAnalyzing(null)
    }
  }

  // Export functions
  const handleExportCSV = () => {
    if (filteredAnalyses.length === 0) return
    const headers = ['Title', 'Platform', 'Total Comments', 'Positive', 'Negative', 'Neutral', 'Avg Sentiment', 'Status', 'Created']
    const rows = filteredAnalyses.map(a => [
      a.title,
      a.platform,
      a.totalComments.toString(),
      a.positiveCount.toString(),
      a.negativeCount.toString(),
      a.neutralCount.toString(),
      a.avgSentiment.toFixed(2),
      a.status,
      a.createdAt,
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audience-sentiment-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    if (filteredAnalyses.length === 0) return
    const data = {
      exportDate: new Date().toISOString(),
      totalAnalyses: filteredAnalyses.length,
      summary: {
        totalComments: filteredAnalyses.reduce((sum, a) => sum + a.totalComments, 0),
        totalPositive: filteredAnalyses.reduce((sum, a) => sum + a.positiveCount, 0),
        totalNegative: filteredAnalyses.reduce((sum, a) => sum + a.negativeCount, 0),
        totalNeutral: filteredAnalyses.reduce((sum, a) => sum + a.neutralCount, 0),
        averageSentiment: filteredAnalyses.length > 0 
          ? (filteredAnalyses.reduce((sum, a) => sum + a.avgSentiment, 0) / filteredAnalyses.length).toFixed(2)
          : 0,
        byPlatform: PLATFORMS.map(p => ({
          platform: p.key,
          count: filteredAnalyses.filter(a => a.platform === p.key).length,
        })),
      },
      analyses: filteredAnalyses,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audience-sentiment-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Markdown export function
  const handleExportMarkdown = useCallback(() => {
    if (filteredAnalyses.length === 0) return
    
    const totalComments = filteredAnalyses.reduce((sum, a) => sum + a.totalComments, 0)
    const totalPositive = filteredAnalyses.reduce((sum, a) => sum + a.positiveCount, 0)
    const totalNegative = filteredAnalyses.reduce((sum, a) => sum + a.negativeCount, 0)
    const totalNeutral = filteredAnalyses.reduce((sum, a) => sum + a.neutralCount, 0)
    const avgSentiment = filteredAnalyses.length > 0 
      ? (filteredAnalyses.reduce((sum, a) => sum + a.avgSentiment, 0) / filteredAnalyses.length).toFixed(2)
      : '0'
    
    // Build Markdown content
    let markdown = `# Audience Sentiment Analysis Report
*Generated by CinePilot on ${new Date().toISOString().split('T')[0]}*

## Overview

| Metric | Value |
|--------|-------|
| Total Analyses | ${filteredAnalyses.length} |
| Total Comments | ${totalComments.toLocaleString()} |
| Positive | ${totalPositive.toLocaleString()} |
| Negative | ${totalNegative.toLocaleString()} |
| Neutral | ${totalNeutral.toLocaleString()} |
| Average Sentiment | ${avgSentiment} |

## Platform Breakdown

| Platform | Analyses | Comments |
|----------|----------|----------|
`
    
    PLATFORMS.forEach(p => {
      const platformAnalyses = filteredAnalyses.filter(a => a.platform === p.key)
      const platformComments = platformAnalyses.reduce((sum, a) => sum + a.totalComments, 0)
      markdown += `| ${p.label} | ${platformAnalyses.length} | ${platformComments.toLocaleString()} |\n`
    })
    
    markdown += `
## Filter Summary

| Filter | Value |
|--------|-------|
| Platform | ${platformFilter === 'all' ? 'All' : platformFilter} |
| Status | ${statusFilter === 'all' ? 'All' : statusFilter} |
| Regional Cinema | ${regionalFilter === 'all' ? 'All' : regionalFilter} |
| Sort By | ${sortBy} (${sortOrder}) |

## Detailed Analyses

`
    
    filteredAnalyses.forEach((a, idx) => {
      markdown += `### ${idx + 1}. ${a.title}

| Field | Value |
|-------|-------|
| Platform | ${a.platform} |
| Total Comments | ${a.totalComments.toLocaleString()} |
| Positive | ${a.positiveCount.toLocaleString()} (${a.totalComments > 0 ? ((a.positiveCount / a.totalComments) * 100).toFixed(1) : 0}%) |
| Negative | ${a.negativeCount.toLocaleString()} (${a.totalComments > 0 ? ((a.negativeCount / a.totalComments) * 100).toFixed(1) : 0}%) |
| Neutral | ${a.neutralCount.toLocaleString()} (${a.totalComments > 0 ? ((a.neutralCount / a.totalComments) * 100).toFixed(1) : 0}%) |
| Average Sentiment | ${a.avgSentiment.toFixed(2)} |
| Status | ${a.status} |
| Created | ${a.createdAt.split('T')[0]} |
${a.regionalCinema ? `| Regional Cinema | ${a.regionalCinema} |\n` : ''}${a.videoUrl ? `| Video URL | ${a.videoUrl} |\n` : ''}
`
      
      if (a.takeaways && a.takeaways.length > 0) {
        markdown += `#### Key Takeaways\n`
        a.takeaways.forEach(t => markdown += `- ${t}\n`)
        markdown += `\n`
      }
      
      if (a.posterTips && a.posterTips.length > 0) {
        markdown += `#### Poster Tips\n`
        a.posterTips.forEach(t => markdown += `- ${t}\n`)
        markdown += `\n`
      }
      
      if (a.topPositive && a.topPositive.length > 0) {
        markdown += `#### Top Positive Comments\n`
        a.topPositive.slice(0, 3).forEach(c => {
          markdown += `- "${c.text}" (${c.likes} likes)\n`
        })
        markdown += `\n`
      }
      
      if (a.topNegative && a.topNegative.length > 0) {
        markdown += `#### Top Negative Comments\n`
        a.topNegative.slice(0, 3).forEach(c => {
          markdown += `- "${c.text}" (${c.likes} likes)\n`
        })
        markdown += `\n`
      }
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audience-sentiment-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }, [filteredAnalyses, platformFilter, statusFilter, regionalFilter, sortBy, sortOrder])

  // Print function
  const printSentimentReport = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const totalComments = filteredAnalyses.reduce((sum, a) => sum + a.totalComments, 0)
    const totalPositive = filteredAnalyses.reduce((sum, a) => sum + a.positiveCount, 0)
    const totalNegative = filteredAnalyses.reduce((sum, a) => sum + a.negativeCount, 0)
    const totalNeutral = filteredAnalyses.reduce((sum, a) => sum + a.neutralCount, 0)
    const avgSentiment = filteredAnalyses.length > 0 
      ? (filteredAnalyses.reduce((sum, a) => sum + a.avgSentiment, 0) / filteredAnalyses.length).toFixed(2)
      : '0'
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Audience Sentiment Report - CinePilot</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1e293b; }
    h1 { color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 5px; }
    .subtitle { color: #64748b; margin-bottom: 20px; }
    .meta { margin-bottom: 30px; }
    .meta-item { font-size: 14px; color: #64748b; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card.positive { background: #d1fae5; border: 1px solid #6ee7b7; }
    .summary-card.negative { background: #fee2e2; border: 1px solid #fca5a5; }
    .summary-card.neutral { background: #f1f5f9; border: 1px solid #cbd5e1; }
    .summary-card.avg { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .summary-card h3 { margin: 0; font-size: 24px; }
    .summary-card p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; }
    .platform-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
    .platform-badge.youtube { background: #fee2e2; color: #dc2626; }
    .platform-badge.instagram { background: #fce7f3; color: #db2777; }
    .platform-badge.twitter { background: #e0f2fe; color: #0284c7; }
    .sentiment-bar { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .sentiment-fill { height: 100%; border-radius: 3px; }
    .sentiment-fill.positive { background: #10b981; }
    .sentiment-fill.negative { background: #ef4444; }
    .sentiment-fill.neutral { background: #6b7280; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 Audience Sentiment Report</h1>
  <p class="subtitle">CinePilot - Audience Analysis</p>
  
  <div class="meta">
    <div class="meta-item"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    <div class="meta-item"><strong>Total Analyses:</strong> ${filteredAnalyses.length}</div>
    <div class="meta-item"><strong>Total Comments:</strong> ${totalComments.toLocaleString()}</div>
  </div>
  
  <div class="summary">
    <div class="summary-card positive">
      <h3>${totalPositive.toLocaleString()}</h3>
      <p>Positive</p>
    </div>
    <div class="summary-card negative">
      <h3>${totalNegative.toLocaleString()}</h3>
      <p>Negative</p>
    </div>
    <div class="summary-card neutral">
      <h3>${totalNeutral.toLocaleString()}</h3>
      <p>Neutral</p>
    </div>
    <div class="summary-card avg">
      <h3>${avgSentiment}</h3>
      <p>Avg Score</p>
    </div>
  </div>
  
  <div class="section">
    <h2>Analysis Details</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Platform</th>
          <th>Comments</th>
          <th>Positive</th>
          <th>Negative</th>
          <th>Neutral</th>
          <th>Sentiment</th>
        </tr>
      </thead>
      <tbody>
        ${filteredAnalyses.slice(0, 10).map(a => `
          <tr>
            <td><strong>${a.title}</strong></td>
            <td><span class="platform-badge ${a.platform}">${a.platform}</span></td>
            <td>${a.totalComments.toLocaleString()}</td>
            <td>${a.positiveCount}</td>
            <td>${a.negativeCount}</td>
            <td>${a.neutralCount}</td>
            <td>
              <div class="sentiment-bar">
                <div class="sentiment-fill ${a.avgSentiment > 0.3 ? 'positive' : a.avgSentiment < -0.3 ? 'negative' : 'neutral'}" style="width: ${Math.abs(a.avgSentiment * 100)}%"></div>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${filteredAnalyses.length > 10 ? `<p style="color: #64748b; font-size: 12px; margin-top: 10px;">...and ${filteredAnalyses.length - 10} more analyses</p>` : ''}
  </div>
  
  <div class="footer">
    <p>Generated by CinePilot • Production Management System</p>
  </div>
</body>
</html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }, [filteredAnalyses])

  // Update ref when printSentimentReport changes
  useEffect(() => {
    printSentimentReportRef.current = printSentimentReport
  }, [printSentimentReport])

  // Update ref when handleExportMarkdown changes
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown
  }, [handleExportMarkdown])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.export-menu')) {
          setShowExportMenu(false)
        }
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button
        const target = e.target as HTMLElement
        if (!target.closest('[title="Toggle filters (F)"]')) {
          setShowFilters(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  // Close export menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExportMenu) {
        setShowExportMenu(false)
      }
      if (e.key === 'Escape' && showPrintMenu) {
        setShowPrintMenu(false)
      }
      if (e.key === 'Escape' && showFilters) {
        setShowFilters(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showExportMenu, showPrintMenu, showFilters])

  const selectedAnalysis = filteredAnalyses[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Audience Sentiment</h1>
                <p className="text-sm text-slate-400">
                  {searchQuery || platformFilter !== 'all' || statusFilter !== 'all'
                    ? `${filteredAnalyses.length} of ${analyses.length} analyses`
                    : `${analyses.length} analyses total`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search analyses... (/)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 w-48"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">(/)</span>
              </div>
              
              {/* Platform Filter */}
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                {PLATFORMS.map((platform, idx) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.key}
                      onClick={() => setPlatformFilter(platform.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        platformFilter === platform.key
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: platform.color }} />
                      <span className="hidden sm:inline">{platform.label}</span>
                      <span className="text-xs text-slate-500 ml-0.5">({idx + 2})</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    platformFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  All
                  <span className="text-xs text-slate-500 ml-0.5">(1)</span>
                </button>
              </div>
              <button
                onClick={() => fetchDataRef.current?.()}
                disabled={refreshing}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Refresh data (R)"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-lg transition-colors flex items-center gap-1.5 ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-slate-400 hover:text-white'
                }`}
                title="Toggle filters (F)"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="text-xs font-medium">{activeFilterCount}</span>
                )}
              </button>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="relative export-menu">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  title="Export (E)"
                >
                  <Download className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-violet-400" />
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      Export Markdown
                    </button>
                  </div>
                )}
              </div>
              {/* Print Button */}
              <div className="relative" ref={printMenuRef}>
                <button
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  title="Print (P)"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={printSentimentReport}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      Print Report
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div ref={filterPanelRef} className="flex flex-wrap items-center gap-4">
              {/* Filter Panel Header with Shortcut Hints */}
              <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-rose-400" />
                  Filters
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-cyan-400">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">1-4</kbd> Platform
                    <kbd className="ml-1 px-1.5 py-0.5 bg-slate-700 rounded">0</kbd> Clear
                  </span>
                  <span className="text-emerald-400">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">⇧1-4</kbd> Status
                    <kbd className="ml-1 px-1.5 py-0.5 bg-slate-700 rounded">⇧0</kbd> Clear
                  </span>
                </div>
              </div>
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="all">All Status (⇧1)</option>
                  <option value="completed">Completed (⇧2)</option>
                  <option value="analyzing">Analyzing (⇧3)</option>
                  <option value="failed">Failed (⇧4)</option>
                </select>
              </div>

              {/* Regional Cinema Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">🎬:</span>
                <select
                  value={regionalFilter}
                  onChange={(e) => setRegionalFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Regions</option>
                  <option value="tamil">🇮🇳 Tamil</option>
                  <option value="telugu">🇮🇳 Telugu</option>
                  <option value="malayalam">🇮🇳 Malayalam</option>
                  <option value="kannada">🇮🇳 Kannada</option>
                  <option value="hindi">🇮🇳 Hindi</option>
                  <option value="other">🌍 Other</option>
                </select>
              </div>
              
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Sort:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="createdAt">Date</option>
                    <option value="title">Title</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="comments">Comments</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <button
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1 px-2 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs text-white transition-colors"
                    title="Toggle sort order (S)"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              
              {/* Clear Filters */}
              {(platformFilter !== 'all' || statusFilter !== 'all' || regionalFilter !== 'all' || searchQuery || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                <button
                  onClick={() => {
                    setPlatformFilter('all')
                    setStatusFilter('all')
                    setRegionalFilter('all')
                    setSearchQuery('')
                    setSortBy('createdAt')
                    setSortOrder('desc')
                  }}
                  className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
              
              {/* Results Count */}
              <span className="text-sm text-slate-500 ml-auto">
                {filteredAnalyses.length} of {analyses.length} results
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Sentiment Analyses Yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Analyze audience reactions from trailer comments to understand what viewers think and get tips for improving your movie poster.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {selectedAnalysis && (
              <>
                {/* Header with Regional Cinema */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedAnalysis.title}
                    </h2>
                    {selectedAnalysis.regionalCinema && (
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${REGIONAL_CINEMA.find(r => r.key === selectedAnalysis.regionalCinema)?.color}20`,
                          color: REGIONAL_CINEMA.find(r => r.key === selectedAnalysis.regionalCinema)?.color
                        }}
                      >
                        {REGIONAL_CINEMA.find(r => r.key === selectedAnalysis.regionalCinema)?.flag} {REGIONAL_CINEMA.find(r => r.key === selectedAnalysis.regionalCinema)?.label} Cinema
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedAnalysis.platform === 'youtube' ? 'bg-red-500/20 text-red-400' :
                      selectedAnalysis.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {selectedAnalysis.platform === 'youtube' ? 'YouTube' : 
                       selectedAnalysis.platform === 'instagram' ? 'Instagram' : 'Twitter/X'}
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-400">Total Comments</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedAnalysis.totalComments}</p>
                    <p className="text-xs text-slate-500 mt-1">Analyzed: {selectedAnalysis.analyzedCount}</p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-400">Positive</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{selectedAnalysis.positiveCount}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.totalComments > 0 
                        ? Math.round((selectedAnalysis.positiveCount / selectedAnalysis.totalComments) * 100)
                        : 0}% of total
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <ThumbsDown className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-sm text-slate-400">Negative</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{selectedAnalysis.negativeCount}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.totalComments > 0 
                        ? Math.round((selectedAnalysis.negativeCount / selectedAnalysis.totalComments) * 100)
                        : 0}% of total
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-sm text-slate-400">Sentiment Score</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {selectedAnalysis.avgSentiment > 0 ? '+' : ''}{selectedAnalysis.avgSentiment.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAnalysis.avgSentiment > 0.3 ? '🟢 Very Positive' 
                        : selectedAnalysis.avgSentiment > 0 ? '🟢 Positive' 
                        : selectedAnalysis.avgSentiment > -0.3 ? '🟡 Neutral' 
                        : '🔴 Negative'}
                    </p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sentiment Distribution */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-rose-400" />
                      Sentiment Distribution
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: selectedAnalysis.positiveCount, color: '#10b981' },
                              { name: 'Negative', value: selectedAnalysis.negativeCount, color: '#ef4444' },
                              { name: 'Neutral', value: selectedAnalysis.neutralCount, color: '#6b7280' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { name: 'Positive', value: selectedAnalysis.positiveCount, color: '#10b981' },
                              { name: 'Negative', value: selectedAnalysis.negativeCount, color: '#ef4444' },
                              { name: 'Neutral', value: selectedAnalysis.neutralCount, color: '#6b7280' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Language Breakdown - South Indian Focus */}
                  {selectedAnalysis.languageBreakdown && (
                    <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-xl">🌐</span>
                        Comment Language Breakdown
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Tamil', count: selectedAnalysis.languageBreakdown?.tamil || 0, color: '#ff6b6b' },
                            { name: 'English', count: selectedAnalysis.languageBreakdown?.english || 0, color: '#3b82f6' },
                            { name: 'Telugu', count: selectedAnalysis.languageBreakdown?.telugu || 0, color: '#4ecdc4' },
                            { name: 'Hindi', count: selectedAnalysis.languageBreakdown?.hindi || 0, color: '#feca57' },
                            { name: 'Malayalam', count: selectedAnalysis.languageBreakdown?.malayalam || 0, color: '#45b7d1' },
                            { name: 'Kannada', count: selectedAnalysis.languageBreakdown?.kannada || 0, color: '#96ceb4' },
                          ].filter(d => d.count > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                              itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {[
                                { name: 'Tamil', count: selectedAnalysis.languageBreakdown?.tamil || 0, color: '#ff6b6b' },
                                { name: 'English', count: selectedAnalysis.languageBreakdown?.english || 0, color: '#3b82f6' },
                                { name: 'Telugu', count: selectedAnalysis.languageBreakdown?.telugu || 0, color: '#4ecdc4' },
                                { name: 'Hindi', count: selectedAnalysis.languageBreakdown?.hindi || 0, color: '#feca57' },
                                { name: 'Malayalam', count: selectedAnalysis.languageBreakdown?.malayalam || 0, color: '#45b7d1' },
                                { name: 'Kannada', count: selectedAnalysis.languageBreakdown?.kannada || 0, color: '#96ceb4' },
                              ].filter(d => d.count > 0).map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {COMMENT_LANGUAGES.filter(l => (selectedAnalysis.languageBreakdown as any)?.[l.key] > 0).map(lang => (
                          <span 
                            key={lang.key}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${lang.color}20`, color: lang.color }}
                          >
                            {lang.label}: {(selectedAnalysis.languageBreakdown as any)?.[lang.key] || 0}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Comments */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-rose-400" />
                      Top Positive Comments
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedAnalysis.topPositive?.map((comment, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-emerald-500/20">
                          <p className="text-sm text-white line-clamp-2">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">@{comment.author}</span>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {comment.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!selectedAnalysis.topPositive || selectedAnalysis.topPositive.length === 0) && (
                        <p className="text-sm text-slate-500 text-center py-4">No positive comments yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insights Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key Takeaways */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-3">
                      {selectedAnalysis.takeaways?.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {takeaway}
                        </li>
                      ))}
                      {(!selectedAnalysis.takeaways || selectedAnalysis.takeaways.length === 0) && (
                        <p className="text-sm text-slate-500">Run analysis to see takeaways</p>
                      )}
                    </ul>
                  </div>

                  {/* Poster Tips */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-rose-400" />
                      Poster Improvement Tips
                    </h3>
                    <ul className="space-y-3">
                      {selectedAnalysis.posterTips?.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 text-xs flex-shrink-0">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                      {(!selectedAnalysis.posterTips || selectedAnalysis.posterTips.length === 0) && (
                        <p className="text-sm text-slate-500">Run analysis to get poster tips</p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Negative Feedback */}
                {selectedAnalysis.negativeCount > 0 && (
                  <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      Areas of Concern
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedAnalysis.topNegative?.map((comment, i) => (
                        <div key={i} className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                          <p className="text-sm text-slate-300 line-clamp-2">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">@{comment.author}</span>
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" /> {comment.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Analyses List */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-400" />
                    All Analyses
                  </h3>
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center">
                            {analysis.platform === 'youtube' ? (
                              <Youtube className="w-5 h-5 text-red-400" />
                            ) : analysis.platform === 'instagram' ? (
                              <Instagram className="w-5 h-5 text-pink-400" />
                            ) : (
                              <Twitter className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{analysis.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500">
                                {new Date(analysis.createdAt).toLocaleDateString()}
                              </span>
                              {analysis.regionalCinema && (
                                <span 
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ 
                                    backgroundColor: `${REGIONAL_CINEMA.find(r => r.key === analysis.regionalCinema)?.color}20`,
                                    color: REGIONAL_CINEMA.find(r => r.key === analysis.regionalCinema)?.color
                                  }}
                                >
                                  {REGIONAL_CINEMA.find(r => r.key === analysis.regionalCinema)?.flag} {REGIONAL_CINEMA.find(r => r.key === analysis.regionalCinema)?.label}
                                </span>
                              )}
                              {analysis.status === 'completed' && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Completed
                                </span>
                              )}
                              {analysis.status === 'analyzing' && (
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                                </span>
                              )}
                              {analysis.status === 'pending' && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.status === 'completed' && (
                            <div className="flex items-center gap-4 mr-4">
                              <span className="text-sm text-emerald-400">{analysis.positiveCount} 🟢</span>
                              <span className="text-sm text-red-400">{analysis.negativeCount} 🔴</span>
                            </div>
                          )}
                          {analysis.status !== 'completed' && (
                            <button
                              onClick={() => runAnalysis(analysis.id)}
                              disabled={analyzing === analysis.id}
                              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            >
                              {analyzing === analysis.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              Analyze
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(analysis.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-white mb-6">New Sentiment Analysis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Analysis Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Thalapathy 68 First Look"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: platform.key })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        formData.platform === platform.key
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                      <span className="text-xs">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Video URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Regional Cinema Selector - South Indian Focus */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🎬 Regional Cinema Focus
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {REGIONAL_CINEMA.map((region) => (
                    <button
                      key={region.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, regionalCinema: region.key })}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        formData.regionalCinema === region.key
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{region.flag}</span>
                      <span>{region.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Select the primary regional cinema market for targeted audience insights
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Create & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {/* General Shortcuts */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Refresh data</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Search analyses</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">New analysis</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">N</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Export menu</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">E</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Export Markdown</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">M</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Print report</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">F</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-emerald-400">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">S</kbd>
              </div>
              
              {/* Context-Aware: Filters Closed */}
              <div className="mt-3 mb-1">
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Filters Closed</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Open + Filter: All</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-amber-400">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Open + Filter: YouTube</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-amber-400">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Open + Filter: Instagram</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-amber-400">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Open + Filter: Twitter</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-amber-400">4</kbd>
              </div>
              
              {/* Context-Aware: Filters Open */}
              <div className="mt-3 mb-1">
                <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Filters Open</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: All</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: YouTube</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: Instagram</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: Twitter</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">4</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Clear platform</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-cyan-400">0</kbd>
              </div>
              
              {/* Status Filters */}
              <div className="mt-3 mb-1">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Shift+Number: Status Filter</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: All</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">⇧1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: Completed</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">⇧2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: Analyzing</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">⇧3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle: Failed</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">⇧4</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Clear status</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-emerald-400">⇧0</kbd>
              </div>
              
              {/* General */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300">Close / Clear</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
