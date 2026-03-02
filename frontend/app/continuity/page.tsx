'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, AlertTriangle, Search, RefreshCw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Script = { id: string; title: string };

type Warning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null; sceneIndex: number };
};

type Summary = {
  totalScenes: number;
  totalWarnings: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  resolved: number;
};

// Demo data for continuity warnings
const DEMO_WARNINGS: Warning[] = [
  { id: 'w1', sceneId: 's12', warningType: 'continuity', description: 'Character Arjun is wearing a blue shirt in Scene 12 but a white kurta in Scene 15 without explanation', severity: 'medium', scene: { sceneNumber: '15', headingRaw: 'INT. HOUSE - DAY', sceneIndex: 14 } },
  { id: 'w2', sceneId: 's18', warningType: 'continuity', description: 'Prop: Glass of water appears full in shot A but empty in shot B of same scene', severity: 'low', scene: { sceneNumber: '18', headingRaw: 'INT. OFFICE - DAY', sceneIndex: 17 } },
  { id: 'w3', sceneId: 's22', warningType: 'continuity', description: 'Time inconsistency: Character mentions "morning meeting" but window shows night sky', severity: 'high', scene: { sceneNumber: '22', headingRaw: 'INT. OFFICE - DAY', sceneIndex: 21 } },
  { id: 'w4', sceneId: 's25', warningType: 'plot_hole', description: 'Priya receives a phone call from Arjun but later claims she never spoke to him that day', severity: 'critical', scene: { sceneNumber: '25', headingRaw: 'EXT. PARK - EVENING', sceneIndex: 24 } },
  { id: 'w5', sceneId: 's28', warningType: 'continuity', description: 'Camera angle mismatch: In Scene 28, Arjun enters from left but in Scene 30 he enters from right with no explanation', severity: 'medium', scene: { sceneNumber: '28', headingRaw: 'INT. RESTAURANT - NIGHT', sceneIndex: 27 } },
  { id: 'w6', sceneId: 's31', warningType: 'continuity', description: 'Costume change: Priya\'s necklace disappears between Scene 31 and Scene 33', severity: 'low', scene: { sceneNumber: '31', headingRaw: 'INT. JEWELRY STORE - DAY', sceneIndex: 30 } },
  { id: 'w7', sceneId: 's35', warningType: 'plot_hole', description: 'The letter that Arjun reads in Scene 35 was never shown being written or received earlier', severity: 'high', scene: { sceneNumber: '35', headingRaw: 'INT. HOUSE - NIGHT', sceneIndex: 34 } },
  { id: 'w8', sceneId: 's38', warningType: 'continuity', description: 'Weather inconsistency: It\'s raining in Scene 37 but dry with no wet surfaces in Scene 38', severity: 'medium', scene: { sceneNumber: '38', headingRaw: 'EXT. STREET - DAY', sceneIndex: 37 } },
  { id: 'w9', sceneId: 's42', warningType: 'continuity', description: 'Character Rajesh has a beard in Scene 42 but is clean-shaven in Scene 44 with no scene showing him shaving', severity: 'high', scene: { sceneNumber: '42', headingRaw: 'INT. TEMPLE - DAY', sceneIndex: 41 } },
  { id: 'w10', sceneId: 's45', warningType: 'plot_hole', description: 'The car that was established as out of fuel in Scene 40 drives away normally in Scene 45', severity: 'critical', scene: { sceneNumber: '45', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 44 } },
  { id: 'w11', sceneId: 's48', warningType: 'continuity', description: 'Lighting continuity: Shadow direction changes 180 degrees between shots in same scene', severity: 'medium', scene: { sceneNumber: '48', headingRaw: 'INT. COURTROOM - DAY', sceneIndex: 47 } },
  { id: 'w12', sceneId: 's52', warningType: 'continuity', description: 'Prop continuity: The briefcase is closed in wide shot but open in close-up', severity: 'low', scene: { sceneNumber: '52', headingRaw: 'INT. POLICE STATION - DAY', sceneIndex: 51 } },
];

const DEMO_SUMMARY: Summary = {
  totalScenes: 47,
  totalWarnings: 12,
  byType: { continuity: 9, plot_hole: 3 },
  bySeverity: { low: 3, medium: 5, high: 2, critical: 2 },
  resolved: 0,
};

const DEMO_SCRIPTS: Script[] = [
  { id: 'demo-1', title: 'Kaadhal Enbadhu (Demo)' },
  { id: 'demo-2', title: 'Vikram Vedha 2 (Demo)' },
];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; chartColor: string }> = {
  low: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600', chartColor: '#64748b' },
  medium: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', chartColor: '#f59e0b' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50', chartColor: '#f97316' },
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', chartColor: '#ef4444' },
};

