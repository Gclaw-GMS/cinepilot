'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Globe,
  Brain,
  Palette,
  Bell,
  Database,
  Save,
  Check,
  Download,
  Upload,
} from 'lucide-react';
import { MODELS } from '@/lib/ai/config';
import type { ModelKey } from '@/lib/ai/config';

type SettingsState = Record<string, unknown>;

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        checked ? 'bg-slate-600 border-slate-500' : 'bg-slate-800 border-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

const LANGUAGES = [
  { value: 'tamil', label: 'Tamil' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

const AI_MODELS = Object.keys(MODELS) as ModelKey[];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({});
  const [local, setLocal] = useState<SettingsState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((theme: string) => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSettings(data);
      setLocal(data);
      // Detect demo mode from API response
      setIsDemoMode(data.isDemoMode === true);
      // Apply saved theme
      const savedTheme = data.theme || 'dark';
      applyTheme(savedTheme);
    } catch (err) {
      console.error(err);
      setSettings({});
      setLocal({});
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const set = (key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    // Apply theme immediately when changed
    if (key === 'theme' && typeof value === 'string') {
      applyTheme(value);
    }
  };

  const get = (key: string): unknown => {
    return local[key] ?? settings[key];
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', settings: local }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSettings(local);
      setSaved(true);
      // Apply theme on save (for persistence)
      const theme = local.theme as string;
      if (theme) {
        applyTheme(theme);
        // Also save to localStorage for demo mode persistence
        localStorage.setItem('cinepilot-theme', theme);
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] dark:bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] dark:bg-slate-950 text-slate-100 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          {isDemoMode && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-medium">
              DEMO
            </span>
          )}
        </div>

        {isDemoMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200">
            Running in demo mode — settings are simulated and will reset on refresh. Connect your database to enable persistent settings.
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4" />
              Language
            </h2>
            <select
              value={(get('language') as string) ?? 'tamil'}
              onChange={(e) => set('language', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              {LANGUAGES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4" />
              Tamil Cinema Features
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Enable Tamil-specific parsing and suggestions
              </span>
              <Toggle
                checked={(get('tamilCinemaEnabled') as boolean) ?? true}
                onChange={(v) => set('tamilCinemaEnabled', v)}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4" />
              AI Model
            </h2>
            <select
              value={(get('aiModel') as string) ?? 'gpt4o'}
              onChange={(e) => set('aiModel', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              {AI_MODELS.map((key) => (
                <option key={key} value={key}>
                  {key}: {MODELS[key as ModelKey].slug}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              {MODELS[(get('aiModel') as ModelKey) ?? 'gpt4o']?.description ??
                ''}
            </p>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4" />
              Theme
            </h2>
            <select
              value={(get('theme') as string) ?? 'dark'}
              onChange={(e) => set('theme', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            >
              {THEMES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4" />
              Notifications
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Push notifications</span>
                <Toggle
                  checked={(get('notificationsPush') as boolean) ?? true}
                  onChange={(v) => set('notificationsPush', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Email alerts</span>
                <Toggle
                  checked={(get('notificationsEmail') as boolean) ?? false}
                  onChange={(v) => set('notificationsEmail', v)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Database className="h-4 w-4" />
              Data
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Analytics (anonymous)</span>
              <Toggle
                checked={(get('analyticsEnabled') as boolean) ?? false}
                onChange={(v) => set('analyticsEnabled', v)}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Download className="h-4 w-4" />
              Export / Import
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const data = { settings: local, exportedAt: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cinepilot-settings-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target?.result as string);
                        if (data.settings && typeof data.settings === 'object') {
                          setLocal((prev) => ({ ...prev, ...data.settings }));
                          alert('Settings imported successfully! Click Save to apply.');
                        } else {
                          alert('Invalid settings file format.');
                        }
                      } catch {
                        alert('Failed to parse settings file.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm font-medium"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </>
            )}
          </button>
          {saved && (
            <span className="text-sm text-green-500 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Settings saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
