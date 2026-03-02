'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, AlertTriangle, Search, RefreshCw, FileCheck, AlertCircle, BarChart3, LayoutGrid, List } from 'lucide-react';

type Script = { id: string; title: string };

type Warning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null };
};

type Summary = {
  total: number;
  continuityIssues: number;
  plotHoles: number;
  bySeverity?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  _demo?: boolean;
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  low: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600', bar: 'bg-slate-500' },
  medium: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', bar: 'bg-amber-500' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50', bar: 'bg-orange-500' },
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', bar: 'bg-red-500' },
};

function getSeverityStyle(severity: string) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
}

export default function ContinuityPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        setScripts(list);
        // Auto-select first script and load demo data
        if (list.length > 0 && !selectedScript) {
          setSelectedScript(list[0].id);
        }
      })
      .catch(() => {
        // If API fails, use demo data
        setScripts([{ id: 'demo', title: 'Demo Script - "The Court"' }]);
        setSelectedScript('demo');
      });
  }, []);

  const fetchWarnings = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/continuity?scriptId=${scriptId}&demo=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setWarnings(Array.isArray(data) ? data : (data.warnings || []));
      setSummary(data.summary || null);
      setIsDemo(data._demo || false);
    } catch (err) {
      // On error, load demo data
      try {
        const demoRes = await fetch('/api/continuity?scriptId=demo&demo=true');
        const demoData = await demoRes.json();
        setWarnings(demoData.warnings || []);
        setSummary(demoData.summary || null);
        setIsDemo(true);
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to load warnings');
        setWarnings([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScript) fetchWarnings(selectedScript);
  }, [selectedScript, fetchWarnings]);

  async function runCheck() {
    if (!selectedScript) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScript, useDemo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      await fetchWarnings(selectedScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Continuity check failed');
    } finally {
      setChecking(false);
    }
  }

  const continuityWarnings = warnings.filter((w) => w.warningType === 'continuity');
  const plotHoleWarnings = warnings.filter((w) => w.warningType === 'plot_hole');

  const filteredContinuity = filter
    ? continuityWarnings.filter(
        (w) =>
          w.description.toLowerCase().includes(filter.toLowerCase()) ||
          w.scene.sceneNumber.includes(filter) ||
          (w.scene.headingRaw || '').toLowerCase().includes(filter.toLowerCase()),
      )
    : continuityWarnings;

  const filteredPlotHoles = filter
    ? plotHoleWarnings.filter(
        (w) =>
          w.description.toLowerCase().includes(filter.toLowerCase()) ||
          w.scene.sceneNumber.includes(filter) ||
          (w.scene.headingRaw || '').toLowerCase().includes(filter.toLowerCase()),
      )
    : plotHoleWarnings;

  const severityCounts = warnings.reduce(
    (acc, w) => {
      acc[w.severity] = (acc[w.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate percentages for severity bars
  const total = warnings.length || 1;
  const severityPercentages = {
    critical: ((severityCounts.critical || 0) / total) * 100,
    high: ((severityCounts.high || 0) / total) * 100,
    medium: ((severityCounts.medium || 0) / total) * 100,
    low: ((severityCounts.low || 0) / total) * 100,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Continuity Tracker</h1>
              <p className="text-sm text-slate-400">
                Detect character inconsistencies and plot holes across scenes
              </p>
            </div>
          </div>
          {isDemo && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/20 border border-cyan-800/50 rounded-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-400">Demo Data</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
            >
              <option value="">Select a script...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
              <option value="demo">Demo Script - "The Court"</option>
            </select>

            <button
              onClick={runCheck}
              disabled={!selectedScript || checking}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Analyzing...' : 'Run Analysis'}
            </button>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter warnings..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Cards with Charts */}
        {warnings.length > 0 && (
          <>
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Total Issues</span>
                </div>
                <div className="text-3xl font-bold">{warnings.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {filteredContinuity.length + filteredPlotHoles.length} shown
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Continuity</span>
                </div>
                <div className="text-3xl font-bold">{continuityWarnings.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {summary?.continuityIssues || continuityWarnings.length} detected
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Plot Holes</span>
                </div>
                <div className="text-3xl font-bold">{plotHoleWarnings.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {summary?.plotHoles || plotHoleWarnings.length} detected
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Issues Resolved</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">0</div>
                <div className="text-xs text-slate-500 mt-1">Click to mark resolved</div>
              </div>
            </div>

            {/* Severity Distribution Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Severity Distribution
              </h3>
              <div className="space-y-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                  const count = severityCounts[sev] || 0;
                  const pct = severityPercentages[sev];
                  const style = getSeverityStyle(sev);
                  return (
                    <div key={sev} className="flex items-center gap-3">
                      <span className={`text-xs w-16 capitalize ${style.text}`}>{sev}</span>
                      <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono w-8 text-right ${style.text}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-slate-400">Analyzing script for continuity issues...</div>
          </div>
        )}

        {!loading && warnings.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <FileCheck className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <div className="text-xl font-semibold text-slate-300 mb-2">No Issues Found</div>
            <div className="text-slate-500 max-w-md mx-auto">
              Your script looks clean! Run a continuity check to analyze for potential issues.
            </div>
            <button
              onClick={runCheck}
              className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Run Analysis Now
            </button>
          </div>
        )}

        {/* Continuity Issues */}
        {filteredContinuity.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Continuity Issues
              <span className="text-sm text-slate-500 font-normal">
                ({filteredContinuity.length})
              </span>
            </h2>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredContinuity.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-4 ${viewMode === 'grid' ? 'flex-col' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Eye className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Scene {w.scene.sceneNumber}
                        </span>
                        {w.scene.headingRaw && (
                          <span className="text-xs text-slate-500 truncate">
                            {w.scene.headingRaw}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{w.description}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {w.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plot Holes */}
        {filteredPlotHoles.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Plot Holes
              <span className="text-sm text-slate-500 font-normal">
                ({filteredPlotHoles.length})
              </span>
            </h2>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredPlotHoles.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-4 ${viewMode === 'grid' ? 'flex-col' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Scene {w.scene.sceneNumber}
                        </span>
                        {w.scene.headingRaw && (
                          <span className="text-xs text-slate-500 truncate">
                            {w.scene.headingRaw}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{w.description}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {w.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
