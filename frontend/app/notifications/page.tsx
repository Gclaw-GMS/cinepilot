'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Check,
  Send,
  X,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Trash2,
  RefreshCw,
  Loader2,
  Smartphone,
  Users,
  Zap,
  Keyboard,
  Download,
  Printer,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

type Notification = {
  id: string;
  channel: 'app' | 'email' | 'whatsapp' | 'sms';
  recipient: string | null;
  title: string;
  body: string;
  status: 'read' | 'unread' | 'sent' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  sentAt?: string;
};

const CHANNEL_CONFIG = {
  app: { 
    icon: Bell, 
    label: 'App', 
    color: 'text-blue-400 bg-blue-500/20',
    bg: 'border-blue-500/30'
  },
  email: { 
    icon: Mail, 
    label: 'Email', 
    color: 'text-amber-400 bg-amber-500/20',
    bg: 'border-amber-500/30'
  },
  whatsapp: { 
    icon: MessageSquare, 
    label: 'WhatsApp', 
    color: 'text-emerald-400 bg-emerald-500/20',
    bg: 'border-emerald-500/30'
  },
  sms: { 
    icon: Smartphone, 
    label: 'SMS', 
    color: 'text-purple-400 bg-purple-500/20',
    bg: 'border-purple-500/30'
  },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-400 bg-slate-500/20' },
  medium: { label: 'Medium', color: 'text-amber-400 bg-amber-500/20' },
  high: { label: 'High', color: 'text-red-400 bg-red-500/20' },
};

const STATUS_CONFIG = {
  read: { label: 'Read', icon: Check, color: 'text-emerald-400 bg-emerald-500/20' },
  unread: { label: 'Unread', icon: AlertCircle, color: 'text-blue-400 bg-blue-500/20' },
  sent: { label: 'Sent', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/20' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-400 bg-red-500/20' },
};

interface NotificationStats {
  total: number;
  unread: number;
  sent: number;
  failed: number;
}

