'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

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
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
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
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'unread').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
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

  // Sort by date (newest first)
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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

            {/* Filter Bar */}
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                <option value="all">All Channels</option>
                <option value="app">App</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
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
    </div>
  );
}
