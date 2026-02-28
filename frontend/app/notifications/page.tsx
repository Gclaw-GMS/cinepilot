'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  X,
  Check,
  Trash2,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Calendar,
  User,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type Notification = {
  id: string;
  channel: string;
  recipient: string | null;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  priority?: string;
  category?: string;
};

// Demo data for notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', channel: 'app', recipient: null, title: 'Schedule Update', body: 'Shooting schedule for Day 5 has been updated with new call time of 05:00 AM', status: 'unread', createdAt: '2026-02-28T08:00:00Z', priority: 'high', category: 'schedule' },
  { id: 'n2', channel: 'email', recipient: 'crew@cinepilot.com', title: 'Call Sheet Available', body: 'Call sheet for February 28th is now available. Please check details.', status: 'read', createdAt: '2026-02-28T06:30:00Z', priority: 'high', category: 'callsheet' },
  { id: 'n3', channel: 'whatsapp', recipient: '+91 98765 43210', title: 'Location Change', body: 'Tomorrow\'s shoot location changed to AVM Studios due to weather.', status: 'unread', createdAt: '2026-02-27T22:00:00Z', priority: 'urgent', category: 'logistics' },
  { id: 'n4', channel: 'app', recipient: null, title: 'Budget Approval', body: 'Your budget request for VFX equipment has been approved.', status: 'read', createdAt: '2026-02-27T18:45:00Z', priority: 'medium', category: 'budget' },
  { id: 'n5', channel: 'whatsapp', recipient: '+91 98765 43211', title: 'Catering Update', body: 'Special diet arrangements confirmed for 5 crew members.', status: 'read', createdAt: '2026-02-27T16:20:00Z', priority: 'low', category: 'catering' },
  { id: 'n6', channel: 'email', recipient: 'director@cinepilot.com', title: 'Script Changes', body: 'Revised pages 23-28 sent for review. Note new scene additions.', status: 'unread', createdAt: '2026-02-27T14:00:00Z', priority: 'high', category: 'script' },
  { id: 'n7', channel: 'app', recipient: null, title: 'Weather Alert', body: 'Light rain expected tomorrow afternoon. Indoor backup locations ready.', status: 'read', createdAt: '2026-02-27T12:00:00Z', priority: 'medium', category: 'weather' },
  { id: 'n8', channel: 'app', recipient: null, title: 'Equipment Ready', body: 'RED Komodo and lighting package confirmed for pickup at 06:00 AM.', status: 'unread', createdAt: '2026-02-26T20:30:00Z', priority: 'medium', category: 'equipment' },
  { id: 'n9', channel: 'whatsapp', recipient: '+91 98765 43212', title: 'Cast Arrival', body: 'Lead actor arriving at hotel by 8:00 PM. Makeup call at 05:00 AM.', status: 'read', createdAt: '2026-02-26T18:00:00Z', priority: 'high', category: 'cast' },
  { id: 'n10', channel: 'email', recipient: 'producer@cinepilot.com', title: 'Insurance Renewal', body: 'Production insurance needs renewal by March 1st. Please review documents.', status: 'unread', createdAt: '2026-02-26T10:00:00Z', priority: 'urgent', category: 'admin' },
];