const TYPE_COLORS: Record<string, string> = {
  continuity: '#6366f1',
  plot_hole: '#f59e0b',
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load scripts on mount
  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        if (list.length > 0) {
          setScripts(list);
        } else {
          setScripts(DEMO_SCRIPTS);
          setSelectedScript(DEMO_SCRIPTS[0].id);
          setIsDemoMode(true);
        }
      })
      .catch(() => {
        setScripts(DEMO_SCRIPTS);
        setSelectedScript(DEMO_SCRIPTS[0].id);
        setIsDemoMode(true);
      });
  }, []);

  const fetchWarnings = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    setIsDemoMode(false);
    try {
      const res = await fetch(`/api/continuity?scriptId=${scriptId}`);
      const data = await res.json();
      
      if (res.ok && data.warnings) {
        setWarnings(data.warnings);
        setSummary(data.summary || calculateSummary(data.warnings));
        setIsDemoMode(data.isDemoMode === true);
      } else if (!res.ok && data.isDemoMode !== false) {
        // Use demo data
        setWarnings(DEMO_WARNINGS);
        setSummary(DEMO_SUMMARY);
        setIsDemoMode(true);
      } else {
        setWarnings([]);
        setSummary(null);
      }
    } catch (err) {
      // Fallback to demo data on error
      setWarnings(DEMO_WARNINGS);
      setSummary(DEMO_SUMMARY);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateSummary = (warns: Warning[]): Summary => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    warns.forEach(w => {
      byType[w.warningType] = (byType[w.warningType] || 0) + 1;
      bySeverity[w.severity] = (bySeverity[w.severity] || 0) + 1;
    });

    return {
      totalScenes: 47,
      totalWarnings: warns.length,
      byType,
      bySeverity,
      resolved: 0,
    };
  };

  useEffect(() => {
    if (selectedScript) {
      fetchWarnings(selectedScript);
    }
  }, [selectedScript, fetchWarnings]);

  async function runCheck() {
    if (!selectedScript) return;
    setChecking(true);
    setError('');
    setIsDemoMode(false);
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

  // Chart data
  const severityChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.bySeverity).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SEVERITY_COLORS[name]?.chartColor || '#64748b',
    }));
  }, [summary]);

  const typeChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byType).map(([name, value]) => ({
      name: name === 'plot_hole' ? 'Plot Holes' : 'Continuity',
      value,
      color: TYPE_COLORS[name] || '#64748b',
    }));
  }, [summary]);

  const severityCounts = warnings.reduce(
    (acc, w) => {
      acc[w.severity] = (acc[w.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Continuity Tracker</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Detect character inconsistencies, prop errors & plot holes across scenes
                </p>
              </div>
            </div>
            {isDemoMode && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                Demo Mode
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[260px]"
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Running Check...' : 'Run Continuity Check'}
            </button>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter warnings by scene, description..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/50 rounded-xl px-5 py-3 mb-6 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {isDemoMode && warnings.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-5 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Showing demo data — connect a database for real continuity analysis
          </div>
        )}

        {/* Stats Row */}
        {warnings.length > 0 && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/20"><FileText className="w-4 h-4 text-indigo-400" /></div>
                <span className="text-sm text-slate-400">Total Scenes</span>
              </div>
              <p className="text-2xl font-semibold text-white">{summary.totalScenes}</p>
              <p className="text-xs text-slate-500 mt-1">Analyzed</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/20"><AlertTriangle className="w-4 h-4 text-amber-400" /></div>
                <span className="text-sm text-slate-400">Total Warnings</span>
              </div>
              <p className="text-2xl font-semibold text-white">{warnings.length}</p>
              <p className="text-xs text-slate-500 mt-1">{continuityWarnings.length} continuity, {plotHoleWarnings.length} plot holes</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/20"><AlertCircle className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm text-slate-400">Critical Issues</span>
              </div>
              <p className="text-2xl font-semibold text-red-400">{(severityCounts.critical || 0) + (severityCounts.high || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">High + Critical severity</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20"><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
                <span className="text-sm text-slate-400">Resolved</span>
              </div>
              <p className="text-2xl font-semibold text-emerald-400">{summary.resolved}</p>
              <p className="text-xs text-slate-500 mt-1">Issues marked resolved</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {warnings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Severity Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Warning Severity Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value} warnings`, '']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Warning Type Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                Warning Type Breakdown
              </h3>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value} warnings`, '']}
                    />
                    <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && selectedScript && warnings.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Continuity Issues Found</h3>
            <p className="text-slate-400 mb-6">Run a continuity check to analyze this script for issues</p>
            <button
              onClick={runCheck}
              disabled={!selectedScript || checking}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Run Continuity Check
            </button>
          </div>
        )}

        {/* Continuity Issues */}
        {filteredContinuity.length > 0 && (
          <div className="space-y-3 mb-8">
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
                    className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 flex items-start gap-4 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      <Eye className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
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
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
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
                    className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 flex items-start gap-4 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
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
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {w.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
