'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Check,
  Send,
  X,
} from 'lucide-react';

type Notification = {
  id: string;
  channel: string;
  recipient: string | null;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  app: <Bell className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  whatsapp: <MessageSquare className="h-5 w-5" />,
};

function ChannelIcon({ channel }: { channel: string }) {
  return (
    <span className="text-slate-400">
      {CHANNEL_ICONS[channel] ?? <Bell className="h-5 w-5" />}
    </span>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'unread' | 'sent'>('all');
  const [form, setForm] = useState({
    channel: 'app',
    recipient: '',
    title: '',
    body: '',
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      console.error(err);
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: form.channel,
          recipient: form.recipient.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setForm({ channel: form.channel, recipient: '', title: '', body: '' });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered =
    tab === 'unread'
      ? notifications.filter((n) => n.status === 'unread')
      : tab === 'sent'
        ? notifications.filter((n) => n.channel === 'email' || n.channel === 'whatsapp')
        : notifications;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>

        <form
          onSubmit={sendNotification}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3"
        >
          <h2 className="text-sm font-medium text-slate-300">Send Notification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, channel: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="app">App</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
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
          </div>
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
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>

        <div className="flex gap-2 border-b border-slate-800 pb-2">
          {(['all', 'unread', 'sent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                tab === t
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm">No notifications</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((n) => (
              <li
                key={n.id}
                onClick={() => toggleStatus(n.id, n.status)}
                className="flex gap-3 p-4 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <ChannelIcon channel={n.channel} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{n.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        n.status === 'read'
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-slate-600 text-slate-200'
                      }`}
                    >
                      {n.status === 'read' ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 inline" />
                          Read
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <X className="h-3 w-3 inline" />
                          Unread
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {n.body}
                  </p>
                  {n.recipient && (
                    <p className="text-slate-500 text-xs mt-1">
                      To: {n.recipient}
                    </p>
                  )}
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