const CHANNEL_CONFIG: Record<string, { icon: React.ElementType<{ className?: string }>; color: string; bg: string }> = {
  app: { icon: Bell, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  email: { icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  whatsapp: { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316', 
  medium: '#f59e0b',
  low: '#64748b',
};

const CATEGORY_COLORS: Record<string, string> = {
  schedule: '#6366f1',
  logistics: '#10b981',
  budget: '#f59e0b',
  script: '#8b5cf6',
  equipment: '#06b6d4',
  cast: '#ec4899',
  catering: '#14b8a6',
  weather: '#3b82f6',
  vfx: '#a855f7',
  admin: '#64748b',
  other: '#78716c',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'unread' | 'sent' | 'stats'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [form, setForm] = useState({
    channel: 'app',
    recipient: '',
    title: '',
    body: '',
    priority: 'medium',
    category: 'general',
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
        setIsDemoMode(false);
      } else {
        setNotifications(DEMO_NOTIFICATIONS);
        setIsDemoMode(true);
      }
    } catch (err) {
      setNotifications(DEMO_NOTIFICATIONS);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

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
      if (isDemoMode) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, status: nextStatus } : n
        ));
      }
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchNotifications();
    } catch (err) {
      if (isDemoMode) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: form.channel,
          recipient: form.recipient.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          priority: form.priority,
          category: form.category,
        }),
      });
      setForm({ channel: form.channel, recipient: '', title: '', body: '', priority: 'medium', category: 'general' });
      setShowCompose(false);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => {
    let result = notifications;

    if (tab === 'unread') {
      result = result.filter((n) => n.status === 'unread');
    } else if (tab === 'sent') {
      result = result.filter((n) => n.channel === 'email' || n.channel === 'whatsapp');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.recipient && n.recipient.toLowerCase().includes(q))
      );
    }

    if (channelFilter !== 'all') {
      result = result.filter(n => n.channel === channelFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(n => n.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(n => n.category === categoryFilter);
    }

    return result;
  }, [notifications, tab, searchQuery, channelFilter, priorityFilter, categoryFilter]);

  const calculatedStats = useMemo(() => {
    const unread = notifications.filter(n => n.status === 'unread').length;
    const byChannel = Object.entries(
      notifications.reduce((acc, n) => {
        acc[n.channel] = (acc[n.channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([channel, count]) => ({ channel, count }));

    const byPriority = Object.entries(
      notifications.reduce((acc, n) => {
        const p = n.priority || 'medium';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([priority, count]) => ({ priority, count }));

    const byCategory = Object.entries(
      notifications.reduce((acc, n) => {
        const c = n.category || 'other';
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count }));

    return {
      total: notifications.length,
      unread,
      read: notifications.length - unread,
      byChannel,
      byPriority,
      byCategory,
    };
  }, [notifications]);

  const channelChartData = calculatedStats.byChannel.map(item => ({
    name: item.channel.charAt(0).toUpperCase() + item.channel.slice(1),
    value: item.count,
    color: item.channel === 'app' ? '#6366f1' : item.channel === 'email' ? '#06b6d4' : '#10b981',
  }));

  const priorityChartData = calculatedStats.byPriority.map(item => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: item.count,
    color: PRIORITY_COLORS[item.priority] || '#64748b',
  }));

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                Notifications
                {isDemoMode && (
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                    Demo Data
                  </span>
                )}
              </h1>
              <p className="text-slate-400 text-sm">Manage alerts, messages, and announcements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Compose
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total</span>
              <div className="p-2 bg-slate-800 rounded-lg">
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{calculatedStats.total}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Unread</span>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400">{calculatedStats.unread}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Read</span>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{calculatedStats.read}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">This Week</span>
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-400">{notifications.filter(n => {
              const d = new Date(n.createdAt);
              const now = new Date();
              return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
            }).length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800 pb-px">
          {(['all', 'unread', 'sent', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'unread' && calculatedStats.unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                  {calculatedStats.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats View */}
        {tab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                By Channel
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={channelChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                By Priority
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                By Category
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {calculatedStats.byCategory.map((cat) => (
                  <div
                    key={cat.category}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                      />
                      <span className="text-xs text-slate-400 capitalize">{cat.category}</span>
                    </div>
                    <div className="text-xl font-bold">{cat.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {tab !== 'stats' && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">All Channels</option>
                <option value="app">App</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">All Categories</option>
                <option value="schedule">Schedule</option>
                <option value="logistics">Logistics</option>
                <option value="budget">Budget</option>
                <option value="script">Script</option>
                <option value="equipment">Equipment</option>
                <option value="cast">Cast</option>
                <option value="catering">Catering</option>
                <option value="weather">Weather</option>
                <option value="vfx">VFX</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <span className="text-sm text-slate-500">
              {filtered.length} of {notifications.length}
            </span>
          </div>
        )}

        {/* Notification List */}
        {tab !== 'stats' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium">No notifications</p>
                <p className="text-slate-500 text-sm mt-1">
                  {searchQuery || channelFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              filtered.map((n) => {
                const channelConfig = CHANNEL_CONFIG[n.channel] || CHANNEL_CONFIG.app;
                const ChannelIcon = channelConfig.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => toggleStatus(n.id, n.status)}
                    className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      n.status === 'unread'
                        ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${channelConfig.bg} flex items-center justify-center shrink-0 mt-1`}>
                      <ChannelIcon className={`w-5 h-5 ${channelConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-medium ${n.status === 'unread' ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </span>
                        {n.status === 'unread' && (
                          <span className="w-2 h-2 bg-indigo-400 rounded-full" />
                        )}
                        {n.priority && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: PRIORITY_COLORS[n.priority],
                              color: PRIORITY_COLORS[n.priority],
                              backgroundColor: `${PRIORITY_COLORS[n.priority]}15`,
                            }}
                          >
                            {n.priority.toUpperCase()}
                          </span>
                        )}
                        {n.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                            {n.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(n.createdAt)}
                        </span>
                        {n.recipient && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {n.recipient}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                Send Notification
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={sendNotification} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, channel: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="app">App Notification</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              {(form.channel === 'email' || form.channel === 'whatsapp') && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Recipient
                  </label>
                  <input
                    type="text"
                    value={form.recipient}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, recipient: e.target.value }))
                    }
                    placeholder={
                      form.channel === 'email' ? 'email@example.com' : '+91...'
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Notification body"
                  required
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
