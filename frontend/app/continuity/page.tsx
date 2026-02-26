'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, AlertTriangle, Search, RefreshCw } from 'lucide-react';

type Script = { id: string; title: string };

type Warning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null };
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' },
  medium: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50' },
};

function getSeverityStyle(severity: string) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
}

export default function ContinuityPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        setScripts(list);
      })
      .catch(() => setScripts([]));
  }, []);

  const fetchWarnings = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/continuity?scriptId=${scriptId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setWarnings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warnings');
      setWarnings([]);
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
        body: JSON.stringify({ scriptId: selectedScript }),
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Continuity Tracker</h1>
              <p className="text-sm text-slate-400">
                Detect character inconsistencies and plot holes across scenes
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
            >
              <option value="">Select a script...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={runCheck}
              disabled={!selectedScript || checking}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Running Check...' : 'Run Continuity Check'}
            </button>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter warnings..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        {warnings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold">{warnings.length}</div>
              <div className="text-xs text-slate-400 mt-1">Total Warnings</div>
            </div>
            {(['low', 'medium', 'high', 'critical'] as const).map((sev) => {
              const count = severityCounts[sev] || 0;
              if (count === 0 && sev !== 'low') return null;
              const style = getSeverityStyle(sev);
              return (
                <div
                  key={sev}
                  className={`${style.bg} border ${style.border} rounded-xl p-4`}
                >
                  <div className={`text-2xl font-bold ${style.text}`}>{count}</div>
                  <div className="text-xs text-slate-400 mt-1 capitalize">{sev}</div>
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading warnings...</div>
        )}

        {!loading && selectedScript && warnings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No warnings found. Run a continuity check to analyze this script.
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
            <div className="space-y-2">
              {filteredContinuity.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="shrink-0 mt-0.5">
                      <Eye className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">
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
                      className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
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
            <div className="space-y-2">
              {filteredPlotHoles.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">
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
                      className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
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