// Demo data for notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    channel: 'app',
    recipient: null,
    title: 'Shooting Schedule Updated',
    body: 'Day 15 schedule has been modified. Please check the updated call sheet for tomorrow\'s shoot at Chennai studio.',
    status: 'unread',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: '2',
    channel: 'email',
    recipient: 'crew@cinepilot.ai',
    title: 'Call Sheet - Day 14',
    body: 'The call sheet for tomorrow\'s shoot (Factory Sequence) is now available. Call time: 6:00 AM.',
    status: 'sent',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    channel: 'whatsapp',
    recipient: '+91 98765 43210',
    title: 'Location Change Alert',
    body: 'Tomorrow\'s shoot location changed from Studio A to Outdoor Set B due to weather conditions.',
    status: 'sent',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    channel: 'app',
    recipient: null,
    title: 'Budget Approval Required',
    body: 'Equipment rental overbudget by ₹2.5L. Requires producer approval before proceeding.',
    status: 'unread',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
  },
  {
    id: '5',
    channel: 'email',
    recipient: 'vendor@equipment.com',
    title: 'Equipment Booking Confirmation',
    body: 'Your booking for ARRI Alexa Mini has been confirmed for dates Feb 20-25.',
    status: 'read',
    priority: 'low',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '6',
    channel: 'sms',
    recipient: '+91 98765 43211',
    title: 'Emergency: Shoot Postponed',
    body: 'Due to heavy rain, today\'s outdoor shoot has been postponed. Report at 10 AM tomorrow.',
    status: 'failed',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day 2 hours ago
  },
  {
    id: '7',
    channel: 'app',
    recipient: null,
    title: 'New Comment on Scene 42',
    body: 'Director added a note on scene 42 - "Need more emotional depth in this dialogue exchange."',
    status: 'read',
    priority: 'low',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'sent' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort state
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'channel' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterTabRef = useRef(filterTab)
  const showFiltersRef = useRef(showFilters)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sync refs with state for keyboard shortcuts
  useEffect(() => {
    filterTabRef.current = filterTab
  }, [filterTab])
  
  useEffect(() => {
    showFiltersRef.current = showFilters
  }, [showFilters])
  
  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (channelFilter !== 'all') count++;
    if (filterTab !== 'all') count++;
    if (searchQuery) count++;
    if (sortBy !== 'date' || sortOrder !== 'desc') count++;
    return count;
  }, [channelFilter, filterTab, searchQuery, sortBy, sortOrder]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setChannelFilter('all');
    setFilterTab('all');
    setSearchQuery('');
    setSortBy('date');
    setSortOrder('desc');
  }, []);

  // Refs for keyboard shortcuts
  const clearFiltersRef = useRef(clearFilters)
  const activeFilterCountRef = useRef(activeFilterCount)

  // Sync refs with state
  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  const [form, setForm] = useState({
    channel: 'app' as 'app' | 'email' | 'whatsapp' | 'sms',
    recipient: '',
    title: '',
    body: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      } else {
        // Use demo data when no real data
        setNotifications(DEMO_NOTIFICATIONS);
      }
    } catch (err) {
      console.warn('Using demo notifications:', err);
      setNotifications(DEMO_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [fetchNotifications])

  // Ref for keyboard shortcut access
  const handleRefreshRef = useRef(handleRefresh)
  useEffect(() => {
    handleRefreshRef.current = handleRefresh
  }, [handleRefresh])

  // Export functions
  const handleExportCSV = () => {
    if (sortedNotifications.length === 0) return
    setExporting(true)
    setShowExportMenu(false)

    const headers = ['ID', 'Channel', 'Recipient', 'Title', 'Body', 'Status', 'Priority', 'Created At', 'Sent At']
    const rows = sortedNotifications.map(n => [
      n.id,
      n.channel,
      n.recipient || '',
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.body.replace(/"/g, '""')}"`,
      n.status,
      n.priority,
      n.createdAt,
      n.sentAt || '',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    setExporting(false)
  }

  const handleExportJSON = () => {
    if (sortedNotifications.length === 0) return
    setExporting(true)
    setShowExportMenu(false)

    const exportData = {
      exportDate: new Date().toISOString(),
      total: sortedNotifications.length,
      sortBy,
      sortOrder,
      filters: {
        channelFilter,
        filterTab,
        searchQuery: searchQuery || undefined,
      },
      stats: {
        total: sortedNotifications.length,
        unread: sortedNotifications.filter(n => n.status === 'unread').length,
        sent: sortedNotifications.filter(n => n.status === 'sent').length,
        failed: sortedNotifications.filter(n => n.status === 'failed').length,
        byChannel: {
          app: sortedNotifications.filter(n => n.channel === 'app').length,
          email: sortedNotifications.filter(n => n.channel === 'email').length,
          whatsapp: sortedNotifications.filter(n => n.channel === 'whatsapp').length,
          sms: sortedNotifications.filter(n => n.channel === 'sms').length,
        },
        byPriority: {
          high: sortedNotifications.filter(n => n.priority === 'high').length,
          medium: sortedNotifications.filter(n => n.priority === 'medium').length,
          low: sortedNotifications.filter(n => n.priority === 'low').length,
        },
      },
      notifications: sortedNotifications,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setExporting(false)
  }

  // Markdown export - defined as regular function to avoid hoisting issues
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleExportMarkdown = () => {
    if (sortedNotifications.length === 0) return
    setExporting(true)
    setShowExportMenu(false)

    // Calculate stats
    const total = sortedNotifications.length
    const unread = sortedNotifications.filter(n => n.status === 'unread').length
    const sent = sortedNotifications.filter(n => n.status === 'sent').length
    const failed = sortedNotifications.filter(n => n.status === 'failed').length
    const byChannel = {
      app: sortedNotifications.filter(n => n.channel === 'app').length,
      email: sortedNotifications.filter(n => n.channel === 'email').length,
      whatsapp: sortedNotifications.filter(n => n.channel === 'whatsapp').length,
      sms: sortedNotifications.filter(n => n.channel === 'sms').length,
    }
    const byPriority = {
      high: sortedNotifications.filter(n => n.priority === 'high').length,
      medium: sortedNotifications.filter(n => n.priority === 'medium').length,
      low: sortedNotifications.filter(n => n.priority === 'low').length,
    }

    // Channel and priority labels
    const channelLabels: Record<string, string> = {
      app: 'In-App',
      email: 'Email',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
    }
    const priorityLabels: Record<string, string> = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    }
    const statusLabels: Record<string, string> = {
      unread: 'Unread',
      sent: 'Sent',
      failed: 'Failed',
    }

    let markdown = `# CinePilot Notifications Report

> Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

## Summary

| Metric | Value |
|--------|-------|
| **Total Notifications** | ${total} |
| **Unread** | ${unread} |
| **Sent** | ${sent} |
| **Failed** | ${failed} |

## By Channel

| Channel | Count |
|---------|-------|
| In-App | ${byChannel.app} |
| Email | ${byChannel.email} |
| WhatsApp | ${byChannel.whatsapp} |
| SMS | ${byChannel.sms} |

## By Priority

| Priority | Count |
|----------|-------|
| 🔴 High | ${byPriority.high} |
| 🟡 Medium | ${byPriority.medium} |
| ⚪ Low | ${byPriority.low} |

## Notifications Detail

| # | Channel | Recipient | Title | Status | Priority | Created |
|---|---------|-----------|-------|--------|----------|---------|
`

    sortedNotifications.forEach((n, idx) => {
      const channel = channelLabels[n.channel] || n.channel
      const priority = n.priority === 'high' ? '🔴 High' : n.priority === 'medium' ? '🟡 Medium' : '⚪ Low'
      const status = statusLabels[n.status] || n.status
      const title = n.title.length > 40 ? n.title.substring(0, 40) + '...' : n.title
      markdown += `| ${idx + 1} | ${channel} | ${n.recipient || '-'} | ${title} | ${status} | ${priority} | ${new Date(n.createdAt).toLocaleDateString()} |\n`
    })

    // Add filter info if filters are active
    if (channelFilter !== 'all' || filterTab !== 'all' || searchQuery) {
      markdown += `
## Active Filters

| Filter | Value |
|--------|-------|
| **Channel** | ${channelFilter} |
| **Tab** | ${filterTab} |
| **Search** | ${searchQuery || '(none)'} |
| **Filtered Count** | ${sortedNotifications.length} of ${notifications.length} |
`
    }

    markdown += `
---
*Generated by CinePilot - Film Production Management System*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    setExporting(false)
  }

  // Ref for keyboard shortcut
  const handleExportMarkdownRef = useRef(handleExportMarkdown)

  const handlePrint = () => {
    if (sortedNotifications.length === 0) return
    setPrinting(true)
    setShowPrintMenu(false)

    const stats = {
      total: sortedNotifications.length,
      unread: sortedNotifications.filter(n => n.status === 'unread').length,
      sent: sortedNotifications.filter(n => n.status === 'sent').length,
      failed: sortedNotifications.filter(n => n.status === 'failed').length,
      byChannel: {
        app: sortedNotifications.filter(n => n.channel === 'app').length,
        email: sortedNotifications.filter(n => n.channel === 'email').length,
        whatsapp: sortedNotifications.filter(n => n.channel === 'whatsapp').length,
        sms: sortedNotifications.filter(n => n.channel === 'sms').length,
      },
    }

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Notifications Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #4f46e5; }
    .header h1 { color: #4f46e5; font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #4f46e5; }
    .stat-card h3 { font-size: 24px; color: #1a1a1a; }
    .stat-card p { font-size: 12px; color: #666; text-transform: uppercase; }
    .stat-card.high { border-color: #dc2626; }
    .stat-card.sent { border-color: #16a34a; }
    .stat-card.failed { border-color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #4f46e5; color: white; padding: 12px; text-align: left; font-size: 12px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tr:nth-child(even) { background: #f9fafb; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge.app { background: #dbeafe; color: #1d4ed8; }
    .badge.email { background: #fef3c7; color: #b45309; }
    .badge.whatsapp { background: #d1fae5; color: #047857; }
    .badge.sms { background: #ede9fe; color: #6d28d9; }
    .badge.high { background: #fee2e2; color: #dc2626; }
    .badge.medium { background: #fef3c7; color: #b45309; }
    .badge.low { background: #f3f4f6; color: #6b7280; }
    .badge.read { background: #d1fae5; color: #047857; }
    .badge.unread { background: #dbeafe; color: #1d4ed8; }
    .badge.sent { background: #d1fae5; color: #047857; }
    .badge.failed { background: #fee2e2; color: #dc2626; }
    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📢 CinePilot Notifications Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <h3>${stats.total}</h3>
      <p>Total</p>
    </div>
    <div class="stat-card">
      <h3>${stats.unread}</h3>
      <p>Unread</p>
    </div>
    <div class="stat-card sent">
      <h3>${stats.sent}</h3>
      <p>Sent</p>
    </div>
    <div class="stat-card failed">
      <h3>${stats.failed}</h3>
      <p>Failed</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Channel</th>
        <th>Title</th>
        <th>Recipient</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${sortedNotifications.map((n, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><span class="badge ${n.channel}">${n.channel.toUpperCase()}</span></td>
          <td>${n.title}</td>
          <td>${n.recipient || '-'}</td>
          <td><span class="badge ${n.status}">${n.status.toUpperCase()}</span></td>
          <td><span class="badge ${n.priority}">${n.priority.toUpperCase()}</span></td>
          <td>${new Date(n.createdAt).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>CinePilot - Production Management System</p>
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    setPrinting(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur()
          setSearchQuery('')
        }
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefreshRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters panel OPEN: Filter by All tab (toggle)
            if (filterTabRef.current === 'all') {
              setFilterTab('all')
            } else {
              setFilterTab('all')
            }
          } else {
            // When filters panel CLOSED: Open filters and set to All
            setShowFilters(true)
            setFilterTab('all')
          }
          break
        case '2':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters panel OPEN: Filter by Unread tab (toggle)
            if (filterTabRef.current === 'unread') {
              setFilterTab('all')
            } else {
              setFilterTab('unread')
            }
          } else {
            // When filters panel CLOSED: Open filters and set to Unread
            setShowFilters(true)
            setFilterTab('unread')
          }
          break
        case '3':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters panel OPEN: Filter by Sent tab (toggle)
            if (filterTabRef.current === 'sent') {
              setFilterTab('all')
            } else {
              setFilterTab('sent')
            }
          } else {
            // When filters panel CLOSED: Open filters and set to Sent
            setShowFilters(true)
            setFilterTab('sent')
          }
          break
        case '4':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters panel OPEN: Filter by Failed tab (toggle)
            if (filterTabRef.current === 'failed') {
              setFilterTab('all')
            } else {
              setFilterTab('failed')
            }
          } else {
            // When filters panel CLOSED: Open filters and set to Failed
            setShowFilters(true)
            setFilterTab('failed')
          }
          break
        case '0':
          e.preventDefault()
          if (showFiltersRef.current) {
            // When filters panel OPEN: Clear tab filter
            setFilterTab('all')
          }
          break
        case 'x':
        case 'X':
          if (!e.ctrlKey && !e.metaKey && showFiltersRef.current && activeFilterCountRef.current > 0) {
            e.preventDefault()
            clearFiltersRef.current()
          }
          break
        case 'c':
          e.preventDefault()
          setActiveTab('compose')
          break
        case 'i':
          e.preventDefault()
          setActiveTab('inbox')
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setSearchQuery('')
          setShowFilters(false)
          break
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            setShowFilters(!showFilters)
          }
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
          }
          break
        case 'e':
          if (!showExportMenu) {
            e.preventDefault()
            setShowExportMenu(prev => !prev)
          }
          break
        case 'm':
          if (notifications.length > 0) {
            e.preventDefault()
            handleExportMarkdownRef.current()
          }
          break
        case 'p':
          if (!showPrintMenu && notifications.length > 0) {
            e.preventDefault()
            setShowPrintMenu(prev => !prev)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFilters, notifications.length, showExportMenu, showPrintMenu, sortOrder])

  // Click outside to close export/print menus and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) && 
          !(e.target as Element).closest('.filter-toggle')) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'unread').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  };

  // Analytics data for charts
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.channel] = (counts[n.channel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [notifications]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.status] = (counts[n.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [notifications]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.priority] = (counts[n.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [notifications]);

  // Time-based data for area chart
  const timeData = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      const date = new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 unique days
  }, [notifications]);

  const CHANNEL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
  const STATUS_COLORS_CHART = {
    Unread: '#3b82f6',
    Sent: '#10b981',
    Read: '#64748b',
    Failed: '#ef4444',
  };
  const PRIORITY_COLORS_CHART = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#64748b',
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesTab = filterTab === 'all' 
      ? true 
      : filterTab === 'unread' 
        ? n.status === 'unread'
        : filterTab === 'sent'
          ? n.status === 'sent' || n.status === 'read'
          : n.status === 'failed';
    
    const matchesChannel = channelFilter === 'all' || n.channel === channelFilter;
    
    const matchesSearch = !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.recipient && n.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesChannel && matchesSearch;
  });

  // Sort notifications based on sortBy and sortOrder
  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'channel':
          comparison = a.channel.localeCompare(b.channel);
          break;
        case 'status':
          const statusOrder = { unread: 3, sent: 2, read: 1, failed: 0 };
          const aStatus = a.status === 'read' ? 'read' : a.status;
          const bStatus = b.status === 'read' ? 'read' : b.status;
          comparison = (statusOrder[bStatus as keyof typeof statusOrder] || 0) - (statusOrder[aStatus as keyof typeof statusOrder] || 0);
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [filteredNotifications, sortBy, sortOrder]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'read' ? 'unread' : 'read';
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchNotifications();
    } catch (err) {
      // Update local state for demo
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, status: nextStatus as 'read' | 'unread' } : n
      ));
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchNotifications();
    } catch (err) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: form.channel,
          recipient: form.recipient.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          priority: form.priority,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to send');
      
      // Reset form
      setForm({ 
        channel: form.channel, 
        recipient: '', 
        title: '', 
        body: '',
        priority: 'medium'
      });
      
      // Refresh and show inbox
      await fetchNotifications();
      setActiveTab('inbox');
    } catch (err) {
      console.error('Send failed:', err);
      // Add to local state for demo
      const newNotification: Notification = {
        id: `new-${Date.now()}`,
        channel: form.channel,
        recipient: form.recipient || null,
        title: form.title,
        body: form.body,
        status: 'sent',
        priority: form.priority,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
      setForm({ 
        channel: form.channel, 
        recipient: '', 
        title: '', 
        body: '',
        priority: 'medium'
      });
      setActiveTab('inbox');
    } finally {
      setSending(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === sortedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(sortedNotifications.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                Notifications
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Send and manage production notifications across all channels
              </p>
            </div>
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh (R)"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Analytics Toggle Button */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showAnalytics
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
              title="Analytics"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors filter-toggle ${
                showFilters 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
              title="Toggle filters (F)"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting || notifications.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Export (E)"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm">Export</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4 text-indigo-400" />
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4 text-green-400" />
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-cyan-400 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4 text-cyan-400" />
                    Export Markdown
                  </button>
                </div>
              )}
            </div>

            {/* Print Button */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={printing || notifications.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50"
                title="Print (P)"
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                <span className="text-sm">Print</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Printer className="h-4 w-4 text-amber-400" />
                    Print Notifications
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inbox'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📥 Inbox
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'compose'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✉️ Compose
          </button>
        </div>

        {showAnalytics && activeTab !== 'compose' && (
          /* Analytics Dashboard */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Analytics</h2>
                <p className="text-sm text-slate-400">Notification distribution and trends</p>
              </div>
            </div>

            {/* Chart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Channel Distribution - Pie Chart */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-blue-400" />
                  By Channel
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} notifications`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution - Bar Chart */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  By Status
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} notifications`, '']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS_CHART[entry.name as keyof typeof STATUS_COLORS_CHART] || '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Distribution - Donut Chart */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  By Priority
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {priorityData.map((entry) => (
                          <Cell key={entry.name} fill={PRIORITY_COLORS_CHART[entry.name as keyof typeof PRIORITY_COLORS_CHART] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} notifications`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time Trend - Area Chart */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  Recent Trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} notifications`, '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">Top Channel</p>
                <p className="text-lg font-semibold text-white">
                  {channelData.length > 0 ? channelData.sort((a, b) => b.value - a.value)[0]?.name : '-'}
                </p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">Most Common Status</p>
                <p className="text-lg font-semibold text-white">
                  {statusData.length > 0 ? statusData.sort((a, b) => b.value - a.value)[0]?.name : '-'}
                </p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">Highest Priority</p>
                <p className="text-lg font-semibold text-white">
                  {priorityData.length > 0 ? priorityData.sort((a, b) => b.value - a.value)[0]?.name : '-'}
                </p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">Total Time Span</p>
                <p className="text-lg font-semibold text-white">
                  {timeData.length > 0 ? `${timeData.length} days` : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compose' ? (
          /* Compose Form */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-400" />
              Send Notification
            </h2>
            <form onSubmit={sendNotification} className="space-y-4">
              {/* Channel Selection */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(CHANNEL_CONFIG) as [string, typeof CHANNEL_CONFIG['app']][]).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, channel: key as any }))}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                          form.channel === key
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient (for non-app channels) */}
              {form.channel !== 'app' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Recipient {form.channel === 'email' ? '(Email)' : form.channel === 'whatsapp' ? '(WhatsApp)' : '(Phone)'}
                  </label>
                  <input
                    type="text"
                    value={form.recipient}
                    onChange={(e) => setForm(f => ({ ...f, recipient: e.target.value }))}
                    placeholder={
                      form.channel === 'email' ? 'email@example.com' : 
                      form.channel === 'whatsapp' ? '+91 98765 43210' : '+91XXXXXXXXXX'
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        form.priority === p
                          ? PRIORITY_CONFIG[p].color
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Message *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Notification message..."
                  required
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending || !form.title.trim() || !form.body.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-medium transition-colors"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ channel: 'app', recipient: '', title: '', body: '', priority: 'medium' })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Inbox View */
          <div className="space-y-4">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => setFilterTab('all')}
                className={`p-3 rounded-xl border transition-all ${
                  filterTab === 'all'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">All</span>
                </div>
                <div className="text-xl font-bold mt-1">{stats.total}</div>
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`p-3 rounded-xl border transition-all ${
                  filterTab === 'unread'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-400">Unread</span>
                </div>
                <div className="text-xl font-bold text-blue-400 mt-1">{stats.unread}</div>
              </button>
              <button
                onClick={() => setFilterTab('sent')}
                className={`p-3 rounded-xl border transition-all ${
                  filterTab === 'sent'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-slate-400">Sent</span>
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{stats.sent}</div>
              </button>
              <button
                onClick={() => setFilterTab('failed')}
                className={`p-3 rounded-xl border transition-all ${
                  filterTab === 'failed'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-slate-400">Failed</span>
                </div>
                <div className="text-xl font-bold text-red-400 mt-1">{stats.failed}</div>
              </button>
            </div>

            {/* Filter & Sort Panel */}
            {showFilters && (
              <div ref={filterPanelRef} className="flex flex-wrap items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Filters:</span>
                  <span className="text-xs text-cyan-400 ml-1">(1-4 to filter, 0 to clear, X for all)</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Channel:</label>
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Channels</option>
                    <option value="app">App</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Status:</label>
                  <select
                    value={filterTab}
                    onChange={(e) => setFilterTab(e.target.value as any)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="unread">Unread</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                {/* Sort Controls */}
                <div className="flex items-center gap-2 border-l border-slate-600 pl-3">
                  <span className="text-sm text-slate-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="date">Date</option>
                    <option value="priority">Priority</option>
                    <option value="channel">Channel</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      sortBy !== 'date' || sortOrder !== 'desc'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    title="Toggle sort order (S)"
                  >
                    {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                  </button>
                </div>
                
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Search notifications... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
                <p className="text-slate-400 mt-2">Loading notifications...</p>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No notifications</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {searchQuery || channelFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'All caught up! Send a new notification to get started.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedNotifications.map((notification) => {
                  const channelConfig = CHANNEL_CONFIG[notification.channel];
                  const ChannelIcon = channelConfig.icon;
                  const statusConfig = STATUS_CONFIG[notification.status];
                  const priorityConfig = PRIORITY_CONFIG[notification.priority];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border transition-all hover:border-slate-600 ${
                        notification.status === 'unread'
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-slate-900/50 border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Channel Icon */}
                        <div className={`p-2 rounded-lg ${channelConfig.color} shrink-0`}>
                          <ChannelIcon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${
                              notification.status === 'unread' ? 'text-white' : 'text-slate-300'
                            }`}>
                              {notification.title}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${priorityConfig.color}`}>
                              {priorityConfig.label}
                            </span>
                            {notification.status === 'unread' && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full" />
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.recipient && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {notification.recipient}
                              </span>
                            )}
                            {notification.sentAt && (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Zap className="h-3 w-3" />
                                Sent {formatTimeAgo(notification.sentAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleStatus(notification.id, notification.status)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            title={notification.status === 'read' ? 'Mark as unread' : 'Mark as read'}
                          >
                            {notification.status === 'read' ? (
                              <Mail className="h-4 w-4 text-slate-500" />
                            ) : (
                              <Check className="h-4 w-4 text-emerald-400" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination / Load More */}
            {sortedNotifications.length > 0 && (
              <div className="text-center pt-4">
                <p className="text-slate-500 text-sm">
                  Showing {sortedNotifications.length} of {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Keyboard className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Refresh notifications</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Toggle export menu</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">E</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-cyan-400">Export Markdown</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-cyan-400">M</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Print notifications</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">P</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">F</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Toggle sort order</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">S</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Focus search</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">Filters closed:</span>
                  <span className="text-slate-300">Open filters + filter</span>
                </div>
                <span className="text-xs text-slate-500">1-4</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">Filters open:</span>
                  <span className="text-slate-300">Toggle filter (press again to clear)</span>
                </div>
                <span className="text-xs text-slate-500">1-4</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-cyan-400">Clear tab filter</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-cyan-400">0</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-cyan-400">Clear all filters</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-cyan-400">X</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Go to Inbox</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">I</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Go to Compose</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">C</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">?</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-300">Close modal / Clear</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
