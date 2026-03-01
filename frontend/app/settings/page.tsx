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
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { MODELS } from '@/lib/ai/config';
import type { ModelKey } from '@/lib/ai/config';

type SettingsState = Record<string, unknown>;

const STORAGE_KEY = 'cinepilot-settings';

const DEFAULT_SETTINGS: SettingsState = {
  language: 'tamil',
  tamilCinemaEnabled: true,
  aiModel: 'gpt4o',
  theme: 'dark',
  notificationsPush: true,
  notificationsEmail: false,
  analyticsEnabled: false,
};

// Load settings from localStorage
function loadFromStorage(): SettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings from storage:', e);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveToStorage(settings: SettingsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage:', e);
  }
}

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
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [local, setLocal] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  const fetchSettings = useCallback(async () => {
    // First load from localStorage for instant display
    const stored = loadFromStorage();
    setSettings(stored);
    setLocal(stored);
    
    // Then try to fetch from API
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setLocal(data);
        setDbConnected(true);
        // Sync localStorage with database data
        saveToStorage(data);
      } else {
        setDbConnected(false);
      }
    } catch (err) {
      console.warn('Database not connected, using local storage fallback');
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const set = (key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const get = (key: string): unknown => {
    return local[key] ?? settings[key];
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    
    // Always save to localStorage first (instant)
    saveToStorage(local);
    setSettings(local);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', settings: local }),
      });
      if (res.ok) {
        setDbConnected(true);
      } else {
        setDbConnected(false);
      }
    } catch (err) {
      console.warn('Failed to save to database, using local storage only');
      setDbConnected(false);
    } finally {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          <p className="text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-slate-100 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          {dbConnected === false && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400">Local mode</span>
            </div>
          )}
          {dbConnected === true && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">Database connected</span>
            </div>
          )}
        </div>
        
        {dbConnected === false && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300 font-medium">Using local storage</p>
                <p className="text-xs text-slate-500 mt-1">
                  Your settings are saved locally. Connect a PostgreSQL database to sync across devices.
                </p>
              </div>
            </div>
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
