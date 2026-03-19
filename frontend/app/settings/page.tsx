'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  DollarSign,
  Shield,
  RefreshCw,
  Keyboard,
  Search,
  X,
  Printer,
  Download,
  Filter,
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
  defaultCurrency: 'INR',
  budgetAlerts: true,
  scheduleReminders: true,
  censorMode: 'standard',
  autoSave: true,
  autoSaveInterval: 30,
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
  const [saved, setSaved] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const printMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Refs for keyboard shortcuts
  const saveRef = useRef<() => void>(() => {});
  const handlePrintRef = useRef<() => void>(() => {});
  const handleExportMarkdownRef = useRef<() => void>(() => {});
  
  // Refs for context-aware keyboard shortcuts
  const showFilterPanelRef = useRef(showFilterPanel);
  const activeFilterRef = useRef(activeFilter);
  
  // Sync refs with state for context-aware shortcuts
  useEffect(() => {
    showFilterPanelRef.current = showFilterPanel;
  }, [showFilterPanel]);
  
  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // /: Focus search
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // R: Refresh settings
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRefreshing(true);
        fetchSettings().finally(() => setRefreshing(false));
      }

      // S: Save settings
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        saveRef.current?.();
      }

      // ?: Show shortcuts
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // P: Print settings
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrintRef.current?.();
      }

      // E: Export menu
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShowExportMenu(!showExportMenu);
      }

      // M: Direct Markdown export
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleExportMarkdownRef.current?.();
      }

      // F: Toggle filters
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setShowFilterPanel(!showFilterPanel);
      }

      // Context-aware number keys for category filtering
      if (showFilterPanelRef.current) {
        // When filter panel is OPEN: Number keys 1-5 filter by category (toggle)
        const filterCategories: Record<string, string> = {
          '1': 'all',
          '2': 'language',
          '3': 'ai',
          '4': 'appearance',
          '5': 'notifications',
          '6': 'production',
        };
        
        if (filterCategories[e.key]) {
          e.preventDefault();
          const category = filterCategories[e.key];
          // Toggle behavior: if same category is selected, clear to 'all'
          if (activeFilterRef.current === category) {
            setActiveFilter('all');
          } else {
            setActiveFilter(category);
          }
        }
        
        // 0: Clear filter (show all)
        if (e.key === '0') {
          e.preventDefault();
          setActiveFilter('all');
        }
      } else {
        // When filter panel is CLOSED: Number keys could do something else
        // For now, we'll just open the filter panel when 1-6 is pressed
        const filterCategories: Record<string, string> = {
          '1': 'all',
          '2': 'language',
          '3': 'ai',
          '4': 'appearance',
          '5': 'notifications',
          '6': 'production',
        };
        
        if (filterCategories[e.key]) {
          e.preventDefault();
          setShowFilterPanel(true);
          const category = filterCategories[e.key];
          setActiveFilter(category);
        }
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowPrintMenu(false);
        setShowExportMenu(false);
        setShowFilterPanel(false);
        setShowResetConfirm(false);
      }

      // X: Reset to defaults (with Ctrl/Cmd for safety)
      if ((e.key === 'x' || e.key === 'X') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowResetConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchSettings, showFilterPanel, showExportMenu]);

  const set = useCallback((key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
    
    // Immediately apply theme change
    if (key === 'theme') {
      const theme = value as 'dark' | 'light' | 'system'
      // Call global theme setter if available
      const globalSetTheme = (window as Window & { __setTheme?: (theme: string) => void }).__setTheme
      if (globalSetTheme) {
        globalSetTheme(theme)
      }
    }
  }, [])

  const get = useCallback((key: string): unknown => {
    return local[key] ?? settings[key];
  }, [local, settings]);

  // useCallback for save function
  const save = useCallback(async () => {
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
  }, [local]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setResetting(true);
    setShowResetConfirm(false);
    
    // Reset to default settings
    const resetSettings = { ...DEFAULT_SETTINGS };
    setSettings(resetSettings);
    saveToStorage(resetSettings);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', settings: resetSettings }),
      });
      if (res.ok) {
        setDbConnected(true);
      }
    } catch (err) {
      console.warn('Failed to reset in database, using local storage only');
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setResetting(false);
  }, []);

  // Update saveRef when save changes
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Print settings report
  const handlePrint = useCallback(() => {
    setPrinting(true);
    setShowPrintMenu(false);
    
    // Capture current settings values
    const currentSettings = { ...settings, ...local };
    const currentGet = (key: string): unknown => currentSettings[key];
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot Settings Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .section { margin-bottom: 20px; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; }
    .section-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
    .setting { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .setting:last-child { border-bottom: none; }
    .label { color: #666; font-size: 13px; }
    .value { font-weight: 500; font-size: 13px; }
    .enabled { color: #10b981; }
    .disabled { color: #ef4444; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #1a1a1a; text-align: center; font-size: 12px; color: #666; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>⚙️ CinePilot Settings Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  
  <div class="section">
    <div class="section-title">🌐 Language & Region</div>
    <div class="setting"><span class="label">Language</span><span class="value">${(get('language') as string) || 'tamil'}</span></div>
    <div class="setting"><span class="label">Default Currency</span><span class="value">${(get('defaultCurrency') as string) || 'INR'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">🤖 AI Settings</div>
    <div class="setting"><span class="label">Tamil Cinema Features</span><span class="value ${(get('tamilCinemaEnabled') as boolean) ? 'enabled' : 'disabled'}">${(get('tamilCinemaEnabled') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
    <div class="setting"><span class="label">AI Model</span><span class="value">${(get('aiModel') as string) || 'gpt4o'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">🎨 Appearance</div>
    <div class="setting"><span class="label">Theme</span><span class="value">${(get('theme') as string) || 'dark'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">🔔 Notifications</div>
    <div class="setting"><span class="label">Push Notifications</span><span class="value ${(get('notificationsPush') as boolean) ? 'enabled' : 'disabled'}">${(get('notificationsPush') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
    <div class="setting"><span class="label">Email Alerts</span><span class="value ${(get('notificationsEmail') as boolean) ? 'enabled' : 'disabled'}">${(get('notificationsEmail') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
    <div class="setting"><span class="label">Budget Alerts</span><span class="value ${(get('budgetAlerts') as boolean) ? 'enabled' : 'disabled'}">${(get('budgetAlerts') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
    <div class="setting"><span class="label">Schedule Reminders</span><span class="value ${(get('scheduleReminders') as boolean) ? 'enabled' : 'disabled'}">${(get('scheduleReminders') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">📊 Data & Privacy</div>
    <div class="setting"><span class="label">Analytics</span><span class="value ${(get('analyticsEnabled') as boolean) ? 'enabled' : 'disabled'}">${(get('analyticsEnabled') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">🎬 Production</div>
    <div class="setting"><span class="label">Censor Mode</span><span class="value">${(get('censorMode') as string) || 'standard'}</span></div>
    <div class="setting"><span class="label">Auto-Save</span><span class="value ${(get('autoSave') as boolean) ? 'enabled' : 'disabled'}">${(get('autoSave') as boolean) ? 'Enabled' : 'Disabled'}</span></div>
    <div class="setting"><span class="label">Auto-Save Interval</span><span class="value">${(get('autoSaveInterval') as number) || 30} seconds</span></div>
  </div>
  
  <div class="footer">
    CinePilot — AI Pre-Production Assistant for South Indian Cinema
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    setPrinting(false);
  }, [local, settings, get]);

  // Update handlePrintRef when handlePrint changes
  useEffect(() => {
    handlePrintRef.current = handlePrint;
  }, [handlePrint]);

  // Export settings to Markdown
  const handleExportMarkdown = useCallback(() => {
    setExporting(true);
    setShowExportMenu(false);
    
    // Capture current settings values
    const currentSettings = { ...settings, ...local };
    const currentGet = (key: string): unknown => currentSettings[key];
    
    const formatValue = (value: unknown): string => {
      if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
      if (value === null || value === undefined) return '-';
      return String(value);
    };
    
    const markdown = `# ⚙️ CinePilot Settings Report

**Generated:** ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

---

## 🌐 Language & Region

| Setting | Value |
|---------|-------|
| Language | ${formatValue(currentGet('language'))} |
| Default Currency | ${formatValue(currentGet('defaultCurrency'))} |

---

## 🤖 AI Settings

| Setting | Value |
|---------|-------|
| Tamil Cinema Features | ${formatValue(currentGet('tamilCinemaEnabled'))} |
| AI Model | ${formatValue(currentGet('aiModel'))} |

---

## 🎨 Appearance

| Setting | Value |
|---------|-------|
| Theme | ${formatValue(currentGet('theme'))} |

---

## 🔔 Notifications

| Setting | Value |
|---------|-------|
| Push Notifications | ${formatValue(currentGet('notificationsPush'))} |
| Email Alerts | ${formatValue(currentGet('notificationsEmail'))} |
| Budget Alerts | ${formatValue(currentGet('budgetAlerts'))} |
| Schedule Reminders | ${formatValue(currentGet('scheduleReminders'))} |

---

## 📊 Data & Privacy

| Setting | Value |
|---------|-------|
| Analytics | ${formatValue(currentGet('analyticsEnabled'))} |

---

## 🎬 Production

| Setting | Value |
|---------|-------|
| Censor Mode | ${formatValue(currentGet('censorMode'))} |
| Auto-Save | ${formatValue(currentGet('autoSave'))} |
| Auto-Save Interval | ${formatValue(currentGet('autoSaveInterval'))} seconds |

---

## Summary

- **Total Settings:** 13
- **Database:** ${dbConnected === true ? 'Connected' : dbConnected === false ? 'Local Mode' : 'Unknown'}
- **Last Updated:** ${localStorage ? new Date().toLocaleDateString() : '-'}

---

*CinePilot — AI Pre-Production Assistant for South Indian Cinema*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinepilot-settings-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [local, settings, dbConnected]);

  // Update handleExportMarkdownRef when handleExportMarkdown changes
  useEffect(() => {
    handleExportMarkdownRef.current = handleExportMarkdown;
  }, [handleExportMarkdown]);

  // Click outside to close print menu, export menu, and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false);
      }
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (showFilterPanel && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPrintMenu, showExportMenu, showFilterPanel]);

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
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                >
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              )}
            </div>
            {/* Filter Toggle Button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  activeFilter !== 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle filters (F)"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                {activeFilter !== 'all' && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-emerald-500 text-xs rounded-full">1</span>
                )}
              </button>
              {showFilterPanel && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Filter Settings</span>
                      {activeFilter !== 'all' && (
                        <button
                          onClick={() => setActiveFilter('all')}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-cyan-400 mt-1">(1-6 to filter, 0 to clear)</div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { setActiveFilter('all'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">1</span>
                      All Settings
                    </button>
                    <button
                      onClick={() => { setActiveFilter('language'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'language' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">2</span>
                      Language & Region
                    </button>
                    <button
                      onClick={() => { setActiveFilter('ai'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">3</span>
                      AI & Language
                    </button>
                    <button
                      onClick={() => { setActiveFilter('appearance'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'appearance' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">4</span>
                      Appearance
                    </button>
                    <button
                      onClick={() => { setActiveFilter('notifications'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'notifications' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">5</span>
                      Notifications
                    </button>
                    <button
                      onClick={() => { setActiveFilter('production'); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeFilter === 'production' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-amber-400 mr-2">6</span>
                      Production
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                fetchSettings().finally(() => setRefreshing(false));
              }}
              disabled={refreshing}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh settings (R)"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            {/* Export Button */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-700/50 rounded-lg text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                title="Export settings (E)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportMarkdown}
                    disabled={exporting}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export Markdown'}
                  </button>
                </div>
              )}
            </div>
            {/* Print Button */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-700/50 rounded-lg text-sm text-slate-400 hover:text-amber-400 transition-colors"
                title="Print settings report (P)"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    {printing ? 'Printing...' : 'Print Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>
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

          {/* Production Settings */}
          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" />
              Production
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Default Currency</label>
                <select
                  value={(get('defaultCurrency') as string) ?? 'INR'}
                  onChange={(e) => set('defaultCurrency', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Budget alerts</span>
                <Toggle
                  checked={(get('budgetAlerts') as boolean) ?? true}
                  onChange={(v) => set('budgetAlerts', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Schedule reminders</span>
                <Toggle
                  checked={(get('scheduleReminders') as boolean) ?? true}
                  onChange={(v) => set('scheduleReminders', v)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" />
              Censor Board
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Analysis Mode</label>
                <select
                  value={(get('censorMode') as string) ?? 'standard'}
                  onChange={(e) => set('censorMode', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                >
                  <option value="standard">Standard (CBFC)</option>
                  <option value="strict">Strict (Conservative)</option>
                  <option value="relaxed">Relaxed (Minimal)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Save className="h-4 w-4" />
              Auto-Save
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Enable auto-save</span>
                <Toggle
                  checked={(get('autoSave') as boolean) ?? true}
                  onChange={(v) => set('autoSave', v)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Auto-save interval (seconds)</label>
                <select
                  value={(get('autoSaveInterval') as number) ?? 30}
                  onChange={(e) => set('autoSaveInterval', parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  disabled={!(get('autoSave') as boolean)}
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                </select>
              </div>
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
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 disabled:opacity-50 rounded text-sm font-medium text-red-400"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          {saved && (
            <span className="text-sm text-green-500 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Settings saved
            </span>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {/* General Shortcuts */}
              <div className="text-xs text-cyan-400 mb-1">General:</div>
              {[
                { key: '/', action: 'Focus search' },
                { key: '?', action: 'Show shortcuts' },
                { key: 'Esc', action: 'Close modal' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300 border border-slate-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
              
              {/* Filter Panel Closed - Number keys open filter */}
              <div className="text-xs text-amber-400 mt-3 mb-1">When filters closed:</div>
              {[
                { key: '1', action: 'Show all settings' },
                { key: '2', action: 'Filter: Language' },
                { key: '3', action: 'Filter: AI' },
                { key: '4', action: 'Filter: Appearance' },
                { key: '5', action: 'Filter: Notifications' },
                { key: '6', action: 'Filter: Production' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-amber-400 border border-slate-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
              
              {/* Filter Panel Open - Number keys filter */}
              <div className="text-xs text-cyan-400 mt-3 mb-1">When filters open:</div>
              {[
                { key: '1', action: 'Filter: All (toggle)' },
                { key: '2', action: 'Filter: Language (toggle)' },
                { key: '3', action: 'Filter: AI (toggle)' },
                { key: '4', action: 'Filter: Appearance (toggle)' },
                { key: '5', action: 'Filter: Notifications (toggle)' },
                { key: '6', action: 'Filter: Production (toggle)' },
                { key: '0', action: 'Clear filter' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-cyan-400 border border-slate-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
              
              {/* Action Shortcuts */}
              <div className="text-xs text-emerald-400 mt-3 mb-1">Actions:</div>
              {[
                { key: 'F', action: 'Toggle filters' },
                { key: 'R', action: 'Refresh settings' },
                { key: 'S', action: 'Save settings' },
                { key: 'Ctrl+X', action: 'Reset to defaults' },
                { key: 'E', action: 'Export menu' },
                { key: 'M', action: 'Export Markdown' },
                { key: 'P', action: 'Print settings' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300 border border-slate-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Press Esc or click outside to close
            </p>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowResetConfirm(false)}
        >
          <div 
            className="bg-slate-900 border border-red-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                Reset Settings
              </h2>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={resetToDefaults}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm font-medium text-white"
              >
                {resetting ? 'Resetting...' : 'Reset to Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
